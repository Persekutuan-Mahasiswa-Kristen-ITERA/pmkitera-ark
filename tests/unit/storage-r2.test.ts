import {
  DeleteObjectCommand,
  HeadObjectCommand,
  PutObjectCommand,
  S3Client,
} from "@aws-sdk/client-s3";
import { beforeEach, describe, expect, it, vi } from "vitest";

// Fake, offline-only configuration. No request ever leaves the process:
// S3Client#send is stubbed and presigning is a local computation.
const FAKE_ENV = {
  R2_ACCOUNT_ID: "testaccount",
  R2_ACCESS_KEY_ID: "TESTACCESSKEY",
  R2_SECRET_ACCESS_KEY: "test-secret-access-key",
  R2_BUCKET_NAME: "test-bucket",
  R2_PUBLIC_URL: "https://files.example.test/",
  STORAGE_ENDPOINT: "",
  STORAGE_REGION: "",
};

function stubR2Env(overrides: Partial<typeof FAKE_ENV> = {}) {
  for (const [k, v] of Object.entries({ ...FAKE_ENV, ...overrides })) vi.stubEnv(k, v);
}

async function loadR2() {
  vi.resetModules();
  return await import("@/lib/storage/r2");
}

let send: ReturnType<typeof vi.spyOn>;

beforeEach(() => {
  stubR2Env();
  send = vi.spyOn(S3Client.prototype, "send").mockImplementation(async () => ({}) as never);
});

describe("R2StorageService configuration", () => {
  it.each(["R2_ACCOUNT_ID", "R2_ACCESS_KEY_ID", "R2_SECRET_ACCESS_KEY", "R2_BUCKET_NAME", "R2_PUBLIC_URL"] as const)(
    "throws when %s is missing",
    async (name) => {
      const { R2StorageService } = await loadR2();
      vi.stubEnv(name, "");
      expect(() => new R2StorageService()).toThrow(/Konfigurasi R2 tidak lengkap/);
    }
  );

  it("fails at import time when the environment is incomplete", async () => {
    vi.stubEnv("R2_BUCKET_NAME", "");
    await expect(loadR2()).rejects.toThrow(/Konfigurasi R2 tidak lengkap/);
  });

  it("defaults to the account's R2 endpoint, region auto and path-style URLs", async () => {
    const { R2StorageService } = await loadR2();
    const service = new R2StorageService();
    const client = (service as unknown as { client: S3Client }).client;
    const endpoint = await client.config.endpoint!();
    expect(endpoint.hostname).toBe("testaccount.r2.cloudflarestorage.com");
    expect(endpoint.protocol).toBe("https:");
    await expect(client.config.region()).resolves.toBe("auto");
    expect(client.config.forcePathStyle).toBe(true);
  });

  it("honours STORAGE_ENDPOINT and STORAGE_REGION overrides", async () => {
    stubR2Env({ STORAGE_ENDPOINT: "https://s3.other.example.test", STORAGE_REGION: "ap-southeast-3" });
    const { R2StorageService } = await loadR2();
    const client = (new R2StorageService() as unknown as { client: S3Client }).client;
    expect((await client.config.endpoint!()).hostname).toBe("s3.other.example.test");
    await expect(client.config.region()).resolves.toBe("ap-southeast-3");
  });
});

describe("R2StorageService.getPublicUrl", () => {
  it.each([
    ["https://files.example.test/", "documents/2026/09/a.pdf"],
    ["https://files.example.test", "documents/2026/09/a.pdf"],
    ["https://files.example.test/", "/documents/2026/09/a.pdf"],
    ["https://files.example.test", "/documents/2026/09/a.pdf"],
  ])("joins %s and %s with exactly one slash", async (publicUrl, key) => {
    stubR2Env({ R2_PUBLIC_URL: publicUrl });
    const { R2StorageService } = await loadR2();
    expect(new R2StorageService().getPublicUrl(key)).toBe("https://files.example.test/documents/2026/09/a.pdf");
  });
});

