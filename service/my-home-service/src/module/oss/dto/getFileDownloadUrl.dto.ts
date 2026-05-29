import { ApiProperty, ApiSchema } from '@nestjs/swagger';
import { IsString } from 'class-validator';

@ApiSchema({ name: 'oss-GetFileDownloadUrlDto' })
export class GetFileDownloadUrlDto {
  @ApiProperty({
    description: 'oss object引用id',
  })
  @IsString()
  ossObjectRefId: string;
}
