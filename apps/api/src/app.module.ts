import { Module } from '@nestjs/common';
import { APP_INTERCEPTOR } from '@nestjs/core';
import { ConfigModule } from '@nestjs/config';
import { join } from 'path';
import { AuthModule } from './auth/auth.module';
import { AuditInterceptor } from './common/audit.interceptor';
import { PrismaModule } from './prisma/prisma.module';
import { HealthController } from './health/health.controller';
import { PhaseController } from './phase/phase.controller';
import { CandidatesModule } from './candidates/candidates.module';
import { BookingsModule } from './bookings/bookings.module';
import { ExamModule } from './exam/exam.module';
import { ProctoringModule } from './proctoring/proctoring.module';
import { GradingModule } from './grading/grading.module';
import { TestCentersModule } from './test-centers/test-centers.module';
import { CertificatesModule } from './certificates/certificates.module';
import { AdminModule } from './admin/admin.module';

@Module({
  imports: [
    ConfigModule.forRoot({
      isGlobal: true,
      envFilePath: [join(__dirname, '..', '..', '..', '.env'), '.env'],
    }),
    PrismaModule,
    AuthModule,
    CandidatesModule,
    BookingsModule,
    ExamModule,
    ProctoringModule,
    GradingModule,
    TestCentersModule,
    CertificatesModule,
    AdminModule,
  ],
  controllers: [HealthController, PhaseController],
  providers: [{ provide: APP_INTERCEPTOR, useClass: AuditInterceptor }],
})
export class AppModule {}
