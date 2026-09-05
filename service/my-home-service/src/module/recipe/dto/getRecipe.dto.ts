import { ApiProperty, ApiSchema } from '@nestjs/swagger';
import { IsString } from 'class-validator';

@ApiSchema({ name: 'recipe-GetRecipeDto' })
export class GetRecipeDto {
  @ApiProperty({
    description: '菜谱id',
  })
  @IsString()
  recipeId: string;
}
