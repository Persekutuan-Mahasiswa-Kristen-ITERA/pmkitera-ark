export const MAX_FILE_SIZE_BYTES = 50 * 1024 * 1024; // 50 MB
export const ACCEPTED_FILE_TYPES = [
  "application/vnd.openxmlformats-officedocument.presentationml.presentation", // .pptx
  "application/pdf",
] as const;

export const ACCEPTED_FILE_EXTENSIONS = ["pptx", "pdf"] as const;

export type AcceptedFileType = (typeof ACCEPTED_FILE_TYPES)[number];
export type AcceptedFileExtension = (typeof ACCEPTED_FILE_EXTENSIONS)[number];

export function isAcceptedFileType(contentType: string): boolean {
  return ACCEPTED_FILE_TYPES.includes(contentType as AcceptedFileType);
}

export function detectFileExtension(filename: string): AcceptedFileExtension | null {
  const lower = filename.toLowerCase();
  for (const ext of ACCEPTED_FILE_EXTENSIONS) {
    if (lower.endsWith(`.${ext}`)) return ext;
  }
  return null;
}
