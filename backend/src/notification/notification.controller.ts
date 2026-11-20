import {
  Controller,
  Get,
  Param,
  Patch,
  Query,
  Req,
  UseGuards,
} from '@nestjs/common';
import { ApiBearerAuth, ApiOperation, ApiTags } from '@nestjs/swagger';
import { AuthGuard } from '../common/guards/auth.guard';
import { NotificationService } from './notification.service';

interface AuthedRequest {
  user: {
    userId: string;
  };
}

@ApiTags('Notifications (Thông báo)')
@ApiBearerAuth('JWT-auth')
@UseGuards(AuthGuard)
@Controller('notifications')
export class NotificationController {
  constructor(private readonly notificationService: NotificationService) {}

  @Get()
  @ApiOperation({ summary: 'Lấy danh sách thông báo và số lượng chưa đọc' })
  getMyNotifications(
    @Req() req: AuthedRequest,
    @Query('limit') limit?: number,
  ) {
    return this.notificationService.getUserNotifications(
      req.user.userId,
      limit ? Number(limit) : 20,
    );
  }

  @Patch('read-all')
  @ApiOperation({ summary: 'Đánh dấu tất cả thông báo là đã đọc' })
  markAllAsRead(@Req() req: AuthedRequest) {
    return this.notificationService.markAsRead(req.user.userId);
  }

  @Patch(':id/read')
  @ApiOperation({ summary: 'Đánh dấu 1 thông báo là đã đọc' })
  markOneAsRead(@Req() req: AuthedRequest, @Param('id') id: string) {
    return this.notificationService.markAsRead(req.user.userId, id);
  }
}
