import { Body, Controller, Get, Param, Patch, Post, Query, Req, UseGuards } from '@nestjs/common';
import { AuthGuard } from '@nestjs/passport';
import { Roles } from '../auth/roles.decorator';
import { RolesGuard } from '../auth/roles.guard';
import { ProctoringService } from './proctoring.service';

@Controller('proctoring')
@UseGuards(AuthGuard('jwt'), RolesGuard)
export class ProctoringController {
  constructor(private proctoring: ProctoringService) {}

  @Get('flags')
  @Roles('proctor', 'reviewer', 'admin')
  flags(@Query('status') status = 'OPEN') {
    return this.proctoring.listFlags(status);
  }

  @Patch('flags/:flagId')
  @Roles('proctor', 'reviewer', 'admin')
  review(
    @Param('flagId') flagId: string,
    @Req() req: { user: { userId: string } },
    @Body() body: { action: 'dismiss' | 'warn' | 'escalate'; rationale?: string },
  ) {
    return this.proctoring.reviewFlag(flagId, req.user.userId, body.action, body.rationale);
  }

  @Post('sessions/:sessionId/resolve')
  @Roles('proctor', 'reviewer', 'admin')
  resolve(@Param('sessionId') sessionId: string) {
    return this.proctoring.resolveSession(sessionId);
  }
}
