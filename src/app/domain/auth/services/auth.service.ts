import {
  Injectable,
  ConflictException,
  NotFoundException,
  UnauthorizedException,
  BadRequestException,
  ForbiddenException,
  Scope,
} from '@nestjs/common';
import { TokenService } from 'src/app/shared/token/token.service';
import { ParamsSignUp } from '../../interfaces/auth.interface';
import { EntityManager } from 'typeorm';
import { User, UserActive } from 'src/app/entities/user.entity';
import { Token } from 'src/app/entities/token.entity';
import { reverseSlug, slug } from 'src/app/utils/slug.util';
import { SigninDto } from '../dtos/signin.dto';
import { ResponseAuth, ResponseAuthRaw } from '../dtos/response.dto';
import { MailService } from 'src/app/shared/mail/mail.service';
import { encrypt } from 'src/app/utils/crypto.util';
import { ConfigService } from '@nestjs/config';
import { TokenPayload } from 'src/app/shared/interfaces/token.interface';
import { comparePassword } from 'src/app/utils/hash.util';
import { UserService } from '../../user/services/user.service';
import { generateUsernameUnique } from 'src/app/utils/generate';
import { CacheService } from 'src/app/shared/cache/cache.service';

@Injectable({ scope: Scope.DEFAULT })
export class AuthService {
  constructor(
    private readonly tokenService: TokenService,
    private readonly entityManager: EntityManager,
    private readonly mailService: MailService,
    private readonly configService: ConfigService,
    private readonly userService: UserService,
    private readonly cacheService: CacheService,
  ) {}

  // private async lazyModule() {
  //   if (!this.mailModuleRef) {
  //     const { MailModule } = await import('../../../shared/mail/mail.module');
  //     this.mailModuleRef = await this.lazyModuleLoader.load(() => MailModule);
  //   }

  //   const { MailService } = await import('../../../shared/mail/mail.service');
  //   const mailService = this.mailModuleRef.get(MailService);
  //   return { mailService };
  // }

  public async signup({
    username,
    email,
    password,
  }: ParamsSignUp): Promise<string> {
    try {
      const findUser = await this.userService.getUserByUsernameOrEmail(
        { email, username },
        ['user.userId'],
      );

      if (findUser) {
        throw new ConflictException('Username or email already exists');
      }

      try {
        await this.entityManager.transaction(async (entityManager) => {
          const createUser = entityManager.create(User, {
            username: slug(username),
            email,
            password,
          });

          const verificationToken = await this.generateVerificationToken(email);
          await this.mailService.sendVerifyUser(email, verificationToken);
          await entityManager.save(createUser);
        });
      } catch (error) {
        throw error;
      }

      return 'user created successfully';
    } catch (error) {
      throw error;
    }
  }

  public async signin({ email, password, username }: SigninDto) {
    try {
      const usernameSlug = username ? slug(username) : undefined;
      const user = await this.userService.getUserByUsernameOrEmail({
        email,
        username: usernameSlug,
      });

      if (!user) {
        throw new NotFoundException('User not found');
      }

      await this.validateUser(user, password);

      const accessToken = await this.generateAccessToken(user);

      if (user.token) {
        await this.updateUserAccessToken(user, accessToken);
      } else {
        await this.createUserToken(user, accessToken);
      }

      return this.createResponseAuth(user, accessToken);
    } catch (error) {
      throw error;
    }
  }

  public async resetPassword(email: string) {
    await this.processEmailRequest(
      email,
      'sendResetPassword',
      'Password reset request is in cooldown',
    );
  }

  public async resendUserVerification(email: string) {
    await this.processEmailRequest(
      email,
      'sendVerifyUser',
      'Password reset request is in cooldown',
      true,
    );
  }

  private async processEmailRequest(
    email: string,
    emailType: 'sendResetPassword' | 'sendVerifyUser',
    cooldownMessage: string,
    isVerification = false,
  ) {
    try {
      const user = await this.userService.getUserByUsernameOrEmail({ email });

      if (!user) {
        throw new NotFoundException('User not found');
      }

      const cooldownKey = `${emailType}:${email}`;
      const cooldownExists = await this.cacheService.exists(cooldownKey);

      if (cooldownExists) {
        throw new BadRequestException(cooldownMessage);
      }

      if (
        (isVerification && user.active === UserActive.ACTIVE) ||
        (!isVerification && user.active === UserActive.INACTIVE)
      ) {
        const errorMessage = isVerification
          ? 'User is active'
          : 'User is inactive';
        throw new BadRequestException(errorMessage);
      }

      await this.cacheService.set(cooldownKey, 'cooldown', 180);
      const verificationToken = await this.generateVerificationToken(email);

      switch (emailType) {
        case 'sendResetPassword':
          await this.mailService.sendResetPassword(email, verificationToken);
          break;
        case 'sendVerifyUser':
          await this.mailService.sendVerifyUser(email, verificationToken);
          break;
      }
    } catch (error) {
      throw error;
    }
  }

