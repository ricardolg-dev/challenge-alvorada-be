import { validateRequest } from '../../../../test/helpers/validate-request';
import { RescheduleBookingRequest } from './rescheduling.dto';

describe('RescheduleBookingRequest', () => {
  it('accepts valid int32 periods, including the existing negative range', async () => {
    expect(
      (
        await validateRequest(RescheduleBookingRequest, {
          start: -20,
          end: -10,
        })
      ).ok,
    ).toBe(true);
  });

  it.each([
    { start: 10, end: 10 },
    { start: 20, end: 10 },
    { start: 1.5, end: 10 },
    { start: true, end: 10 },
    { start: 10 },
    { start: 10, end: 20, resourceId: 'R2' },
  ])('rejects an invalid or unknown field: %j', async (body) => {
    expect((await validateRequest(RescheduleBookingRequest, body)).ok).toBe(
      false,
    );
  });
});
