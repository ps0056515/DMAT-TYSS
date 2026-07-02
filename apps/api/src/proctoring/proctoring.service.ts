import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { GradingService } from '../grading/grading.service';

@Injectable()
export class ProctoringService {
  constructor(
    private prisma: PrismaService,
    private grading: GradingService,
  ) {}

  listFlags(status = 'OPEN') {
    return this.prisma.client.proctoringFlag.findMany({
      where: { status: status as 'OPEN' },
      include: {
        session: {
          include: {
            booking: {
              include: { candidate: true, subjectModule: true },
            },
            questions: true,
            responses: true,
          },
        },
      },
      orderBy: [{ severity: 'desc' }, { createdAt: 'asc' }],
    });
  }

  async reviewFlag(flagId: string, userId: string, action: 'dismiss' | 'warn' | 'escalate', rationale?: string) {
    const statusMap = { dismiss: 'DISMISSED', warn: 'CONFIRMED', escalate: 'ESCALATED' } as const;
    const flag = await this.prisma.client.proctoringFlag.update({
      where: { id: flagId },
      data: {
        status: statusMap[action],
        reviewerId: userId,
        rationale,
      },
    });
    return flag;
  }

  async resolveSession(sessionId: string) {
    const open = await this.prisma.client.proctoringFlag.count({
      where: { sessionId, status: 'OPEN' },
    });
    if (open > 0) throw new Error('Open flags remain');

    await this.prisma.client.examSession.update({
      where: { id: sessionId },
      data: { status: 'GRADING' },
    });

    await this.grading.tryFinalizeSession(sessionId);
    return { resolved: true };
  }
}
