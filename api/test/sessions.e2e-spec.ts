import { Test } from '@nestjs/testing';
import { INestApplication } from '@nestjs/common';
import request from 'supertest';
import { MongoMemoryServer } from 'mongodb-memory-server';
import { AppModule } from '../src/app.module';

async function registerAndLogin(app: INestApplication) {
  const email = 'user@example.com';
  const password = 'password123';

  await request(app.getHttpServer())
    .post('/api/auth/register')
    .send({ email, password })
    .expect(201);

  const login = await request(app.getHttpServer())
    .post('/api/auth/login')
    .send({ email, password })
    .expect(201);

  return login.body.token as string;
}

describe('Sessions (e2e)', () => {
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

  it('creates, updates, submits, fetches', async () => {
    const token = await registerAndLogin(app);

    const created = await request(app.getHttpServer())
      .post('/api/sessions')
      .set('Authorization', `Bearer ${token}`)
      .send({})
      .expect(201);

    expect(created.body.id).toBeTruthy();
    expect(created.body.questions).toHaveLength(5);

    const answers = created.body.questions.map((q: string, i: number) => `Answer ${i + 1} because I would test and iterate. ${q}`);

    const updated = await request(app.getHttpServer())
      .put(`/api/sessions/${created.body.id}/answers`)
      .set('Authorization', `Bearer ${token}`)
      .send({ answers })
      .expect(200);

    expect(updated.body.answers[0]).toContain('Answer 1');

    const submitted = await request(app.getHttpServer())
      .post(`/api/sessions/${created.body.id}/submit`)
      .set('Authorization', `Bearer ${token}`)
      .send({})
      .expect(201);

    expect(submitted.body.status).toBe('submitted');
    expect(submitted.body.feedback).toBeTruthy();
    expect(submitted.body.feedback.skills).toHaveLength(3);

    const fetched = await request(app.getHttpServer())
      .get(`/api/sessions/${created.body.id}`)
      .set('Authorization', `Bearer ${token}`)
      .expect(200);

    expect(fetched.body.feedback.skills[0].skill).toBeTruthy();
  });
});
