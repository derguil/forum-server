import { ConflictException, ForbiddenException, Injectable, NotFoundException, Logger } from '@nestjs/common';
import { PostRepository } from './post.repository';
import { CreatePostDto } from './dto/create-post.dto';
import { UpdatePostDto } from './dto/update-post.dto';
import { GetPostsDto } from './dto/get-posts.dto';
import { S3clientService } from '../infra/s3client/s3client.service';
import { Post, PostVote } from '@prisma/client';
import { ForumRepository } from '../forums/forum.repository';
import { ImageAssetRepository } from './image-asset.repository';
import { ImageAssetService } from './image-asset.service';
import { PrismaService } from '../infra/prisma/prisma.service';
import { PostVoteRepository } from './post-vote.repository';
import { ScrapRepository } from './scrap.repository';
import { CommentRepository } from '../comments/comment.repository';

@Injectable()
export class PostsService {
  private readonly logger = new Logger(PostsService.name);

  constructor(
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
    const forum = await this.forumRepository.findByForumId(forumId)
    if (!forum) {
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
    }

    return createdPost;
  }

  async getPosts(getPostsDto: GetPostsDto): Promise<Post[]> {
    const { forumId, page, limit } = getPostsDto;
    return await this.postRepository.findPostsByForumId(forumId, page, limit)
  }

  async getPostById(postId: number, userId?: number): Promise<Post & { isScrapped: boolean }> {
    const post = await this.postRepository.findPostByPostId(postId)
    if (!post) {
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
    const post = await this.postRepository.findPostByPostId(postId);
    if (!post) {
      throw new NotFoundException('Post not found');
    }
    if (post.userId !== userId) {
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
    return this.postRepository.updatePost(postId, {
      ...postData,
    });
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
    const post = await this.postRepository.findPostByPostId(postId);
    if (!post) {
      throw new NotFoundException('Post not found');
    }
    const today = new Date().toISOString().slice(0, 10);
    const already = await this.postVoteRepository.findPostVoteByUserAndPost(userId, postId, today)
    if (already) {
      throw new ConflictException('공감?� 1??1?�만 가?�합?�다.');
    }
    
    return this.prisma.$transaction(async (tx) => {
      const createdPostVote = await this.postVoteRepository.createPostVote(userId, postId, today, tx);
      await this.postRepository.incrementVoteCount(postId, tx);
      return createdPostVote;
    });
  }

  async removePostVote(userId: number, postId: number): Promise<PostVote> {
    const post = await this.postRepository.findPostByPostId(postId);
    if (!post) {
      throw new NotFoundException('Post not found');
    }
    const today = new Date().toISOString().slice(0, 10);
    return this.prisma.$transaction(async (tx) => {
      const deletedPostVote = await this.postVoteRepository.deletePostVote(userId, postId, today, tx);
      await this.postRepository.decrementVoteCount(postId, tx);
      return deletedPostVote;
    });
  }

  async addScrap(userId: number, postId: number) {
    const post = await this.postRepository.findPostByPostId(postId);
    if (!post) {
      throw new NotFoundException('Post not found');
    }
    return this.prisma.$transaction(async (tx) => {
      const createdScrap = await this.scrapRepository.createScrap(userId, postId, tx);
      await this.postRepository.incrementScrapCount(postId, tx);
      return createdScrap;
    });
  }

  async removeScrap(userId: number, postId: number) {
    const post = await this.postRepository.findPostByPostId(postId);
    if (!post) {
      throw new NotFoundException('Post not found');
    }
    return this.prisma.$transaction(async (tx) => {
      const deletedScrap = await this.scrapRepository.deleteScrap(userId, postId, tx);
      await this.postRepository.decrementScrapCount(postId, tx);
      return deletedScrap;
    });
  }

  async softDeletePost(userId: number, postId: number): Promise<Post> {
    const post = await this.postRepository.findPostByPostId(postId);
    if (!post) {
      throw new NotFoundException('Post not found');
    }
    if (post.userId !== userId) {
      throw new ForbiddenException('No permission');
    }
    return this.prisma.$transaction(async (tx) => {
      const softDeletedPost = await this.postRepository.softDeletePostByPostId(postId, tx);
      await this.commentRepository.softDeleteCommentsByPostId(postId, tx);
      return softDeletedPost;
    });
  }
}
