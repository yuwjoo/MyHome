import { ApiProperty, ApiSchema } from '@nestjs/swagger';
import { IsNumber, IsString, Min } from 'class-validator';

@ApiSchema({ name: 'cloudDisk-CreateShareLinkDto' })
export class CreateShareLinkDto {
  @ApiProperty({
    description: '文件路径',
  })
  @IsString()
  filePath: string;

  @ApiProperty({
    description: '过期时间（秒）',
    minimum: 1,
  })
  @IsNumber()
  @Min(1)
  expiresIn: number;
}
