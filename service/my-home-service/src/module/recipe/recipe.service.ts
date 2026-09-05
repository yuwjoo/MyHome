import { BadRequestException, Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { plainToInstance } from 'class-transformer';
import { runInTransaction } from 'typeorm-transactional';
import { JwtPayload } from 'src/types/jwt';
import { RecipeEntity, RecipeMediaStorage } from './entities/recipe.entity';
import { SaveRecipeDto } from './dto/saveRecipe.dto';
import { RecipeMediaDto } from './dto/recipeMedia.dto';
import { RecipeDto } from './dto/recipe.dto';
import { DeleteRecipeDto } from './dto/deleteRecipe.dto';
import { GetRecipeDto } from './dto/getRecipe.dto';
import { PaginationQueryDto } from 'src/common/dto/pagination/paginationQuery.dto';
import { PaginationDataDto } from 'src/common/dto/pagination/paginationData.dto';
import { OssService } from '../oss/oss.service';

@Injectable()
export class RecipeService {
  constructor(
    @InjectRepository(RecipeEntity)
    private readonly recipeRepository: Repository<RecipeEntity>,
    private readonly ossService: OssService,
  ) {}

  /**
   * 将请求媒体列表物化为“纯普通对象”存储结构。
   * 避免响应式/额外字段混入 JSON 列，只保留白名单字段。
   * @param medias 请求媒体列表
   * @return 存储用媒体列表
   */
  private toStorageMedias(medias?: RecipeMediaDto[]): RecipeMediaStorage[] {
    return (medias || []).map((media) => {
      const storage: RecipeMediaStorage = {
        refId: media.refId,
        kind: media.kind,
        name: media.name,
        mimeType: media.mimeType,
        size: media.size,
      };
      if (media.width !== undefined) storage.width = media.width;
      if (media.height !== undefined) storage.height = media.height;
      if (media.duration !== undefined) storage.duration = media.duration;
      return storage;
    });
  }

  /**
   * 创建菜谱
   * @param saveRecipeDto 保存菜谱dto
   * @param user 用户信息
   * @return 菜谱数据
   */
  async createRecipe(
    saveRecipeDto: SaveRecipeDto,
    user: JwtPayload,
  ): Promise<RecipeDto> {
    const storageMedias = this.toStorageMedias(saveRecipeDto.medias);

    return runInTransaction(async () => {
      const recipe = this.recipeRepository.create({
        recipeName: saveRecipeDto.recipeName.trim(),
        note: saveRecipeDto.note?.trim(),
        medias: storageMedias,
        createUser: { userId: user.userId },
      });
      const saved = await this.recipeRepository.save(recipe);
      // 使用oss对象引用（菜谱媒体对外公开访问）
      await this.ossService.batchUseFile(
        storageMedias.map((media) => media.refId),
        'public',
      );

      return plainToInstance(RecipeDto, saved);
    });
  }

  /**
   * 修改菜谱
   * @param saveRecipeDto 保存菜谱dto
   * @param user 用户信息
   * @return 菜谱数据
   */
  async modifyRecipe(
    saveRecipeDto: SaveRecipeDto,
    user: JwtPayload,
  ): Promise<RecipeDto> {
    const recipe = await this.recipeRepository.findOne({
      where: { recipeId: saveRecipeDto.recipeId },
      relations: ['createUser'],
    });

    if (!recipe) {
      throw new BadRequestException('菜谱不存在');
    }
    if (recipe.createUser.userId !== user.userId) {
      throw new BadRequestException('无权限修改');
    }

    const nextStorageMedias = this.toStorageMedias(saveRecipeDto.medias);

    return runInTransaction(async () => {
      const nextRecipe = this.recipeRepository.create({
        ...recipe,
        recipeName: saveRecipeDto.recipeName.trim(),
        note: saveRecipeDto.note?.trim(),
        medias: nextStorageMedias,
      });
      const updated = await this.recipeRepository.save(nextRecipe);

      const originalRefIds = (recipe.medias || []).map((media) => media.refId);
      const nextRefIds = nextStorageMedias.map((media) => media.refId);
      const addRefIds = nextRefIds.filter(
        (refId) => !originalRefIds.includes(refId),
      );
      const removeRefIds = originalRefIds.filter(
        (refId) => !nextRefIds.includes(refId),
      );
      // 新增媒体：使用引用；被移除媒体：删除引用
      await this.ossService.batchUseFile(addRefIds, 'public');
      await this.ossService.batchDeleteFile(removeRefIds);

      return plainToInstance(RecipeDto, updated);
    });
  }

  /**
   * 删除菜谱
   * @param deleteRecipeDto 删除菜谱dto
   * @param user 用户信息
   */
  async deleteRecipe(
    deleteRecipeDto: DeleteRecipeDto,
    user: JwtPayload,
  ): Promise<void> {
    const recipe = await this.recipeRepository.findOne({
      where: { recipeId: deleteRecipeDto.recipeId },
      relations: ['createUser'],
    });

    if (!recipe) {
      throw new BadRequestException('菜谱不存在');
    }
    if (recipe.createUser.userId !== user.userId) {
      throw new BadRequestException('无权限删除');
    }

    await runInTransaction(async () => {
      await this.recipeRepository.remove(recipe);
      // 删除oss对象引用
      await this.ossService.batchDeleteFile(
        (recipe.medias || []).map((media) => media.refId),
      );
    });
  }

  /**
   * 获取菜谱列表
   * @param paginationQueryDto 分页参数
   * @return 菜谱数据列表
   */
  async getRecipeList(
    paginationQueryDto: PaginationQueryDto,
  ): Promise<PaginationDataDto<RecipeDto>> {
    const { pageNum, pageSize, keywords } = paginationQueryDto;

    const query = this.recipeRepository
      .createQueryBuilder('recipe')
      .leftJoinAndSelect('recipe.createUser', 'createUser')
      .orderBy('recipe.updatedAt', 'DESC');

    if (keywords) {
      query.andWhere(
        '(recipe.recipeName LIKE :keywords OR recipe.note LIKE :keywords)',
        {
          keywords: `%${keywords}%`,
        },
      );
    }

    const [list, total] = await query
      .skip((pageNum - 1) * pageSize)
      .take(pageSize)
      .getManyAndCount();

    const records = list.map((recipe) => plainToInstance(RecipeDto, recipe));

    return {
      pageNum,
      pageSize,
      total,
      records,
    };
  }

  /**
   * 获取菜谱详情
   * @param getRecipeDto 获取菜谱dto
   * @return 菜谱数据
   */
  async getRecipe(getRecipeDto: GetRecipeDto): Promise<RecipeDto> {
    const recipe = await this.recipeRepository.findOne({
      where: { recipeId: getRecipeDto.recipeId },
      relations: ['createUser'],
    });

    if (!recipe) {
      throw new BadRequestException('菜谱不存在');
    }

    return plainToInstance(RecipeDto, recipe);
  }
}
