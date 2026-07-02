import { Controller, Get } from '@nestjs/common';
import { DELIVERY_PHASES } from '@dmat/types';

/** Exposes current delivery phase metadata for frontends during scaffold phase. */
@Controller('meta')
export class PhaseController {
  @Get('phases')
  phases() {
    return {
      current: 'phase-0-foundation',
      phases: DELIVERY_PHASES,
      modules: {
        'phase-0-foundation': ['auth', 'database', 'audit', 'i18n-skeleton'],
        'phase-1a-public-candidate': ['public-site', 'candidate-portal', 'booking', 'notifications'],
        'phase-1b-exam-engine': ['question-import', 'exam-player', 'auto-save', 'lockdown'],
        'phase-1c-proctoring': ['identity-verification', 'av-capture', 'ai-flags', 'proctor-console'],
        'phase-1d-grading-certificates': ['grading-queue', 'score-aggregation', 'certificates', 'appeals'],
      },
    };
  }
}
