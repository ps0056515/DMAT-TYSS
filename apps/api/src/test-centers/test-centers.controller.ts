import { Body, Controller, Get, Param, Post, UseGuards } from '@nestjs/common';
import { AuthGuard } from '@nestjs/passport';
import { Roles } from '../auth/roles.decorator';
import { RolesGuard } from '../auth/roles.guard';
import { TestCentersService } from './test-centers.service';

@Controller('test-centers')
@UseGuards(AuthGuard('jwt'), RolesGuard)
@Roles('test_center_staff', 'admin')
export class TestCentersController {
  constructor(private testCenters: TestCentersService) {}

  @Get('today')
  today() {
    return this.testCenters.todaySession();
  }

  @Post('bookings/:bookingId/check-in')
  checkIn(@Param('bookingId') bookingId: string) {
    return this.testCenters.checkIn(bookingId);
  }

  @Post('bookings/:bookingId/incident')
  incident(@Param('bookingId') bookingId: string, @Body() body: { type: string; notes: string }) {
    return this.testCenters.logIncident(bookingId, body);
  }
}
