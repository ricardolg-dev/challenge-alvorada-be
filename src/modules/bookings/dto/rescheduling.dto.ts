import { Expose, Type } from 'class-transformer';
import {
  IsGreaterThan,
  IsInt32,
  ToNumber,
} from '../../../shared/validation/validators';
import { BookingResponse } from './bookings.dto';

export class RescheduleBookingRequest {
  @ToNumber()
  @IsInt32()
  start: number;

  @ToNumber()
  @IsInt32()
  @IsGreaterThan('start')
  end: number;
}

export class RescheduleBookingResponse {
  @Expose()
  outcome: 'rescheduled' | 'no_change';

  @Expose()
  @Type(() => BookingResponse)
  booking: BookingResponse;
}
