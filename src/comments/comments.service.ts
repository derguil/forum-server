import { Injectable, NotFoundException, ForbiddenException, BadRequestException } from '@nestjs/common';
import { CreateCommentDto } from './dto/create-comment.dto';
import { GetCommentsDto } from './dto/get-comments.dto';
import { Comment } from '@prisma/client';
import { CommentRepository } from './comment.repository';
import { PostRepository } from '../posts/post.repository';
import { PrismaService } from '../infra/prisma/prisma.service';

@Injectable()
export class CommentsService {
  constructor(
    private readonly postRepository: PostRepository,
    private readonly commentRepository: CommentRepository,
    private readonly prisma: PrismaService
  ) {}

  async addComment(userId: number, createCommentDto: CreateCommentDto): Promise<Comment> {
    const { postId, content } = createCommentDto;
    const post = await this.postRepository.findPostByPostId(postId)
    if (!post) {
      throw new NotFoundException('Post not found');
    }

    return this.prisma.$transaction(async (tx) => {
      const createdComment = await this.commentRepository.createcomment(
        {
          content,
          user: { connect: { id: userId } },
          post: { connect: { id: postId } },
        },
        tx,
      );
      await this.postRepository.incrementCommentCount(postId, tx);
      return createdComment;
    });
  }

  // async getComments(getCommentsDto: GetCommentsDto): Promise<Comment[]> {
  //   const { postId } = getCommentsDto;
  //   return await this.commentRepository.findCommentsByPostId(postId)
  // }

  async softDeleteCommentByCommentId(userId: number, commentId: number): Promise<Comment> {
    const comment = await this.commentRepository.findCommentByIdIncludingDeleted(commentId);
    if (!comment) {
      throw new NotFoundException('comment not found');
    }
    if (comment.isDeleted) {
      throw new BadRequestException('Comment already deleted');
    }
    if (comment.userId !== userId) {
      throw new ForbiddenException('No permission');
    }

    return this.prisma.$transaction(async (tx) => {
      const deletedComment = await this.commentRepository.softDeleteCommentById(commentId, tx);
      await this.postRepository.decrementCommentCount(comment.postId, tx);
      return deletedComment;
    });
  }
}