describe("R2StorageService object operations", () => {
  it("uploads with bucket, key, content type and metadata", async () => {
    const { R2StorageService } = await loadR2();
    const body = Buffer.from("%PDF-1.7");
    const result = await new R2StorageService().uploadFile({
      key: "documents/2026/09/warta-1.pdf",
      body,
      contentType: "application/pdf",
      metadata: { original_filename: "warta.pdf" },
    });

    expect(result).toEqual({
      key: "documents/2026/09/warta-1.pdf",
      url: "https://files.example.test/documents/2026/09/warta-1.pdf",
    });
    expect(send).toHaveBeenCalledTimes(1);
    const command = send.mock.calls[0][0];
    expect(command).toBeInstanceOf(PutObjectCommand);
    expect(command.input).toEqual({
      Bucket: "test-bucket",
      Key: "documents/2026/09/warta-1.pdf",
      Body: body,
      ContentType: "application/pdf",
      Metadata: { original_filename: "warta.pdf" },
    });
  });

  it("propagates upload failures", async () => {
    send.mockRejectedValueOnce(new Error("network down"));
    const { R2StorageService } = await loadR2();
    await expect(
      new R2StorageService().uploadFile({ key: "k", body: Buffer.alloc(0), contentType: "application/pdf" })
    ).rejects.toThrow("network down");
  });

  it("deletes an object and reports success", async () => {
    const { R2StorageService } = await loadR2();
    await expect(new R2StorageService().deleteFile("documents/x.pdf")).resolves.toBe(true);
    const command = send.mock.calls[0][0];
    expect(command).toBeInstanceOf(DeleteObjectCommand);
    expect(command.input).toEqual({ Bucket: "test-bucket", Key: "documents/x.pdf" });
  });

  it("returns false instead of throwing when delete fails", async () => {
    vi.spyOn(console, "error").mockImplementation(() => {});
    send.mockRejectedValueOnce(new Error("AccessDenied"));
    const { R2StorageService } = await loadR2();
    await expect(new R2StorageService().deleteFile("documents/x.pdf")).resolves.toBe(false);
  });

  it("fileExists maps HeadObject success/failure to true/false", async () => {
    const { R2StorageService } = await loadR2();
    const service = new R2StorageService();
    await expect(service.fileExists("documents/x.pdf")).resolves.toBe(true);
    expect(send.mock.calls[0][0]).toBeInstanceOf(HeadObjectCommand);
    expect(send.mock.calls[0][0].input).toEqual({ Bucket: "test-bucket", Key: "documents/x.pdf" });

    send.mockRejectedValueOnce(Object.assign(new Error("NotFound"), { name: "NotFound" }));
    await expect(service.fileExists("documents/missing.pdf")).resolves.toBe(false);
  });

  it("presigns a GetObject URL locally with the requested expiry", async () => {
    const { R2StorageService } = await loadR2();
    const service = new R2StorageService();

    const url = new URL(await service.getDownloadUrl("documents/2026/09/warta-1.pdf", 600));
    expect(url.hostname).toBe("testaccount.r2.cloudflarestorage.com");
    expect(url.pathname).toBe("/test-bucket/documents/2026/09/warta-1.pdf");
    expect(url.searchParams.get("X-Amz-Expires")).toBe("600");
    expect(url.searchParams.get("X-Amz-Signature")).toMatch(/^[0-9a-f]{64}$/);
    expect(url.searchParams.get("X-Amz-Credential")).toMatch(/^TESTACCESSKEY\//);

    const defaultUrl = new URL(await service.getDownloadUrl("documents/a.pdf"));
    expect(defaultUrl.searchParams.get("X-Amz-Expires")).toBe("3600");
    expect(send).not.toHaveBeenCalled();
  });

  it("is what @/lib/storage exports", async () => {
    vi.resetModules();
    const [{ storageService }, r2] = await Promise.all([import("@/lib/storage"), import("@/lib/storage/r2")]);
    expect(storageService).toBe(r2.storageService);
    expect(storageService).toBeInstanceOf(r2.R2StorageService);
  });
});
