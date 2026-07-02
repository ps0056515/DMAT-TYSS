import { Injectable } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';

@Injectable()
export class TestCentersService {
  constructor(private prisma: PrismaService) {}

  async todaySession() {
    const start = new Date();
    start.setHours(0, 0, 0, 0);
    const end = new Date(start);
    end.setDate(end.getDate() + 1);

    const bookings = await this.prisma.client.examBooking.findMany({
      where: {
        pathway: 'PHYSICAL_CENTER',
        scheduledAt: { gte: start, lt: end },
        status: 'CONFIRMED',
      },
      include: {
        candidate: true,
        subjectModule: true,
        testCenter: true,
        examSession: true,
      },
      orderBy: { scheduledAt: 'asc' },
    });

    const expected = bookings.length;
    const checkedIn = bookings.filter((b) => b.checkedInAt).length;
    const inProgress = bookings.filter((b) => b.examSession?.status === 'IN_PROGRESS').length;
    const noShows = bookings.filter((b) => !b.checkedInAt && b.scheduledAt < new Date()).length;

    return {
      center: bookings[0]?.testCenter ?? { name: 'Munich Test Center', city: 'Munich', room: '3A' },
      scheduledAt: bookings[0]?.scheduledAt,
      stats: { expected, checkedIn, inProgress, noShows },
      candidates: bookings.map((b) => ({
        bookingId: b.id,
        name: `${b.candidate.firstName} ${b.candidate.lastName}`,
        seat: b.seatLabel ?? '—',
        module: b.subjectModule.name,
        status: b.examSession?.status === 'IN_PROGRESS'
          ? 'in_progress'
          : b.checkedInAt
            ? 'in_progress'
            : b.scheduledAt < new Date()
              ? 'no_show'
              : 'awaiting',
      })),
    };
  }

  async checkIn(bookingId: string) {
    const booking = await this.prisma.client.examBooking.update({
      where: { id: bookingId },
      data: { checkedInAt: new Date() },
      include: { examSession: true },
    });

    if (booking.examSession) {
      await this.prisma.client.examSession.update({
        where: { id: booking.examSession.id },
        data: { status: 'IN_PROGRESS', startedAt: new Date() },
      });
    }

    return booking;
  }

  async logIncident(bookingId: string, dto: { type: string; notes: string }) {
    const booking = await this.prisma.client.examBooking.findUnique({
      where: { id: bookingId },
      include: { examSession: true },
    });
    if (!booking?.examSession) return { logged: false };

    return this.prisma.client.proctoringFlag.create({
      data: {
        sessionId: booking.examSession.id,
        severity: 'MEDIUM',
        status: 'OPEN',
        flagType: 'test_center_incident',
        description: `${dto.type}: ${dto.notes}`,
        timestampMs: 0,
      },
    });
  }
}
