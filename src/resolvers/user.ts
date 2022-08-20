import argon2 from 'argon2';
import { MyContext } from 'src/types';
import { validateRegister } from '../utils/validateRegister';
import {
  Arg,
  Ctx,
  Field,
  FieldResolver,
  Mutation,
  ObjectType,
  Query,
  Resolver,
  Root,
} from 'type-graphql';
import { COOKIE_NAME, FORGET_PASSWORD_PREFIX } from '../constants';
import { User } from '../entities/User';
import { UsernamePasswordInput } from './inputs/UsernamePasswordInput';
import { sendMail } from '../utils/sendEmail';
import { v4 } from 'uuid';
import { AppDataSource } from '../typeorm.config';
import { userInfo } from 'os';
@ObjectType()
class FieldError {
  @Field()
  field: string;
  @Field()
  message: string;
}

@ObjectType()
class UserResponse {
  @Field(() => [FieldError], { nullable: true })
  errors?: FieldError[];
  @Field(() => User, { nullable: true })
  user?: User;
}

@Resolver(User)
export class UserResolver {
  @FieldResolver(() => String)
  email(@Root() user: User, @Ctx() { req }: MyContext) {
    if (req.session.userId === user.id) {
      return user.email;
    }
    return '';
  }

  @Mutation(() => UserResponse)
  async changePassword(
    @Arg('token') token: string,
    @Arg('newPassword') newPassword: string,
    @Ctx() { redis, req }: MyContext
  ): Promise<UserResponse> {
    if (newPassword.length <= 3) {
      return {
        errors: [
          {
            field: 'newPassword',
            message: 'password cant have less than 3 characters',
          },
        ],
      };
    }

    const key = FORGET_PASSWORD_PREFIX + token;

    const userId = await redis.get(key);

    if (!userId) {
      return {
        errors: [
          {
            field: 'token',
            message: 'token expired',
          },
        ],
      };
    }

    const id = parseInt(userId);

    const user = await User.findOne({ where: { id } });

    if (!user) {
      return {
        errors: [
          {
            field: 'user',
            message: 'user not found',
          },
        ],
      };
    }

    await User.update({ id }, { password: await argon2.hash(newPassword) });

    await redis.del(key); //deleting token ,so user cant renew his/her password with pervious token

    req.session.userId = user.id; //login after change password

    return {
      user,
    };
  }

  @Mutation(() => Boolean)
  async forgotPassword(
    @Arg('email') email: string,
    @Ctx() { redis }: MyContext
  ) {
    const user = await User.findOne({ where: { email } });
    if (!user) {
      return true;
    }

    const token = v4();

    await redis.set(
      FORGET_PASSWORD_PREFIX + token,
      user.id,
      'EX',
      1000 * 60 * 60 * 24 * 3
    ); //3days

    sendMail(
      email,
      `<a href='http://localhost:3000/change-password/${token}'>reset password</a>`
    );
    return true;
  }

  @Query(() => UserResponse, { nullable: true })
  async me(@Ctx() { req }: MyContext): Promise<UserResponse | null> {
    if (!req.session.userId) {
      return null;
    }

    const user = await User.findOne({ where: { id: req.session.userId } });

    if (!user) {
      return {
        errors: [{ field: 'username', message: 'user not found' }],
      };
    }
    return {
      user,
    };
  }

  @Mutation(() => UserResponse)
  async register(
    @Arg('options') options: UsernamePasswordInput,
    @Ctx() { req }: MyContext
  ): Promise<UserResponse> {
    const errors = validateRegister(options);

    if (errors) {
      return { errors };
    }

    const hashedPassword = await argon2.hash(options.password);

    // one way to create User
    // const user = User.create({
    // username: options.username,
    // email: options.email,
    // password: hashedPassword,
    // });

    // create user via querybuilder
    let user;

    try {
      const results = await AppDataSource.createQueryBuilder()
        .insert()
        .into(User)
        .values({
          username: options.username,
          email: options.email,
          password: hashedPassword,
        })
        .returning('*')
        .execute();
      // await userInfo.save()

      user = results.raw[0];
    } catch (e) {
      if (e.detail.includes('already exists')) {
        return {
          errors: [{ field: 'username', message: 'username already taken' }],
        };
      }
    }
    return {
      user,
    };
    // req.session.userId = user.id; //log user in after he/she register
  }

  @Mutation(() => UserResponse)
  async login(
    @Arg('usernameOrEmail') usernameOrEmail: string,
    @Arg('password') password: string,
    @Ctx() { req }: MyContext
  ): Promise<UserResponse> {
    const user = await User.findOne(
      usernameOrEmail.includes('@')
        ? {
            where: {
              email: usernameOrEmail.toLowerCase(),
            },
          }
        : {
            where: {
              username: usernameOrEmail.toLowerCase(),
            },
          }
    );

    if (!user) {
      return {
        errors: [
          { field: 'usernameOrEmail', message: "that username doesn't exist" },
        ],
      };
    }

    const valid = await argon2.verify(user.password, password);
    if (!valid) {
      return {
        errors: [
          { field: 'password', message: 'username or password is wrong' },
        ],
      };
    }

    req.session.userId = user.id;

    return {
      user,
    };
  }

  @Mutation(() => Boolean)
  logout(@Ctx() { req, res }: MyContext) {
    return new Promise((resolve) => {
      req.session.destroy((err) => {
        res.clearCookie(COOKIE_NAME);
        if (err) {
          console.log(err);
          resolve(false);
          return;
        }
        resolve(true);
      });
    });
  }
}
