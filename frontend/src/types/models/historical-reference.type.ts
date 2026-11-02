export interface HistoricalReferenceItem {
  id: string;
  title: string;
  author?: string | null;
  publisher?: string | null;
  publishYear?: number | null;
  url?: string | null;
  isbn?: string | null;
  doi?: string | null;
  metadata?: Record<string, any> | null;
  createdAt: string;
  updatedAt: string;
}

export interface CreateHistoricalReferencePayload {
  title: string;
  author?: string;
  publisher?: string;
  publishYear?: number;
  url?: string;
  isbn?: string;
  doi?: string;
  metadata?: Record<string, any>;
}
