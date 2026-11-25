import { Body, Controller, HttpCode, HttpStatus, Post } from '@nestjs/common';
import { ApiOperation, ApiTags } from '@nestjs/swagger';
import { Throttle } from '@nestjs/throttler';
import {
  CONCEPT_CANVAS_ROUTES,
  CONCEPT_CANVAS_THROTTLE,
} from './concept-canvas.constant';
import {
  ConceptCanvasService,
  SpatialExploreResponse,
} from './concept-canvas.service';
import { ExploreConceptDto } from './dto/concept-canvas.dto';

@ApiTags('Public Concept Canvas - Bản đồ Khái niệm Không gian AI')
@Controller(CONCEPT_CANVAS_ROUTES.ROOT)
export class ConceptCanvasController {
  constructor(private readonly conceptCanvasService: ConceptCanvasService) {}

  @Post(CONCEPT_CANVAS_ROUTES.EXPLORE)
  @Throttle({ default: CONCEPT_CANVAS_THROTTLE })
  @HttpCode(HttpStatus.OK)
  @ApiOperation({
    summary:
      'Khám phá khái niệm lịch sử theo mô hình Hybrid RAG trên không gian 2D vô tận',
  })
  explore(@Body() dto: ExploreConceptDto): Promise<SpatialExploreResponse> {
    return this.conceptCanvasService.explore(dto);
  }
}
