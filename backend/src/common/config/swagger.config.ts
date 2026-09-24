import { INestApplication } from '@nestjs/common';
import { DocumentBuilder, SwaggerModule } from '@nestjs/swagger';

export function setupSwagger(app: INestApplication): void {
  const config = new DocumentBuilder()
    .setTitle('Hệ Thống Học Lịch Sử Online API')
    .setDescription(
      'Hệ thống RESTful API quản lý bài học lịch sử, giai đoạn, chủ đề, câu hỏi quiz và tài khoản người dùng.',
    )
    .setVersion('1.0.0')
    .addBearerAuth(
      {
        type: 'http',
        scheme: 'bearer',
        bearerFormat: 'JWT',
        name: 'JWT',
        description: 'Nhập JWT access token để xác thực',
        in: 'header',
      },
      'JWT-auth',
    )
    // Common tags
    .addTag('Auth - Xác thực & Phân quyền', 'Endpoints xác thực đăng ký, đăng nhập, OTP và OAuth')
    .addTag('Users - Quản lý Người dùng', 'Endpoints quản lý thông tin tài khoản và phân quyền')
    .addTag('Periods - Giai đoạn Lịch sử', 'Endpoints quản lý các giai đoạn lịch sử')
    .addTag('Topics - Chủ đề Lịch sử', 'Endpoints quản lý các chủ đề thuộc giai đoạn')
    .addTag('Lessons - Bài học Lịch sử', 'Endpoints quản lý bài học, nội dung rich text và kiểm duyệt bài')
    .addTag('Historical Events - Sự kiện Lịch sử', 'Endpoints quản lý các sự kiện lịch sử mốc thời gian thuộc chủ đề')
    .addTag('Tags (Nhãn phân loại)', 'Endpoints quản lý nhãn/thẻ phân loại bài học và sự kiện lịch sử')
    .addTag('health', 'Endpoints kiểm tra sức khỏe hệ thống')
    .addTag('metrics', 'Endpoints theo dõi giám sát hệ thống')
    .build();

  const document = SwaggerModule.createDocument(app, config, {
    extraModels: [],
  });

  // Customize Swagger UI
  SwaggerModule.setup('docs', app, document, {
    customSiteTitle: 'Tài liệu API Hệ Thống Học Lịch Sử Online',
    customfavIcon: 'https://nestjs.com/img/logo-small.svg',
    customCss: `
      .swagger-ui .topbar { display: none }
      .swagger-ui .info { margin: 20px 0 }
      .swagger-ui .scheme-container { margin: 20px 0 }
    `,
    swaggerOptions: {
      persistAuthorization: true,
      docExpansion: 'none',
      filter: true,
      showRequestDuration: true,
      tryItOutEnabled: true,
      tagsSorter: 'alpha',
      operationsSorter: 'alpha',
    },
  });
}
