# Focus flow and frontend handoff

## Try the flow

1. Click the landing GIF and choose an existing demo profile.
2. Choose an available drink, then Tall (25 minutes), Grande (45), or Venti (60).
3. Enter a name or label. This labels the session without renaming the profile.
4. Write your task on the notepad. Open Task details to change deadline, difficulty, estimate, description, or energy.
5. Click Start. This saves the task and a **planned** session; the timer has not started and no seat is occupied yet.
6. Browse spaces using the arrows. Press the Play icon to start the timer. Capacity is checked for the entire remaining focus window, including future reservations. Decorative chairs do not represent real users or clickable reservations.
7. Pause freezes elapsed time until you press Play to resume. No reward is required. Resuming checks capacity again. Arrows save the selected area; running moves check capacity before changing the scene. The task is visible only in the plain focus view; virtual spaces show the cup, small countdown, play/pause, stop and volume slider.
8. At 00:00, a modal asks whether you finished the displayed task. Submit saves the session and marks its task completed; “Task isn’t finished yet” saves the focus time and sets its task status to in progress. The next modal lets you cycle through available drinks and Tall/Grande/Venti sizes, enter a task, then press Go to start another session in the currently displayed space. Its timer starts immediately. New tasks use the existing default medium difficulty and next-day deadline; details can be edited on the Task Board. Stop remains available for ending a session early; under one minute is cancelled. Saved time cannot exceed the planned timer duration.
9. Open Explore → Productivity Analytics to view the saved totals, streaks, and cafe habits.

The selected drink is a session companion. It does not automatically create a virtual order or deduct credits. The reward shop and order calculation remain available through Explore; purchased rewards can be used from Your Orders during an active timer. See [TEMPO_REWARDS.md](TEMPO_REWARDS.md). The recommendation processing API remains available; the current setup UI uses drink sizes. Unlimited duration is not offered because the current session schema and seat checks use finite durations.

## Add music later

1. Copy your audio file to `client/public/assets/cozy-cafe.mp3`.
2. In `client/src/assets.ts`, change `music: ''` to `music: '/assets/cozy-cafe.mp3'`.
3. Start a session and browse to a virtual space. Music loops while its timer runs. Pause and stop halt playback; resuming restarts it. Returning to the plain focus view stops music and removes the slider.
4. Test the room's Volume slider. If the browser blocks playback, pause and resume the timer to retry.

OGG and WAV also work; use the matching path and extension. Until a file is configured, the room slider stays disabled. Actual audio playback still needs checking after the file is supplied.

## Keep presentation separate

- `services/cafeApi.ts`: HTTP calls, including session actions.
- `state/StudyDraftContext.tsx`: profile-specific setup draft in session storage.
- `hooks/useStudyEntry.ts`: task saving and planned-session creation.
- `hooks/useFocusRoom.ts`: session refresh, persisted space movement, and timer actions. Capacity checks happen on the server when starting, resuming or moving an active timer.
- `hooks/useFocusTimer.ts`: countdown derived from saved timestamps, excluding paused time.
- `hooks/useFocusMusic.ts`: audio playback, volume, and browser playback errors.
- `components/SessionFinish.tsx`: end-of-timer confirmation, drink/size selection and validated next-task entry. Failed session creation reuses the task already saved instead of creating a duplicate on retry.
- `pages/StudyEntryPages.tsx`, `pages/FocusPages.tsx`, and `study.css`: replaceable presentation.

The server validates drink sizes, calculates durations and focus minutes, checks capacity, and saves session state. Supplied drink and room assets are mapped in `assets.ts`.

## Verified scope

Browser tests use isolated Atlas profiles and clean up their records. They cover the complete entry flow, reload and pause persistence, stopped minutes, analytics, existing task/order/reservation operations, mobile layouts, and request recovery. A separate capacity test submits concurrent bookings and session starts to a one-seat test area and verifies full-area resume rejection. Presentation tests check cup/control placement at four viewport sizes and music transitions with a fake audio element.

The capacity queue protects requests in one Node server process. Multiple server instances would need a database-level concurrency design. Profiles remain a demo selection flow, not password authentication. Optional Focus Passport stamps remain unimplemented.
