import { ApiProperty, ApiSchema } from '@nestjs/swagger';
import { IsString } from 'class-validator';

@ApiSchema({ name: 'recipe-DeleteRecipeDto' })
export class DeleteRecipeDto {
  @ApiProperty({
    description: '菜谱id',
  })
  @IsString()
  recipeId: string;
}
