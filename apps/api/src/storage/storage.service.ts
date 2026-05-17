import {
  DeleteObjectCommand,
  GetObjectCommand,
  HeadObjectCommand,
  PutObjectCommand,
  S3Client,
} from "@aws-sdk/client-s3";
import { getSignedUrl } from "@aws-sdk/s3-request-presigner";
import { Injectable } from "@nestjs/common";
import { getApiEnv } from "../config/env.js";
import type {
  CreatePresignedUploadUrlInput,
  HeadObjectResult,
  PresignedDownloadResult,
  PresignedUploadResult,
} from "./storage.types.js";

@Injectable()
export class StorageService {
  private readonly env = getApiEnv();
  private readonly client = new S3Client({
    region: this.env.storageRegion,
    endpoint: this.env.storageEndpoint,
    credentials: {
      accessKeyId: this.env.storageAccessKey,
      secretAccessKey: this.env.storageSecretKey,
    },
    forcePathStyle: this.env.storageForcePathStyle,
  });

  get bucket() {
    return this.env.storageBucket;
  }

  async createPresignedUploadUrl(
    input: CreatePresignedUploadUrlInput,
  ): Promise<PresignedUploadResult> {
    const expiresIn = this.env.storagePresignExpiresInSeconds;
    const command = new PutObjectCommand({
      Bucket: this.env.storageBucket,
      Key: input.key,
      ContentType: input.contentType,
    });
    const url = await getSignedUrl(this.client, command, { expiresIn });

    return {
      url,
      expires_at: new Date(Date.now() + expiresIn * 1000).toISOString(),
      headers: input.contentType ? { "Content-Type": input.contentType } : {},
    };
  }

  async createPresignedDownloadUrl(key: string): Promise<PresignedDownloadResult> {
    const expiresIn = this.env.storagePresignExpiresInSeconds;
    const command = new GetObjectCommand({
      Bucket: this.env.storageBucket,
      Key: key,
    });
    const url = await getSignedUrl(this.client, command, { expiresIn });

    return {
      url,
      expires_at: new Date(Date.now() + expiresIn * 1000).toISOString(),
    };
  }

  async headObject(key: string): Promise<HeadObjectResult> {
    try {
      const result = await this.client.send(
        new HeadObjectCommand({
          Bucket: this.env.storageBucket,
          Key: key,
        }),
      );

      return {
        exists: true,
        content_type: result.ContentType,
        content_length: result.ContentLength,
      };
    } catch {
      return { exists: false };
    }
  }

  async deleteObject(key: string): Promise<void> {
    await this.client.send(
      new DeleteObjectCommand({
        Bucket: this.env.storageBucket,
        Key: key,
      }),
    );
  }
}
