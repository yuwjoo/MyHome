import { Inject, Injectable, UnauthorizedException } from '@nestjs/common';
import { PassportStrategy } from '@nestjs/passport';
import { ExtractJwt, Strategy } from 'passport-jwt';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { SysUserEntity } from '../entities/sysUser.entity';
import { JwtPayload } from 'src/types/jwt';
import jwtConfig, { JwtConfig } from 'src/config/jwt.config';

@Injectable()
export class JwtStrategy extends PassportStrategy(Strategy) {
  constructor(
    @InjectRepository(SysUserEntity)
    private readonly sysUserRepository: Repository<SysUserEntity>,
    @Inject(jwtConfig.KEY)
    readonly jwtConfig: JwtConfig,
  ) {
    super({
      jwtFromRequest: ExtractJwt.fromAuthHeaderAsBearerToken(),
      secretOrKey: jwtConfig.secretKey,
      ignoreExpiration: false,
    });
  }

  async validate(payload: JwtPayload) {
    const isExist = await this.sysUserRepository.existsBy({
      userId: payload.userId,
    });
    if (!isExist) {
      throw new UnauthorizedException();
    }
    return payload;
  }
}
