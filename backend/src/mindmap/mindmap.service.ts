import {
  BadRequestException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { Prisma } from '@prisma/client';
import { PrismaService } from '../common/services/prisma.service';
import { CreateMindmapDto, UpdateMindmapDto } from './dto/mindmap.dto';
import {
  MINDMAP_LIMITS,
  MINDMAP_MESSAGES,
  MindmapTemplateType,
} from './mindmap.constant';
import {
  MindmapGraphData,
  MindmapTemplateRegistry,
} from './mindmap-template.strategy';

export interface MindmapSummary {
  id: string;
  title: string;
  periodLabel: string | null;
  template: string;
  nodeCount: number;
  edgeCount: number;
  createdAt: Date;
  updatedAt: Date;
}

function countGraph(graph: unknown): { nodeCount: number; edgeCount: number } {
  if (!graph || typeof graph !== 'object')
    return { nodeCount: 0, edgeCount: 0 };
  const rec = graph as { nodes?: unknown; edges?: unknown };
  return {
    nodeCount: Array.isArray(rec.nodes) ? rec.nodes.length : 0,
    edgeCount: Array.isArray(rec.edges) ? rec.edges.length : 0,
  };
}

@Injectable()
export class MindmapService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly templateRegistry: MindmapTemplateRegistry,
  ) {}

  async list(ownerId: string): Promise<MindmapSummary[]> {
    const rows = await this.prisma.studyMindmap.findMany({
      where: { ownerId },
      orderBy: { updatedAt: 'desc' },
    });
    return rows.map((row) => ({
      id: row.id,
      title: row.title,
      periodLabel: row.periodLabel,
      template: row.template,
      ...countGraph(row.graph),
      createdAt: row.createdAt,
      updatedAt: row.updatedAt,
    }));
  }

  async findOne(ownerId: string, id: string) {
    const row = await this.prisma.studyMindmap.findFirst({
      where: { id, ownerId },
    });
    if (!row) throw new NotFoundException(MINDMAP_MESSAGES.NOT_FOUND);
    return row;
  }

  async create(ownerId: string, dto: CreateMindmapDto) {
    const count = await this.prisma.studyMindmap.count({ where: { ownerId } });
    if (count >= MINDMAP_LIMITS.MAX_MINDMAPS_PER_USER) {
      throw new BadRequestException(MINDMAP_MESSAGES.TOO_MANY_MINDMAPS);
    }

    const template = dto.template ?? MindmapTemplateType.SPIDER;
    const graph: MindmapGraphData = dto.graph
      ? (dto.graph as unknown as MindmapGraphData)
      : this.templateRegistry.buildGraph(template, dto.title, dto.periodLabel);

    return this.prisma.studyMindmap.create({
      data: {
        ownerId,
        title: dto.title,
        periodLabel: dto.periodLabel ?? null,
        template,
        graph: graph as unknown as Prisma.InputJsonValue,
      },
    });
  }

  async update(ownerId: string, id: string, dto: UpdateMindmapDto) {
    await this.findOne(ownerId, id);
    return this.prisma.studyMindmap.update({
      where: { id },
      data: {
        ...(dto.title !== undefined ? { title: dto.title } : {}),
        ...(dto.periodLabel !== undefined
          ? { periodLabel: dto.periodLabel }
          : {}),
        ...(dto.template !== undefined ? { template: dto.template } : {}),
        ...(dto.graph !== undefined
          ? { graph: dto.graph as unknown as Prisma.InputJsonValue }
          : {}),
      },
    });
  }

  async remove(ownerId: string, id: string) {
    await this.findOne(ownerId, id);
    await this.prisma.studyMindmap.delete({ where: { id } });
    return { deleted: true };
  }
}
