import { Body, Controller, Get, Param, Post, Put, Req, UseGuards } from '@nestjs/common';
import { AuthGuard } from '@nestjs/passport';
import { Roles } from '../auth/roles.decorator';
import { RolesGuard } from '../auth/roles.guard';
import { ExamService } from './exam.service';

@Controller('exam/sessions')
@UseGuards(AuthGuard('jwt'), RolesGuard)
@Roles('candidate')
export class ExamController {
  constructor(private exam: ExamService) {}

  @Get(':sessionId')
  get(@Param('sessionId') sessionId: string, @Req() req: { user: { profileId?: string } }) {
    return this.exam.getSession(sessionId, req.user.profileId!);
  }

  @Post(':sessionId/start')
  start(@Param('sessionId') sessionId: string, @Req() req: { user: { profileId?: string } }) {
    return this.exam.start(sessionId, req.user.profileId!);
  }

  @Post(':sessionId/heartbeat')
  heartbeat(@Param('sessionId') sessionId: string, @Req() req: { user: { profileId?: string } }) {
    return this.exam.heartbeat(sessionId, req.user.profileId!);
  }

  @Post(':sessionId/events')
  logEvent(
    @Param('sessionId') sessionId: string,
    @Req() req: { user: { profileId?: string } },
    @Body() body: { eventType: string; description?: string },
  ) {
    return this.exam.logEvent(sessionId, req.user.profileId!, body);
  }

  @Get(':sessionId/questions')
  questions(@Param('sessionId') sessionId: string, @Req() req: { user: { profileId?: string } }) {
    return this.exam.getQuestions(sessionId, req.user.profileId!);
  }

  @Get(':sessionId/review')
  review(@Param('sessionId') sessionId: string, @Req() req: { user: { profileId?: string } }) {
    return this.exam.reviewSummary(sessionId, req.user.profileId!);
  }

  @Put(':sessionId/responses/:questionId')
  saveResponse(
    @Param('sessionId') sessionId: string,
    @Param('questionId') questionId: string,
    @Req() req: { user: { profileId?: string } },
    @Body() body: { answerPayload: unknown },
  ) {
    return this.exam.saveResponse(sessionId, questionId, req.user.profileId!, body.answerPayload);
  }

  @Post(':sessionId/questions/:questionId/flag')
  flag(
    @Param('sessionId') sessionId: string,
    @Param('questionId') questionId: string,
    @Req() req: { user: { profileId?: string } },
    @Body() body: { flagged: boolean },
  ) {
    return this.exam.toggleFlag(sessionId, questionId, req.user.profileId!, body.flagged);
  }

  @Post(':sessionId/submit')
  submit(@Param('sessionId') sessionId: string, @Req() req: { user: { profileId?: string } }) {
    return this.exam.submit(sessionId, req.user.profileId!);
  }
}
