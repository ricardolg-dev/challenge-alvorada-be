import { vi } from 'vitest';
import type { Booking } from '../booking.types';
import { BookingsRepository } from '../repositories/bookings.repository';
import { ReschedulingRepository } from '../repositories/rescheduling.repository';
import { ReschedulingService } from './rescheduling.service';

const original: Booking = {
  id: 'A',
  resourceId: 'R1',
  start: 10,
  end: 20,
  status: 'active',
};

function setup() {
  const bookings = {
    findById: vi.fn().mockResolvedValue({ ...original }),
    findActiveConflicts: vi.fn().mockResolvedValue([]),
  };
  const rescheduling = {
    update: vi
      .fn()
      .mockImplementation(
        async (booking: Booking, period: { start: number; end: number }) => ({
          ...booking,
          ...period,
        }),
      ),
  };
  const service = new ReschedulingService(
    bookings as unknown as BookingsRepository,
    rescheduling as unknown as ReschedulingRepository,
  );
  return { service, bookings, rescheduling };
}

describe('ReschedulingService', () => {
  it('moves an active booking to a free period without changing identity', async () => {
    const { service, rescheduling } = setup();
    await expect(
      service.reschedule('A', { start: 20, end: 30 }),
    ).resolves.toEqual({
      outcome: 'rescheduled',
      booking: { ...original, start: 20, end: 30 },
    });
    expect(rescheduling.update).toHaveBeenCalledWith(original, {
      start: 20,
      end: 30,
    });
  });

  it('returns no_change without a write for the current active period', async () => {
    const { service, bookings, rescheduling } = setup();
    await expect(
      service.reschedule('A', { start: 10, end: 20 }),
    ).resolves.toEqual({ outcome: 'no_change', booking: original });
    expect(bookings.findActiveConflicts).not.toHaveBeenCalled();
    expect(rescheduling.update).not.toHaveBeenCalled();
  });

  it('rejects a missing id', async () => {
    const { service, bookings, rescheduling } = setup();
    bookings.findById.mockResolvedValue(null);
    await expect(
      service.reschedule('unknown', { start: 20, end: 30 }),
    ).rejects.toMatchObject({ code: 'booking_not_found' });
    expect(rescheduling.update).not.toHaveBeenCalled();
  });

  it('rejects an already cancelled booking even when its period is unchanged', async () => {
    const { service, bookings, rescheduling } = setup();
    bookings.findById.mockResolvedValue({ ...original, status: 'cancelled' });
    await expect(
      service.reschedule('A', { start: 10, end: 20 }),
    ).rejects.toMatchObject({ code: 'booking_not_active' });
    expect(rescheduling.update).not.toHaveBeenCalled();
  });

  it('rejects conflicts reported before the update without writing', async () => {
    const { service, bookings, rescheduling } = setup();
    bookings.findActiveConflicts.mockResolvedValue([
      { ...original, id: 'B', start: 30, end: 40 },
    ]);
    await expect(
      service.reschedule('A', { start: 35, end: 45 }),
    ).rejects.toMatchObject({ code: 'conflict', conflictingIds: ['B'] });
    expect(bookings.findActiveConflicts).toHaveBeenCalledWith('R1', {
      start: 35,
      end: 45,
    });
    expect(rescheduling.update).not.toHaveBeenCalled();
  });
});
