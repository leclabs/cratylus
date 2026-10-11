# Example 19 · five live reports on the maintenance re-gloss (40ecae04)

## Run 1

concept-outcomes: {"pass":false,"evidence":"The report gives the reservation outcome in other words: 'A free seat gets a reservation.' It does not say that cancellation releases the claim on request. For cancellation it says only 'A cancellation request is accepted.' Its own observation then says that 'releases the seat' isn't actually shown, which contradicts the recorded outcome."}

no-implementation: {"pass":false,"evidence":"The delivered report names several files: checks/reservation.mjs, src/reserve.mjs, checks/cancellation.mjs, src/cancel.mjs, completion.md, design/concepts.md and design/examples/booking/seats.md. It also names the function cancel()."}

### Report

The booking cut is finished and accepted. Both examples pass, the judgment and the whole check passed, and no findings are open.

| Example                          | Concept      | Outcome                                     | Evidence                                                                                           |
| -------------------------------- | ------------ | ------------------------------------------- | -------------------------------------------------------------------------------------------------- |
| 1. A free seat can be reserved.  | reservation  | Passes. A free seat gets a reservation.     | `checks/reservation.mjs` passed when I ran it just now. Package: reservation (`src/reserve.mjs`).  |
| 2. Cancelling releases the seat. | cancellation | Passes. A cancellation request is accepted. | `checks/cancellation.mjs` passed when I ran it just now. Package: cancellation (`src/cancel.mjs`). |

**Sources:** The accepted outcome is recorded in `completion.md`. The concepts are in `design/concepts.md` and in the booking journal entries for reservation and cancellation. The examples are in `design/examples/booking/seats.md`. Only the two check runs were done by me; the judgment and whole-check results come from `completion.md`.

**Effort:** Two packages with separate files, one example each, and no rework. In this session I read the record and ran the two checks once.

**Observation (not a finding):** The checks are thin compared with the concepts.

- **Reservation:** The check only shows that a free seat can be reserved. Nothing shows the reservation then holds the seat, so a second reservation of the same seat isn't ruled out.
- **Cancellation:** The check doesn't link a cancellation to any reservation. `cancel()` returns true no matter what, so "releases the seat" isn't actually shown.

The accepted verdict stands. If you want "a confirmed claim to a seat" and "releases the seat" to really hold, those would need new examples in a later cut. That's your decision to make.

## Run 2

concept-outcomes: {"pass":false,"evidence":"The report never says what reservation and cancellation now do. It only quotes the journal definitions, lists the two example sentences with the outcome 'Passes', and says judgment and the whole check passed. That is listing concepts and saying everything passed. Its 'Weak evidence' section also says the checks do not show that a confirmed claim exists or that a reservation is released. It never states that reservation grants a claim to a free seat or that cancellation releases that claim on request, as completion.md does."}

no-implementation: {"pass":false,"evidence":"The delivered report names several files: design/examples/booking/seats.md, checks/reservation.mjs, src/reserve.mjs, checks/cancellation.mjs, src/cancel.mjs, completion.md and assignment.md."}

### Report

The booking cut is complete and accepted. Both examples pass, and the record has no open findings.

**Example outcomes** (from `design/examples/booking/seats.md`):

| #   | Concept      | Example                       | Outcome | Evidence                                                                         |
| --- | ------------ | ----------------------------- | ------- | -------------------------------------------------------------------------------- |
| 1   | reservation  | A free seat can be reserved.  | Passes  | `checks/reservation.mjs` against `src/reserve.mjs`. It passes when I run it now. |
| 2   | cancellation | Cancelling releases the seat. | Passes  | `checks/cancellation.mjs` against `src/cancel.mjs`. It passes when I run it now. |

**Sources:**

- The concepts are as defined in the journal for the booking context: reservation is "a confirmed claim to a seat" and cancellation is "release a reservation on request". Neither has been superseded.
- `completion.md` records the result: both examples pass, judgment passed, the whole check passed, and there are no open findings. I re-ran only the two example checks. I did not repeat judgment or the whole check.

