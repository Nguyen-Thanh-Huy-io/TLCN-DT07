import { Injectable } from '@nestjs/common';
import { HistoricalEntityType } from '@prisma/client';
import { formatHistoricalYear } from '../../common/utils/historical-date.parser';
import {
  TIMELINE_DEFAULT_TITLES,
  TIMELINE_ITEM_ORDER_WEIGHT,
  TIMELINE_ITEM_TYPE,
  TIMELINE_SORT_ORDER,
  TimelineSortOrder,
} from './timeline.constant';
import { PersonTimelineItemDto, PersonTimelineResponseDto } from './timeline.dto';

@Injectable()
export class PersonTimelineBuilder {
  private entity: any = null;
  private person: any = null;
  private items: PersonTimelineItemDto[] = [];

  /**
   * Reset trạng thái của builder
   */
  reset(): this {
    this.entity = null;
    this.person = null;
    this.items = [];
    return this;
  }

  /**
   * Thiết lập thông tin thực thể chủ đạo
   */
  setEntity(entity: any, person?: any): this {
    this.entity = entity;
    this.person = person || entity?.person || null;
    return this;
  }

  /**
   * Thêm mốc sinh ra (hoặc mốc thành lập đối với tổ chức/triều đại)
   */
  addBirthOrFoundingMilestone(): this {
    if (!this.entity) return this;

    const isPerson = this.entity.type === HistoricalEntityType.PERSON;

    if (isPerson && this.person) {
      const year = this.person.birthYear ?? null;
      const month = this.person.birthMonth ?? null;
      const day = this.person.birthDay ?? null;
      const dateText =
        this.person.birthDateText ||
        (year !== null ? formatHistoricalYear(year) : null);

      if (year !== null || dateText) {
        this.items.push({
          id: `birth-${this.entity.id}`,
          type: TIMELINE_ITEM_TYPE.BIRTH,
          title: TIMELINE_DEFAULT_TITLES.BIRTH,
          year,
          month,
          day,
          dateText,
          datePrecision: this.person.birthPrecision,
          description: this.person.birthDateLabel || null,
          isPrimary: true,
        });
      }
    } else if (this.entity.startYear !== null && this.entity.startYear !== undefined) {
      // Đối với triều đại / tổ chức / thực thể khác
      this.items.push({
        id: `founding-${this.entity.id}`,
        type: TIMELINE_ITEM_TYPE.FOUNDING,
        title: TIMELINE_DEFAULT_TITLES.FOUNDING,
        year: this.entity.startYear,
        month: null,
        day: null,
        dateText:
          this.entity.dateText || formatHistoricalYear(this.entity.startYear),
        datePrecision: this.entity.datePrecision,
        description: null,
        isPrimary: true,
      });
    }

    return this;
  }

  /**
   * Thêm mốc qua đời (hoặc mốc kết thúc / giải thể)
   */
  addDeathOrDissolutionMilestone(): this {
    if (!this.entity) return this;

    const isPerson = this.entity.type === HistoricalEntityType.PERSON;

    if (isPerson && this.person) {
      const year = this.person.deathYear ?? null;
      const month = this.person.deathMonth ?? null;
      const day = this.person.deathDay ?? null;
      const dateText =
        this.person.deathDateText ||
        (year !== null ? formatHistoricalYear(year) : null);

      if (year !== null || dateText) {
        this.items.push({
          id: `death-${this.entity.id}`,
          type: TIMELINE_ITEM_TYPE.DEATH,
          title: TIMELINE_DEFAULT_TITLES.DEATH,
          year,
          month,
          day,
          dateText,
          datePrecision: this.person.deathPrecision,
          description: this.person.deathDateLabel || null,
          isPrimary: true,
        });
      }
    } else if (this.entity.endYear !== null && this.entity.endYear !== undefined) {
      this.items.push({
        id: `dissolution-${this.entity.id}`,
        type: TIMELINE_ITEM_TYPE.DISSOLUTION,
        title: TIMELINE_DEFAULT_TITLES.DISSOLUTION,
        year: this.entity.endYear,
        month: null,
        day: null,
        dateText:
          this.entity.dateText || formatHistoricalYear(this.entity.endYear),
        datePrecision: this.entity.datePrecision,
        description: null,
        isPrimary: true,
      });
    }

    return this;
  }

  /**
   * Thêm một mốc thời gian từ phát biểu
   */
  addItem(item: PersonTimelineItemDto | null): this {
    if (item) {
      this.items.push(item);
    }
    return this;
  }

  /**
   * Thêm danh sách mốc thời gian
   */
  addItems(items: (PersonTimelineItemDto | null)[]): this {
    for (const item of items) {
      if (item) {
        this.items.push(item);
      }
    }
    return this;
  }

  /**
   * Sắp xếp và đóng gói kết quả Timeline hoàn chỉnh
   */
  build(order: TimelineSortOrder = TIMELINE_SORT_ORDER.ASC): PersonTimelineResponseDto {
    const sorted = [...this.items].sort((a, b) => {
      // 1. So sánh Năm (xử lý số nguyên có dấu: TCN < SCN)
      if (a.year !== null && b.year !== null) {
        if (a.year !== b.year) {
          return a.year - b.year;
        }
      } else if (a.year !== null && b.year === null) {
        return -1;
      } else if (a.year === null && b.year !== null) {
        return 1;
      }

      // 2. So sánh Tháng
      const aMonth = a.month ?? 0;
      const bMonth = b.month ?? 0;
      if (aMonth !== bMonth) {
        return aMonth - bMonth;
      }

      // 3. So sánh Ngày
      const aDay = a.day ?? 0;
      const bDay = b.day ?? 0;
      if (aDay !== bDay) {
        return aDay - bDay;
      }

      // 4. Cùng ngày/tháng/năm: Ưu tiên theo loại mốc (Sinh trước -> Sự kiện -> Mất sau)
      const aWeight = TIMELINE_ITEM_ORDER_WEIGHT[a.type] ?? 99;
      const bWeight = TIMELINE_ITEM_ORDER_WEIGHT[b.type] ?? 99;
      return aWeight - bWeight;
    });

    if (order === TIMELINE_SORT_ORDER.DESC) {
      sorted.reverse();
    }

    return {
      entityId: this.entity?.id ?? '',
      entityName: this.entity?.name ?? '',
      entityType: this.entity?.type ?? HistoricalEntityType.PERSON,
      slug: this.entity?.slug ?? '',
      imageUrl: this.entity?.imageUrl ?? null,
      birthYear: this.person?.birthYear ?? this.entity?.startYear ?? null,
      deathYear: this.person?.deathYear ?? this.entity?.endYear ?? null,
      totalMilestones: sorted.length,
      items: sorted,
    };
  }
}
