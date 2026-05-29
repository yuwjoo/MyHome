import { Controller, Post, Body } from '@nestjs/common';
import { ApiTags, ApiOperation } from '@nestjs/swagger';
import { AuthService } from './auth.service';
import { RegisterDto } from './dto/register.dto';
import { LoginDto } from './dto/login.dto';
import { LoginResDto } from './dto/loginRes.dto';
import { UpdateUserInfoDto } from './dto/updateUserInfo.dto';
import { ChangePasswordDto } from './dto/changePassword.dto';
import { Public } from 'src/common/decorators/public.decorator';
import { User } from 'src/common/decorators/user.decorator';
import { JwtPayload } from 'src/types/jwt';

@ApiTags('鉴权')
@Controller('system/auth')
export class AuthController {
  constructor(private readonly authService: AuthService) {}

  @Public()
  @ApiOperation({
    summary: '注册新用户',
  })
  @Post('register')
  async register(@Body() registerDto: RegisterDto): Promise<void> {
    return this.authService.register(registerDto);
  }

  @Public()
  @ApiOperation({
    summary: '用户登录',
  })
  @Post('login')
  async login(@Body() loginDto: LoginDto): Promise<LoginResDto> {
    return this.authService.login(loginDto);
  }

  @ApiOperation({
    summary: '修改用户信息',
  })
  @Post('updateUserInfo')
  async updateUserInfo(
    @Body() updateUserInfoDto: UpdateUserInfoDto,
    @User() user: JwtPayload,
  ): Promise<void> {
    return this.authService.updateUserInfo(updateUserInfoDto, user);
  }

  @ApiOperation({
    summary: '修改密码',
  })
  @Post('changePassword')
  async changePassword(
    @Body() changePasswordDto: ChangePasswordDto,
    @User() user: JwtPayload,
  ): Promise<void> {
    return this.authService.changePassword(changePasswordDto, user);
  }
}
