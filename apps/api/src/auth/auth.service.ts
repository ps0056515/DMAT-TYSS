import { Injectable, UnauthorizedException, ConflictException } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import * as bcrypt from 'bcryptjs';
import { PrismaService } from '../prisma/prisma.service';
import { toRole } from '../common/mappers';
import type { UserRole } from '@dmat/types';

@Injectable()
export class AuthService {
  constructor(
    private prisma: PrismaService,
    private jwt: JwtService,
  ) {}

  private sign(user: { id: string; email: string; role: UserRole }) {
    return this.jwt.sign({ sub: user.id, email: user.email, role: user.role });
  }

  async register(dto: {
    email: string;
    password: string;
    firstName: string;
    lastName: string;
    countryCode: string;
    registrationCountry: string;
  }) {
    const existing = await this.prisma.client.user.findUnique({ where: { email: dto.email } });
    if (existing) throw new ConflictException('Email already registered');

    const passwordHash = await bcrypt.hash(dto.password, 10);
    const user = await this.prisma.client.user.create({
      data: {
        email: dto.email,
        passwordHash,
        role: 'CANDIDATE',
        candidateProfile: {
          create: {
            firstName: dto.firstName,
            lastName: dto.lastName,
            countryCode: dto.countryCode,
            registrationCountry: dto.registrationCountry,
          },
        },
      },
      include: { candidateProfile: true },
    });

    const role = toRole(user.role);
    return {
      accessToken: this.sign({ id: user.id, email: user.email, role }),
      user: {
        id: user.id,
        email: user.email,
        role,
        firstName: user.candidateProfile?.firstName,
        lastName: user.candidateProfile?.lastName,
      },
    };
  }

  async login(email: string, password: string) {
    const user = await this.prisma.client.user.findUnique({
      where: { email },
      include: { candidateProfile: true },
    });
    if (!user || !(await bcrypt.compare(password, user.passwordHash))) {
      throw new UnauthorizedException('Invalid credentials');
    }
    const role = toRole(user.role);
    return {
      accessToken: this.sign({ id: user.id, email: user.email, role }),
      user: {
        id: user.id,
        email: user.email,
        role,
        firstName: user.candidateProfile?.firstName,
        lastName: user.candidateProfile?.lastName,
      },
    };
  }

  async me(userId: string) {
    const user = await this.prisma.client.user.findUnique({
      where: { id: userId },
      include: { candidateProfile: true },
    });
    if (!user) throw new UnauthorizedException();
    return {
      id: user.id,
      email: user.email,
      role: toRole(user.role),
      firstName: user.candidateProfile?.firstName,
      lastName: user.candidateProfile?.lastName,
    };
  }
}
