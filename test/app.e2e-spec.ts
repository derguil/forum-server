import { Test, TestingModule } from '@nestjs/testing';
import { INestApplication } from '@nestjs/common';
import request from 'supertest';
import { App } from 'supertest/types';
import { AppModule } from './../src/app.module';

describe('App E2E Smoke', () => {
  let app: INestApplication<App>;

  beforeAll(async () => {
    const moduleFixture: TestingModule = await Test.createTestingModule({
      imports: [AppModule],
    }).compile();

    app = moduleFixture.createNestApplication();
    app.setGlobalPrefix('api');
    await app.init();
  });

  afterAll(async () => {
    await app.close();
  });

  it('GET /api/does-not-exist -> 404', () => {
    return request(app.getHttpServer())
      .get('/api/does-not-exist')
      .expect(404);
  });

  it('POST /api/forums without access token -> 401', () => {
    return request(app.getHttpServer())
      .post('/api/forums')
      .send({ title: 'e2e-forum' })
      .expect(401);
  });
});
