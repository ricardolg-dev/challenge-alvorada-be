import request from 'supertest';
import { startTestApp, type TestApp } from '../helpers/test-app';

let target: TestApp;
beforeAll(async () => {
  target = await startTestApp();
});
afterAll(async () => {
  await target?.close();
});
beforeEach(async () => {
  await target.reset();
});

describe('POST /bookings/:id/rescheduling', () => {
  it('moves to an adjacent free period and exposes the new availability', async () => {
    const server = target.app.getHttpServer();
    await request(server)
      .post('/bookings')
      .send({ id: 'A', resourceId: 'R1', start: 10, end: 20 })
      .expect(201);
    await request(server)
      .post('/bookings')
      .send({ id: 'B', resourceId: 'R1', start: 30, end: 40 })
      .expect(201);
    const result = await request(server)
      .post('/bookings/A/rescheduling')
      .send({ start: 20, end: 30 })
      .expect(200);
    expect(result.body).toEqual({
      outcome: 'rescheduled',
      booking: {
        id: 'A',
        resourceId: 'R1',
        start: 20,
        end: 30,
        status: 'active',
      },
    });
    const oldPeriod = await request(server)
      .get('/resources/R1/availability?start=10&end=20')
      .expect(200);
    expect(oldPeriod.body.available).toBe(true);
    const listed = await request(server).get('/bookings/A').expect(200);
    expect(listed.body).toEqual(result.body.booking);
  });

  it('keeps the old period when another booking already conflicts', async () => {
    const server = target.app.getHttpServer();
    await request(server)
      .post('/bookings')
      .send({ id: 'A', resourceId: 'R1', start: 10, end: 20 })
      .expect(201);
    await request(server)
      .post('/bookings')
      .send({ id: 'B', resourceId: 'R1', start: 30, end: 40 })
      .expect(201);
    const result = await request(server)
      .post('/bookings/A/rescheduling')
      .send({ start: 35, end: 45 })
      .expect(409);
    expect(result.body).toMatchObject({
      code: 'conflict',
      conflictingIds: ['B'],
    });
    const stored = await request(server).get('/bookings/A').expect(200);
    expect(stored.body).toMatchObject({ start: 10, end: 20, status: 'active' });
  });
});
