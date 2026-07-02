import { Controller, Get, Req, UseGuards } from '@nestjs/common';
import { AuthGuard } from '@nestjs/passport';
import { Roles } from '../auth/roles.decorator';
import { RolesGuard } from '../auth/roles.guard';
import { CertificatesService } from './certificates.service';

@Controller('certificates')
@UseGuards(AuthGuard('jwt'), RolesGuard)
@Roles('candidate')
export class CertificatesController {
  constructor(private certificates: CertificatesService) {}

  @Get('me')
  mine(@Req() req: { user: { profileId?: string } }) {
    return this.certificates.forCandidate(req.user.profileId!);
  }
}
