import { CreatePeriodDto } from '../dto/create-period.dto';
import { UpdatePeriodDto } from '../dto/update-period.dto';
import { QueryPeriodDto } from '../dto/query-period.dto';
import { Period } from '@prisma/client';

export interface IPaginatedResult<T> {
  items: T[];
  total: number;
  page: number;
  limit: number;
  totalPages: number;
}

export interface IPeriodService {
  create(createPeriodDto: CreatePeriodDto): Promise<Period>;
  findAll(query: QueryPeriodDto): Promise<IPaginatedResult<Period>>;
  findOne(id: string): Promise<Period>;
  update(id: string, updatePeriodDto: UpdatePeriodDto): Promise<Period>;
  remove(id: string): Promise<{ success: boolean; message: string }>;
}
