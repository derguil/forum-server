import { ConflictException, Injectable, NotFoundException, Inject } from '@nestjs/common';
import { Forum } from '@prisma/client';
import { WINSTON_MODULE_PROVIDER } from 'nest-winston';
import { Logger as WinstonLogger } from 'winston';
import { CreateForumDto } from './dto/create-forum.dto';
import { ForumRepository } from './forum.repository';

@Injectable()
export class ForumsService {
  constructor(
    @Inject(WINSTON_MODULE_PROVIDER)
    private readonly logger: WinstonLogger,
    private readonly forumRepository: ForumRepository,
  ) {}

  async addForum(createForumDto: CreateForumDto, userId: number): Promise<Forum> {
    const { title } = createForumDto
    this.logger.info('addForum requested', {
      context: ForumsService.name,
      userId,
      title,
    });

    try {
      const createdForum = await this.forumRepository.createForum({
        title,
        user: {
          connect: { id: userId }  // user 관계로 연결
        }
      })

      this.logger.info('addForum completed', {
        context: ForumsService.name,
        userId,
        forumId: createdForum.id,
        title,
      });

      return createdForum;
    } catch (error: unknown) {
      if ((error as any).code === 'P2002') {
        const target = (error as any).meta?.target;

        this.logger.warn('addForum failed: duplicate value', {
          context: ForumsService.name,
          userId,
          title,
          target,
        });

        if (target?.includes('title')) {
          throw new ConflictException('이미 존재하는 title입니다.');
        }
        throw new ConflictException('중복된 값이 존재합니다.');
      }

      this.logger.error('addForum failed: unhandled error', {
        context: ForumsService.name,
        userId,
        title,
        error,
      });

      throw error;
    }
  }

  async getForums(): Promise<Forum[]> {
    this.logger.debug('getForums requested', {
      context: ForumsService.name,
    });

    const forums = await this.forumRepository.findForums()

    this.logger.debug('getForums completed', {
      context: ForumsService.name,
      count: forums.length,
    });

    return forums;
  }

  async getForumById(forumId: number): Promise<Forum> {
    this.logger.debug('getForumById requested', {
      context: ForumsService.name,
      forumId,
    });

    const forum = await this.forumRepository.findByForumId(forumId);
    if (!forum) {
      this.logger.warn('getForumById failed: forum not found', {
        context: ForumsService.name,
        forumId,
      });
      throw new NotFoundException('Forum not found');
    }

    this.logger.debug('getForumById completed', {
      context: ForumsService.name,
      forumId,
    });

    return forum;
  }
}
