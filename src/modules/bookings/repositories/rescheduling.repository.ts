import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { QueryFailedError, Repository } from 'typeorm';
import type { Booking, Period } from '../booking.types';
import { BookingEntity } from '../entities/booking.entity';

@Injectable()
export class ReschedulingRepository {
  constructor(
    @InjectRepository(BookingEntity)
    private readonly bookings: Repository<BookingEntity>,
  ) {}

  async update(booking: Booking, period: Period): Promise<Booking> {
    try {
      // A single UPDATE lets the existing exclusion constraint protect the
      // destination, without creating a replacement id or an intermediate row.
      const { raw } = await this.bookings
        .createQueryBuilder()
        .update()
        .set({ period: `[${period.start},${period.end})` })
        .where('id = :id', { id: booking.id })
        .returning(
          `id, resource_id AS "resourceId", lower(period) AS start,
           upper(period) AS "end", status`,
        )
        .execute();
      return (raw as Booking[])[0]!;
    } catch (error) {
      if (
        error instanceof QueryFailedError &&
        (error.driverError as { code?: string }).code === '23P01'
      ) {
        // The constraint preserved the original period; return that booking
        // so callers can refresh their view after a concurrent reservation.
        return booking;
      }
      throw error;
    }
  }
}
