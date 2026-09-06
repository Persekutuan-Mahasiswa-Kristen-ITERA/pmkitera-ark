import {
  S3Client,
  PutObjectCommand,
  DeleteObjectCommand,
  HeadObjectCommand,
  GetObjectCommand,
} from "@aws-sdk/client-s3";
import { getSignedUrl } from "@aws-sdk/s3-request-presigner";
import { StorageService, UploadOptions } from "./types";

export class R2StorageService implements StorageService {
  private client: S3Client;
  private bucket: string;
  private publicUrl: string;

  constructor() {
    const accountId = process.env.R2_ACCOUNT_ID;
    const accessKeyId = process.env.R2_ACCESS_KEY_ID;
    const secretAccessKey = process.env.R2_SECRET_ACCESS_KEY;
    const bucket = process.env.R2_BUCKET_NAME;
    const publicUrl = process.env.R2_PUBLIC_URL;

    if (!accountId || !accessKeyId || !secretAccessKey || !bucket || !publicUrl) {
      throw new Error(
        "Konfigurasi R2 tidak lengkap. Pastikan R2_ACCOUNT_ID, R2_ACCESS_KEY_ID, R2_SECRET_ACCESS_KEY, R2_BUCKET_NAME, dan R2_PUBLIC_URL sudah diset di environment variable."
      );
    }

    this.bucket = bucket;
    this.publicUrl = publicUrl;

    const endpoint = process.env.STORAGE_ENDPOINT || `https://${accountId}.r2.cloudflarestorage.com`;

    this.client = new S3Client({
      region: process.env.STORAGE_REGION || "auto",
      endpoint,
      credentials: {
        accessKeyId,
        secretAccessKey,
      },
      forcePathStyle: true,
    });
  }

  async uploadFile({ key, body, contentType, metadata }: UploadOptions): Promise<{ key: string; url: string }> {
    const command = new PutObjectCommand({
      Bucket: this.bucket,
      Key: key,
      Body: body,
      ContentType: contentType,
      Metadata: metadata,
    });

    await this.client.send(command);
    return {
      key,
      url: this.getPublicUrl(key),
    };
  }

  async deleteFile(key: string): Promise<boolean> {
    try {
      const command = new DeleteObjectCommand({
        Bucket: this.bucket,
        Key: key,
      });
      await this.client.send(command);
      return true;
    } catch (error) {
      console.error("Error deleting file from R2:", error);
      return false;
    }
  }

  async getDownloadUrl(key: string, expiresInSeconds: number = 3600): Promise<string> {
    const command = new GetObjectCommand({
      Bucket: this.bucket,
      Key: key,
    });
    return await getSignedUrl(this.client, command, { expiresIn: expiresInSeconds });
  }

  getPublicUrl(key: string): string {
    const cleanPublicUrl = this.publicUrl.replace(/\/$/, "");
    const cleanKey = key.replace(/^\//, "");
    return `${cleanPublicUrl}/${cleanKey}`;
  }

  async fileExists(key: string): Promise<boolean> {
    try {
      const command = new HeadObjectCommand({
        Bucket: this.bucket,
        Key: key,
      });
      await this.client.send(command);
      return true;
    } catch {
      return false;
    }
  }
}

// Singleton export
export const storageService: StorageService = new R2StorageService();
