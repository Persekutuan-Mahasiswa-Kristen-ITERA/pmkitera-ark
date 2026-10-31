import { describe, expect, it } from "vitest";
import {
  ACCEPTED_FILE_EXTENSIONS,
  ACCEPTED_FILE_TYPES,
  MAX_FILE_SIZE_BYTES,
  detectFileExtension,
  isAcceptedFileType,
} from "@/lib/validation/file";

const PPTX_MIME = "application/vnd.openxmlformats-officedocument.presentationml.presentation";

describe("file validation constants", () => {
  it("allows 50 MB uploads of pptx and pdf", () => {
    expect(MAX_FILE_SIZE_BYTES).toBe(50 * 1024 * 1024);
    expect(ACCEPTED_FILE_TYPES).toEqual([PPTX_MIME, "application/pdf"]);
    expect(ACCEPTED_FILE_EXTENSIONS).toEqual(["pptx", "pdf"]);
  });
});

describe("isAcceptedFileType", () => {
  it.each([PPTX_MIME, "application/pdf"])("accepts %s", (type) => {
    expect(isAcceptedFileType(type)).toBe(true);
  });

  it.each([
    "application/vnd.ms-powerpoint",
    "application/msword",
    "image/png",
    "text/plain",
    "",
    "APPLICATION/PDF",
    "application/pdf; charset=binary",
  ])("rejects %j", (type) => {
    expect(isAcceptedFileType(type)).toBe(false);
  });
});

describe("detectFileExtension", () => {
  it.each([
    ["warta.pdf", "pdf"],
    ["Ibadah Jumat.PPTX", "pptx"],
    ["khotbah.final.v2.pptx", "pptx"],
    ["SLIDES.Pdf", "pdf"],
  ])("%s -> %s", (name, ext) => {
    expect(detectFileExtension(name)).toBe(ext);
  });

  it.each(["slides.ppt", "doc.docx", "pdf", "archive.pdf.zip", "noextension", "", "file.pptx.exe"])(
    "returns null for %j",
    (name) => {
      expect(detectFileExtension(name)).toBeNull();
    }
  );
});
