import { Module, forwardRef } from '@nestjs/common';
import { ExamController } from './exam.controller';
import { ExamService } from './exam.service';
import { GradingModule } from '../grading/grading.module';

@Module({
  imports: [forwardRef(() => GradingModule)],
  controllers: [ExamController],
  providers: [ExamService],
  exports: [ExamService],
})
export class ExamModule {}
