import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { RecipeController } from './recipe.controller';
import { RecipeService } from './recipe.service';
import { RecipeEntity } from './entities/recipe.entity';
import { SysUserEntity } from '../system/module/auth/entities/sysUser.entity';
import { OssModule } from '../oss/oss.module';

@Module({
  imports: [TypeOrmModule.forFeature([RecipeEntity, SysUserEntity]), OssModule],
  controllers: [RecipeController],
  providers: [RecipeService],
})
export class RecipeModule {}
