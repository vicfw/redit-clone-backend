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

  @Query(() => PaginatedPosts)
  async posts(
    @Arg('limit', () => Int) limit: number,
    @Arg('cursor', () => String, { nullable: true }) cursor: string | null
  ): Promise<PaginatedPosts> {
    const realLimit = Math.min(50, limit);
    const realLimitPlusOne = realLimit + 1;

    const replacement: any[] = [realLimitPlusOne];

    if (cursor) {
      replacement.push(new Date(parseInt(cursor)));
    }

    const posts = await AppDataSource.query(
      `
      SELECT p.*, 
      json_build_object(
      'id', u.id,  
      'username', u.username,
      'email', u.email
      ) creator
      from post p
      inner join public.user u on u.id = p."creatorId"
      ${cursor ? `where p."createdAt" < $2` : ''}
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

    console.log(posts, 'posts');

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
