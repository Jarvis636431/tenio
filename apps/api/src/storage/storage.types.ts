export interface CreatePresignedUploadUrlInput {
  key: string;
  contentType?: string;
}

export interface PresignedUploadResult {
  url: string;
  expires_at: string;
  headers: Record<string, string>;
}

export interface PresignedDownloadResult {
  url: string;
  expires_at: string;
}

export interface HeadObjectResult {
  exists: boolean;
  content_type?: string;
  content_length?: number;
}
