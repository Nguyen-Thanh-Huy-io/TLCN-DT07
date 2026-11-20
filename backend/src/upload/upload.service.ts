import { BadRequestException, Injectable } from '@nestjs/common';
import type { Request } from 'express';
import { existsSync, mkdirSync, unlinkSync } from 'fs';
import { v2 as cloudinary } from 'cloudinary';
import config from '../common/config/app.config';
import {
  CLOUDINARY_UPLOAD_FOLDER,
  UPLOAD_DIR,
  UploadResult,
} from './upload.constant';

@Injectable()
export class UploadService {
  private readonly hasCloudinaryConfig: boolean;

  constructor() {
    if (!existsSync(UPLOAD_DIR)) {
      mkdirSync(UPLOAD_DIR, { recursive: true });
    }

    this.hasCloudinaryConfig = Boolean(
      config.cloudinary_cloud_name &&
      config.cloudinary_api_key &&
      config.cloudinary_api_secret,
    );

    if (this.hasCloudinaryConfig) {
      cloudinary.config({
        cloud_name: config.cloudinary_cloud_name,
        api_key: config.cloudinary_api_key,
        api_secret: config.cloudinary_api_secret,
        secure: true,
      });
    }
  }

  async processUploadedFile(
    file: Express.Multer.File | undefined,
    req: Request | undefined,
    missingFileMessage: string,
  ): Promise<UploadResult> {
    if (!file) {
      throw new BadRequestException(missingFileMessage);
    }

    const cloudinaryResult = await this.uploadToCloudinary(file);
    if (cloudinaryResult) {
      return cloudinaryResult;
    }

    return {
      success: true,
      filename: file.filename,
      originalName: file.originalname,
      size: file.size,
      url: this.buildLocalUploadUrl(req, file.filename),
    };
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

  private async uploadToCloudinary(
    file: Express.Multer.File,
  ): Promise<UploadResult | null> {
    if (!this.hasCloudinaryConfig) {
      return null;
    }

    const result = await cloudinary.uploader.upload(file.path, {
      folder: CLOUDINARY_UPLOAD_FOLDER,
      resource_type: 'auto',
    });

    if (file.path) {
      try {
        unlinkSync(file.path);
      } catch {
        // Ignore temporary local file cleanup error after successful remote upload
      }
    }

    return {
      success: true,
      filename: file.filename,
      originalName: file.originalname,
      size: file.size,
      url: result.secure_url || result.url,
    };
  }
}
