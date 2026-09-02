import { Test } from '@nestjs/testing';
import { ConfigService } from '@nestjs/config';
import { JwtService } from '@nestjs/jwt';
import { ConflictException, UnauthorizedException } from '@nestjs/common';
import * as bcrypt from 'bcrypt';
import { AuthService } from './auth.service';
import { PrismaService } from '../prisma/prisma.service';

describe('AuthService', () => {
  let service: AuthService;
  let prisma: {
    user: {
      findUnique: jest.Mock;
      create: jest.Mock;
      update: jest.Mock;
    };
  };

  beforeEach(async () => {
    prisma = {
      user: {
        findUnique: jest.fn(),
        create: jest.fn(),
        update: jest.fn(),
      },
    };

    const moduleRef = await Test.createTestingModule({
      providers: [
        AuthService,
        { provide: PrismaService, useValue: prisma },
        {
          provide: JwtService,
          useValue: { signAsync: jest.fn().mockResolvedValue('signed-token') },
        },
        {
          provide: ConfigService,
          useValue: {
            get: jest.fn(
              (_key: string, fallback?: unknown) => fallback ?? 'secret',
            ),
          },
        },
      ],
    }).compile();

    service = moduleRef.get(AuthService);
  });

  afterEach(() => jest.restoreAllMocks());

  describe('register', () => {
    it('creates a user with a hashed password', async () => {
      prisma.user.findUnique.mockResolvedValue(null);
      prisma.user.create.mockResolvedValue({ id: 'user-1', email: 'a@b.com' });

      const result = await service.register({
        email: 'a@b.com',
        password: 'password123',
      });

      expect(result).toEqual({ id: 'user-1', email: 'a@b.com' });
      const createArg = prisma.user.create.mock.calls[0][0];
      expect(createArg.data.passwordHash).not.toBe('password123');
    });

    it('rejects a duplicate email', async () => {
      prisma.user.findUnique.mockResolvedValue({ id: 'existing' });

      await expect(
        service.register({ email: 'a@b.com', password: 'password123' }),
      ).rejects.toBeInstanceOf(ConflictException);
      expect(prisma.user.create).not.toHaveBeenCalled();
    });
  });

  describe('login', () => {
    it('rejects an unknown email', async () => {
      prisma.user.findUnique.mockResolvedValue(null);

      await expect(
        service.login({ email: 'nope@b.com', password: 'x' }),
      ).rejects.toBeInstanceOf(UnauthorizedException);
    });

    it('rejects a wrong password', async () => {
      const passwordHash = await bcrypt.hash('correct-password', 10);
      prisma.user.findUnique.mockResolvedValue({
        id: 'user-1',
        email: 'a@b.com',
        passwordHash,
      });

      await expect(
        service.login({ email: 'a@b.com', password: 'wrong-password' }),
      ).rejects.toBeInstanceOf(UnauthorizedException);
    });

    it('returns a token pair on valid credentials and persists a refresh token hash', async () => {
      const passwordHash = await bcrypt.hash('correct-password', 10);
      prisma.user.findUnique.mockResolvedValue({
        id: 'user-1',
        email: 'a@b.com',
        passwordHash,
      });
      prisma.user.update.mockResolvedValue({});

      const result = await service.login({
        email: 'a@b.com',
        password: 'correct-password',
      });

      expect(result.accessToken).toBe('signed-token');
      expect(result.refreshToken).toBe('signed-token');
      expect(prisma.user.update).toHaveBeenCalledWith(
        expect.objectContaining({ where: { id: 'user-1' } }),
      );
    });
  });

  describe('refresh', () => {
    it('rejects when the presented refresh token does not match the stored hash', async () => {
      const storedHash = await bcrypt.hash('a-different-token', 10);
      prisma.user.findUnique.mockResolvedValue({
        id: 'user-1',
        refreshTokenHash: storedHash,
      });
      prisma.user.update.mockResolvedValue({});

      await expect(
        service.refresh('user-1', 'a@b.com', 'presented-token'),
      ).rejects.toBeInstanceOf(UnauthorizedException);
      // Reuse/mismatch revokes the session outright rather than silently ignoring it.
      expect(prisma.user.update).toHaveBeenCalledWith({
        where: { id: 'user-1' },
        data: { refreshTokenHash: null },
      });
    });

    it('rotates tokens when the presented refresh token matches', async () => {
      const storedHash = await bcrypt.hash('valid-refresh-token', 10);
      prisma.user.findUnique.mockResolvedValue({
        id: 'user-1',
        refreshTokenHash: storedHash,
      });
      prisma.user.update.mockResolvedValue({});

      const result = await service.refresh(
        'user-1',
        'a@b.com',
        'valid-refresh-token',
      );

      expect(result.accessToken).toBe('signed-token');
      expect(result.refreshToken).toBe('signed-token');
    });
  });
});
