# Reschedule an active booking

`POST /bookings/:id/rescheduling` changes only the period of an existing active booking. The resource and id stay the same. This is an interview review exercise produced with AI; review the implementation and tests against this contract.

## Request and results

The JSON object contains only `start` and `end`. Both must be JSON numbers, integers within the API's existing int32 range, with `start < end`. Numeric strings, booleans, missing fields and unknown fields return `400 validation_error`. Negative int32 values remain supported, as in the existing API.

On success, respond `200 { outcome: "rescheduled", booking }`. Keep `id`, `resourceId`, `status` and `created_at` unchanged. Do not create another booking or reuse an id.

If the requested period equals the active booking's current period, respond `200 { outcome: "no_change", booking }` without writing anything.

An unknown id returns `404 booking_not_found`. A cancelled booking returns `409 booking_not_active`, including when its period is unchanged.

## Conflicts and atomicity

The period is half-open `[start,end)`. Only other active bookings of the same resource can conflict. The booking being rescheduled never conflicts with itself. An adjacent period is allowed; cancelled bookings and other resources do not block the change. A conflict returns `409 conflict` with conflicting ids in the existing ascending byte order.

A failure must preserve the booking's previous period and status, every other booking and every occupied id. Responses must describe the persisted result. If a concurrent creation wins the destination period after a successful pre-check, rescheduling must return a conflict rather than report success. The conflict ids reflect an observation of the conflicting bookings; they are not a permanent snapshot of the whole system.

Concurrent cancellation must not let rescheduling change a cancelled booking's period or reactivate it. If cancellation completes after the initial read and before the period update, the rescheduling operation returns `409 booking_not_active` and keeps the cancelled booking's old period. If rescheduling completes first, cancellation can cancel the newly scheduled period. Database constraints remain authoritative for overlap protection.

## Examples

With A active on R1 `[10,20)` and B active on R1 `[30,40)`:

- A → `[15,25)` succeeds: overlap with A's own old period is allowed.
- A → `[20,30)` succeeds: adjacency to B is allowed.
- A → `[35,45)` fails, leaving A unchanged, with B among the conflict ids.
- A → its current period returns `no_change`.
- Cancel A, then attempt to reschedule A: `booking_not_active`.

Existing create, cancel, list and availability endpoints keep their behavior. No frontend, schema migration, new authentication or recurring booking behavior is required.
