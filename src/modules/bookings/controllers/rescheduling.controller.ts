import {
  Body,
  Controller,
  HttpCode,
  HttpStatus,
  Param,
  Post,
  SerializeOptions,
} from '@nestjs/common';
import { BookingParamsRequest } from '../dto/bookings.dto';
import {
  RescheduleBookingRequest,
  RescheduleBookingResponse,
} from '../dto/rescheduling.dto';
import {
  type RescheduleResult,
  ReschedulingService,
} from '../services/rescheduling.service';

@Controller('bookings')
export class ReschedulingController {
  constructor(private readonly rescheduling: ReschedulingService) {}

  @Post(':id/rescheduling')
  @HttpCode(HttpStatus.OK)
  @SerializeOptions({ type: RescheduleBookingResponse })
  reschedule(
    @Param() { id }: BookingParamsRequest,
    @Body() period: RescheduleBookingRequest,
  ): Promise<RescheduleResult> {
    return this.rescheduling.reschedule(id, period);
  }
}
