import { Inject, Injectable, NotFoundException } from '@nestjs/common';
import {
  LANDING_SECTION_STRATEGIES,
  LandingSection,
} from '../public-content.constant';
import { LandingSectionStrategy } from './landing-section.strategy';

@Injectable()
export class LandingSectionRegistry {
  private readonly strategies: Map<LandingSection, LandingSectionStrategy>;

  constructor(
    @Inject(LANDING_SECTION_STRATEGIES)
    strategies: LandingSectionStrategy[],
  ) {
    this.strategies = new Map(strategies.map((s) => [s.section, s]));
  }

  resolve(section: LandingSection): LandingSectionStrategy {
    const strategy = this.strategies.get(section);
    if (!strategy) {
      throw new NotFoundException(
        `Landing section "${section}" chưa được hỗ trợ`,
      );
    }
    return strategy;
  }
}
