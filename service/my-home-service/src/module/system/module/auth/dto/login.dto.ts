import { ApiProperty, ApiSchema } from '@nestjs/swagger';
import { IsString } from 'class-validator';

@ApiSchema({ name: 'system-auth-LoginDto' })
export class LoginDto {
  @ApiProperty({
    description: '账号',
  })
  @IsString()
  userAccount: string;

  @ApiProperty({
    description: '密码',
  })
  @IsString()
  password: string;
}
