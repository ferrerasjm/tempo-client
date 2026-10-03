# Study flow and frontend handoff

## Try the flow

1. Click the landing GIF and choose an existing demo profile.
2. Choose an available drink, then Tall (25 minutes), Grande (45), or Venti (60).
3. Enter a name or label. This labels the session without renaming the profile.
4. Write your task on the notepad. Open Task details to change deadline, difficulty, estimate, description, or energy.
5. Click Start. This saves the task and a **planned** session; the timer has not started and no seat is occupied yet.
6. Browse spaces using the arrows. Click Start session to take a seat and start the timer. Capacity is checked for the entire remaining focus window, including future reservations.
7. Pause timer releases the seat and freezes elapsed time. Resume timer checks capacity again. While running, arrows preview spaces; Reserve this seat moves your actual seat after a server check.
8. Stop session saves elapsed whole minutes. Under one minute is cancelled. Update task status separately when its work is finished.
9. Open Explore → Productivity Analytics to view the saved totals, streaks, and cafe habits.

The selected drink is a session companion. It does not automatically create a virtual order or deduct credits. Counter and order calculation remain available through Explore. Smart focus recommendation remains a separate option for planning existing tasks. Unlimited duration is not offered because the current session schema and seat checks use finite durations.

## Add music later

1. Copy your audio file to `client/public/assets/cozy-cafe.mp3`.
2. In `client/src/assets.ts`, change `music: ''` to `music: '/assets/cozy-cafe.mp3'`.
3. Start a session. Music loops while the timer runs. Pause music affects only music; Pause timer pauses both. Resume timer resumes music unless you manually paused it. Stop session stops playback.
4. Test the Volume slider. If the browser blocks playback, use Play music.

OGG and WAV also work; use the matching path and extension. Until a file is configured, music controls stay disabled and explain that the file has not been added. Actual audio playback still needs checking after the file is supplied.

## Keep presentation separate

- `services/cafeApi.ts`: HTTP calls, including session actions.
- `state/StudyDraftContext.tsx`: profile-specific setup draft in session storage.
- `hooks/useStudyEntry.ts`: task saving and planned-session creation.
- `hooks/useFocusRoom.ts`: seat queries, space preview, and session actions.
- `hooks/useFocusTimer.ts`: countdown derived from saved timestamps, excluding paused time.
- `hooks/useFocusMusic.ts`: audio playback, volume, and browser playback errors.
- `pages/StudyEntryPages.tsx`, `pages/FocusPages.tsx`, and `study.css`: replaceable presentation.

The server validates drink sizes, calculates durations and focus minutes, checks capacity, and saves session state. Temporary drink and room SVGs can be replaced without changing these hooks or services.

## Verified scope

Browser tests use isolated Atlas profiles and clean up their records. They cover the complete entry flow, reload and pause persistence, seat changes, stopped minutes, analytics, existing task/order/reservation operations, mobile layouts, and request recovery. A separate capacity test submits concurrent bookings and session starts to a one-seat test area and verifies full-area resume rejection.

The capacity queue protects requests in one Node server process. Multiple server instances would need a database-level concurrency design. Profiles remain a demo selection flow, not password authentication. Optional Focus Passport stamps remain unimplemented.
