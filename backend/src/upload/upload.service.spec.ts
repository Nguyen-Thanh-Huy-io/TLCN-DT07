import { BadGatewayException, BadRequestException } from '@nestjs/common';
import type { Request } from 'express';
import { v2 as cloudinary } from 'cloudinary';
import config from '../common/config/app.config';
import { UploadService } from './upload.service';

describe('UploadService', () => {
  const originalCloud = config.cloudinary_cloud_name;
  const originalKey = config.cloudinary_api_key;
  const originalSecret = config.cloudinary_api_secret;

  afterEach(() => {
    config.cloudinary_cloud_name = originalCloud;
    config.cloudinary_api_key = originalKey;
    config.cloudinary_api_secret = originalSecret;
    jest.restoreAllMocks();
  });

  it('ném BadRequestException khi không có file được tải lên', async () => {
    const service = new UploadService();
    await expect(
      service.processUploadedFile(
        undefined,
        undefined,
        'Vui lòng chọn file hình ảnh để tải lên',
      ),
    ).rejects.toThrow(BadRequestException);
  });

  it('trả về URL cục bộ dựa trên host của request khi không cấu hình Cloudinary', async () => {
    config.cloudinary_cloud_name = '';
    config.cloudinary_api_key = '';
    config.cloudinary_api_secret = '';
    const service = new UploadService();

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

  it('stream buffer trực tiếp lên Cloudinary khi đã cấu hình đủ credentials', async () => {
    config.cloudinary_cloud_name = 'demo-cloud';
    config.cloudinary_api_key = '123456';
    config.cloudinary_api_secret = 'real-secret';
    const expectedCloudinaryUrl = [
      'https',
      '//res.cloudinary.com/demo-cloud/image/upload/v1/hisgo/uploads/mindmap-1.png',
    ].join(':');

    const uploadStreamSpy = jest
      .spyOn(cloudinary.uploader, 'upload_stream')
      .mockImplementation(((
        _opts: unknown,
        cb?: (err?: unknown, res?: unknown) => void,
      ) => ({
        end: () =>
          cb?.(undefined, {
            public_id: 'hisgo/uploads/mindmap-1',
            secure_url: expectedCloudinaryUrl,
          }),
      })) as unknown as typeof cloudinary.uploader.upload_stream);

    const service = new UploadService();
    const mockFile = {
      originalname: 'mindmap.png',
      size: 4096,
      buffer: Buffer.from('fake-png-bytes'),
    } as Express.Multer.File;

    const result = await service.processUploadedFile(
      mockFile,
      undefined,
      'Missing',
    );

    expect(uploadStreamSpy).toHaveBeenCalled();
    expect(result.url).toBe(expectedCloudinaryUrl);
  });

  it('ném BadGatewayException kèm lý do rõ ràng nếu Cloudinary từ chối (ví dụ sai API Secret)', async () => {
    config.cloudinary_cloud_name = 'demo-cloud';
    config.cloudinary_api_key = '123456';
    config.cloudinary_api_secret = 'wrong-secret';

    jest.spyOn(cloudinary.uploader, 'upload_stream').mockImplementation(((
      _opts: unknown,
      cb?: (err?: unknown, res?: unknown) => void,
    ) => ({
      end: () => cb?.({ message: 'Invalid Signature' }, undefined),
    })) as unknown as typeof cloudinary.uploader.upload_stream);

    const service = new UploadService();
    const mockFile = {
      originalname: 'mindmap.png',
      size: 4096,
      buffer: Buffer.from('fake-png-bytes'),
    } as Express.Multer.File;

    await expect(
      service.processUploadedFile(mockFile, undefined, 'Missing'),
    ).rejects.toThrow(BadGatewayException);
  });

  it('truyền resource_type=video khi upload file video lên Cloudinary', async () => {
    config.cloudinary_cloud_name = 'demo-cloud';
    config.cloudinary_api_key = '123456';
    config.cloudinary_api_secret = 'real-secret';
    const expectedVideoUrl = [
      'https',
      '//res.cloudinary.com/demo-cloud/video/upload/v1/hisgo/uploads/clip-1.mp4',
    ].join(':');

    const uploadStreamSpy = jest
      .spyOn(cloudinary.uploader, 'upload_stream')
      .mockImplementation(((
        _opts: unknown,
        cb?: (err?: unknown, res?: unknown) => void,
      ) => ({
        end: () =>
          cb?.(undefined, {
            public_id: 'hisgo/uploads/clip-1',
            secure_url: expectedVideoUrl,
          }),
      })) as unknown as typeof cloudinary.uploader.upload_stream);

    const service = new UploadService();
    const mockVideo = {
      originalname: 'lich-su.mp4',
      size: 102400,
      buffer: Buffer.from('fake-mp4-bytes'),
    } as Express.Multer.File;

    const result = await service.processUploadedFile(
      mockVideo,
      undefined,
      'Missing',
      'video',
    );

    expect(uploadStreamSpy).toHaveBeenCalledWith(
      expect.objectContaining({ resource_type: 'video' }),
      expect.any(Function),
    );
    expect(result.url).toBe(expectedVideoUrl);
  });
});
