import { Body, Controller, Get, Post, Req, UseGuards } from '@nestjs/common';
import { AuthGuard } from '@nestjs/passport';
import { Roles } from '../auth/roles.decorator';
import { RolesGuard } from '../auth/roles.guard';
import { GradingService } from './grading.service';

@Controller('grading')
@UseGuards(AuthGuard('jwt'), RolesGuard)
@Roles('grader', 'admin')
export class GradingController {
  constructor(private grading: GradingService) {}

  @Get('queue')
  queue() {
    return this.grading.getQueue();
  }

  @Post('scores')
  submit(
    @Req() req: { user: { userId: string } },
    @Body()
    body: {
      sessionId: string;
      questionId: string;
      criteriaScores: Record<string, number>;
      totalScore: number;
      notes?: string;
    },
  ) {
    return this.grading.submitScore(req.user.userId, body);
  }
}
