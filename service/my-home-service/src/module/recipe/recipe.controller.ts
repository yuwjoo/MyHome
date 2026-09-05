import { Body, Controller, Get, Post, Query } from '@nestjs/common';
import { ApiOperation, ApiTags } from '@nestjs/swagger';
import { RecipeService } from './recipe.service';
import { SaveRecipeDto } from './dto/saveRecipe.dto';
import { RecipeDto } from './dto/recipe.dto';
import { DeleteRecipeDto } from './dto/deleteRecipe.dto';
import { GetRecipeDto } from './dto/getRecipe.dto';
import { User } from 'src/common/decorators/user.decorator';
import { JwtPayload } from 'src/types/jwt';
import { PaginationQueryDto } from 'src/common/dto/pagination/paginationQuery.dto';
import { PaginationDataDto } from 'src/common/dto/pagination/paginationData.dto';

@ApiTags('菜谱')
@Controller('recipe')
export class RecipeController {
  constructor(private readonly recipeService: RecipeService) {}

  @ApiOperation({
    summary: '保存菜谱',
  })
  @Post('saveRecipe')
  saveRecipe(
    @Body() saveRecipeDto: SaveRecipeDto,
    @User() user: JwtPayload,
  ): Promise<RecipeDto> {
    if (saveRecipeDto.recipeId) {
      return this.recipeService.modifyRecipe(saveRecipeDto, user);
    } else {
      return this.recipeService.createRecipe(saveRecipeDto, user);
    }
  }

  @ApiOperation({
    summary: '删除菜谱',
  })
  @Post('deleteRecipe')
  deleteRecipe(
    @Body() deleteRecipeDto: DeleteRecipeDto,
    @User() user: JwtPayload,
  ): Promise<void> {
    return this.recipeService.deleteRecipe(deleteRecipeDto, user);
  }

  @ApiOperation({
    summary: '获取菜谱列表',
  })
  @Get('getRecipeList')
  getRecipeList(
    @Query() paginationQueryDto: PaginationQueryDto,
  ): Promise<PaginationDataDto<RecipeDto>> {
    return this.recipeService.getRecipeList(paginationQueryDto);
  }

  @ApiOperation({
    summary: '获取菜谱详情',
  })
  @Get('getRecipe')
  getRecipe(@Query() getRecipeDto: GetRecipeDto): Promise<RecipeDto> {
    return this.recipeService.getRecipe(getRecipeDto);
  }
}
