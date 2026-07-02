import { BadRequestException, Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';

export interface QuestionInput {
  subjectModuleId?: string;
  moduleCode?: string;
  type: 'MCQ' | 'FIGURE' | 'FREE_TEXT';
  stem: string;
  content: Record<string, unknown>;
  correctAnswer?: Record<string, unknown>;
  rubric?: Record<string, unknown>;
  sortOrder?: number;
}

@Injectable()
export class AdminService {
  constructor(private prisma: PrismaService) {}

  listQuestions(moduleId?: string) {
    return this.prisma.client.question.findMany({
      where: moduleId ? { subjectModuleId: moduleId } : undefined,
      include: { subjectModule: { select: { code: true, name: true } } },
      orderBy: [{ subjectModuleId: 'asc' }, { sortOrder: 'asc' }],
    });
  }

  private async resolveModuleId(input: QuestionInput): Promise<string> {
    if (input.subjectModuleId) return input.subjectModuleId;
    if (input.moduleCode) {
      const module = await this.prisma.client.subjectModule.findUnique({
        where: { code: input.moduleCode },
      });
      if (!module) throw new NotFoundException(`Module not found: ${input.moduleCode}`);
      return module.id;
    }
    throw new BadRequestException('subjectModuleId or moduleCode is required');
  }

  private validateQuestion(input: QuestionInput, index?: number) {
    const at = index === undefined ? '' : ` (item ${index + 1})`;
    if (!input.stem?.trim()) throw new BadRequestException(`stem is required${at}`);
    if (!['MCQ', 'FIGURE', 'FREE_TEXT'].includes(input.type)) {
      throw new BadRequestException(`type must be MCQ, FIGURE, or FREE_TEXT${at}`);
    }
    if (input.type !== 'FREE_TEXT' && !input.correctAnswer) {
      throw new BadRequestException(`correctAnswer is required for objective questions${at}`);
    }
    if (input.type === 'FREE_TEXT' && !input.rubric) {
      throw new BadRequestException(`rubric is required for free-text questions${at}`);
    }
  }

  async createQuestion(input: QuestionInput) {
    this.validateQuestion(input);
    const subjectModuleId = await this.resolveModuleId(input);
    return this.prisma.client.question.create({
      data: {
        subjectModuleId,
        type: input.type,
        stem: input.stem,
        content: (input.content ?? {}) as object,
        correctAnswer: input.correctAnswer as object | undefined,
        rubric: input.rubric as object | undefined,
        sortOrder: input.sortOrder ?? 0,
      },
    });
  }

  async importQuestions(items: QuestionInput[]) {
    if (!Array.isArray(items) || items.length === 0) {
      throw new BadRequestException('Provide a non-empty array of questions');
    }
    items.forEach((item, i) => this.validateQuestion(item, i));

    const created = [];
    for (const item of items) {
      created.push(await this.createQuestion(item));
    }
    return { imported: created.length, questions: created };
  }

  async deleteQuestion(id: string) {
    const used = await this.prisma.client.examSessionQuestion.count({
      where: { questionId: id },
    });
    if (used > 0) {
      throw new BadRequestException('Question is used in existing exam sessions and cannot be deleted');
    }
    await this.prisma.client.question.delete({ where: { id } });
    return { deleted: true };
  }

  async overview(days = 30) {
    const since = new Date(Date.now() - days * 86400000);

    const [sessions, certificates, flags, appeals, remote, physical] = await Promise.all([
      this.prisma.client.examSession.count({ where: { createdAt: { gte: since } } }),
      this.prisma.client.certificate.count({ where: { issuedAt: { gte: since } } }),
      this.prisma.client.proctoringFlag.count({ where: { createdAt: { gte: since } } }),
      this.prisma.client.appeal.count({ where: { status: 'OPEN' } }),
      this.prisma.client.examBooking.count({
        where: { pathway: 'REMOTE_PROCTORED', createdAt: { gte: since } },
      }),
      this.prisma.client.examBooking.count({
        where: { pathway: 'PHYSICAL_CENTER', createdAt: { gte: since } },
      }),
    ]);

    const totalBookings = remote + physical || 1;
    const openFlags = await this.prisma.client.proctoringFlag.count({ where: { status: 'OPEN' } });
    const gradingPending = await this.prisma.client.examSession.count({ where: { status: 'GRADING' } });

    return {
      kpis: {
        examsDelivered: sessions,
        certificatesIssued: certificates,
        flagRate: sessions ? `${((flags / sessions) * 100).toFixed(1)}%` : '0%',
        openAppeals: appeals,
      },
      pathways: {
        remotePct: Math.round((remote / totalBookings) * 100),
        physicalPct: Math.round((physical / totalBookings) * 100),
      },
      grading: { pending: gradingPending, avgDaysToClose: 2.1 },
      needsAttention: [
        ...(appeals > 0 ? [`${appeals} appeals pending adjudication`] : []),
        ...(openFlags > 0 ? [`${openFlags} proctoring flags need review`] : []),
        ...(gradingPending > 0 ? [`${gradingPending} sessions awaiting grading`] : []),
      ],
    };
  }
}
