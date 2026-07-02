import { Injectable } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';

@Injectable()
export class CertificatesService {
  constructor(private prisma: PrismaService) {}

  forCandidate(profileId: string) {
    return this.prisma.client.certificate.findMany({
      where: { candidateId: profileId },
      orderBy: { issuedAt: 'desc' },
    });
  }
}
