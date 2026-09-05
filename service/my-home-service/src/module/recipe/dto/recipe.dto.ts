import { ApiProperty, ApiSchema } from '@nestjs/swagger';
import { Expose, Transform } from 'class-transformer';
import { RecipeMediaDto } from './recipeMedia.dto';

@ApiSchema({ name: 'recipe-CreateUserDto' })
export class RecipeCreateUserDto {
  @ApiProperty({
    description: '用户id',
  })
  userId: number;

  @ApiProperty({
    description: '用户账号',
  })
  userAccount: string;

  @ApiProperty({
    description: '用户名称',
  })
  userName: string;
}

@ApiSchema({ name: 'recipe-RecipeDto' })
export class RecipeDto {
  @ApiProperty({
    description: '菜谱id',
  })
  recipeId: string;

  @ApiProperty({
    description: '菜谱名称',
  })
  recipeName: string;

  @ApiProperty({
    description: '备注说明',
    nullable: true,
  })
  note?: string;

  @ApiProperty({
    description: '媒体元信息列表',
    type: [RecipeMediaDto],
    nullable: true,
  })
  medias?: RecipeMediaDto[];

  @ApiProperty({
    description: '创建时间戳',
  })
  @Expose({ name: 'createdAt' })
  @Transform(({ value }) => new Date(value).getTime())
  createdTime: number;

  @ApiProperty({
    description: '更新时间戳',
  })
  @Expose({ name: 'updatedAt' })
  @Transform(({ value }) => new Date(value).getTime())
  updatedTime: number;

  @ApiProperty({
    description: '创建用户信息',
  })
  createUser: RecipeCreateUserDto;
}
