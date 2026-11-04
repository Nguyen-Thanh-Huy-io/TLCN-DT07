import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../common/services/prisma.service';
import { CustomLoggerService } from '../common/services/custom-logger.service';
import { CreateHistoricalReferenceDto } from './dto/create-reference.dto';
import { UpdateHistoricalReferenceDto } from './dto/update-reference.dto';
import { QueryHistoricalReferenceDto } from './dto/query-reference.dto';

@Injectable()
export class HistoricalReferenceService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly customLogger: CustomLoggerService,
  ) {}

  async create(dto: CreateHistoricalReferenceDto) {
    this.customLogger.log(
      `Tạo tài liệu tham khảo mới: ${dto.title}`,
      HistoricalReferenceService.name,
    );
    return this.prisma.historicalReference.create({
      data: {
        title: dto.title,
        author: dto.author || null,
        publisher: dto.publisher || null,
        publishYear: dto.publishYear || null,
        url: dto.url || null,
        isbn: dto.isbn || null,
        doi: dto.doi || null,
        metadata: dto.metadata || undefined,
      },
    });
  }

  async update(id: string, dto: UpdateHistoricalReferenceDto) {
    const existing = await this.prisma.historicalReference.findUnique({
      where: { id },
    });
    if (!existing) {
      throw new NotFoundException('Không tìm thấy tài liệu tham khảo.');
    }

    return this.prisma.historicalReference.update({
      where: { id },
      data: {
        ...dto,
        metadata: dto.metadata !== undefined ? dto.metadata : undefined,
      },
    });
  }

  async remove(id: string) {
    const existing = await this.prisma.historicalReference.findUnique({
      where: { id },
    });
    if (!existing) {
      throw new NotFoundException('Không tìm thấy tài liệu tham khảo.');
    }

    await this.prisma.historicalReference.delete({
      where: { id },
    });

    return { success: true, message: 'Đã xoá tài liệu tham khảo thành công.' };
  }

  async findOne(id: string) {
    const reference = await this.prisma.historicalReference.findUnique({
      where: { id },
      include: {
        statementReferences: {
          include: {
            statement: {
              include: {
                predicate: true,
                subject: true,
                object: true,
              },
            },
          },
        },
      },
    });

    if (!reference) {
      throw new NotFoundException('Không tìm thấy tài liệu tham khảo.');
    }

    return reference;
  }

  async findMany(query: QueryHistoricalReferenceDto) {
    const page = query.page || 1;
    const limit = query.limit || 20;
    const skip = (page - 1) * limit;

    const where: any = {};

    if (query.search) {
      where.OR = [
        { title: { contains: query.search, mode: 'insensitive' } },
        { author: { contains: query.search, mode: 'insensitive' } },
        { publisher: { contains: query.search, mode: 'insensitive' } },
      ];
    }

    if (query.author) {
      where.author = { contains: query.author, mode: 'insensitive' };
    }

    if (query.publishYear) {
      where.publishYear = query.publishYear;
    }

    const [total, data] = await Promise.all([
      this.prisma.historicalReference.count({ where }),
      this.prisma.historicalReference.findMany({
        where,
        skip,
        take: limit,
        orderBy: [{ publishYear: 'desc' }, { createdAt: 'desc' }],
      }),
    ]);

    return {
      data,
      meta: {
        total,
        page,
        limit,
        totalPages: Math.ceil(total / limit),
      },
    };
  }
}
