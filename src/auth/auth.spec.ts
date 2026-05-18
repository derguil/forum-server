import { Test, TestingModule } from '@nestjs/testing';
import { BadRequestException, ConflictException } from '@nestjs/common';
import { AuthService } from './auth.service';
import { UserRepository } from './user.repository';
import { AuthGenerateTokenService } from './auth.generate-token.service';

const mockUserRepository = {
  createUser: jest.fn(),
  findByUserId: jest.fn(),
  findByUsername: jest.fn(),
  findByIdWithRefreshToken: jest.fn(),
  updateRefreshTokenHash: jest.fn(),
};

const mockAuthGenerateTokenService = {
  generateAccessToken: jest.fn(),
  generateRefreshToken: jest.fn(),
};

describe('AuthService', () => {
  let service: AuthService;
  let userRepository: typeof mockUserRepository;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        AuthService,
        {
          provide: UserRepository,
          useValue: mockUserRepository,
        },
        {
          provide: AuthGenerateTokenService,
          useValue: mockAuthGenerateTokenService,
        },
      ],
    }).compile();

    service = module.get<AuthService>(AuthService);
    userRepository = module.get(UserRepository);
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  describe('getMe', () => {
    it('사용자가 없으면 null을 반환해야 한다', async () => {
      userRepository.findByUserId.mockResolvedValue(null);

      const result = await service.getMe(1);

      expect(result).toBeNull();
      expect(userRepository.findByUserId).toHaveBeenCalledWith(1);
    });

    it('민감정보를 제외한 사용자 정보를 반환해야 한다', async () => {
      userRepository.findByUserId.mockResolvedValue({
        id: 1,
        username: 'tester',
        email: 'tester@test.com',
        passwordHash: 'hashed-password',
        hashedRefreshToken: 'hashed-refresh',
        createdAt: new Date(),
        profileImageKey: null,
        profileImageUrl: null,
      });

      const result = await service.getMe(1);

      expect(result).toMatchObject({
        id: 1,
        username: 'tester',
        email: 'tester@test.com',
      });
      expect(result).not.toHaveProperty('passwordHash');
      expect(result).not.toHaveProperty('hashedRefreshToken');
    });
  });

  describe('register', () => {
    it('비밀번호 불일치 시 BadRequestException을 던져야 한다', async () => {
      await expect(
        service.register({
          username: 'tester',
          email: 'tester@test.com',
          password: 'pw1',
          password2: 'pw2',
        }),
      ).rejects.toThrow(new BadRequestException('확인 비밀번호가 일치하지 않습니다.'));
    });

    it('username 중복 시 ConflictException을 던져야 한다', async () => {
      userRepository.createUser.mockRejectedValue({
        code: 'P2002',
        meta: { target: ['username'] },
      });

      await expect(
        service.register({
          username: 'tester',
          email: 'tester@test.com',
          password: 'pw',
          password2: 'pw',
        }),
      ).rejects.toThrow(new ConflictException('이미 존재하는 username입니다.'));
    });

    it('정상 입력이면 createUser가 호출되어야 한다', async () => {
      userRepository.createUser.mockResolvedValue({ id: 1 });

      await service.register({
        username: 'tester',
        email: 'tester@test.com',
        password: 'pw',
        password2: 'pw',
      });

      expect(userRepository.createUser).toHaveBeenCalledTimes(1);
      expect(userRepository.createUser).toHaveBeenCalledWith(
        expect.objectContaining({
          username: 'tester',
          email: 'tester@test.com',
        }),
      );
    });
  });
});