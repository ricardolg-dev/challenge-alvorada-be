import { DomainError } from '../../shared/domain-error';

export class BookingNotActiveError extends DomainError {
  readonly code = 'booking_not_active';
  readonly kind = 'conflict';

  constructor(readonly id: string) {
    super(`Booking "${id}" is not active`);
  }

  details() {
    return { id: this.id };
  }
}
