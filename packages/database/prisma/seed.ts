import { resolve } from 'path';
import {
  BookingStatus,
  DataRegion,
  ExamPathway,
  ExamSessionStatus,
  PrismaClient,
  ProctoringFlagSeverity,
  ProctoringFlagStatus,
  QuestionType,
  SystemCheckStatus,
  UserRole,
} from '@prisma/client';
import * as bcrypt from 'bcryptjs';

if (!process.env.DATABASE_URL) {
  process.env.DATABASE_URL = `file:${resolve(__dirname, 'dev.db')}`;
}

const prisma = new PrismaClient();

async function main() {
  await prisma.auditLog.deleteMany();
  await prisma.appeal.deleteMany();
  await prisma.certificate.deleteMany();
  await prisma.gradingScore.deleteMany();
  await prisma.proctoringFlag.deleteMany();
  await prisma.examResponse.deleteMany();
  await prisma.examSessionQuestion.deleteMany();
  await prisma.examSession.deleteMany();
  await prisma.systemCheck.deleteMany();
  await prisma.examBooking.deleteMany();
  await prisma.question.deleteMany();
  await prisma.subjectModule.deleteMany();
  await prisma.testCenter.deleteMany();
  await prisma.candidateProfile.deleteMany();
  await prisma.user.deleteMany();

  const passwordHash = await bcrypt.hash('password123', 10);

  const candidate = await prisma.user.create({
    data: {
      email: 'alex@example.com',
      passwordHash,
      role: UserRole.CANDIDATE,
      dataRegion: DataRegion.EU_CENTRAL_1,
      candidateProfile: {
        create: {
          firstName: 'Alex',
          lastName: 'Müller',
          countryCode: 'DE',
          registrationCountry: 'Germany',
        },
      },
    },
    include: { candidateProfile: true },
  });

  await prisma.user.createMany({
    data: [
      { email: 'proctor@dmat.de', passwordHash, role: UserRole.PROCTOR, dataRegion: DataRegion.EU_CENTRAL_1 },
      { email: 'grader@dmat.de', passwordHash, role: UserRole.GRADER, dataRegion: DataRegion.EU_CENTRAL_1 },
      { email: 'staff@dmat.de', passwordHash, role: UserRole.TEST_CENTER_STAFF, dataRegion: DataRegion.EU_CENTRAL_1 },
      { email: 'admin@dmat.de', passwordHash, role: UserRole.ADMIN, dataRegion: DataRegion.EU_CENTRAL_1 },
    ],
  });

  const mathModule = await prisma.subjectModule.create({
    data: {
      code: 'MATH',
      name: 'dMAT Mathematics',
      description: 'Core mathematics assessment module',
    },
  });

  const testCenter = await prisma.testCenter.create({
    data: {
      name: 'Munich Test Center',
      city: 'Munich',
      countryCode: 'DE',
      room: '3A',
    },
  });

  const questions = await Promise.all([
    prisma.question.create({
      data: {
        subjectModuleId: mathModule.id,
        type: QuestionType.FIGURE,
        stem: 'Complete the Latin square by selecting the symbol that replaces the question mark.',
        sortOrder: 1,
        content: {
          grid: [
            ['▲', '●', '■', '◆'],
            ['●', '?', '▲', '■'],
            ['■', '◆', '●', '▲'],
            ['◆', '▲', '■', '●'],
          ],
          options: [
            { id: 'a', symbol: '■', label: 'Square' },
            { id: 'b', symbol: '▲', label: 'Triangle' },
            { id: 'c', symbol: '●', label: 'Circle' },
            { id: 'd', symbol: '◆', label: 'Diamond' },
          ],
        },
        correctAnswer: { selectedId: 'c' },
      },
    }),
    prisma.question.create({
      data: {
        subjectModuleId: mathModule.id,
        type: QuestionType.MCQ,
        stem: 'What is the derivative of x²?',
        sortOrder: 2,
        content: {
          options: [
            { id: 'a', label: 'x' },
            { id: 'b', label: '2x' },
            { id: 'c', label: 'x²' },
            { id: 'd', label: '2' },
          ],
        },
        correctAnswer: { selectedId: 'b' },
      },
    }),
    prisma.question.create({
      data: {
        subjectModuleId: mathModule.id,
        type: QuestionType.FREE_TEXT,
        stem: 'Explain how supply-chain disruptions affect consumer price indices in open economies.',
        sortOrder: 3,
        content: { minWords: 150, maxWords: 300 },
        rubric: {
          criteria: [
            { name: 'Conceptual accuracy', max: 4 },
            { name: 'Use of evidence', max: 3 },
            { name: 'Structure & clarity', max: 3 },
          ],
        },
      },
    }),
  ]);

  const scheduledAt = new Date(Date.now() + 12 * 24 * 60 * 60 * 1000);

  const booking = await prisma.examBooking.create({
    data: {
      candidateId: candidate.candidateProfile!.id,
      subjectModuleId: mathModule.id,
      pathway: ExamPathway.REMOTE_PROCTORED,
      scheduledAt,
      status: BookingStatus.CONFIRMED,
    },
  });

  await prisma.systemCheck.create({
    data: {
      candidateId: candidate.candidateProfile!.id,
      bookingId: booking.id,
      status: SystemCheckStatus.PENDING,
      checks: { webcam: false, microphone: false, connection: false, browser: false },
    },
  });

  const session = await prisma.examSession.create({
    data: {
      bookingId: booking.id,
      status: ExamSessionStatus.SYSTEM_CHECK_PENDING,
      durationMinutes: 180,
      questions: {
        create: questions.map((q, i) => ({
          questionId: q.id,
          sortOrder: i + 1,
        })),
      },
    },
  });

  await prisma.examBooking.createMany({
    data: [
      {
        candidateId: candidate.candidateProfile!.id,
        subjectModuleId: mathModule.id,
        pathway: ExamPathway.PHYSICAL_CENTER,
        scheduledAt: new Date(Date.now() + 2 * 24 * 60 * 60 * 1000),
        status: BookingStatus.CONFIRMED,
        testCenterId: testCenter.id,
        seatLabel: 'A-12',
      },
    ],
  });

  const inProgressSession = await prisma.examSession.create({
    data: {
      booking: {
        create: {
          candidateId: candidate.candidateProfile!.id,
          subjectModuleId: mathModule.id,
          pathway: ExamPathway.REMOTE_PROCTORED,
          scheduledAt: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000),
          status: BookingStatus.CONFIRMED,
          testCenterId: testCenter.id,
          seatLabel: 'A-13',
          checkedInAt: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000),
        },
      },
      status: ExamSessionStatus.IN_PROGRESS,
      startedAt: new Date(),
      timeRemainingSec: 9900,
      durationMinutes: 180,
      questions: {
        create: questions.map((q, i) => ({
          questionId: q.id,
          sortOrder: i + 1,
        })),
      },
    },
  });

  await prisma.proctoringFlag.createMany({
    data: [
      {
        sessionId: inProgressSession.id,
        severity: ProctoringFlagSeverity.HIGH,
        status: ProctoringFlagStatus.OPEN,
        flagType: 'multiple_faces',
        description: 'Multiple faces detected',
        timestampMs: 554000,
        aiConfidence: 0.94,
        clipUrl: '/clips/demo-high.mp4',
      },
      {
        sessionId: inProgressSession.id,
        severity: ProctoringFlagSeverity.MEDIUM,
        status: ProctoringFlagStatus.OPEN,
        flagType: 'gaze_off_screen',
        description: 'Gaze off-screen > 8s',
        timestampMs: 432000,
        aiConfidence: 0.72,
        clipUrl: '/clips/demo-medium.mp4',
      },
    ],
  });

  console.log('Seed complete');
  console.log('Demo accounts (password: password123):');
  console.log('  candidate: alex@example.com');
  console.log('  proctor:   proctor@dmat.de');
  console.log('  grader:    grader@dmat.de');
  console.log('  staff:     staff@dmat.de');
  console.log('  admin:     admin@dmat.de');
  console.log(`Exam session for candidate: ${session.id}`);
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(() => prisma.$disconnect());
