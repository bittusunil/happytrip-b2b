import { Injectable, UnauthorizedException } from '@nestjs/common';
import { PassportStrategy } from '@nestjs/passport';
import { ExtractJwt, Strategy } from 'passport-jwt';
import { ConfigService } from '@nestjs/config';
import { PrismaService } from '../../../prisma/prisma.service';

@Injectable()
export class JwtStrategy extends PassportStrategy(Strategy) {
  constructor(
    private configService: ConfigService,
    private prisma: PrismaService,
  ) {
    super({
      jwtFromRequest: ExtractJwt.fromAuthHeaderAsBearerToken(),
      ignoreExpiration: false,
      secretOrKey: configService.get('JWT_SECRET'),
    });
  }

  async validate(payload: any) {
    const agent = await this.prisma.agent.findUnique({
      where: { id: payload.sub },
      select: {
        id: true,
        email: true,
        agencyName: true,
        agencyCode: true,
        status: true,
        verificationStatus: true,
        permissions: true,
      },
    });

    if (!agent) {
      throw new UnauthorizedException();
    }

    if (agent.status !== 'Active') {
      throw new UnauthorizedException('Account is not active');
    }

    return agent;
  }
}
