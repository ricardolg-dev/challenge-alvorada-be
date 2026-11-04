import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { ResourcesModule } from '../resources/resources.module';
import { AvailabilityController } from './controllers/availability.controller';
import { BookingsController } from './controllers/bookings.controller';
import { ReschedulingController } from './controllers/rescheduling.controller';
import { BookingEntity } from './entities/booking.entity';
import { BookingsRepository } from './repositories/bookings.repository';
import { ReschedulingRepository } from './repositories/rescheduling.repository';
import { AvailabilityService } from './services/availability.service';
import { BookingsService } from './services/bookings.service';
import { ReschedulingService } from './services/rescheduling.service';

@Module({
  imports: [TypeOrmModule.forFeature([BookingEntity]), ResourcesModule],
  controllers: [
    BookingsController,
    AvailabilityController,
    ReschedulingController,
  ],
  providers: [
    BookingsService,
    AvailabilityService,
    BookingsRepository,
    ReschedulingService,
    ReschedulingRepository,
  ],
})
export class BookingsModule {}
