import { Controller, Get, Req, UseGuards } from '@nestjs/common';
import { AuthGuard } from '@nestjs/passport';
import { Roles } from '../auth/roles.decorator';
import { RolesGuard } from '../auth/roles.guard';
import { CandidatesService } from './candidates.service';

@Controller('candidates')
@UseGuards(AuthGuard('jwt'), RolesGuard)
@Roles('candidate')
export class CandidatesController {
  constructor(private candidates: CandidatesService) {}

  @Get('dashboard')
  dashboard(@Req() req: { user: { profileId?: string } }) {
    return this.candidates.getDashboard(req.user.profileId!);
  }
}
