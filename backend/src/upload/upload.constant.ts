import { join } from 'path';

export const UPLOAD_DIR = join(process.cwd(), 'uploads');
export const CLOUDINARY_UPLOAD_FOLDER = 'hisgo/uploads';

export const IMAGE_MAX_SIZE_BYTES = 5 * 1024 * 1024;
export const DOCUMENT_MAX_SIZE_BYTES = 20 * 1024 * 1024;

export const ALLOWED_IMAGE_EXTENSIONS = [
  '.jpg',
  '.jpeg',
  '.png',
  '.webp',
  '.gif',
] as const;

export const ALLOWED_DOCUMENT_EXTENSIONS = [
  '.pdf',
  '.doc',
  '.docx',
  '.txt',
  '.ppt',
  '.pptx',
  '.epub',
] as const;

export interface UploadResult {
  success: boolean;
  filename: string;
  originalName: string;
  size: number;
  url: string;
}
