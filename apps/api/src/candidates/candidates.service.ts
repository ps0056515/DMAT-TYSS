import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';

@Injectable()
export class CandidatesService {
  constructor(private prisma: PrismaService) {}

  async getDashboard(profileId: string) {
    const profile = await this.prisma.client.candidateProfile.findUnique({
      where: { id: profileId },
      include: {
        examBookings: {
          include: {
            subjectModule: true,
            testCenter: true,
            examSession: { include: { certificate: true } },
            systemCheck: true,
          },
          orderBy: { scheduledAt: 'asc' },
        },
      },
    });
    if (!profile) throw new NotFoundException();

    const startableStatuses = ['SYSTEM_CHECK_PENDING', 'SCHEDULED', 'CHECK_IN'];
    const upcoming =
      profile.examBookings.find(
        (b) =>
          b.status === 'CONFIRMED' &&
          b.examSession &&
          startableStatuses.includes(b.examSession.status),
      ) ??
      profile.examBookings.find(
        (b) => b.status === 'CONFIRMED' && b.examSession?.status === 'IN_PROGRESS',
      ) ??
      profile.examBookings.find(
        (b) => b.status === 'CONFIRMED' && b.examSession?.status !== 'CERTIFIED',
      );

    const daysUntil = upcoming
      ? Math.max(0, Math.ceil((upcoming.scheduledAt.getTime() - Date.now()) / 86400000))
      : null;

    const checklist = [
      { label: 'Complete registration', done: true, href: '/' },
      { label: 'Book your exam slot', done: profile.examBookings.some((b) => b.status === 'CONFIRMED'), href: '/booking' },
      {
        label: 'Run system & ID check',
        done: upcoming?.systemCheck?.status === 'PASSED',
        href: '/system-check',
      },
      { label: 'Review exam interface demo', done: true, href: '/' },
      {
        label: 'Read proctoring consent policy',
        done: !!upcoming?.systemCheck?.consentAt,
        href: '/system-check',
      },
    ];

    return {
      firstName: profile.firstName,
      lastName: profile.lastName,
      upcomingBooking: upcoming
        ? {
            id: upcoming.id,
            moduleName: upcoming.subjectModule.name,
            pathway: upcoming.pathway,
            scheduledAt: upcoming.scheduledAt,
            sessionId: upcoming.examSession?.id,
            sessionStatus: upcoming.examSession?.status,
          }
        : null,
      stats: {
        daysUntilExam: daysUntil,
        idVerification: upcoming?.systemCheck?.status === 'PASSED' ? 'Verified' : 'Pending',
        systemCheck: upcoming?.systemCheck?.status === 'PASSED' ? 'Complete' : 'Not started',
        prepModulesDone: `${checklist.filter((c) => c.done).length} / ${checklist.length}`,
      },
      checklist,
      certificates: profile.examBookings
        .filter((b) => b.examSession?.certificate)
        .map((b) => b.examSession!.certificate),
    };
  }
}
