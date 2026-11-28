import {
  BadRequestException,
  Controller,
  Post,
  Req,
  UploadedFile,
  UseGuards,
  UseInterceptors,
} from '@nestjs/common';
import { FileInterceptor } from '@nestjs/platform-express';
import {
  ApiBearerAuth,
  ApiBody,
  ApiConsumes,
  ApiOperation,
  ApiTags,
} from '@nestjs/swagger';
import type { Request } from 'express';
import { memoryStorage } from 'multer';
import type { MulterOptions } from '@nestjs/platform-express/multer/interfaces/multer-options.interface';
import { extname } from 'path';
import { ContentWrite } from '../common/access/access.decorator';
import { AuthGuard } from '../common/guards/auth.guard';
import {
  ALLOWED_AUDIO_EXTENSIONS,
  ALLOWED_DOCUMENT_EXTENSIONS,
  ALLOWED_IMAGE_EXTENSIONS,
  ALLOWED_VIDEO_EXTENSIONS,
  AUDIO_MAX_SIZE_BYTES,
  DOCUMENT_MAX_SIZE_BYTES,
  IMAGE_MAX_SIZE_BYTES,
  UPLOAD_PREFIX,
  UploadResult,
  VIDEO_MAX_SIZE_BYTES,
} from './upload.constant';
import { UploadService } from './upload.service';

function createMemoryUploadOptions(
  maxBytes: number,
  allowedExtensions: readonly string[],
  invalidExtMessage: string,
): MulterOptions {
  return {
    storage: memoryStorage(),
    limits: { fileSize: maxBytes },
    fileFilter: (_req, file, cb) => {
      const ext = extname(file.originalname).toLowerCase();
      if (allowedExtensions.includes(ext)) {
        cb(null, true);
      } else {
        cb(new BadRequestException(invalidExtMessage), false);
      }
    },
  };
}

@ApiTags('Upload')
@Controller('upload')
export class UploadController {
  constructor(private readonly uploadService: UploadService) {}

  @Post('image')
  @UseGuards(AuthGuard)
  @ApiBearerAuth('JWT-auth')
  @ApiOperation({
    summary: 'Tải lên hình ảnh tư liệu lịch sử / Cộng đồng (lưu Cloudinary)',
  })
  @ApiConsumes('multipart/form-data')
  @ApiBody({
    schema: {
      type: 'object',
      properties: { file: { type: 'string', format: 'binary' } },
    },
  })
  @UseInterceptors(
    FileInterceptor(
      'file',
      createMemoryUploadOptions(
        IMAGE_MAX_SIZE_BYTES,
        ALLOWED_IMAGE_EXTENSIONS,
        'Chỉ hỗ trợ tải lên file hình ảnh (.jpg, .jpeg, .png, .webp, .gif)',
      ),
    ),
  )
  async uploadImage(
    @UploadedFile() file?: Express.Multer.File,
    @Req() req?: Request,
  ): Promise<UploadResult> {
    return this.uploadService.processUploadedFile(
      file,
      req,
      'Vui lòng chọn file hình ảnh để tải lên',
      UPLOAD_PREFIX.IMAGE,
    );
  }

  @Post('audio')
  @UseGuards(AuthGuard)
  @ApiBearerAuth('JWT-auth')
  @ApiOperation({
    summary:
      'Tải lên file âm thanh ghi chú / lời thoại (.mp3, .wav, .ogg, .m4a ≤ 20MB)',
  })
  @ApiConsumes('multipart/form-data')
  @ApiBody({
    schema: {
      type: 'object',
      properties: { file: { type: 'string', format: 'binary' } },
    },
  })
  @UseInterceptors(
    FileInterceptor(
      'file',
      createMemoryUploadOptions(
        AUDIO_MAX_SIZE_BYTES,
        ALLOWED_AUDIO_EXTENSIONS,
        'Chỉ hỗ trợ tải lên file âm thanh (.mp3, .wav, .ogg, .m4a)',
      ),
    ),
  )
  async uploadAudio(
    @UploadedFile() file?: Express.Multer.File,
    @Req() req?: Request,
  ): Promise<UploadResult> {
    return this.uploadService.processUploadedFile(
      file,
      req,
      'Vui lòng chọn file âm thanh để tải lên',
      UPLOAD_PREFIX.AUDIO,
    );
  }

  @Post('video')
  @UseGuards(AuthGuard)
  @ApiBearerAuth('JWT-auth')
  @ApiOperation({
    summary:
      'Tải lên video tư liệu Cộng đồng lên Cloudinary (.mp4, .webm, .mov ≤ 50MB)',
  })
  @ApiConsumes('multipart/form-data')
  @ApiBody({
    schema: {
      type: 'object',
      properties: { file: { type: 'string', format: 'binary' } },
    },
  })
  @UseInterceptors(
    FileInterceptor(
      'file',
      createMemoryUploadOptions(
        VIDEO_MAX_SIZE_BYTES,
        ALLOWED_VIDEO_EXTENSIONS,
        'Chỉ hỗ trợ tải lên video (.mp4, .webm, .mov, .m4v)',
      ),
    ),
  )
  async uploadVideo(
    @UploadedFile() file?: Express.Multer.File,
    @Req() req?: Request,
  ): Promise<UploadResult> {
    return this.uploadService.processUploadedFile(
      file,
      req,
      'Vui lòng chọn file video để tải lên',
      UPLOAD_PREFIX.VIDEO,
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
      properties: { file: { type: 'string', format: 'binary' } },
    },
  })
  @UseInterceptors(
    FileInterceptor(
      'file',
      createMemoryUploadOptions(
        DOCUMENT_MAX_SIZE_BYTES,
        ALLOWED_DOCUMENT_EXTENSIONS,
        'Chỉ hỗ trợ tải lên tài liệu (.pdf, .doc, .docx, .txt, .ppt, .pptx, .epub)',
      ),
    ),
  )
  async uploadDocument(
    @UploadedFile() file?: Express.Multer.File,
    @Req() req?: Request,
  ): Promise<UploadResult> {
    return this.uploadService.processUploadedFile(
      file,
      req,
      'Vui lòng chọn file tài liệu để tải lên',
      UPLOAD_PREFIX.DOCUMENT,
    );
  }
}
