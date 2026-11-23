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

const MULTIPART_HEADERS = {
  'Content-Type': 'multipart/form-data',
} as const;

async function uploadMultipart(endpoint: string, file: File): Promise<UploadImageResult> {
  const formData = new FormData();
  formData.append('file', file);
  const res = await api.post<UploadResponse>(endpoint, formData, {
    headers: MULTIPART_HEADERS,
  });
  return res.data.data;
}

export class UploadApiService {
  /** Upload file ảnh lên Cloudinary. */
  static uploadImage(file: File): Promise<UploadImageResult> {
    return uploadMultipart('/upload/image', file);
  }

  /** Upload file video (MP4, WebM, MOV) lên Cloudinary. */
  static uploadVideo(file: File): Promise<UploadImageResult> {
    return uploadMultipart('/upload/video', file);
  }

  /** Upload file tài liệu (PDF, Word, TXT) lên server. */
  static uploadDocument(file: File): Promise<UploadImageResult> {
    return uploadMultipart('/upload/document', file);
  }
}
