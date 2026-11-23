import {
  BadGatewayException,
  BadRequestException,
  Injectable,
  Logger,
} from '@nestjs/common';
import type { Request } from 'express';
import { existsSync, mkdirSync, unlinkSync, writeFileSync } from 'fs';
import { extname, join } from 'path';
import { v2 as cloudinary, type UploadApiResponse } from 'cloudinary';
import config from '../common/config/app.config';
import {
  CLOUDINARY_UPLOAD_FOLDER,
  UPLOAD_DIR,
  UPLOAD_PREFIX,
  UploadResult,
} from './upload.constant';

function extractCloudinaryErrorMessage(err: unknown): string {
  if (err instanceof Error && err.message) return err.message;
  if (err && typeof err === 'object' && 'message' in err) {
    const msg = (err as { message?: unknown }).message;
    if (typeof msg === 'string' && msg.trim()) return msg;
  }
  return 'Lỗi kết nối hoặc xác thực Cloudinary';
}

function generateStoredFilename(prefix: string, originalName: string): string {
  const uniqueSuffix = `${Date.now()}-${Math.round(Math.random() * 1e9)}`;
  const ext = extname(originalName || '').toLowerCase();
  return `${prefix}-${uniqueSuffix}${ext}`;
}

@Injectable()
export class UploadService {
  private readonly logger = new Logger(UploadService.name);
  private readonly hasCloudinaryConfig: boolean;

  constructor() {
    const cloudName = config.cloudinary_cloud_name.trim();
    const apiKey = config.cloudinary_api_key.trim();
    const apiSecret = config.cloudinary_api_secret.trim();

    this.hasCloudinaryConfig = Boolean(cloudName && apiKey && apiSecret);

    if (this.hasCloudinaryConfig) {
      cloudinary.config({
        cloud_name: cloudName,
        api_key: apiKey,
        api_secret: apiSecret,
        secure: true,
      });
    } else if (!existsSync(UPLOAD_DIR)) {
      mkdirSync(UPLOAD_DIR, { recursive: true });
    }
  }

  async processUploadedFile(
    file: Express.Multer.File | undefined,
    req: Request | undefined,
    missingFileMessage: string,
    filenamePrefix: string = UPLOAD_PREFIX.IMAGE,
  ): Promise<UploadResult> {
    if (!file) {
      throw new BadRequestException(missingFileMessage);
    }

    if (this.hasCloudinaryConfig) {
      return this.uploadToCloudinary(file, filenamePrefix);
    }

    return this.saveToLocalFallback(file, req, filenamePrefix);
  }

  buildLocalUploadUrl(req: Request | undefined, filename: string): string {
    const requestHost = req?.get ? req.get('host') : undefined;
    const protocol = req?.protocol || 'http';
    const host =
      config.app_url ||
      (requestHost
        ? `${protocol}://${requestHost}`
        : `http://localhost:${config.port}`);

    return `${host}/uploads/${filename}`;
  }

  private saveToLocalFallback(
    file: Express.Multer.File,
    req: Request | undefined,
    filenamePrefix: string,
  ): UploadResult {
    const filename =
      file.filename ||
      generateStoredFilename(filenamePrefix, file.originalname);
    if (!file.filename && file.buffer?.length) {
      if (!existsSync(UPLOAD_DIR)) {
        mkdirSync(UPLOAD_DIR, { recursive: true });
      }
      writeFileSync(join(UPLOAD_DIR, filename), file.buffer);
    }
    return {
      success: true,
      filename,
      originalName: file.originalname,
      size: file.size,
      url: this.buildLocalUploadUrl(req, filename),
    };
  }

  private uploadBufferToCloudinary(
    buffer: Buffer,
    resourceType: 'auto' | 'video',
  ): Promise<UploadApiResponse> {
    return new Promise((resolve, reject) => {
      const stream = cloudinary.uploader.upload_stream(
        { folder: CLOUDINARY_UPLOAD_FOLDER, resource_type: resourceType },
        (error, result) => {
          if (error || !result) {
            reject(
              error instanceof Error
                ? error
                : new Error(extractCloudinaryErrorMessage(error)),
            );
            return;
          }
          resolve(result);
        },
      );
      stream.end(buffer);
    });
  }

  private async uploadToCloudinary(
    file: Express.Multer.File,
    filenamePrefix: string,
  ): Promise<UploadResult> {
    const resourceType =
      filenamePrefix === UPLOAD_PREFIX.VIDEO ? 'video' : 'auto';
    try {
      const result: UploadApiResponse = file.buffer?.length
        ? await this.uploadBufferToCloudinary(file.buffer, resourceType)
        : await cloudinary.uploader.upload(file.path, {
            folder: CLOUDINARY_UPLOAD_FOLDER,
            resource_type: resourceType,
          });

      if (file.path) {
        try {
          unlinkSync(file.path);
        } catch {
          // Bỏ qua lỗi dọn file tạm nếu tệp không còn
        }
      }

      return {
        success: true,
        filename:
          result.public_id ||
          file.filename ||
          generateStoredFilename(filenamePrefix, file.originalname),
        originalName: file.originalname,
        size: file.size,
        url: result.secure_url || result.url,
      };
    } catch (error) {
      const detail = extractCloudinaryErrorMessage(error);
      this.logger.error(`Cloudinary upload failed: ${detail}`);
      throw new BadGatewayException(
        `Tải tệp lên Cloudinary thất bại (${detail}). Kiểm tra lại CLOUDINARY_CLOUD_NAME, CLOUDINARY_API_KEY và CLOUDINARY_API_SECRET.`,
      );
    }
  }
}
