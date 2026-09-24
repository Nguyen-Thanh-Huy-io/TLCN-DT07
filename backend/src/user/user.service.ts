import {
  Injectable,
  NotFoundException,
  ConflictException,
} from '@nestjs/common';
import { CreateUserDto } from './dto/create-user.dto';
import { UpdateUserDto } from './dto/update-user.dto';
import { PrismaService } from '../common/services/prisma.service';
import { CustomLoggerService } from '../common/services/custom-logger.service';
import * as bcrypt from 'bcryptjs';

@Injectable()
export class UserService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly customLogger: CustomLoggerService,
  ) {}

  async create(createUserDto: CreateUserDto) {
    this.customLogger.log(`Creating user: ${createUserDto.email}`, 'UserService');

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

    const hashedPassword = await bcrypt.hash(createUserDto.password, 10);

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

  async findAll() {
    this.customLogger.log('Fetching all users', 'UserService');
    return this.prisma.authUser.findMany({
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
    });
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
    await this.findOne(id);

    const { firstName, lastName, bio, avatarUrl, password, ...authData } = updateUserDto;

    const dataToUpdate: any = { ...authData };
    if (password) {
      dataToUpdate.password = await bcrypt.hash(password, 10);
    }

    if (firstName !== undefined || lastName !== undefined || bio !== undefined || avatarUrl !== undefined) {
      dataToUpdate.userProfile = {
        upsert: {
          create: { firstName, lastName, bio, avatarUrl },
          update: { firstName, lastName, bio, avatarUrl },
        },
      };
    }

    return this.prisma.authUser.update({
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
  }

  async remove(id: string) {
    this.customLogger.warn(`Removing user with id: ${id}`, 'UserService');
    await this.findOne(id);

    await this.prisma.authUser.delete({
      where: { id },
    });

    return {
      success: true,
      message: `Người dùng với ID ${id} đã được xóa thành công`,
    };
  }
}
