import { Post } from '../entities/Post';
import {
  Arg,
  Ctx,
  Field,
  FieldResolver,
  Int,
  Mutation,
  ObjectType,
  Query,
  Resolver,
  Root,
  UseMiddleware,
} from 'type-graphql';
import { MyContext } from 'src/types';
import { PostInput } from './inputs/PostInput';
import { isAuth } from '../middleware/isAuth';
import { AppDataSource } from '../typeorm.config';
import { Updoot } from '../entities/Updoot';
import { toNamespacedPath } from 'path';

@ObjectType()
class PaginatedPosts {
  @Field(() => [Post])
  posts: Post[];

  @Field()
  hasMore: boolean;
}

@Resolver(Post)
export class PostResolver {
  @FieldResolver(() => String)
  textSnippet(@Root() root: Post) {
    return root.text.slice(0, 50);
  }

  @Mutation(() => Boolean)
  @UseMiddleware(isAuth)
  async vote(
    @Arg('postId', () => Int) postId: number,
    @Arg('value', () => Int) value: number,
    @Ctx() { req }: MyContext
  ) {
    const isUpdoot = value !== -1;
    const { userId } = req.session;
    const realValue = isUpdoot ? 1 : -1;

    const updoot = await Updoot.findOne({ where: { postId, userId } });

    if (updoot && updoot.value !== realValue) {
      //the user has voted on the post before
      await AppDataSource.transaction(async (tm) => {
        await tm.query(
          `
          update updoot
          set value = $1
          where "postId" = $2 and "userId" = $3
        `,
          [realValue, postId, userId]
        );

        await tm.query(
          `
        update post 
        set points = points + $1
        where id = $2;
        `,
          [2 * realValue, postId]
        );
      });
    } else if (!updoot) {
      // has never voted
      await AppDataSource.transaction(async (tm) => {
        await tm.query(
          `
            insert into updoot ("userId","postId",value)
            values (${userId},${postId},${realValue});
          `
        );

        await tm.query(`
        update post 
        set points = points + ${realValue}
        where id = ${postId};
        `);
      });
    }

    return true;
  }

  @Query(() => PaginatedPosts)
  async posts(
    @Arg('limit', () => Int) limit: number,
    @Arg('cursor', () => String, { nullable: true }) cursor: string | null,
    @Ctx() { req }: MyContext
  ): Promise<PaginatedPosts> {
    const realLimit = Math.min(50, limit);
    const realLimitPlusOne = realLimit + 1;

    const replacement: any[] = [realLimitPlusOne];

    if (req.session.userId) {
      replacement.push(req.session.userId);
    }
    let cursorIdx = 3;
    if (cursor) {
      replacement.push(new Date(parseInt(cursor)));
      cursorIdx = replacement.length;
    }
    console.log(req.session.userId, 'req.session.userId'); // the issue

    const posts = await AppDataSource.query(
      `
      SELECT p.*, 
      json_build_object( 
      'id', u.id,  
      'username', u.username,
      'email', u.email
      ) creator,
      ${
        req.session.userId
          ? '(select value from updoot where "userId" = $2 and "postId" = p.id) "voteStatus"'
          : 'null as "voteStatus"'
      } 
      from post p
      inner join public.user u on u.id = p."creatorId"
      ${cursor ? `where p."createdAt" < $${cursorIdx}` : ''}
      order by p."createdAt" DESC
      limit $1 
    `,
      replacement
    );

    // const qb = await AppDataSource.getRepository(Post)
    //   .createQueryBuilder('p')
    //   .leftJoinAndSelect('p.creator', 'user')
    //   .orderBy('p."createdAt"', 'DESC')
    //   .take(realLimitPlusOne);

    // if (cursor) {
    //   qb.where('p."createdAt" < :cursor', {
    //     cursor: new Date(parseInt(cursor)),
    //   });
    // }

    // const posts = await qb.getMany();

    return {
      posts: posts.slice(0, realLimit),
      hasMore: posts.length === realLimitPlusOne,
    };
  }

  @Query(() => Post, { nullable: true })
  post(@Arg('id', () => Int) id: number): Promise<Post | null> {
    return Post.findOne({ where: { id } });
  }

  @Mutation(() => Post)
  @UseMiddleware(isAuth)
  async createPost(
    @Arg('input') input: PostInput,
    @Ctx() { req }: MyContext
  ): Promise<Post> {
    return Post.create({
      ...input,
      creatorId: req.session.userId,
    }).save();
  }

  @Mutation(() => Post, { nullable: true })
  async updatePost(
    @Arg('title', () => String, { nullable: true }) title: string,
    @Arg('id') id: number
  ): Promise<Post | null> {
    const post = await Post.findOne({ where: { id } });
    if (!post) return null;
    if (typeof title !== 'undefined') {
      post.title = title;
      await Post.update({ id }, { title });
    }
    return post;
  }

  @Mutation(() => Boolean)
  async deletePost(@Arg('id') id: number): Promise<Boolean> {
    try {
      await Post.delete(id);
      return true;
    } catch {
      return false;
    }
  }
}
