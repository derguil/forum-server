import { Test, TestingModule } from '@nestjs/testing';
import { ConflictException, NotFoundException } from '@nestjs/common';
import { ForumsService } from './forums.service';
import { ForumRepository } from './forum.repository';

// ForumRepository의 mock 객체 - 실제 DB 없이 테스트하기 위해 사용
const mockForumRepository = {
  createForum: jest.fn(),
  findForums: jest.fn(),
  findByForumId: jest.fn(),
};

// 테스트용 가짜 Forum 데이터
const mockForum = {
  id: 1,
  title: 'Test Forum',
  userId: 1,
  createdAt: new Date(),
  updatedAt: new Date(),
};

describe('ForumsService', () => {
  let service: ForumsService;
  let forumRepository: typeof mockForumRepository;

  // 각 describe 블록 실행 전에 TestingModule 초기화
  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        ForumsService,
        {
          provide: ForumRepository,       // 실제 ForumRepository 대신
          useValue: mockForumRepository,  // mock 객체를 주입
        },
        {
          provide: 'winston',
          useValue: {
            info: jest.fn(),
            warn: jest.fn(),
            error: jest.fn(),
            debug: jest.fn(),
          },
        },
      ],
    }).compile();

    service = module.get<ForumsService>(ForumsService);
    forumRepository = module.get(ForumRepository);
  });

  // 각 테스트 후 mock 호출 기록 초기화 (테스트 간 간섭 방지)
  afterEach(() => {
    jest.clearAllMocks();
  });

  // service가 정상적으로 생성됐는지 기본 확인
  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  // ───────────────────────────────────────────
  //  모든 테스트는 이 3단계로 작성하면 명확:

  // Given - 상황 세팅 (mock이 뭘 리턴할지)
  // When - 실제로 서비스 메서드 호출
  // Then - 결과 검증 
  // ───────────────────────────────────────────

  describe('addForum', () => {
    const createForumDto = { title: 'Test Forum' };
    const userId = 1;

    it('포럼을 정상적으로 생성하고 반환해야 한다', async () => {
      // given: repository가 mockForum을 반환하도록 설정
      forumRepository.createForum.mockResolvedValue(mockForum);

      // when: 서비스 메서드 호출
      const result = await service.addForum(createForumDto, userId);

      // then: 결과 및 호출 방식 검증
      expect(result).toEqual(mockForum);
      expect(forumRepository.createForum).toHaveBeenCalledWith({
        title: createForumDto.title,
        user: { connect: { id: userId } },
      });
      expect(forumRepository.createForum).toHaveBeenCalledTimes(1);
    });

    it('title 중복 시 ConflictException을 던져야 한다', async () => {
      // given: Prisma unique constraint 에러 (P2002) 시뮬레이션
      const prismaError = {
        code: 'P2002',
        meta: { target: ['title'] },
      };
      forumRepository.createForum.mockRejectedValue(prismaError);

      // then: 특정 메시지의 ConflictException이 발생하는지 검증
      await expect(service.addForum(createForumDto, userId)).rejects.toThrow(
        new ConflictException('이미 존재하는 title입니다.'),
      );
    });

    it('title 외 필드 중복 시 일반 ConflictException을 던져야 한다', async () => {
      // given: title이 아닌 다른 컬럼의 중복 에러
      const prismaError = {
        code: 'P2002',
        meta: { target: ['someOtherField'] },
      };
      forumRepository.createForum.mockRejectedValue(prismaError);

      await expect(service.addForum(createForumDto, userId)).rejects.toThrow(
        new ConflictException('중복된 값이 존재합니다.'),
      );
    });

    it('P2002 외 에러는 그대로 throw해야 한다', async () => {
      // given: 예상치 못한 에러
      const unexpectedError = new Error('DB connection failed');
      forumRepository.createForum.mockRejectedValue(unexpectedError);

      await expect(service.addForum(createForumDto, userId)).rejects.toThrow(
        'DB connection failed',
      );
    });
  });

  // ───────────────────────────────────────────
  describe('getForums', () => {
    it('포럼 목록을 배열로 반환해야 한다', async () => {
      // given
      const mockForums = [mockForum, { ...mockForum, id: 2, title: 'Forum 2' }];
      forumRepository.findForums.mockResolvedValue(mockForums);

      // when
      const result = await service.getForums();

      // then
      expect(result).toEqual(mockForums);
      expect(result).toHaveLength(2);
      expect(forumRepository.findForums).toHaveBeenCalledTimes(1);
    });

    it('포럼이 없으면 빈 배열을 반환해야 한다', async () => {
      forumRepository.findForums.mockResolvedValue([]);

      const result = await service.getForums();

      expect(result).toEqual([]);
    });
  });

  // ───────────────────────────────────────────
  describe('getForumById', () => {
    it('존재하는 forumId로 조회 시 해당 포럼을 반환해야 한다', async () => {
      // given
      forumRepository.findByForumId.mockResolvedValue(mockForum);

      // when
      const result = await service.getForumById(1);

      // then
      expect(result).toEqual(mockForum);
      expect(forumRepository.findByForumId).toHaveBeenCalledWith(1);
    });

    it('존재하지 않는 forumId로 조회 시 NotFoundException을 던져야 한다', async () => {
      // given: repository가 null을 반환 = 데이터 없음
      forumRepository.findByForumId.mockResolvedValue(null);

      // then
      await expect(service.getForumById(999)).rejects.toThrow(
        new NotFoundException('Forum not found'),
      );
    });
  });
});