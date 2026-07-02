import { BadRequestException, Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';

function shuffle<T>(items: T[]): T[] {
  const copy = [...items];
  for (let i = copy.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [copy[i], copy[j]] = [copy[j]!, copy[i]!];
  }
  return copy;
}

@Injectable()
export class BookingsService {
  constructor(private prisma: PrismaService) {}

  listModules() {
    return this.prisma.client.subjectModule.findMany({ where: { isActive: true } });
  }

  async listForCandidate(profileId: string) {
    return this.prisma.client.examBooking.findMany({
      where: { candidateId: profileId },
      include: { subjectModule: true, testCenter: true, examSession: true, systemCheck: true },
      orderBy: { scheduledAt: 'desc' },
    });
  }

  async create(profileId: string, dto: {
    subjectModuleId: string;
    pathway: 'PHYSICAL_CENTER' | 'REMOTE_PROCTORED';
    scheduledAt: string;
    testCenterId?: string;
  }) {
    const module = await this.prisma.client.subjectModule.findUnique({ where: { id: dto.subjectModuleId } });
    if (!module) throw new NotFoundException('Module not found');

    const booking = await this.prisma.client.examBooking.create({
      data: {
        candidateId: profileId,
        subjectModuleId: dto.subjectModuleId,
        pathway: dto.pathway,
        scheduledAt: new Date(dto.scheduledAt),
        status: 'CONFIRMED',
        testCenterId: dto.testCenterId,
      },
      include: { subjectModule: true },
    });

    const questions = await this.prisma.client.question.findMany({
      where: { subjectModuleId: dto.subjectModuleId },
      orderBy: { sortOrder: 'asc' },
    });

    // Randomize per session: pool by question type (keeps the paper balanced),
    // shuffle within each type, then shuffle the final order.
    const byType = new Map<string, typeof questions>();
    for (const q of questions) {
      const bucket = byType.get(q.type) ?? [];
      bucket.push(q);
      byType.set(q.type, bucket);
    }
    const POOL_PER_TYPE = 10;
    const selected = [...byType.values()].flatMap((bucket) =>
      shuffle(bucket).slice(0, POOL_PER_TYPE),
    );
    const paper = shuffle(selected);

    const session = await this.prisma.client.examSession.create({
      data: {
        bookingId: booking.id,
        status: 'SYSTEM_CHECK_PENDING',
        questions: {
          create: paper.map((q, i) => ({ questionId: q.id, sortOrder: i + 1 })),
        },
      },
    });

    await this.prisma.client.systemCheck.create({
      data: {
        candidateId: profileId,
        bookingId: booking.id,
        status: 'PENDING',
        checks: { webcam: false, microphone: false, connection: false, browser: false },
      },
    });

    return { booking, sessionId: session.id };
  }

  async getSystemCheck(bookingId: string, profileId: string) {
    const check = await this.prisma.client.systemCheck.findFirst({
      where: { bookingId, candidateId: profileId },
    });
    if (!check) throw new NotFoundException();
    return check;
  }

  async submitSystemCheck(
    bookingId: string,
    profileId: string,
    dto: { checks: Record<string, boolean>; consent: boolean; idDocumentUrl?: string },
  ) {
    if (!dto.consent) throw new BadRequestException('Consent required');

    const allPass = Object.values(dto.checks).every(Boolean);
    const check = await this.prisma.client.systemCheck.update({
      where: { bookingId },
      data: {
        checks: dto.checks,
        consentAt: new Date(),
        idDocumentUrl: dto.idDocumentUrl,
        status: allPass ? 'PASSED' : 'FAILED',
        submittedAt: new Date(),
      },
    });

    if (allPass) {
      await this.prisma.client.examSession.updateMany({
        where: { bookingId },
        data: { status: 'SCHEDULED' },
      });
    }

    return check;
  }
}
