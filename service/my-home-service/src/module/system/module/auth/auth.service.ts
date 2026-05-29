import {
  Injectable,
  ConflictException,
  UnauthorizedException,
  BadRequestException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { JwtService } from '@nestjs/jwt';
import * as bcrypt from 'bcrypt';
import { RegisterDto } from './dto/register.dto';
import { LoginDto } from './dto/login.dto';
import { UpdateUserInfoDto } from './dto/updateUserInfo.dto';
import { ChangePasswordDto } from './dto/changePassword.dto';
import { SysUserEntity } from './entities/sysUser.entity';
import { LoginResDto } from './dto/loginRes.dto';
import { JwtPayload } from 'src/types/jwt';
import { runInTransaction } from 'typeorm-transactional';
import { OssService } from 'src/module/oss/oss.service';

@Injectable()
export class AuthService {
  constructor(
    @InjectRepository(SysUserEntity)
    private readonly sysUserRepository: Repository<SysUserEntity>,
    private readonly jwtService: JwtService,
    private readonly ossService: OssService,
  ) {}

  /**
   * 用户注册
   * @param registerDto 注册信息
   * @return 注册成功的用户信息
   */
  async register(registerDto: RegisterDto): Promise<void> {
    // 检查账号是否已存在
    const isExist = await this.sysUserRepository.existsBy({
      userAccount: registerDto.userAccount,
    });
    if (isExist) {
      throw new ConflictException('账号已存在');
    }
    // hash编码密码
    const hashedPassword = await bcrypt.hash(registerDto.password, 10);

    const user = this.sysUserRepository.create({
      userAccount: registerDto.userAccount,
      userName: registerDto.userName,
      passwordHash: hashedPassword,
      avatarUrl: registerDto.avatarUrl,
    });

    runInTransaction(async () => {
      if (registerDto.avatarUrl) {
        await this.ossService.useFile(registerDto.avatarUrl, 'public');
      }
      await this.sysUserRepository.insert(user);
    });
  }

  /**
   * 用户登录
   * @param loginDto 登录信息
   * @return 登录结果
   */
  async login(loginDto: LoginDto): Promise<LoginResDto> {
    // 查找用户
    const user = await this.sysUserRepository.findOne({
      select: [
        'userId',
        'passwordHash',
        'userAccount',
        'userName',
        'avatarUrl',
      ],
      where: {
        userAccount: loginDto.userAccount,
      },
    });
    // 验证用户和密码
    if (
      !user ||
      !(await bcrypt.compare(loginDto.password, user.passwordHash))
    ) {
      throw new UnauthorizedException('账号或密码错误');
    }
    // 生成JWT令牌
    const token = this.jwtService.sign<JwtPayload>({
      userId: user.userId,
      userAccount: user.userAccount,
    });

    return {
      token,
      user: {
        userAccount: user.userAccount,
        userName: user.userName,
        avatarUrl: user.avatarUrl,
      },
    };
  }

  /**
   * 修改用户信息
   * @param updateUserInfoDto 要修改的用户信息
   * @param user 当前登录用户
   */
  async updateUserInfo(
    updateUserInfoDto: UpdateUserInfoDto,
    user: JwtPayload,
  ): Promise<void> {
    const { userName, avatarUrl } = updateUserInfoDto;

    // 构建更新数据
    const updateData: Partial<SysUserEntity> = {};
    if (userName !== undefined) {
      updateData.userName = userName;
    }
    if (avatarUrl !== undefined) {
      updateData.avatarUrl = avatarUrl;
    }

    // 没有要更新的字段则直接返回
    if (Object.keys(updateData).length === 0) {
      return;
    }

    await runInTransaction(async () => {
      if (avatarUrl !== undefined) {
        await this.ossService.useFile(avatarUrl, 'public');
      }
      await this.sysUserRepository.update(user.userId, updateData);
    });
  }

  /**
   * 修改密码
   * @param changePasswordDto 旧密码 + 新密码
   * @param user 当前登录用户
   */
  async changePassword(
    changePasswordDto: ChangePasswordDto,
    user: JwtPayload,
  ): Promise<void> {
    const { oldPassword, newPassword } = changePasswordDto;

    // 新旧密码不能相同
    if (oldPassword === newPassword) {
      throw new BadRequestException('新密码不能与旧密码相同');
    }

    // 查找用户（手动 select passwordHash）
    const userEntity = await this.sysUserRepository.findOne({
      select: ['userId', 'passwordHash'],
      where: { userId: user.userId },
    });

    if (!userEntity) {
      throw new UnauthorizedException('用户不存在');
    }

    // 验证旧密码
    const isMatch = await bcrypt.compare(oldPassword, userEntity.passwordHash);
    if (!isMatch) {
      throw new BadRequestException('旧密码错误');
    }

    // 哈希新密码并更新
    const hashedPassword = await bcrypt.hash(newPassword, 10);
    await this.sysUserRepository.update(user.userId, {
      passwordHash: hashedPassword,
    });
  }
}
