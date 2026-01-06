import {
  Injectable,
  UnauthorizedException,
  ConflictException,
  NotFoundException,
  Logger,
} from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { ConfigService } from '@nestjs/config';
import { PrismaService } from '../../prisma/prisma.service';
import { RegisterAgentDto, LoginDto } from './dto';
import * as bcrypt from 'bcrypt';
import { AgentStatus } from '@prisma/client';

@Injectable()
export class AuthService {
  private readonly logger = new Logger(AuthService.name);

  constructor(
    private prisma: PrismaService,
    private jwtService: JwtService,
    private configService: ConfigService,
  ) {}

  async registerAgent(dto: RegisterAgentDto) {
    this.logger.log(`Registering new agent: ${dto.email}`);

    // Check if agency code exists
    const existingCode = await this.prisma.agent.findUnique({
      where: { agencyCode: dto.agencyCode },
    });

    if (existingCode) {
      throw new ConflictException('Agency code already exists');
    }

    // Check if email exists
    const existingEmail = await this.prisma.agent.findUnique({
      where: { email: dto.email },
    });

    if (existingEmail) {
      throw new ConflictException('Email already registered');
    }

    // Hash password
    const hashedPassword = await bcrypt.hash(dto.password, 10);

    // Create agent
    const agent = await this.prisma.agent.create({
      data: {
        ...dto,
        passwordHash: hashedPassword,
        status: AgentStatus.Pending,
        verificationStatus: 'Unverified',
      },
    });

    // Create wallet
    await this.prisma.wallet.create({
      data: {
        agentId: agent.id,
        currentBalance: 0,
        availableBalance: 0,
        blockedBalance: 0,
        creditLimit: 0,
        availableCredit: 0,
        usedCredit: 0,
      },
    });

    this.logger.log(`Agent registered successfully: ${agent.id}`);

    // Generate tokens
    const tokens = await this.generateTokens(agent.id, agent.email);

    return {
      user: this.sanitizeAgent(agent),
      ...tokens,
    };
  }

  async login(dto: LoginDto) {
    this.logger.log(`Login attempt: ${dto.email}`);

    const agent = await this.prisma.agent.findUnique({
      where: { email: dto.email },
    });

    if (!agent) {
      throw new UnauthorizedException('Invalid credentials');
    }

    const isPasswordValid = await bcrypt.compare(dto.password, agent.passwordHash);

    if (!isPasswordValid) {
      throw new UnauthorizedException('Invalid credentials');
    }

    if (agent.status !== AgentStatus.Active) {
      throw new UnauthorizedException(
        `Account is ${agent.status.toLowerCase()}. Please contact support.`,
      );
    }

    // Update last login
    await this.prisma.agent.update({
      where: { id: agent.id },
      data: { lastLoginAt: new Date() },
    });

    this.logger.log(`Agent logged in successfully: ${agent.id}`);

    const tokens = await this.generateTokens(agent.id, agent.email);

    return {
      user: this.sanitizeAgent(agent),
      ...tokens,
    };
  }

  async validateAgent(userId: string) {
    const agent = await this.prisma.agent.findUnique({
      where: { id: userId },
    });

    if (!agent) {
      throw new NotFoundException('Agent not found');
    }

    if (agent.status !== AgentStatus.Active) {
      throw new UnauthorizedException('Account is not active');
    }

    return this.sanitizeAgent(agent);
  }

  async getProfile(agentId: string) {
    const agent = await this.prisma.agent.findUnique({
      where: { id: agentId },
      include: {
        wallet: true,
      },
      select: {
        id: true,
        agencyName: true,
        agencyCode: true,
        businessType: true,
        contactPersonName: true,
        email: true,
        phone: true,
        website: true,
        addressLine1: true,
        addressLine2: true,
        city: true,
        state: true,
        country: true,
        postalCode: true,
        status: true,
        verificationStatus: true,
        walletBalance: true,
        creditLimit: true,
        availableCredit: true,
        commissionRate: true,
        useCustomMarkup: true,
        permissions: true,
        lastLoginAt: true,
        createdAt: true,
        wallet: true,
      },
    });

    if (!agent) {
      throw new NotFoundException('Agent not found');
    }

    return agent;
  }

  async changePassword(agentId: string, oldPassword: string, newPassword: string) {
    const agent = await this.prisma.agent.findUnique({
      where: { id: agentId },
    });

    if (!agent) {
      throw new NotFoundException('Agent not found');
    }

    const isPasswordValid = await bcrypt.compare(oldPassword, agent.passwordHash);

    if (!isPasswordValid) {
      throw new UnauthorizedException('Current password is incorrect');
    }

    const hashedPassword = await bcrypt.hash(newPassword, 10);

    await this.prisma.agent.update({
      where: { id: agentId },
      data: { passwordHash: hashedPassword },
    });

    this.logger.log(`Password changed for agent: ${agentId}`);

    return { message: 'Password changed successfully' };
  }

  private async generateTokens(userId: string, email: string) {
    const payload = { sub: userId, email };

    const accessToken = this.jwtService.sign(payload);

    return {
      accessToken,
      refreshToken: this.jwtService.sign(payload, {
        secret: this.configService.get('JWT_SECRET'),
        expiresIn: '30d',
      }),
    };
  }

  private sanitizeAgent(agent: any) {
    const { passwordHash, resetPasswordToken, ...sanitized } = agent;
    return sanitized;
  }
}
