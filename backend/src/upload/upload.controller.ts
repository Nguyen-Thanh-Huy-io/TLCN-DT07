import {
  Controller,
  Post,
  UploadedFile,
  UseInterceptors,
  BadRequestException,
  Req,
} from '@nestjs/common';
import type { Request } from 'express';
import { FileInterceptor } from '@nestjs/platform-express';
import { ApiTags, ApiOperation, ApiConsumes, ApiBody } from '@nestjs/swagger';
import { diskStorage } from 'multer';
import { extname, join } from 'path';
import { existsSync, mkdirSync } from 'fs';

const UPLOAD_DIR = join(process.cwd(), 'uploads');
if (!existsSync(UPLOAD_DIR)) {
  mkdirSync(UPLOAD_DIR, { recursive: true });
}

@ApiTags('Upload')
@Controller('upload')
export class UploadController {
  @Post('image')
  @ApiOperation({ summary: 'Tải lên hình ảnh tư liệu lịch sử (PNG, JPG, WEBP, JPEG)' })
  @ApiConsumes('multipart/form-data')
  @ApiBody({
    schema: {
      type: 'object',
      properties: {
        file: {
          type: 'string',
          format: 'binary',
        },
      },
    },
  })
  @UseInterceptors(
    FileInterceptor('file', {
      storage: diskStorage({
        destination: (_req, _file, cb) => {
          cb(null, UPLOAD_DIR);
        },
        filename: (_req, file, cb) => {
          const uniqueSuffix = `${Date.now()}-${Math.round(Math.random() * 1e9)}`;
          const ext = extname(file.originalname).toLowerCase();
          cb(null, `history-${uniqueSuffix}${ext}`);
        },
      }),
      limits: {
        fileSize: 5 * 1024 * 1024, // 5MB limit
      },
      fileFilter: (_req, file, cb) => {
        const allowedExtensions = ['.jpg', '.jpeg', '.png', '.webp', '.gif'];
        const ext = extname(file.originalname).toLowerCase();
        if (allowedExtensions.includes(ext)) {
          cb(null, true);
        } else {
          cb(
            new BadRequestException(
              'Chỉ hỗ trợ tải lên file hình ảnh (.jpg, .jpeg, .png, .webp, .gif)',
            ),
            false,
          );
        }
      },
    }),
  )
  uploadImage(
    @UploadedFile() file?: Express.Multer.File,
    @Req() req?: Request,
  ) {
    if (!file) {
      throw new BadRequestException('Vui lòng chọn file hình ảnh để tải lên');
    }

    const requestHost = req?.get ? req.get('host') : undefined;
    const protocol = req?.protocol || 'http';
    const host =
      process.env.APP_URL ||
      (requestHost ? `${protocol}://${requestHost}` : `http://localhost:${process.env.PORT || 5001}`);
    const fileUrl = `${host}/uploads/${file.filename}`;

    return {
      success: true,
      filename: file.filename,
      originalName: file.originalname,
      size: file.size,
      url: fileUrl,
    };
  }

  @Post('document')
  @ApiOperation({ summary: 'Tải lên tài liệu nghiên cứu lịch sử (PDF, DOC, DOCX, TXT)' })
  @ApiConsumes('multipart/form-data')
  @ApiBody({
    schema: {
      type: 'object',
      properties: {
        file: {
          type: 'string',
          format: 'binary',
        },
      },
    },
  })
  @UseInterceptors(
    FileInterceptor('file', {
      storage: diskStorage({
        destination: (_req, _file, cb) => {
          cb(null, UPLOAD_DIR);
        },
        filename: (_req, file, cb) => {
          const uniqueSuffix = `${Date.now()}-${Math.round(Math.random() * 1e9)}`;
          const ext = extname(file.originalname).toLowerCase();
          cb(null, `doc-${uniqueSuffix}${ext}`);
        },
      }),
      limits: {
        fileSize: 20 * 1024 * 1024, // 20MB limit
      },
      fileFilter: (_req, file, cb) => {
        const allowedExtensions = ['.pdf', '.doc', '.docx', '.txt', '.ppt', '.pptx', '.epub'];
        const ext = extname(file.originalname).toLowerCase();
        if (allowedExtensions.includes(ext)) {
          cb(null, true);
        } else {
          cb(
            new BadRequestException(
              'Chỉ hỗ trợ tải lên tài liệu (.pdf, .doc, .docx, .txt, .ppt, .pptx, .epub)',
            ),
            false,
          );
        }
      },
    }),
  )
  uploadDocument(
    @UploadedFile() file?: Express.Multer.File,
    @Req() req?: Request,
  ) {
    if (!file) {
      throw new BadRequestException('Vui lòng chọn file tài liệu để tải lên');
    }

    const requestHost = req?.get ? req.get('host') : undefined;
    const protocol = req?.protocol || 'http';
    const host =
      process.env.APP_URL ||
      (requestHost ? `${protocol}://${requestHost}` : `http://localhost:${process.env.PORT || 5001}`);
    const fileUrl = `${host}/uploads/${file.filename}`;

    return {
      success: true,
      filename: file.filename,
      originalName: file.originalname,
      size: file.size,
      url: fileUrl,
    };
  }
}
