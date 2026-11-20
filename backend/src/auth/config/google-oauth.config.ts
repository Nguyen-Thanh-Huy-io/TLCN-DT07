/**
 * Google OAuth Configuration
 * Industry-standard configuration for Google OAuth 2.0
 */

const GOOGLE_AUTH_HOST = 'accounts.google.com';
const GOOGLE_OAUTH2_HOST = 'oauth2.googleapis.com';
const GOOGLE_APIS_HOST = 'www.googleapis.com';

export const GOOGLE_OAUTH_CONFIG = {
  // OAuth 2.0 Endpoints
  ENDPOINTS: {
    AUTHORIZATION:
      process.env.GOOGLE_OAUTH_AUTH_URL ||
      `https://${GOOGLE_AUTH_HOST}/o/oauth2/v2/auth`,
    TOKEN:
      process.env.GOOGLE_OAUTH_TOKEN_URL ||
      `https://${GOOGLE_OAUTH2_HOST}/token`,
    USERINFO:
      process.env.GOOGLE_OAUTH_USERINFO_URL ||
      `https://${GOOGLE_APIS_HOST}/oauth2/v3/userinfo`,
    TOKEN_INFO:
      process.env.GOOGLE_OAUTH_TOKEN_INFO_URL ||
      `https://${GOOGLE_OAUTH2_HOST}/tokeninfo`,
    REVOKE:
      process.env.GOOGLE_OAUTH_REVOKE_URL ||
      `https://${GOOGLE_OAUTH2_HOST}/revoke`,
    JWKS:
      process.env.GOOGLE_OAUTH_JWKS_URL ||
      `https://${GOOGLE_APIS_HOST}/oauth2/v3/certs`,
  },

  // OAuth 2.0 Scopes
  SCOPES: ['openid', 'email', 'profile'],

  // Access type for refresh token
  ACCESS_TYPE: 'offline' as const,

  // Prompt type for consent
  PROMPT: 'consent' as const,

  // Response type for authorization code flow
  RESPONSE_TYPE: 'code' as const,

  // Grant types
  GRANT_TYPES: {
    AUTHORIZATION_CODE: 'authorization_code',
    REFRESH_TOKEN: 'refresh_token',
  },

  // State token configuration
  STATE: {
    TTL_SECONDS: 600, // 10 minutes
    CACHE_PREFIX: 'google_oauth_state',
  },
} as const;

/**
 * Get Google OAuth credentials from environment variables
 */
export const getGoogleOAuthCredentials = () => {
  const clientId = process.env.GOOGLE_CLIENT_ID;
  const clientSecret = process.env.GOOGLE_CLIENT_SECRET;
  const redirectUri = process.env.GOOGLE_REDIRECT_URI;

  if (!clientId || !clientSecret || !redirectUri) {
    throw new Error(
      'Google OAuth credentials not configured. Please set GOOGLE_CLIENT_ID, GOOGLE_CLIENT_SECRET, and GOOGLE_REDIRECT_URI environment variables.',
    );
  }

  return {
    clientId,
    clientSecret,
    redirectUri,
  };
};
