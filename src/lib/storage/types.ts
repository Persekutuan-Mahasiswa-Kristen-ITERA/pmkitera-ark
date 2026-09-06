export interface UploadOptions {
  key: string;
  body: Buffer | Uint8Array | ReadableStream;
  contentType: string;
  metadata?: Record<string, string>;
}

export interface StorageService {
  uploadFile(options: UploadOptions): Promise<{ key: string; url: string }>;
  deleteFile(key: string): Promise<boolean>;
  getDownloadUrl(key: string, expiresInSeconds?: number): Promise<string>;
  getPublicUrl(key: string): string;
  fileExists(key: string): Promise<boolean>;
}
