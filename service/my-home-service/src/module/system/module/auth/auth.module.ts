import { Module } from '@nestjs/common';
import { JwtModule } from '@nestjs/jwt';
import { PassportModule } from '@nestjs/passport';
import { TypeOrmModule } from '@nestjs/typeorm';
import { AuthService } from './auth.service';
import { AuthController } from './auth.controller';
import { JwtStrategy } from './common/jwt.strategy';
import { SysUserEntity } from './entities/sysUser.entity';
import jwtConfig, { JwtConfig } from 'src/config/jwt.config';
import { OssModule } from 'src/module/oss/oss.module';

@Module({
  imports: [
    TypeOrmModule.forFeature([SysUserEntity]),
    PassportModule.register({ defaultStrategy: 'jwt' }),
    JwtModule.registerAsync({
      inject: [jwtConfig.KEY],
      useFactory: (jwtConfig: JwtConfig) => ({
        secret: jwtConfig.secretKey,
        signOptions: {
          expiresIn: jwtConfig.expirationTime,
        },
      }),
    }),
    OssModule,
  ],
  controllers: [AuthController],
  providers: [AuthService, JwtStrategy],
})
export class AuthModule {}