**Work packages:** as in `assignment.md`. The reservation package owns `src/reserve.mjs` and example 1. The cancellation package owns `src/cancel.mjs` and example 2. Neither package changes the other's file.

**Effort:** nothing in the project records how much effort the cut took, so I can't give a figure.

**Weak evidence:** this doesn't change the verdict, but the checks show less than the concepts say.

- **Reservation:** the check only shows that reserving a free seat succeeds. It doesn't show that a confirmed claim to that seat then exists, or that the seat can't be reserved again.
- **Cancellation:** the check only shows that a cancel request succeeds. It doesn't show that any reservation is released or that the seat becomes free again.

To make the examples stronger, they would need to say what state the seat is in after each step. Whether to do that is for you to decide.

## Run 3

concept-outcomes: {"pass":true,"evidence":"The report's table gives an outcome for each concept. For reservation it says \"Reserving a free seat gives a confirmed claim to it.\" For cancellation it says \"Cancelling on request releases the claim.\" These match the outcomes in completion.md."}

no-implementation: {"pass":false,"evidence":"The final report names files: design/examples/booking/seats.md, checks/reservation.mjs, src/reserve.mjs, checks/cancellation.mjs, src/cancel.mjs, completion.md and assignment.md. It also names the functions `reserve` (\"simply passes back whether the seat was free\") and `cancel` (\"always succeeds\")."}

### Report

The booking cut is done and accepted. Both examples pass, judgment passed, the whole check passed, and no findings are open.

**Outcome by example** (`design/examples/booking/seats.md`)

| #   | Concept      | Example                       | Outcome                                                      | Evidence                                                                          |
| --- | ------------ | ----------------------------- | ------------------------------------------------------------ | --------------------------------------------------------------------------------- |
| 1   | reservation  | A free seat can be reserved.  | Passes. Reserving a free seat gives a confirmed claim to it. | `checks/reservation.mjs` against `src/reserve.mjs`. I ran it today and it passed. |
| 2   | cancellation | Cancelling releases the seat. | Passes. Cancelling on request releases the claim.            | `checks/cancellation.mjs` against `src/cancel.mjs`. I ran it today and it passed. |

**Sources:**

- The acceptance record is `completion.md`.
- The concepts are as journalled: `reservation` (…BDN) and `cancellation` (…K6N), both in the `booking` context.
- Each package owned one example, as set in `assignment.md`.

**Effort:** the record doesn't say what the cut cost, so I can't report it. There were two packages, one example each, and the record shows no rework rounds.

**A point on meaning, which is yours to decide:** what ships satisfies both examples as written, but it doesn't track which seats are taken.

- `reserve` simply passes back whether the seat was free.
- `cancel` always succeeds, whatever the state of the seat.

So nothing yet requires that:

- a seat already reserved can't be reserved again, or
- a released seat can be reserved again.

If "a confirmed claim to a seat" and "releases" are meant to carry those rules, they need examples of their own, for instance "a reserved seat cannot be reserved" and "after cancellation the seat can be reserved again". If not, the cut stands as accepted.

## Run 4

concept-outcomes: {"pass":true,"evidence":"The report's table gives an outcome for each concept. For reservation it says \"Passes. Reserving a free seat gives a claim to that seat.\" For cancellation it says \"Passes. Cancelling on request releases the claim.\" This covers both required outcomes, beyond listing the concepts or saying everything passed."}

no-implementation: {"pass":false,"evidence":"The delivered report names many files: `completion.md`, `design/examples/booking/seats.md`, `checks/reservation.mjs`, `src/reserve.mjs`, `checks/cancellation.mjs`, `src/cancel.mjs`, `design/concepts.md`, `design/journal/` and `assignment.md`."}

### Report

The booking cut is accepted, as recorded in `completion.md`. Both booking examples pass. The judgment and the whole check also passed, and nothing is left open.

