import { ApiProperty, ApiSchema } from '@nestjs/swagger';
import { IsOptional, IsString } from 'class-validator';

@ApiSchema({ name: 'system-auth-UpdateUserInfoDto' })
export class UpdateUserInfoDto {
  @ApiProperty({
    description: '用户名',
    required: false,
  })
  @IsString()
  @IsOptional()
  userName?: string;

  @ApiProperty({
    description: '头像url',
    required: false,
  })
  @IsString()
  @IsOptional()
  avatarUrl?: string;
}
