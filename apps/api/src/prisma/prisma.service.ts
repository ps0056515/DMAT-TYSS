import { Global, Injectable, OnModuleInit } from '@nestjs/common';
import { prisma } from '@dmat/database';

@Global()
@Injectable()
export class PrismaService implements OnModuleInit {
  client = prisma;

  async onModuleInit() {
    await this.client.$connect();
  }
}
