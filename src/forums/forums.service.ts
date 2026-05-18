import { ConflictException, Injectable, NotFoundException } from '@nestjs/common';
import { Forum } from '@prisma/client';
import { CreateForumDto } from './dto/create-forum.dto';
import { ForumRepository } from './forum.repository';

@Injectable()
export class ForumsService {
  constructor(private readonly forumRepository: ForumRepository) {}

  async addForum(createForumDto: CreateForumDto, userId: number): Promise<Forum> {
    const { title } = createForumDto
    try {
      return await this.forumRepository.createForum({
        title,
        user: {
          connect: { id: userId }  // user 관계로 연결
        }
      })
    } catch (error: unknown) {
      if ((error as any).code === 'P2002') {
        const target = (error as any).meta?.target;
        // console.log(target)
        if (target.includes('title')) {
          throw new ConflictException('이미 존재하는 title입니다.');
        }
        throw new ConflictException('중복된 값이 존재합니다.');
      }
      throw error;
    }
  }

  async getForums(): Promise<Forum[]> {
    return await this.forumRepository.findForums()
  }

  async getForumById(forumId: number): Promise<Forum> {
    const forum = await this.forumRepository.findByForumId(forumId);
    if (!forum) {
      throw new NotFoundException('Forum not found');
    }
    return forum;
  }
}
