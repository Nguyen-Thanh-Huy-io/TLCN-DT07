import { Injectable } from '@nestjs/common';
import * as bcrypt from 'bcryptjs';
import { PrismaService } from '../common/services/prisma.service';
import AppError from '../common/errors/app.error';
import { AuthService } from './auth.service';
import { AuthUtilsService } from './services/auth-utils.service';
import { ChangeMyPasswordDto, UpdateMyProfileDto } from './dto/account.dto';

const PROFILE_SELECT = {
  id: true,
  email: true,
  username: true,
  role: true,
  verified: true,
  provider: true,
  createdAt: true,
  userProfile: {
    select: { firstName: true, lastName: true, bio: true, avatarUrl: true },
  },
} as const;

/** Thao tác người dùng tự làm trên tài khoản của chính mình (trang Tài khoản). */
@Injectable()
export class AccountService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly authService: AuthService,
    private readonly authUtils: AuthUtilsService,
  ) {}

  async getProfile(userId: string) {
    const user = await this.prisma.authUser.findUnique({
      where: { id: userId },
      select: PROFILE_SELECT,
    });
    if (!user) throw AppError.notFound('Không tìm thấy tài khoản.');
    return user;
  }

  async updateProfile(userId: string, dto: UpdateMyProfileDto) {
    const data = {
      firstName: dto.firstName?.trim() || null,
      lastName: dto.lastName?.trim() || null,
      bio: dto.bio?.trim() || null,
      avatarUrl: dto.avatarUrl?.trim() || null,
    };
    await this.prisma.userProfile.upsert({
      where: { authId: userId },
      update: data,
      create: { authId: userId, ...data },
    });
    return this.getProfile(userId);
  }

  /** Đổi mật khẩu rồi thu hồi mọi phiên — client đăng nhập lại bằng mật khẩu mới. */
  async changePassword(userId: string, dto: ChangeMyPasswordDto) {
    const user = await this.prisma.authUser.findUnique({
      where: { id: userId },
      select: { password: true, provider: true },
    });
    if (!user) throw AppError.notFound('Không tìm thấy tài khoản.');
    if (user.provider !== 'local') {
      throw AppError.badRequest(
        `Tài khoản đăng nhập bằng ${user.provider} không đổi mật khẩu tại đây.`,
      );
    }
    if (!(await bcrypt.compare(dto.currentPassword, user.password))) {
      throw AppError.badRequest('Mật khẩu hiện tại không đúng.');
    }
    if (!this.authUtils.validatePassword(dto.newPassword)) {
      throw AppError.badRequest(
        'Mật khẩu mới cần ≥ 8 ký tự, có chữ hoa, chữ thường, số và ký tự đặc biệt.',
      );
    }
    await this.prisma.authUser.update({
      where: { id: userId },
      data: { password: await bcrypt.hash(dto.newPassword, 10) },
    });
    await this.authService.logoutAllDevices(userId);
    return {
      message: 'Đã đổi mật khẩu. Các phiên đăng nhập cũ đã bị thu hồi.',
    };
  }

  logoutAll(userId: string) {
    return this.authService.logoutAllDevices(userId);
  }
}
