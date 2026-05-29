import { ApiProperty, ApiSchema } from '@nestjs/swagger';
import { IsOptional, IsString } from 'class-validator';

@ApiSchema({ name: 'system-auth-RegisterDto' })
export class RegisterDto {
  @ApiProperty({
    description: '用户账号',
  })
  @IsString()
  userAccount: string;

  @ApiProperty({
    description: '密码',
  })
  @IsString()
  password: string;

  @ApiProperty({
    description: '用户名',
  })
  @IsString()
  userName: string;

  @ApiProperty({
    description: '头像url',
  })
  @IsString()
  @IsOptional()
  avatarUrl?: string;
}