  public async googleLogin(data: any) {
    try {
      const findUser = await this.userService.getUserByUsernameOrEmail({
        email: data.email,
      });

      if (findUser) {
        const accessToken = await this.generateAccessToken(findUser);
        if (findUser.token) {
          await this.updateUserAccessToken(findUser, accessToken);
        } else {
          await this.createUserToken(findUser, accessToken);
        }

        return this.createResponseAuth(findUser, accessToken);
      }

      const dataUser = await this.entityManager.transaction(
        async (entityManager) => {
          const username = generateUsernameUnique(data.email.split('@')[0]);
          const createUser = entityManager.create(User, {
            email: data.email,
            active: UserActive.ACTIVE,
            password: `Password: ${username}`,
            username,
          });

          const user = await this.entityManager.save(createUser);
          const accessToken = await this.generateAccessToken(user);
          const token = this.entityManager.create(Token, {
            accessToken,
            user,
          });
          await this.entityManager.save(token);
          return this.createResponseAuth(user, accessToken);
        },
      );

      return dataUser;
    } catch (error) {
      throw error;
    }
  }

  public async me(userId: string) {
    try {
      const cacheKey = `me:${userId}`;
      const cachedData = await this.cacheService.get<ResponseAuthRaw>(cacheKey);
      if (cachedData) {
        return new ResponseAuthRaw(cachedData);
      }
      const user = await this.userService.getUser(userId, [
        'user.userId',
        'user.username',
        'user.email',
        'user.role',
        'user.active',
        'user.createdAt',
        'user.updatedAt',
      ]);

      if (!user) {
        throw new NotFoundException('user not found');
      }

      const data = new ResponseAuthRaw({
        ...user,
        username: reverseSlug(user.username),
        fullName: user?.profile?.fullName,
        gender: user?.profile?.gender,
        image: user?.profile?.photo?.url,
      });

      await this.cacheService.set(cacheKey, data, 60);

      return data;
    } catch (error) {
      if (error instanceof UnauthorizedException) {
        throw new UnauthorizedException('token invalid');
      }

      if (error instanceof NotFoundException) {
        throw error;
      }

      throw new BadRequestException(error.message);
    }
  }

  public async logout(token: string): Promise<void> {
    try {
      const payload = await this.tokenService.verifyToken(token);
      await this.entityManager.update(
        Token,
        { user: payload.userId, accessToken: token },
        { accessToken: null },
      );
    } catch (error) {
      throw error;
    }
  }

  private async validateUser(user: User, password: string) {
    const isMatch = await comparePassword(password, user.password);
    if (!isMatch) {
      throw new UnauthorizedException('Password not match');
    }
    if (user.active === UserActive.INACTIVE) {
      throw new ForbiddenException('User not active');
    }
  }

  private async generateAccessToken({ role, userId }: TokenPayload) {
    const { accessToken } = await this.tokenService.generateToken({
      role,
      userId,
    });
    return accessToken;
  }

  private async updateUserAccessToken(
    { userId }: TokenPayload,
    accessToken: string,
  ) {
    await this.entityManager.update(Token, { user: userId }, { accessToken });
  }

  private async createUserToken(user: User, accessToken: string) {
    const token = this.entityManager.create(Token, {
      accessToken,
      user,
    });
    await this.entityManager.save(token);
  }

  private async generateVerificationToken(email: string) {
    const expirationTime = new Date().getTime() + 300000;
    const payload = {
      email,
      expiredAt: expirationTime,
    };
    const data = JSON.stringify(payload);
    const encryptedData = encrypt(
      data,
      this.configService.get('chipher.secret'),
    );
    return encryptedData;
  }

  private createResponseAuth(user: User, accessToken: string) {
    return new ResponseAuth({
      ...user,
      token: accessToken,
      username: reverseSlug(user.username),
    });
  }
}
