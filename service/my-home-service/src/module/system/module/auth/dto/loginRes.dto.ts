import { ApiProperty, ApiSchema, PickType } from '@nestjs/swagger';
import { SysUserEntity } from '../entities/sysUser.entity';

@ApiSchema({ name: 'system-auth-LoginUserDto' })
class LoginUserDto extends PickType(SysUserEntity, [
  'userAccount',
  'userName',
  'avatarUrl',
]) {}

@ApiSchema({ name: 'system-auth-LoginResDto' })
export class LoginResDto {
  @ApiProperty({
    description: 'token凭证',
  })
  token: string;

  @ApiProperty({
    description: '用户信息',
  })
  user: LoginUserDto;
}
