import {
  Body,
  Controller,
  Delete,
  Get,
  Param,
  ParseUUIDPipe,
  Patch,
  Post,
  Req,
  UseGuards,
} from '@nestjs/common';
import { ApiBearerAuth, ApiOperation, ApiTags } from '@nestjs/swagger';
import { AuthGuard } from '../common/guards/auth.guard';
import {
  CreateCardDto,
  CreateDeckDto,
  ReviewCardDto,
  UpdateCardDto,
  UpdateDeckDto,
} from './dto/flashcard.dto';
import { FLASHCARD_ROUTES } from './flashcard.constant';
import { FlashcardService } from './flashcard.service';

interface AuthedRequest {
  user: { userId: string };
}

@ApiTags('Flashcards - Thẻ ghi nhớ SM-2')
@ApiBearerAuth('JWT-auth')
@UseGuards(AuthGuard)
@Controller(FLASHCARD_ROUTES.ROOT)
export class FlashcardController {
  constructor(private readonly flashcardService: FlashcardService) {}

  @Get(FLASHCARD_ROUTES.DECKS)
  @ApiOperation({ summary: 'Danh sách bộ thẻ và số thẻ cần ôn hôm nay' })
  listDecks(@Req() req: AuthedRequest) {
    return this.flashcardService.listDecks(req.user.userId);
  }

  @Post(FLASHCARD_ROUTES.DECKS)
  @ApiOperation({ summary: 'Tạo bộ thẻ mới' })
  createDeck(@Req() req: AuthedRequest, @Body() dto: CreateDeckDto) {
    return this.flashcardService.createDeck(req.user.userId, dto);
  }

  @Patch(FLASHCARD_ROUTES.DECK)
  @ApiOperation({ summary: 'Cập nhật tên / mô tả bộ thẻ' })
  updateDeck(
    @Req() req: AuthedRequest,
    @Param('deckId', ParseUUIDPipe) deckId: string,
    @Body() dto: UpdateDeckDto,
  ) {
    return this.flashcardService.updateDeck(req.user.userId, deckId, dto);
  }

  @Delete(FLASHCARD_ROUTES.DECK)
  @ApiOperation({ summary: 'Xoá bộ thẻ và toàn bộ thẻ bên trong' })
  deleteDeck(
    @Req() req: AuthedRequest,
    @Param('deckId', ParseUUIDPipe) deckId: string,
  ) {
    return this.flashcardService.deleteDeck(req.user.userId, deckId);
  }

  @Get(FLASHCARD_ROUTES.DECK_CARDS)
  @ApiOperation({ summary: 'Danh sách toàn bộ thẻ trong bộ' })
  listCards(
    @Req() req: AuthedRequest,
    @Param('deckId', ParseUUIDPipe) deckId: string,
  ) {
    return this.flashcardService.listCards(req.user.userId, deckId);
  }

  @Get(FLASHCARD_ROUTES.DECK_DUE)
  @ApiOperation({ summary: 'Danh sách thẻ đến hạn ôn tập trong bộ' })
  listDueCards(
    @Req() req: AuthedRequest,
    @Param('deckId', ParseUUIDPipe) deckId: string,
  ) {
    return this.flashcardService.listDueCards(req.user.userId, deckId);
  }

  @Post(FLASHCARD_ROUTES.DECK_CARDS)
  @ApiOperation({ summary: 'Thêm thẻ mới vào bộ' })
  createCard(
    @Req() req: AuthedRequest,
    @Param('deckId', ParseUUIDPipe) deckId: string,
    @Body() dto: CreateCardDto,
  ) {
    return this.flashcardService.createCard(req.user.userId, deckId, dto);
  }

  @Patch(FLASHCARD_ROUTES.CARD)
  @ApiOperation({ summary: 'Sửa nội dung thẻ' })
  updateCard(
    @Req() req: AuthedRequest,
    @Param('cardId', ParseUUIDPipe) cardId: string,
    @Body() dto: UpdateCardDto,
  ) {
    return this.flashcardService.updateCard(req.user.userId, cardId, dto);
  }

  @Delete(FLASHCARD_ROUTES.CARD)
  @ApiOperation({ summary: 'Xoá một thẻ' })
  deleteCard(
    @Req() req: AuthedRequest,
    @Param('cardId', ParseUUIDPipe) cardId: string,
  ) {
    return this.flashcardService.deleteCard(req.user.userId, cardId);
  }

  @Post(FLASHCARD_ROUTES.CARD_REVIEW)
  @ApiOperation({ summary: 'Chấm điểm ôn tập SM-2 và tính lịch ôn tiếp theo' })
  reviewCard(
    @Req() req: AuthedRequest,
    @Param('cardId', ParseUUIDPipe) cardId: string,
    @Body() dto: ReviewCardDto,
  ) {
    return this.flashcardService.reviewCard(
      req.user.userId,
      cardId,
      dto.rating,
    );
  }
}
