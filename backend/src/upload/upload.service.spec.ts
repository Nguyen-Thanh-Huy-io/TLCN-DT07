import { BadRequestException } from '@nestjs/common';
import type { Request } from 'express';
import { UploadService } from './upload.service';

describe('UploadService', () => {
  let service: UploadService;

  beforeEach(() => {
    service = new UploadService();
  });

  it('ném BadRequestException khi không có file được tải lên', async () => {
    await expect(
      service.processUploadedFile(
        undefined,
        undefined,
        'Vui lòng chọn file hình ảnh để tải lên',
      ),
    ).rejects.toThrow(BadRequestException);
  });

  it('trả về URL cục bộ dựa trên host của request khi không cấu hình Cloudinary', async () => {
    const mockFile = {
      filename: 'history-123.png',
      originalname: 'map.png',
      size: 2048,
      path: '',
    } as Express.Multer.File;

    const mockReq = {
      protocol: 'http',
      get: (header: string) =>
        header === 'host' ? 'localhost:5000' : undefined,
    } as unknown as Request;

    const result = await service.processUploadedFile(
      mockFile,
      mockReq,
      'Missing file',
    );

    expect(result).toEqual({
      success: true,
      filename: 'history-123.png',
      originalName: 'map.png',
      size: 2048,
      url: 'http://localhost:5000/uploads/history-123.png',
    });
  });
});
