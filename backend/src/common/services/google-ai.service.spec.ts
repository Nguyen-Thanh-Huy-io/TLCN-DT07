import { generateKeyPairSync } from 'node:crypto';
import * as fs from 'node:fs';
import * as os from 'node:os';
import * as path from 'node:path';
import * as jwt from 'jsonwebtoken';
import config from '../config/app.config';
import {
  GOOGLE_AI_ENDPOINTS,
  GoogleAiProviderMode,
  GoogleAiService,
} from './google-ai.service';

describe('GoogleAiService (Google Cloud Vertex AI & Gemini Fallback)', () => {
  const { privateKey, publicKey } = generateKeyPairSync('rsa', {
    modulusLength: 2048,
    publicKeyEncoding: { type: 'spki', format: 'pem' },
    privateKeyEncoding: { type: 'pkcs8', format: 'pem' },
  });

  const snapshot = {
    project: config.google_cloud_project_id,
    location: config.google_cloud_location,
    credsPath: config.google_application_credentials,
    credsJson: config.google_cloud_service_account_json,
    apiKey: config.gemini_api_key,
    model: config.gemini_model,
  };
  const originalFetch = global.fetch;

  beforeEach(() => {
    config.google_cloud_project_id = '';
    config.google_cloud_location = 'us-central1';
    config.google_application_credentials = '';
    config.google_cloud_service_account_json = '';
    config.gemini_api_key = '';
    config.gemini_model = 'gemini-2.0-flash';
    global.fetch = originalFetch;
  });

  afterEach(() => {
    global.fetch = originalFetch;
    jest.restoreAllMocks();
  });

  afterAll(() => {
    config.google_cloud_project_id = snapshot.project;
    config.google_cloud_location = snapshot.location;
    config.google_application_credentials = snapshot.credsPath;
    config.google_cloud_service_account_json = snapshot.credsJson;
    config.gemini_api_key = snapshot.apiKey;
    config.gemini_model = snapshot.model;
  });

  it('trả về NONE và null khi chưa cấu hình Service Account hay API key', async () => {
    const service = new GoogleAiService();
    const fetchSpy = jest.spyOn(global, 'fetch');

    expect(service.getProviderMode()).toBe(GoogleAiProviderMode.NONE);
    expect(service.isConfigured()).toBe(false);

    const res = await service.generateJson({
      systemPrompt: 'sys',
      userPrompt: 'usr',
    });

    expect(res).toBeNull();
    expect(fetchSpy).not.toHaveBeenCalled();
  });

  it('ký JWT RS256 đổi lấy OAuth2 Bearer token, gọi Vertex AI đúng region và cache token cho lượt sau', async () => {
    config.google_cloud_location = 'asia-southeast1';
    config.google_cloud_service_account_json = JSON.stringify({
      project_id: 'hisgo-gcp-prod',
      client_email: 'hisgo-ai@hisgo-gcp-prod.iam.gserviceaccount.com',
      private_key_id: 'key-2026',
      private_key: privateKey,
    });

    const fetchMock = jest
      .fn()
      .mockResolvedValueOnce({
        ok: true,
        json: async () => ({
          access_token: 'ya29.vertex-access-token',
          expires_in: 3600,
        }),
      })
      .mockResolvedValueOnce({
        ok: true,
        json: async () => ({
          candidates: [
            {
              content: {
                parts: [
                  { text: '```json\n{"reply":"Chào từ Vertex AI"}\n```' },
                ],
              },
            },
          ],
        }),
      })
      .mockResolvedValueOnce({
        ok: true,
        json: async () => ({
          candidates: [
            {
              content: {
                parts: [{ text: '{"reply":"Lượt thứ 2 dùng token cache"}' }],
              },
            },
          ],
        }),
      });
    global.fetch = fetchMock as typeof fetch;

    const service = new GoogleAiService();
    expect(service.getProviderMode()).toBe(
      GoogleAiProviderMode.VERTEX_SERVICE_ACCOUNT,
    );

    const first = await service.generateJson<{ reply: string }>({
      systemPrompt: 'System',
      userPrompt: 'Prompt 1',
    });
    const second = await service.generateJson<{ reply: string }>({
      systemPrompt: 'System',
      userPrompt: 'Prompt 2',
    });

    expect(first).toEqual({ reply: 'Chào từ Vertex AI' });
    expect(second).toEqual({ reply: 'Lượt thứ 2 dùng token cache' });
    // Chỉ gọi oauth2 token 1 lần + 2 lần Vertex generateContent = 3 lần
    expect(fetchMock).toHaveBeenCalledTimes(3);

    const [oauthUrl, oauthInit] = fetchMock.mock.calls[0] as [
      string,
      RequestInit,
    ];
    expect(oauthUrl).toBe(GOOGLE_AI_ENDPOINTS.OAUTH2_TOKEN_URL);
    const bodyParams = new URLSearchParams(String(oauthInit.body));
    const assertionJwt = bodyParams.get('assertion') ?? '';
    const verified = jwt.verify(assertionJwt, publicKey, {
      algorithms: ['RS256'],
    }) as jwt.JwtPayload;
    expect(verified.iss).toBe(
      'hisgo-ai@hisgo-gcp-prod.iam.gserviceaccount.com',
    );
    expect(verified.scope).toBe(GOOGLE_AI_ENDPOINTS.CLOUD_PLATFORM_SCOPE);

    const [vertexUrl, vertexInit] = fetchMock.mock.calls[1] as [
      string,
      RequestInit,
    ];
    const parsedRegionalUrl = new URL(vertexUrl);
    expect(parsedRegionalUrl.hostname).toBe(
      'asia-southeast1-aiplatform.googleapis.com',
    );
    expect(parsedRegionalUrl.pathname).toBe(
      '/v1/projects/hisgo-gcp-prod/locations/asia-southeast1/publishers/google/models/gemini-2.0-flash:generateContent',
    );
    expect((vertexInit.headers as Record<string, string>).Authorization).toBe(
      'Bearer ya29.vertex-access-token',
    );
  });

  it('hỗ trợ global location, base64 Service Account JSON và đường dẫn GOOGLE_APPLICATION_CREDENTIALS', async () => {
    const rawSa = JSON.stringify({
      project_id: 'hisgo-global',
      client_email: 'sa@hisgo-global.iam.gserviceaccount.com',
      private_key: privateKey,
    });
    config.google_cloud_location = 'global';
    config.google_cloud_service_account_json = Buffer.from(
      rawSa,
      'utf8',
    ).toString('base64');

    const fetchMock = jest
      .fn()
      .mockResolvedValueOnce({
        ok: true,
        json: async () => ({
          access_token: 'ya29.global-token',
          expires_in: 3600,
        }),
      })
      .mockResolvedValueOnce({
        ok: true,
        json: async () => ({
          candidates: [{ content: { parts: [{ text: '{"ok":true}' }] } }],
        }),
      });
    global.fetch = fetchMock as typeof fetch;

    const service = new GoogleAiService();
    const res = await service.generateJson<{ ok: boolean }>({
      systemPrompt: 'sys',
      userPrompt: 'usr',
    });

    expect(res).toEqual({ ok: true });
    const parsedGlobalUrl = new URL(String(fetchMock.mock.calls[1][0]));
    expect(parsedGlobalUrl.hostname).toBe('aiplatform.googleapis.com');
    expect(parsedGlobalUrl.pathname).toBe(
      '/v1/projects/hisgo-global/locations/global/publishers/google/models/gemini-2.0-flash:generateContent',
    );

    const tmpFile = path.join(os.tmpdir(), `hisgo-sa-${Date.now()}.json`);
    fs.writeFileSync(tmpFile, rawSa, 'utf8');
    try {
      config.google_cloud_service_account_json = '';
      config.google_application_credentials = tmpFile;
      expect(service.getProviderMode()).toBe(
        GoogleAiProviderMode.VERTEX_SERVICE_ACCOUNT,
      );
    } finally {
      fs.unlinkSync(tmpFile);
    }
  });

  it('trả về null an toàn khi Vertex OAuth hoặc endpoint HTTP trả lỗi', async () => {
    config.google_cloud_service_account_json = JSON.stringify({
      project_id: 'hisgo-err',
      client_email: 'sa@hisgo-err.iam.gserviceaccount.com',
      private_key: privateKey,
    });

    global.fetch = jest.fn().mockResolvedValue({
      ok: false,
      status: 403,
      text: async () => 'Permission denied',
    }) as typeof fetch;

    const service = new GoogleAiService();
    const res = await service.generateJson({
      systemPrompt: 'sys',
      userPrompt: 'usr',
    });

    expect(res).toBeNull();
  });

  it('gửi tool vertexRagStore khi gọi generateGroundedJson và trích xuất groundingChunks', async () => {
    config.google_cloud_location = 'global';
    config.google_cloud_service_account_json = JSON.stringify({
      project_id: 'hisgo-rag-test',
      client_email: 'sa@hisgo-rag-test.iam.gserviceaccount.com',
      private_key: privateKey,
    });

    const corpusName =
      'projects/hisgo-rag-test/locations/us-central1/ragCorpora/123456';
    const fetchMock = jest
      .fn()
      .mockResolvedValueOnce({
        ok: true,
        json: async () => ({
          access_token: 'ya29.rag-token',
          expires_in: 3600,
        }),
      })
      .mockResolvedValueOnce({
        ok: true,
        json: async () => ({
          candidates: [
            {
              content: {
                parts: [{ text: '{"reply":"Ngô Quyền thắng năm 938."}' }],
              },
              groundingMetadata: {
                groundingChunks: [
                  {
                    retrievedContext: {
                      uri: 'gs://hisgo-rag/hisgo/articles/su-kien--bach-dang.md',
                      title: 'su-kien--bach-dang.md',
                      text: 'Ngô Quyền đánh tan quân Nam Hán năm 938.',
                    },
                  },
                ],
              },
            },
          ],
        }),
      });
    global.fetch = fetchMock as typeof fetch;

    const service = new GoogleAiService();
    const grounded = await service.generateGroundedJson<{ reply: string }>({
      systemPrompt: 'sys',
      userPrompt: 'Trận Bạch Đằng',
      ragCorpus: corpusName,
      topK: 5,
      vectorDistanceThreshold: 0.6,
    });

    expect(grounded).not.toBeNull();
    expect(grounded?.usedRag).toBe(true);
    expect(grounded?.data).toEqual({ reply: 'Ngô Quyền thắng năm 938.' });
    expect(grounded?.groundingChunks).toEqual([
      {
        uri: 'gs://hisgo-rag/hisgo/articles/su-kien--bach-dang.md',
        title: 'su-kien--bach-dang.md',
        text: 'Ngô Quyền đánh tan quân Nam Hán năm 938.',
      },
    ]);

    const [ragUrl, ragInit] = fetchMock.mock.calls[1] as [string, RequestInit];
    expect(new URL(ragUrl).pathname).toContain(
      '/v1beta1/projects/hisgo-rag-test/',
    );
    const sentBody = JSON.parse(String(ragInit.body)) as {
      tools?: Array<{
        retrieval?: {
          vertexRagStore?: {
            ragResources?: Array<{ ragCorpus?: string }>;
            ragRetrievalConfig?: {
              topK?: number;
              filter?: { vectorDistanceThreshold?: number };
            };
          };
        };
      }>;
    };
    expect(
      sentBody.tools?.[0]?.retrieval?.vertexRagStore?.ragResources?.[0]
        ?.ragCorpus,
    ).toBe(corpusName);
    expect(
      sentBody.tools?.[0]?.retrieval?.vertexRagStore?.ragRetrievalConfig?.topK,
    ).toBe(5);
  });

  it('fallback sang gọi Vertex AI trực tiếp (usedRag=false) nếu RAG endpoint trả lỗi', async () => {
    config.google_cloud_location = 'global';
    config.google_cloud_service_account_json = JSON.stringify({
      project_id: 'hisgo-rag-fallback',
      client_email: 'sa@hisgo-rag-fallback.iam.gserviceaccount.com',
      private_key: privateKey,
    });

    const fetchMock = jest
      .fn()
      .mockResolvedValueOnce({
        ok: true,
        json: async () => ({ access_token: 'ya29.tok', expires_in: 3600 }),
      })
      .mockResolvedValueOnce({
        ok: false,
        status: 400,
        text: async () => 'RAG temporarily unavailable',
      })
      .mockResolvedValueOnce({
        ok: true,
        json: async () => ({
          candidates: [
            { content: { parts: [{ text: '{"reply":"Trả lời trực tiếp"}' }] } },
          ],
        }),
      });
    global.fetch = fetchMock as typeof fetch;

    const service = new GoogleAiService();
    const grounded = await service.generateGroundedJson<{ reply: string }>({
      systemPrompt: 'sys',
      userPrompt: 'usr',
      ragCorpus:
        'projects/hisgo-rag-fallback/locations/us-central1/ragCorpora/999',
    });

    expect(grounded?.usedRag).toBe(false);
    expect(grounded?.groundingChunks).toEqual([]);
    expect(grounded?.data).toEqual({ reply: 'Trả lời trực tiếp' });
  });
});
