import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { IsEnum } from 'class-validator';
import { EventCategory, TopicIcon } from '@prisma/client';
import { LandingSection } from '../public-content.constant';

export class PublicPeriodDto {
  @ApiProperty() id: string;
  @ApiPropertyOptional({ nullable: true }) parentId: string | null;
  @ApiProperty() slug: string;
  @ApiProperty() name: string;
  @ApiProperty({ example: '(thế kỷ VII TCN - thế kỷ II TCN)' })
  timeLabel: string;
  @ApiPropertyOptional({ nullable: true }) startYear?: number | null;
  @ApiPropertyOptional({ nullable: true }) endYear: number | null;
  @ApiPropertyOptional({ nullable: true }) description: string | null;
  @ApiPropertyOptional({ nullable: true }) coverImageUrl: string | null;
}

export class PublicTopicDto {
  @ApiProperty() id: string;
  @ApiProperty() slug: string;
  @ApiProperty() name: string;
  @ApiPropertyOptional({ nullable: true }) eyebrow: string | null;
  @ApiPropertyOptional({ enum: TopicIcon, nullable: true })
  icon: TopicIcon | null;
  @ApiPropertyOptional({ nullable: true }) description: string | null;
  @ApiPropertyOptional({ nullable: true }) coverImageUrl: string | null;
}

export class PublicFigureDto {
  @ApiProperty() id: string;
  @ApiProperty() slug: string;
  @ApiProperty() name: string;
  @ApiPropertyOptional({ nullable: true }) tagline: string | null;
  @ApiPropertyOptional({ nullable: true }) description: string | null;
  @ApiPropertyOptional({ nullable: true }) imageUrl: string | null;
  @ApiPropertyOptional({ nullable: true }) birthYear: number | null;
  @ApiPropertyOptional({ nullable: true }) deathYear: number | null;
}

export class PublicLocationSummaryDto {
  @ApiProperty() id: string;
  @ApiProperty() slug: string;
  @ApiProperty() name: string;
  @ApiPropertyOptional({ nullable: true }) address: string | null;
  @ApiPropertyOptional({ nullable: true }) latitude: number | null;
  @ApiPropertyOptional({ nullable: true }) longitude: number | null;
  @ApiPropertyOptional({ nullable: true }) historicalSignificance: string | null;
}

export class PublicEventSummaryDto {
  @ApiProperty() id: string;
  @ApiPropertyOptional({ nullable: true }) slug: string | null;
  @ApiProperty() title: string;
  @ApiProperty() startYear: number;
  @ApiPropertyOptional({ nullable: true }) eventDateNote: string | null;
  @ApiPropertyOptional({ nullable: true }) location: string | null;
  @ApiPropertyOptional({ nullable: true }) description: string | null;
  @ApiProperty({ enum: EventCategory }) category: EventCategory;
  @ApiPropertyOptional({ nullable: true }) periodSlug: string | null;
}

export class PublicLessonSummaryDto {
  @ApiProperty() id: string;
  @ApiProperty() title: string;
  @ApiPropertyOptional({ nullable: true }) contentRichText: string | null;
  @ApiPropertyOptional({ nullable: true }) sourceReferenceNote: string | null;
  @ApiProperty() estimatedReadMinutes: number;
  @ApiProperty({ type: [PublicEventSummaryDto] }) events: PublicEventSummaryDto[];
  @ApiProperty({ type: [PublicFigureDto] }) entities: PublicFigureDto[];
  @ApiProperty({ type: [PublicLocationSummaryDto] })
  locations: PublicLocationSummaryDto[];
}

export class PublicEventRelationDto {
  @ApiProperty() relationType: string;
  @ApiPropertyOptional({ nullable: true }) description: string | null;
  @ApiProperty({ type: () => PublicEventSummaryDto }) event: PublicEventSummaryDto;
}

export class PublicEventDetailDto extends PublicEventSummaryDto {
  @ApiPropertyOptional({ type: () => PublicPeriodDto, nullable: true })
  period: PublicPeriodDto | null;
  @ApiPropertyOptional({ type: () => PublicEventSummaryDto, nullable: true })
  parent: PublicEventSummaryDto | null;
  @ApiProperty({ type: [PublicEventSummaryDto] }) children: PublicEventSummaryDto[];
  @ApiProperty({ type: [PublicEventRelationDto] })
  outgoingRelations: PublicEventRelationDto[];
  @ApiProperty({ type: [PublicEventRelationDto] })
  incomingRelations: PublicEventRelationDto[];
}

export class PublicChildTopicDto extends PublicTopicDto {
  @ApiProperty({ type: [PublicEventSummaryDto] }) events: PublicEventSummaryDto[];
  @ApiProperty({ type: [PublicLessonSummaryDto] })
  lessons: PublicLessonSummaryDto[];
}

export class PublicPeriodDetailDto extends PublicPeriodDto {
  @ApiProperty({ type: [PublicTopicDto] }) topics: PublicTopicDto[];
  @ApiProperty({ type: [PublicFigureDto] }) figures: PublicFigureDto[];
  @ApiProperty({ type: [PublicEventSummaryDto] }) events: PublicEventSummaryDto[];
}

export class PublicTopicDetailDto extends PublicTopicDto {
  @ApiPropertyOptional({ type: () => PublicPeriodDto, nullable: true })
  period: PublicPeriodDto | null;
  @ApiProperty({ type: [PublicChildTopicDto] }) children: PublicChildTopicDto[];
  @ApiProperty({ type: [PublicEventSummaryDto] }) events: PublicEventSummaryDto[];
  @ApiProperty({ type: [PublicLessonSummaryDto] })
  lessons: PublicLessonSummaryDto[];
}

export class PublicFigureDetailDto extends PublicFigureDto {
  @ApiPropertyOptional({ type: () => PublicPeriodDto, nullable: true })
  period: PublicPeriodDto | null;
  @ApiProperty({ type: [PublicEventSummaryDto] }) events: PublicEventSummaryDto[];
  @ApiProperty({ type: [PublicLessonSummaryDto] })
  lessons: PublicLessonSummaryDto[];
}

export class LandingResponseDto {
  @ApiProperty({ type: [PublicPeriodDto] }) periods: PublicPeriodDto[];
  @ApiProperty({ type: [PublicTopicDto] }) chapters: PublicTopicDto[];
  @ApiProperty({ type: [PublicTopicDto] }) knowledge: PublicTopicDto[];
  @ApiProperty({ type: [PublicFigureDto] }) figures: PublicFigureDto[];
}

export class QueryPublicTopicsDto {
  @ApiProperty({ enum: LandingSection })
  @IsEnum(LandingSection)
  section: LandingSection;
}

