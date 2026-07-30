import { ConflictException, ForbiddenException, Injectable, NotFoundException, Inject } from '@nestjs/common';
import { PostRepository } from './post.repository';
import { CreatePostDto } from './dto/create-post.dto';
import { UpdatePostDto } from './dto/update-post.dto';
import { GetPostsDto } from './dto/get-posts.dto';
import { S3clientService } from '../infra/s3client/s3client.service';
import { Post, PostVote } from '@prisma/client';
import { WINSTON_MODULE_PROVIDER } from 'nest-winston';
import { Logger as WinstonLogger } from 'winston';
import { ForumRepository } from '../forums/forum.repository';
import { ImageAssetRepository } from './image-asset.repository';
import { ImageAssetService } from './image-asset.service';
import { PrismaService } from '../infra/prisma/prisma.service';
import { PostVoteRepository } from './post-vote.repository';
import { ScrapRepository } from './scrap.repository';
import { CommentRepository } from '../comments/comment.repository';

@Injectable()
export class PostsService {
  constructor(
    @Inject(WINSTON_MODULE_PROVIDER)
    private readonly logger: WinstonLogger,
    private readonly forumRepository: ForumRepository,
    private readonly postRepository: PostRepository,
    private readonly commentRepository: CommentRepository,
    private readonly s3ClientService: S3clientService,
    private readonly imageAssetService: ImageAssetService,
    private readonly imageAssetRepository: ImageAssetRepository,
    private readonly postVoteRepository: PostVoteRepository,
    private readonly scrapRepository: ScrapRepository,
    private readonly prisma: PrismaService,
  ) {}

  async addPost(userId: number, createPostDto: CreatePostDto, files: Express.Multer.File[]): Promise<Post> {
    const { forumId, title, content } = createPostDto;
    this.logger.info('addPost requested', {
      context: PostsService.name,
      userId,
      forumId,
      fileCount: files?.length ?? 0,
    });

    const forum = await this.forumRepository.findByForumId(forumId)
    if (!forum) {
      this.logger.warn('addPost failed: forum not found', {
        context: PostsService.name,
        userId,
        forumId,
      });
      throw new NotFoundException('Forum not found');
    }
    // try {
    //   return await this.postRepository.createPost({
    //     title,
    //     content,
    //     user: { connect: { id: userId } },
    //     forum: { connect: { id: forumId } },
    //   });
    // } catch (error) {
    //   if (error.code === 'P2025') {
    //     throw new NotFoundException('Forum not found');
    //   }
    //   throw error;
    // }
    const createdPost = await this.postRepository.createPost({
      title,
      content,
      user: { connect: { id: userId } },
      forum: { connect: { id: forumId } },
    });

    if (files.length > 0) {
      const uploadedImages = await this.s3ClientService.uploadFiles(files, userId);
      await this.imageAssetRepository.createMany(
        uploadedImages.files.map((img) => ({
          postId: createdPost.id,
          key: img.key,
          url: img.url,
        })),
      );
      this.logger.info('addPost images uploaded', {
        context: PostsService.name,
        postId: createdPost.id,
        userId,
        uploadedCount: uploadedImages.files.length,
      });
    }

    this.logger.info('addPost completed', {
      context: PostsService.name,
      postId: createdPost.id,
      userId,
      forumId,
    });

    return createdPost;
  }

  async getPosts(getPostsDto: GetPostsDto): Promise<Post[]> {
    const { forumId, page, limit } = getPostsDto;
    this.logger.debug('getPosts requested', {
      context: PostsService.name,
      forumId,
      page,
      limit,
    });
    return await this.postRepository.findPostsByForumId(forumId, page, limit)
  }

  async getPostById(postId: number, userId?: number): Promise<Post & { isScrapped: boolean }> {
    this.logger.debug('getPostById requested', {
      context: PostsService.name,
      postId,
      userId,
    });

    const post = await this.postRepository.findPostByPostId(postId)
    if (!post) {
      this.logger.warn('getPostById failed: post not found', {
        context: PostsService.name,
        postId,
        userId,
      });
      throw new NotFoundException('post not found');
    }

    const isScrapped = userId
      ? !!(await this.scrapRepository.findScrapByUserAndPost(userId, postId))
      : false;
    
    return {
      ...post,
      isScrapped,
    };
  }

  async updatePost(userId: number, postId: number, updatePostDto: UpdatePostDto, files: Express.Multer.File[]): Promise<Post> {
    const { removedOldKeys = [], ...postData } = updatePostDto;
    this.logger.info('updatePost requested', {
      context: PostsService.name,
      userId,
      postId,
      fileCount: files?.length ?? 0,
      removedImageCount: removedOldKeys.length,
    });

    const post = await this.postRepository.findPostByPostId(postId);
    if (!post) {
      this.logger.warn('updatePost failed: post not found', {
        context: PostsService.name,
        userId,
        postId,
      });
      throw new NotFoundException('Post not found');
    }
    if (post.userId !== userId) {
      this.logger.warn('updatePost failed: forbidden user', {
        context: PostsService.name,
        userId,
        postId,
        postOwnerId: post.userId,
      });
      throw new ForbiddenException('No permission');
    }
    if (removedOldKeys.length > 0) {
      await this.imageAssetService.validatePostImageKeys(postId, removedOldKeys);
    }

    const uploadedImages = files?.length > 0
      ? await this.s3ClientService.uploadFiles(files, userId)
      : [];

    if (removedOldKeys.length > 0) {
      await this.s3ClientService.deleteFiles(removedOldKeys);
    }

    await this.imageAssetRepository.deleteByKeys(postId, removedOldKeys);
    const newImages = Array.isArray(uploadedImages) ? uploadedImages : uploadedImages.files;
    if (newImages.length > 0) {
      await this.imageAssetRepository.createMany(
        newImages.map((img) => ({
          postId,
          key: img.key,
          url: img.url,
        })),
      );
    }

    const updatedPost = await this.postRepository.updatePost(postId, {
      ...postData,
    });

    this.logger.info('updatePost completed', {
      context: PostsService.name,
      userId,
      postId,
      newImageCount: newImages.length,
      removedImageCount: removedOldKeys.length,
    });

    return updatedPost;
  }
  
