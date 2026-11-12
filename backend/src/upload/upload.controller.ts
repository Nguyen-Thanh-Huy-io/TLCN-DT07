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
import { extname } from 'path';
import { ContentWrite } from '../common/access/access.decorator';
import {
  ALLOWED_DOCUMENT_EXTENSIONS,
  ALLOWED_IMAGE_EXTENSIONS,
  DOCUMENT_MAX_SIZE_BYTES,
  IMAGE_MAX_SIZE_BYTES,
  UPLOAD_DIR,
  UploadResult,
} from './upload.constant';
import { UploadService } from './upload.service';

@ApiTags('Upload')
@Controller('upload')
export class UploadController {
  constructor(private readonly uploadService: UploadService) {}

  @Post('image')
  @ContentWrite()
  @ApiOperation({
    summary: 'Tải lên hình ảnh tư liệu lịch sử (PNG, JPG, WEBP, JPEG)',
  })
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
        fileSize: IMAGE_MAX_SIZE_BYTES,
      },
      fileFilter: (_req, file, cb) => {
        const ext = extname(file.originalname).toLowerCase();
        if ((ALLOWED_IMAGE_EXTENSIONS as readonly string[]).includes(ext)) {
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
  async uploadImage(
    @UploadedFile() file?: Express.Multer.File,
    @Req() req?: Request,
  ): Promise<UploadResult> {
    return this.uploadService.processUploadedFile(
      file,
      req,
      'Vui lòng chọn file hình ảnh để tải lên',
    );
  }

  @Post('document')
  @ContentWrite()
  @ApiOperation({
    summary: 'Tải lên tài liệu nghiên cứu lịch sử (PDF, DOC, DOCX, TXT)',
  })
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
        fileSize: DOCUMENT_MAX_SIZE_BYTES,
      },
      fileFilter: (_req, file, cb) => {
        const ext = extname(file.originalname).toLowerCase();
        if ((ALLOWED_DOCUMENT_EXTENSIONS as readonly string[]).includes(ext)) {
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
  async uploadDocument(
    @UploadedFile() file?: Express.Multer.File,
    @Req() req?: Request,
  ): Promise<UploadResult> {
    return this.uploadService.processUploadedFile(
      file,
      req,
      'Vui lòng chọn file tài liệu để tải lên',
    );
  }
}
