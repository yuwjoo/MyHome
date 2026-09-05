import { ApiProperty, ApiSchema } from '@nestjs/swagger';
import { Type } from 'class-transformer';
import {
  IsOptional,
  IsString,
  MaxLength,
  ValidateNested,
} from 'class-validator';
import { RecipeMediaDto } from './recipeMedia.dto';

@ApiSchema({ name: 'recipe-SaveRecipeDto' })
export class SaveRecipeDto {
  @ApiProperty({
    description: '菜谱id（编辑时必传，新建时不传）',
    required: false,
  })
  @IsOptional()
  @IsString()
  recipeId?: string;

  @ApiProperty({
    description: '菜谱名称',
  })
  @IsString()
  @MaxLength(100)
  recipeName: string;

  @ApiProperty({
    description: '备注说明',
    required: false,
  })
  @IsOptional()
  @IsString()
  @MaxLength(1000)
  note?: string;

  @ApiProperty({
    description: '媒体元信息列表',
    type: [RecipeMediaDto],
    required: false,
  })
  @IsOptional()
  @ValidateNested({ each: true })
  @Type(() => RecipeMediaDto)
  medias?: RecipeMediaDto[];
}
