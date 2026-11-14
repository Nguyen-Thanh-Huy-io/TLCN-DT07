import { ClassConstructor, plainToInstance } from 'class-transformer';
import { UpdateArticleDto } from '../article/dto/article.dto';
import { UpdateCategoryDto } from '../category/dto/category.dto';
import { UpdateLessonDto } from '../lesson/dto/update-lesson.dto';
import { UpdateTagDto } from '../tag/dto/update-tag.dto';
import { UpdateTimelineDto } from '../timeline/dto/timeline.dto';
import { UpdateTopicDto } from '../topic/dto/update-topic.dto';
import { UpdateUserDto } from '../user/dto/update-user.dto';

/**
 * `PartialType` kế thừa cả giá trị khởi tạo của DTO tạo mới. Nếu `Create*Dto` có `status = DRAFT`
 * thì mọi PATCH không gửi `status` sẽ âm thầm gỡ xuất bản (đã xảy ra với bài học, chủ đề, người dùng).
 * Mặc định khi tạo mới phải đặt ở service hoặc Prisma schema, không đặt trong DTO.
 */
describe('Update DTO không mang giá trị mặc định', () => {
  const updateDtos: [string, ClassConstructor<object>][] = [
    ['UpdateArticleDto', UpdateArticleDto],
    ['UpdateCategoryDto', UpdateCategoryDto],
    ['UpdateLessonDto', UpdateLessonDto],
    ['UpdateTagDto', UpdateTagDto],
    ['UpdateTimelineDto', UpdateTimelineDto],
    ['UpdateTopicDto', UpdateTopicDto],
    ['UpdateUserDto', UpdateUserDto],
  ];

  it.each(updateDtos)(
    '%s từ body rỗng không sinh ra trường nào',
    (_name, dto) => {
      expect({ ...plainToInstance(dto, {}) }).toEqual({});
    },
  );
});
