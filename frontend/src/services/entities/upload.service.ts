import api from '../api';

export interface UploadImageResult {
  success: boolean;
  filename: string;
  originalName: string;
  size: number;
  url: string;
}

/** Backend bọc mọi response qua TransformInterceptor: { statusCode, message, data }. */
interface UploadResponse {
  data: UploadImageResult;
}

export class UploadApiService {
  /**
   * Upload file ảnh lên backend. Backend sẽ ưu tiên Cloudinary nếu đã cấu hình,
   * ngược lại fallback về lưu local /uploads.
   */
  static async uploadImage(file: File): Promise<UploadImageResult> {
    const formData = new FormData();
    formData.append('file', file);

    const res = await api.post<UploadResponse>('/upload/image', formData, {
      headers: {
        'Content-Type': 'multipart/form-data',
      },
    });

    return res.data.data;
  }

  /**
   * Upload file tài liệu (PDF, Word, TXT) lên server
   */
  static async uploadDocument(file: File): Promise<UploadImageResult> {
    const formData = new FormData();
    formData.append('file', file);

    const res = await api.post<UploadResponse>('/upload/document', formData, {
      headers: {
        'Content-Type': 'multipart/form-data',
      },
    });

    return res.data.data;
  }
}
