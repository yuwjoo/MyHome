import { ApiProperty, ApiSchema } from '@nestjs/swagger';

@ApiSchema({ name: 'oss-UploadFileResDto-SignData' })
export class SignData {
  @ApiProperty({
    description: '签名url',
  })
  signUrl?: string;

  @ApiProperty({
    description: '签名请求头',
  })
  signHeaders?: Record<string, string | number | boolean>;
}

@ApiSchema({ name: 'oss-UploadFileResDto' })
export class UploadFileResDto {
  @ApiProperty({
    description: '是否已上传',
  })
  isUploaded: boolean;

  @ApiProperty({
    description: '签名数据',
  })
  signData?: SignData;

  @ApiProperty({
    description: 'oss object引用id',
  })
  ossObjectRefId?: string;
}
