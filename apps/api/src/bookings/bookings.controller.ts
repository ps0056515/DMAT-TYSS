import { Body, Controller, Get, Param, Post, Req, UseGuards } from '@nestjs/common';
import { AuthGuard } from '@nestjs/passport';
import { Roles } from '../auth/roles.decorator';
import { RolesGuard } from '../auth/roles.guard';
import { BookingsService } from './bookings.service';

@Controller('bookings')
export class BookingsController {
  constructor(private bookings: BookingsService) {}

  @Get('modules')
  modules() {
    return this.bookings.listModules();
  }

  @Get()
  @UseGuards(AuthGuard('jwt'), RolesGuard)
  @Roles('candidate')
  list(@Req() req: { user: { profileId?: string } }) {
    return this.bookings.listForCandidate(req.user.profileId!);
  }

  @Post()
  @UseGuards(AuthGuard('jwt'), RolesGuard)
  @Roles('candidate')
  create(
    @Req() req: { user: { profileId?: string } },
    @Body()
    body: {
      subjectModuleId: string;
      pathway: 'PHYSICAL_CENTER' | 'REMOTE_PROCTORED';
      scheduledAt: string;
      testCenterId?: string;
    },
  ) {
    return this.bookings.create(req.user.profileId!, body);
  }

  @Get(':bookingId/system-check')
  @UseGuards(AuthGuard('jwt'), RolesGuard)
  @Roles('candidate')
  getSystemCheck(@Param('bookingId') bookingId: string, @Req() req: { user: { profileId?: string } }) {
    return this.bookings.getSystemCheck(bookingId, req.user.profileId!);
  }

  @Post(':bookingId/system-check')
  @UseGuards(AuthGuard('jwt'), RolesGuard)
  @Roles('candidate')
  submitSystemCheck(
    @Param('bookingId') bookingId: string,
    @Req() req: { user: { profileId?: string } },
    @Body() body: { checks: Record<string, boolean>; consent: boolean; idDocumentUrl?: string },
  ) {
    return this.bookings.submitSystemCheck(bookingId, req.user.profileId!, body);
  }
}
