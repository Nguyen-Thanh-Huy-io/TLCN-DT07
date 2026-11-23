import 'dotenv/config';

interface AppConfig {
  database_url: string;
  app_url: string;
  jwt_access_secret: string;
  jwt_refresh_secret: string;
  redis_cache_key_prefix: string;
  node_env: string;
  port: number;
  email_host: string;
  email_port: number;
  email_user: string;
  email_pass: string;
  email_from: string;
  // Google OAuth
  google_client_id: string;
  google_client_secret: string;
  google_redirect_uri: string;
  // Cloudinary
  cloudinary_cloud_name: string;
  cloudinary_api_key: string;
  cloudinary_api_secret: string;
  // Google Cloud Vertex AI & Gemini AI
  google_cloud_project_id: string;
  google_cloud_location: string;
  google_application_credentials: string;
  google_cloud_service_account_json: string;
  gemini_api_key: string;
  gemini_model: string;
  // Vertex AI RAG Engine
  google_cloud_rag_location: string;
  google_cloud_rag_corpus: string;
  google_cloud_rag_bucket: string;
  google_cloud_rag_top_k: number;
  google_cloud_rag_distance_threshold: number;
}

const config: AppConfig = {
  database_url: process.env.DATABASE_URL || '',
  app_url: process.env.APP_URL || '',
  jwt_access_secret:
    process.env.JWT_ACCESS_SECRET || process.env.JWT_SECRET || '',
  jwt_refresh_secret:
    process.env.JWT_REFRESH_SECRET || process.env.JWT_SECRET || '',
  redis_cache_key_prefix: process.env.REDIS_CACHE_KEY_PREFIX || 'app',
  node_env: process.env.NODE_ENV || 'development',
  port: parseInt(process.env.PORT || '5000', 10),
  email_host: process.env.EMAIL_HOST || 'smtp.gmail.com',
  email_port: parseInt(process.env.EMAIL_PORT || '587', 10),
  email_user: process.env.EMAIL_USER || '',
  email_pass: process.env.EMAIL_PASS || '',
  email_from: process.env.EMAIL_FROM || process.env.EMAIL_USER || '',
  // Google OAuth
  google_client_id: process.env.GOOGLE_CLIENT_ID || '',
  google_client_secret: process.env.GOOGLE_CLIENT_SECRET || '',
  google_redirect_uri: process.env.GOOGLE_REDIRECT_URI || '',
  // Cloudinary
  cloudinary_cloud_name: process.env.CLOUDINARY_CLOUD_NAME || '',
  cloudinary_api_key: process.env.CLOUDINARY_API_KEY || '',
  cloudinary_api_secret: process.env.CLOUDINARY_API_SECRET || '',
  // Google Cloud Vertex AI & Gemini AI
  google_cloud_project_id: (process.env.GOOGLE_CLOUD_PROJECT_ID || '').trim(),
  google_cloud_location: (
    process.env.GOOGLE_CLOUD_LOCATION || 'us-central1'
  ).trim(),
  google_application_credentials: (
    process.env.GOOGLE_APPLICATION_CREDENTIALS || ''
  ).trim(),
  google_cloud_service_account_json: (
    process.env.GOOGLE_CLOUD_SERVICE_ACCOUNT_JSON || ''
  ).trim(),
  gemini_api_key: (process.env.GEMINI_API_KEY || '').trim(),
  gemini_model: (
    process.env.GOOGLE_CLOUD_AI_MODEL ||
    process.env.GEMINI_MODEL ||
    'gemini-2.0-flash'
  ).trim(),
  // Vertex AI RAG Engine
  google_cloud_rag_location: (
    process.env.GOOGLE_CLOUD_RAG_LOCATION || 'us-central1'
  ).trim(),
  google_cloud_rag_corpus: (process.env.GOOGLE_CLOUD_RAG_CORPUS || '').trim(),
  google_cloud_rag_bucket: (process.env.GOOGLE_CLOUD_RAG_BUCKET || '').trim(),
  google_cloud_rag_top_k: Math.max(
    1,
    parseInt(process.env.GOOGLE_CLOUD_RAG_TOP_K || '6', 10) || 6,
  ),
  google_cloud_rag_distance_threshold: (() => {
    const parsed = parseFloat(
      process.env.GOOGLE_CLOUD_RAG_DISTANCE_THRESHOLD || '0.62',
    );
    return Number.isFinite(parsed) && parsed > 0 && parsed <= 1 ? parsed : 0.62;
  })(),
};

export default config;
