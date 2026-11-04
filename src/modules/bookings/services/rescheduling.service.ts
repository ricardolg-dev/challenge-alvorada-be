import { Injectable } from '@nestjs/common';
import { BookingNotFoundError, ConflictError } from '../booking.errors';
import type { Booking, Period } from '../booking.types';
import { BookingsRepository } from '../repositories/bookings.repository';
import { ReschedulingRepository } from '../repositories/rescheduling.repository';
import { BookingNotActiveError } from '../rescheduling.errors';

export interface RescheduleResult {
  outcome: 'rescheduled' | 'no_change';
  booking: Booking;
}

@Injectable()
export class ReschedulingService {
  constructor(
    private readonly bookings: BookingsRepository,
    private readonly rescheduling: ReschedulingRepository,
  ) {}

  async reschedule(id: string, period: Period): Promise<RescheduleResult> {
    const booking = await this.bookings.findById(id);
    if (!booking) throw new BookingNotFoundError(id);
    if (booking.status !== 'active') throw new BookingNotActiveError(id);

    if (booking.start === period.start && booking.end === period.end) {
      return { outcome: 'no_change', booking };
    }

    const conflicts = await this.bookings.findActiveConflicts(
      booking.resourceId,
      period,
    );
    if (conflicts.length > 0) {
      throw new ConflictError(conflicts.map((conflict) => conflict.id));
    }

    return {
      outcome: 'rescheduled',
      booking: await this.rescheduling.update(booking, period),
    };
  }
}
