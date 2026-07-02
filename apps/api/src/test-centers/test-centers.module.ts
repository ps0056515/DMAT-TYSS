import { Module } from '@nestjs/common';
import { TestCentersController } from './test-centers.controller';
import { TestCentersService } from './test-centers.service';

@Module({
  controllers: [TestCentersController],
  providers: [TestCentersService],
})
export class TestCentersModule {}
