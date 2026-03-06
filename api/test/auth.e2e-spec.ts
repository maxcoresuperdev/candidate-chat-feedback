import { Test } from '@nestjs/testing';
import { INestApplication } from '@nestjs/common';
import request from 'supertest';
import { MongoMemoryServer } from 'mongodb-memory-server';
import { AppModule } from '../src/app.module';

describe('Auth (e2e)', () => {
  let app: INestApplication;
  let mongod: MongoMemoryServer;

  beforeAll(async () => {
    mongod = await MongoMemoryServer.create();
    process.env.MONGO_URI = mongod.getUri('testdb');
    process.env.JWT_SECRET = 'test_secret';
    process.env.JWT_EXPIRES_IN = '1d';

    const moduleRef = await Test.createTestingModule({
      imports: [AppModule],
    }).compile();

    app = moduleRef.createNestApplication();
    await app.init();
  });

  afterAll(async () => {
    await app.close();
    await mongod.stop();
  });

  it('registers and logs in', async () => {
    const email = 'test@example.com';
    const password = 'password123';

    const reg = await request(app.getHttpServer())
      .post('/api/auth/register')
      .send({ email, password })
      .expect(201);

    expect(reg.body.token).toBeTruthy();

    const login = await request(app.getHttpServer())
      .post('/api/auth/login')
      .send({ email, password })
      .expect(201);

    expect(login.body.token).toBeTruthy();

    await request(app.getHttpServer())
      .get('/api/auth/me')
      .set('Authorization', `Bearer ${login.body.token}`)
      .expect(200);
  });

  it('rejects bad password', async () => {
    const email = 'badpw@example.com';
    const password = 'password123';

    await request(app.getHttpServer())
      .post('/api/auth/register')
      .send({ email, password })
      .expect(201);

    await request(app.getHttpServer())
      .post('/api/auth/login')
      .send({ email, password: 'wrongpassword' })
      .expect(401);
  });
});
