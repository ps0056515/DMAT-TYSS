import { Module, forwardRef } from '@nestjs/common';
import { ProctoringController } from './proctoring.controller';
import { ProctoringService } from './proctoring.service';
import { GradingModule } from '../grading/grading.module';

@Module({
  imports: [forwardRef(() => GradingModule)],
  controllers: [ProctoringController],
  providers: [ProctoringService],
})
export class ProctoringModule {}