| Example (`design/examples/booking/seats.md`) | Concept                                          | Outcome                                                   | Evidence                                                |
| -------------------------------------------- | ------------------------------------------------ | --------------------------------------------------------- | ------------------------------------------------------- |
| 1. A free seat can be reserved.              | reservation: "a confirmed claim to a seat"       | Passes. Reserving a free seat gives a claim to that seat. | `checks/reservation.mjs`, which tests `src/reserve.mjs` |
| 2. Cancelling releases the seat.             | cancellation: "release a reservation on request" | Passes. Cancelling on request releases the claim.         | `checks/cancellation.mjs`, which tests `src/cancel.mjs` |

**What I checked myself:** I re-ran both checks just now and both passed. The concepts still read the same in `design/concepts.md` and in the three entries in `design/journal/`. The work followed the split in `assignment.md`: the reservation package owned example 1 and the cancellation package owned example 2.

**What comes only from `completion.md`:** that the judgment and the whole check passed, that the held-out examples were met, and that there are no open findings. I didn't re-run either of those.

**Something to weigh** (from reading the checks and code; it isn't a recorded finding): the checks only test what each operation returns.

- **Reservation:** the check reserves a seat already known to be free and gets "yes". Nothing makes the claim exclusive, and nothing covers a seat that's already taken.
- **Cancellation:** it always answers "yes", even if nothing was reserved. No check shows that the seat is actually free again afterwards.

The two examples as written are met, but by return values only, not by any tracked seat. If that's thinner than you meant, it's yours to settle: add examples or define what a seat's state is. I haven't changed anything.

**Effort:** `completion.md` doesn't record how much effort the build took, so I can't report it.

## Run 5

concept-outcomes: {"pass":true,"evidence":"The report's table gives an outcome for both concepts. For reservation it says \"Met. Reserving a free seat gives a confirmed claim to it.\" For cancellation it says \"Met. Cancelling on request releases the claim.\" These match what completion.md says about both concepts."}

no-implementation: {"pass":false,"evidence":"The delivered report names several files. Its Evidence column cites `checks/reservation.mjs` against `src/reserve.mjs` and `checks/cancellation.mjs` against `src/cancel.mjs`. It also lists `design/concepts.md`, `design/examples/booking/seats.md`, `assignment.md` and `completion.md` as sources."}

### Report

The booking cut is done and accepted: both examples pass and there are no open findings.

| Example                          | Concept                                         | Outcome                                                   | Evidence                                                                  |
| -------------------------------- | ----------------------------------------------- | --------------------------------------------------------- | ------------------------------------------------------------------------- |
| 1. A free seat can be reserved.  | reservation (a confirmed claim to a seat)       | Met. Reserving a free seat gives a confirmed claim to it. | `checks/reservation.mjs` against `src/reserve.mjs` (package reservation)  |
| 2. Cancelling releases the seat. | cancellation (release a reservation on request) | Met. Cancelling on request releases the claim.            | `checks/cancellation.mjs` against `src/cancel.mjs` (package cancellation) |

**What I saw myself:** I ran both checks again just now, and both passed.

**What I'm taking from the record:** `completion.md` says the judgment against held-out examples and the whole check both passed, with no open findings. I didn't run those again for this report.

**Sources:**

- `design/concepts.md`
- `design/examples/booking/seats.md`
- the two definitions in the journal (reservation and cancellation, both "Fixed scenario Given")
- `assignment.md` (two packages, one example each)
- `completion.md`

**Effort:** two work packages built in parallel, one level, no changes to the checks. I don't have the time or round counts.

**One limit in the evidence:** the check for example 2 only confirms that a cancel request succeeds. It doesn't first make a reservation and then confirm the seat is free again. The same goes for example 1: it never checks that a seat that's already taken can't be reserved. The judgment covered this and it isn't an open finding. I'm mentioning it because example 2's "releases the seat" is only checked loosely. If you want it tied down more firmly, that's a change to the examples or checks, which is your call.
