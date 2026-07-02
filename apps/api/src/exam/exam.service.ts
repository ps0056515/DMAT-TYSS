import { BadRequestException, Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { GradingService } from '../grading/grading.service';

@Injectable()
export class ExamService {
  constructor(
    private prisma: PrismaService,
    private grading: GradingService,
  ) {}

  async getSession(sessionId: string, profileId?: string) {
    const session = await this.prisma.client.examSession.findUnique({
      where: { id: sessionId },
      include: {
        booking: { include: { subjectModule: true, candidate: true } },
        responses: true,
        questions: { include: { question: true }, orderBy: { sortOrder: 'asc' } },
      },
    });
    if (!session) throw new NotFoundException();
    if (profileId && session.booking.candidateId !== profileId) {
      throw new NotFoundException();
    }
    return session;
  }

  async start(sessionId: string, profileId: string) {
    const session = await this.getSession(sessionId, profileId);
    if (session.status === 'IN_PROGRESS') {
      return session;
    }
    if (!['SCHEDULED', 'CHECK_IN', 'SYSTEM_CHECK_PENDING'].includes(session.status)) {
      throw new BadRequestException(`Session cannot be started (status: ${session.status})`);
    }

    return this.prisma.client.examSession.update({
      where: { id: sessionId },
      data: {
        status: 'IN_PROGRESS',
        startedAt: new Date(),
        timeRemainingSec: session.durationMinutes * 60,
      },
    });
  }

  /**
   * Server-authoritative timer. Remaining time is derived from startedAt so the
   * client cannot extend the exam by tampering with its local clock. If time is
   * up, the session is auto-submitted here.
   */
  async heartbeat(sessionId: string, profileId: string) {
    const session = await this.getSession(sessionId, profileId);
    if (session.status !== 'IN_PROGRESS' || !session.startedAt) {
      return {
        status: session.status,
        timeRemainingSec: session.timeRemainingSec ?? 0,
        expired: false,
      };
    }

    const elapsedSec = Math.floor((Date.now() - session.startedAt.getTime()) / 1000);
    const remaining = Math.max(0, session.durationMinutes * 60 - elapsedSec);

    if (remaining <= 0) {
      const submitted = await this.submit(sessionId, profileId);
      return { status: submitted.status, timeRemainingSec: 0, expired: true };
    }

    await this.prisma.client.examSession.update({
      where: { id: sessionId },
      data: { timeRemainingSec: remaining },
    });
    return { status: 'IN_PROGRESS', timeRemainingSec: remaining, expired: false };
  }

  /** Lockdown/proctoring events reported by the exam player (tab switch, copy attempt, …). */
  async logEvent(
    sessionId: string,
    profileId: string,
    dto: { eventType: string; description?: string },
  ) {
    const session = await this.getSession(sessionId, profileId);
    if (session.status !== 'IN_PROGRESS') return { logged: false };

    const severityMap: Record<string, 'LOW' | 'MEDIUM' | 'HIGH'> = {
      tab_switch: 'MEDIUM',
      fullscreen_exit: 'MEDIUM',
      copy_attempt: 'LOW',
      paste_attempt: 'MEDIUM',
      context_menu: 'LOW',
      camera_denied: 'HIGH',
    };

    const flag = await this.prisma.client.proctoringFlag.create({
      data: {
        sessionId,
        severity: severityMap[dto.eventType] ?? 'LOW',
        status: 'OPEN',
        flagType: dto.eventType,
        description: dto.description ?? `Lockdown event: ${dto.eventType}`,
        timestampMs: session.startedAt ? Date.now() - session.startedAt.getTime() : 0,
      },
    });
    return { logged: true, flagId: flag.id };
  }

  async getQuestions(sessionId: string, profileId: string) {
    const session = await this.getSession(sessionId, profileId);
    return session.questions.map((sq) => ({
      id: sq.question.id,
      sortOrder: sq.sortOrder,
      type: sq.question.type,
      stem: sq.question.stem,
      content: sq.question.content,
      flagged: sq.flagged,
      response: session.responses.find((r) => r.questionId === sq.question.id)?.answerPayload,
    }));
  }

  async saveResponse(sessionId: string, questionId: string, profileId: string, answerPayload: unknown) {
    const session = await this.getSession(sessionId, profileId);
    if (session.status !== 'IN_PROGRESS') throw new BadRequestException('Exam not in progress');

    const sq = session.questions.find((q) => q.questionId === questionId);
    if (!sq) throw new NotFoundException('Question not in session');

    return this.prisma.client.examResponse.upsert({
      where: { sessionId_questionId: { sessionId, questionId } },
      create: {
        sessionId,
        questionId,
        questionType: sq.question.type,
        answerPayload: answerPayload as object,
      },
      update: { answerPayload: answerPayload as object, savedAt: new Date() },
    });
  }

  async toggleFlag(sessionId: string, questionId: string, profileId: string, flagged: boolean) {
    await this.getSession(sessionId, profileId);
    return this.prisma.client.examSessionQuestion.update({
      where: { sessionId_questionId: { sessionId, questionId } },
      data: { flagged },
    });
  }

  private scoreObjective(correct: unknown, answer: unknown): boolean {
    return JSON.stringify(correct) === JSON.stringify(answer);
  }

  async submit(sessionId: string, profileId: string) {
    const session = await this.getSession(sessionId, profileId);
    if (session.status !== 'IN_PROGRESS') throw new BadRequestException('Exam not in progress');

    for (const sq of session.questions) {
      const response = session.responses.find((r) => r.questionId === sq.questionId);
      if (sq.question.type !== 'FREE_TEXT' && sq.question.correctAnswer) {
        const isCorrect = response
          ? this.scoreObjective(sq.question.correctAnswer, response.answerPayload)
          : false;
        await this.prisma.client.examResponse.upsert({
          where: { sessionId_questionId: { sessionId, questionId: sq.questionId } },
          create: {
            sessionId,
            questionId: sq.questionId,
            questionType: sq.question.type,
            answerPayload: response?.answerPayload ?? {},
            isCorrect,
            autoScore: isCorrect ? 1 : 0,
          },
          update: { isCorrect, autoScore: isCorrect ? 1 : 0 },
        });
      }
    }

    const updated = await this.prisma.client.examSession.update({
      where: { id: sessionId },
      data: {
        status: session.booking.pathway === 'REMOTE_PROCTORED' ? 'PROCTORING_REVIEW' : 'GRADING',
        endedAt: new Date(),
        timeRemainingSec: 0,
      },
    });

    if (updated.status === 'GRADING') {
      await this.grading.tryFinalizeSession(sessionId);
    }

    return updated;
  }

  reviewSummary(sessionId: string, profileId: string) {
    return this.getQuestions(sessionId, profileId).then((questions) => {
      const answered = questions.filter((q) => q.response != null).length;
      const flagged = questions.filter((q) => q.flagged).length;
      const unanswered = questions.length - answered;
      return { questions, answered, flagged, unanswered, total: questions.length };
    });
  }
}
