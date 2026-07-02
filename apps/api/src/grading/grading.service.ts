import { Injectable } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';

const GRADING_TOLERANCE = 2;

@Injectable()
export class GradingService {
  constructor(private prisma: PrismaService) {}

  async getQueue() {
    const sessions = await this.prisma.client.examSession.findMany({
      where: { status: { in: ['GRADING', 'PROCTORING_REVIEW'] } },
      include: {
        booking: { include: { subjectModule: true, candidate: true } },
        questions: { include: { question: true } },
        responses: true,
        gradingScores: true,
      },
    });

    const items = [];
    for (const session of sessions) {
      for (const sq of session.questions) {
        if (sq.question.type !== 'FREE_TEXT') continue;
        const scores = session.gradingScores.filter((g) => g.questionId === sq.questionId);
        if (scores.length >= 2) continue;
        const response = session.responses.find((r) => r.questionId === sq.questionId);
        items.push({
          sessionId: session.id,
          questionId: sq.questionId,
          moduleName: session.booking.subjectModule.name,
          candidateId: session.booking.candidateId,
          stem: sq.question.stem,
          content: sq.question.content,
          rubric: sq.question.rubric,
          responseText: (response?.answerPayload as { text?: string })?.text ?? '',
          wordCount: ((response?.answerPayload as { text?: string })?.text ?? '')
            .trim()
            .split(/\s+/)
            .filter(Boolean).length,
          graderCount: scores.length,
        });
      }
    }
    return items;
  }

  async submitScore(
    graderId: string,
    dto: {
      sessionId: string;
      questionId: string;
      criteriaScores: Record<string, number>;
      totalScore: number;
      notes?: string;
    },
  ) {
    await this.prisma.client.gradingScore.create({
      data: {
        sessionId: dto.sessionId,
        questionId: dto.questionId,
        graderId,
        criteriaScores: dto.criteriaScores,
        totalScore: dto.totalScore,
        notes: dto.notes,
      },
    });

    const scores = await this.prisma.client.gradingScore.findMany({
      where: { sessionId: dto.sessionId, questionId: dto.questionId },
    });

    if (scores.length >= 2) {
      const [a, b] = scores;
      if (Math.abs(a!.totalScore - b!.totalScore) > GRADING_TOLERANCE) {
        return { status: 'needs_third_grader', scores };
      }
    }

    await this.tryFinalizeSession(dto.sessionId);
    return { status: 'recorded', graderCount: scores.length };
  }

  async tryFinalizeSession(sessionId: string) {
    const session = await this.prisma.client.examSession.findUnique({
      where: { id: sessionId },
      include: {
        booking: true,
        questions: { include: { question: true } },
        responses: true,
        gradingScores: true,
        certificate: true,
      },
    });
    if (!session || session.certificate) return null;
    if (!['GRADING', 'PROCTORING_REVIEW'].includes(session.status)) return null;

    const openFlags = await this.prisma.client.proctoringFlag.count({
      where: { sessionId, status: 'OPEN' },
    });
    if (openFlags > 0) return null;

    if (session.status === 'PROCTORING_REVIEW') return null;

    for (const sq of session.questions) {
      if (sq.question.type === 'FREE_TEXT') {
        const scores = session.gradingScores.filter((g) => g.questionId === sq.questionId);
        if (scores.length < 1) return null;
      }
    }

    let rawTotal = 0;
    let maxTotal = 0;
    const breakdown: Record<string, { raw: number; scaled: number }> = {};

    for (const sq of session.questions) {
      const response = session.responses.find((r) => r.questionId === sq.questionId);
      let points = 0;
      let max = 1;

      if (sq.question.type === 'FREE_TEXT') {
        const scores = session.gradingScores.filter((g) => g.questionId === sq.questionId);
        max = 10;
        points = scores.length
          ? scores.reduce((s, g) => s + g.totalScore, 0) / scores.length
          : 0;
      } else {
        points = response?.autoScore ?? 0;
      }

      rawTotal += points;
      maxTotal += max;
      breakdown[sq.question.type] = {
        raw: points,
        scaled: Math.round((points / max) * 100),
      };
    }

    const scaledScore = Math.round(100 + (rawTotal / maxTotal) * 100);
    const percentileRank = Math.min(99, Math.round(scaledScore / 2));

    await this.prisma.client.certificate.create({
      data: {
        sessionId,
        candidateId: session.booking.candidateId,
        scaledScore,
        percentileRank,
        moduleBreakdown: breakdown,
      },
    });

    return this.prisma.client.examSession.update({
      where: { id: sessionId },
      data: { status: 'CERTIFIED' },
    });
  }
}