  // async hardDeletePost(userId: number, postId: number): Promise<Post> {
  //   const post = await this.postRepository.findPostByPostId(postId);
  //   if (!post) {
  //     throw new NotFoundException('Post not found');
  //   }
  //   if (post.userId !== userId) {
  //     throw new ForbiddenException('No permission');
  //   }
  //   await this.s3ClientService.deleteFiles(files, userId)
  //   return this.postRepository.hardDeletePostByPostId(postId);
  // }

  async addPostVote(userId: number, postId: number): Promise<PostVote> {
    this.logger.info('addPostVote requested', {
      context: PostsService.name,
      userId,
      postId,
    });

    const post = await this.postRepository.findPostByPostId(postId);
    if (!post) {
      this.logger.warn('addPostVote failed: post not found', {
        context: PostsService.name,
        userId,
        postId,
      });
      throw new NotFoundException('Post not found');
    }
    const today = new Date().toISOString().slice(0, 10);
    const already = await this.postVoteRepository.findPostVoteByUserAndPost(userId, postId, today)
    if (already) {
      this.logger.warn('addPostVote failed: already voted today', {
        context: PostsService.name,
        userId,
        postId,
        date: today,
      });
      throw new ConflictException('You can vote only once per day.');
    }
    
    const createdPostVote = await this.prisma.$transaction(async (tx) => {
      const createdPostVote = await this.postVoteRepository.createPostVote(userId, postId, today, tx);
      await this.postRepository.incrementVoteCount(postId, tx);
      return createdPostVote;
    });

    this.logger.info('addPostVote completed', {
      context: PostsService.name,
      userId,
      postId,
      date: today,
    });

    return createdPostVote;
  }

  async removePostVote(userId: number, postId: number): Promise<PostVote> {
    this.logger.info('removePostVote requested', {
      context: PostsService.name,
      userId,
      postId,
    });

    const post = await this.postRepository.findPostByPostId(postId);
    if (!post) {
      this.logger.warn('removePostVote failed: post not found', {
        context: PostsService.name,
        userId,
        postId,
      });
      throw new NotFoundException('Post not found');
    }
    const today = new Date().toISOString().slice(0, 10);
    const deletedPostVote = await this.prisma.$transaction(async (tx) => {
      const deletedPostVote = await this.postVoteRepository.deletePostVote(userId, postId, today, tx);
      await this.postRepository.decrementVoteCount(postId, tx);
      return deletedPostVote;
    });

    this.logger.info('removePostVote completed', {
      context: PostsService.name,
      userId,
      postId,
      date: today,
    });

    return deletedPostVote;
  }

  async addScrap(userId: number, postId: number) {
    this.logger.info('addScrap requested', {
      context: PostsService.name,
      userId,
      postId,
    });

    const post = await this.postRepository.findPostByPostId(postId);
    if (!post) {
      this.logger.warn('addScrap failed: post not found', {
        context: PostsService.name,
        userId,
        postId,
      });
      throw new NotFoundException('Post not found');
    }
    const createdScrap = await this.prisma.$transaction(async (tx) => {
      const createdScrap = await this.scrapRepository.createScrap(userId, postId, tx);
      await this.postRepository.incrementScrapCount(postId, tx);
      return createdScrap;
    });

    this.logger.info('addScrap completed', {
      context: PostsService.name,
      userId,
      postId,
    });

    return createdScrap;
  }

  async removeScrap(userId: number, postId: number) {
    this.logger.info('removeScrap requested', {
      context: PostsService.name,
      userId,
      postId,
    });

    const post = await this.postRepository.findPostByPostId(postId);
    if (!post) {
      this.logger.warn('removeScrap failed: post not found', {
        context: PostsService.name,
        userId,
        postId,
      });
      throw new NotFoundException('Post not found');
    }
    const deletedScrap = await this.prisma.$transaction(async (tx) => {
      const deletedScrap = await this.scrapRepository.deleteScrap(userId, postId, tx);
      await this.postRepository.decrementScrapCount(postId, tx);
      return deletedScrap;
    });

    this.logger.info('removeScrap completed', {
      context: PostsService.name,
      userId,
      postId,
    });

    return deletedScrap;
  }

  async softDeletePost(userId: number, postId: number): Promise<Post> {
    this.logger.info('softDeletePost requested', {
      context: PostsService.name,
      userId,
      postId,
    });

    const post = await this.postRepository.findPostByPostId(postId);
    if (!post) {
      this.logger.warn('softDeletePost failed: post not found', {
        context: PostsService.name,
        userId,
        postId,
      });
      throw new NotFoundException('Post not found');
    }
    if (post.userId !== userId) {
      this.logger.warn('softDeletePost failed: forbidden user', {
        context: PostsService.name,
        userId,
        postId,
        postOwnerId: post.userId,
      });
      throw new ForbiddenException('No permission');
    }

    const softDeletedPost = await this.prisma.$transaction(async (tx) => {
      const softDeletedPost = await this.postRepository.softDeletePostByPostId(postId, tx);
      await this.commentRepository.softDeleteCommentsByPostId(postId, tx);
      return softDeletedPost;
    });

    this.logger.info('softDeletePost completed', {
      context: PostsService.name,
      userId,
      postId,
    });

    return softDeletedPost;
  }
}
