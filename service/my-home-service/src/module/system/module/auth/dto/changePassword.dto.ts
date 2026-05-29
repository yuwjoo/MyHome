import { ApiProperty, ApiSchema } from '@nestjs/swagger';
import { IsString, MinLength } from 'class-validator';

@ApiSchema({ name: 'system-auth-ChangePasswordDto' })
export class ChangePasswordDto {
  @ApiProperty({
    description: '旧密码',
  })
  @IsString()
  oldPassword: string;

  @ApiProperty({
    description: '新密码',
  })
  @IsString()
  @MinLength(6)
  newPassword: string;
}
