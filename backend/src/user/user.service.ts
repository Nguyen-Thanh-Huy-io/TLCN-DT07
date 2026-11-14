import {
  Injectable,
  NotFoundException,
  ConflictException,
  ForbiddenException,
} from '@nestjs/common';
import { Prisma, userRole, userStatus } from '@prisma/client';
import { QueryUserDto } from './dto/query-user.dto';
import { CreateUserDto } from './dto/create-user.dto';
import { UpdateUserDto } from './dto/update-user.dto';
import { PrismaService } from '../common/services/prisma.service';
import { CustomLoggerService } from '../common/services/custom-logger.service';
import { RedisService } from '../common/services/redis.service';
import config from '../common/config/app.config';
import { AUTH_CONFIG } from '../auth/config/auth.config';
import * as bcrypt from 'bcryptjs';

@Injectable()
export class UserService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly customLogger: CustomLoggerService,
    private readonly redisService: RedisService,
  ) {}

  async create(createUserDto: CreateUserDto) {
    this.customLogger.log(
      `Creating user: ${createUserDto.email}`,
      'UserService',
    );

    const existingUser = await this.prisma.authUser.findFirst({
      where: {
        OR: [
          { email: createUserDto.email },
          { username: createUserDto.username },
        ],
      },
    });

    if (existingUser) {
      throw new ConflictException('Email hoặc Username đã tồn tại');
    }

    const hashedPassword = await bcrypt.hash(
      createUserDto.password,
      AUTH_CONFIG.BCRYPT_SALT_ROUNDS,
    );

    const user = await this.prisma.authUser.create({
      data: {
        email: createUserDto.email,
        username: createUserDto.username,
        password: hashedPassword,
        role: createUserDto.role,
        status: createUserDto.status,
        verified: true, // Mặc định do Admin tạo trực tiếp
        userProfile: {
          create: {},
        },
      },
      select: {
        id: true,
        email: true,
        username: true,
        role: true,
        verified: true,
        status: true,
        userProfile: true,
        createdAt: true,
        updatedAt: true,
      },
    });

    return user;
  }

  async findAll(query: QueryUserDto) {
    const { page = 1, limit = 20, search, role, status } = query;
    const keyword = search?.trim();
    const where: Prisma.authUserWhereInput = {
      ...(role ? { role } : {}),
      ...(status ? { status } : {}),
      ...(keyword
        ? {
            OR: [
              { email: { contains: keyword, mode: 'insensitive' } },
              { username: { contains: keyword, mode: 'insensitive' } },
            ],
          }
        : {}),
    };

    const [items, total] = await this.prisma.$transaction([
      this.prisma.authUser.findMany({
        where,
        select: {
          id: true,
          email: true,
          username: true,
          role: true,
          verified: true,
          status: true,
          userProfile: true,
          createdAt: true,
          updatedAt: true,
        },
        orderBy: { createdAt: 'desc' },
        skip: (page - 1) * limit,
        take: limit,
      }),
      this.prisma.authUser.count({ where }),
    ]);

    return {
      items,
      total,
      page,
      limit,
      totalPages: Math.max(1, Math.ceil(total / limit)),
    };
  }

  async findOne(id: string) {
    this.customLogger.log(`Fetching user with id: ${id}`, 'UserService');
    const user = await this.prisma.authUser.findUnique({
      where: { id },
      select: {
        id: true,
        email: true,
        username: true,
        role: true,
        verified: true,
        status: true,
        userProfile: true,
        createdAt: true,
        updatedAt: true,
      },
    });

    if (!user) {
      throw new NotFoundException(`Không tìm thấy người dùng với ID ${id}`);
    }

    return user;
  }

  async update(id: string, updateUserDto: UpdateUserDto) {
    this.customLogger.log(`Updating user with id: ${id}`, 'UserService');
    const before = await this.findOne(id);

    const { firstName, lastName, bio, avatarUrl, password, ...authData } =
      updateUserDto;

    const losesSuperadmin =
      before.role === userRole.SUPERADMIN &&
      ((authData.role !== undefined && authData.role !== userRole.SUPERADMIN) ||
        (authData.status !== undefined &&
          authData.status !== userStatus.ACTIVE));
    if (losesSuperadmin) {
      await this.assertAnotherActiveSuperadmin(id);
    }

    // Đổi vai trò / trạng thái / mật khẩu phải có hiệu lực ngay: thu hồi mọi token đang dùng.
    const revokeSessions =
      Boolean(password) ||
      (authData.role !== undefined && authData.role !== before.role) ||
      (authData.status !== undefined && authData.status !== before.status);

    const dataToUpdate: any = { ...authData };
    if (revokeSessions) {
      dataToUpdate.tokenVersion = { increment: 1 };
    }
    if (password) {
      dataToUpdate.password = await bcrypt.hash(
        password,
        AUTH_CONFIG.BCRYPT_SALT_ROUNDS,
      );
    }

    if (
      firstName !== undefined ||
      lastName !== undefined ||
      bio !== undefined ||
      avatarUrl !== undefined
    ) {
      dataToUpdate.userProfile = {
        upsert: {
          create: { firstName, lastName, bio, avatarUrl },
          update: { firstName, lastName, bio, avatarUrl },
        },
      };
    }

    const updated = await this.prisma.authUser.update({
      where: { id },
      data: dataToUpdate,
      select: {
        id: true,
        email: true,
        username: true,
        role: true,
        verified: true,
        status: true,
        userProfile: true,
        createdAt: true,
        updatedAt: true,
      },
    });

    if (revokeSessions) {
      // AuthGuard cache tokenVersion trong Redis — xóa để lần gọi kế tiếp đọc bản mới.
      await this.redisService.del(
        `${config.redis_cache_key_prefix}:token_version:${id}`,
      );
    }
    return updated;
  }

  async remove(id: string, requesterId?: string) {
    this.customLogger.warn(`Removing user with id: ${id}`, 'UserService');
    if (id === requesterId) {
      throw new ForbiddenException(
        'Không thể tự xoá tài khoản đang đăng nhập.',
      );
    }
    const target = await this.findOne(id);
    if (target.role === userRole.SUPERADMIN) {
      await this.assertAnotherActiveSuperadmin(id);
    }

    await this.prisma.authUser.delete({
      where: { id },
    });

    return {
      success: true,
      message: `Người dùng với ID ${id} đã được xóa thành công`,
    };
  }

  /** Hệ thống luôn phải còn ít nhất 1 SUPERADMIN đang hoạt động — nếu không sẽ không ai quản trị được tài khoản. */
  private async assertAnotherActiveSuperadmin(
    excludeId: string,
  ): Promise<void> {
    const others = await this.prisma.authUser.count({
      where: {
        role: userRole.SUPERADMIN,
        status: userStatus.ACTIVE,
        id: { not: excludeId },
      },
    });
    if (others === 0) {
      throw new ConflictException(
        'Phải còn ít nhất một SUPERADMIN đang hoạt động.',
      );
    }
  }
}
