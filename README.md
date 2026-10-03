# Cafe Tempo · working UI draft

A virtual productivity cafe built with React, Vite, TypeScript, Tailwind CSS, React Router, React Hook Form, Zod, and axios. This draft connects to the Express API and MongoDB Atlas; its artwork is temporary and easy to replace.

## Start the application

Use Node.js 20.19+ or 22.12+. Open two PowerShell terminals. In the first:

```powershell
cd C:\Users\mjfer\cafe-tempo\server
npm.cmd install
npm.cmd run seed
npm.cmd run dev
```

Keep your Atlas connection string in the server's private `.env`. In the second terminal:

```powershell
cd C:\Users\mjfer\cafe-tempo\client
npm.cmd install
npm.cmd run dev
```

Open **http://localhost:5173**. Use `localhost` so it matches the server's default CORS origin. The client defaults to `http://localhost:5000/api`. To change that address, copy `.env.example` to `.env` and edit `VITE_API_URL`; restart Vite afterward. Client environment variables are public, so never put database credentials here.

Click the animated cafe entrance (hover or focus to see **ready to lock in?**), choose **Demo Student**, then choose a drink, its size, a name or label, and a task. The notepad prepares your session; the **Play timer** icon starts it. Use **Explore the Cafe** to return to focus, choose a drink when no timer is unfinished, or visit the Task Board, reward shop, orders, history and analytics. Profile selection is not authentication. The existing backend has no password login; authentication is optional under the rubric and has not been implemented.

## What the draft supports

- Create, edit, complete, filter, and delete tasks on the Task Board; display server-calculated priority. Show five tasks per page, with pagination when the selected filter has more than five results.
- Focus from the Task Board opens drink setup with that task selected. Setup supports new or existing unfinished tasks. At timer completion, confirm the task or continue it with another drink; dismissed completion prompts can be reopened. Newly created sessions preserve their task title in history, while older sessions use the current task title.
- Explore five cafe areas, check availability, reserve a seat, and cancel a reservation.
- Prepare a session through drink selection (Tall 25, Grande 45, Venti 60 minutes), a label, and a task notepad. The recommendation processing API remains available; the UI uses drink sizes for session duration.
- Start, take a purchased reward break, resume, stop, and reload sessions using server timestamps. Stopping saves elapsed whole minutes; sessions under one minute are cancelled.
- Browse the five spaces with arrows; persist a selected space while running, planned, or paused. Full areas are blocked by the server. Pausing releases the seat; resuming checks capacity again.
- Earn Tempo Credits from full focus sessions and task goals; spend them on single-use rewards consumed from Your Orders. A reward unlocks a timed break; unused orders can be refunded. See [docs/TEMPO_REWARDS.md](docs/TEMPO_REWARDS.md).
- The cup overlaps the supplied foreground table. Virtual spaces show only a small timer, play/pause, stop and volume; the plain focus view keeps the task and large timer. Music pauses when returning to focus. The audio file will be added later; the room slider is disabled until then.
- Run a countdown from the persisted session start time and show the recommended break after completion.
- Select drinks and snacks, preview server-calculated totals/discounts, place an order, view order history, and cancel an order.
- Read productivity statistics, current streak, longest streak, favorite area, and most ordered drink.
- Recover from failed requests and show validation, empty, loading, and success states.

The updated flow and instructions for adding music are in [docs/STUDY_FLOW.md](docs/STUDY_FLOW.md).

The focus room uses the supplied table, room, drink, furniture and character assets. Character captions work on hover and keyboard focus; reduced-motion settings stop their gentle movement. These illustrations do not represent active users or individual chair reservations. The five cafe areas currently share the supplied room background. See [docs/FOCUS_ROOMS.md](docs/FOCUS_ROOMS.md) for the layout files and checks. No window video file has been supplied.

There are 20 content routes plus the /focus setup alias, with a shared component for the add/edit task form. The endpoint map is in [docs/DRAFT_PLAN.md](docs/DRAFT_PLAN.md). The simplified flow and handoff are in [docs/REDESIGN.md](docs/REDESIGN.md), with an optional [asset brief](docs/ASSET_BRIEF.md).

## Structure for the frontend handoff

```text
src/
  api/http.ts           axios instance and API error messages
  services/cafeApi.ts   typed endpoint calls
  hooks/                request loading/retry and timer logic
  state/CafeContext.tsx profile selection, basket, and success notices
  schemas/forms.ts      external Zod schemas and inferred form types
  utils/dates.ts        date display and API date conversion
  types.ts              API response types
  components/           navigation, cafe scene, and reusable form/state UI
  pages/                screen layout and user interactions
  assets.ts             replaceable artwork paths
  styles.css            custom Tailwind theme and draft styling
public/                 supplied reference assets and existing illustrations
```

The server owns prices, discounts, recommendations, priority scores, seat counts, and statistics. The browser owns navigation, display, selected item quantities, and the countdown. Changing artwork or layout does not require rewriting endpoint calls. Reuse the services and hooks when your partner refines the components.

## Verification

```powershell
npm.cmd run build
npm.cmd run test:e2e
npm.cmd run screenshots
```

The browser tests require Chrome, the running API, and the server folder at `../server`. For a different location, set `$env:TEMPO_SERVER_DIR` to that folder before testing. Tests create an isolated profile and delete only its temporary records afterward. Playwright is a development verification tool, not part of the application's runtime.

The tests exercise the full drink/notepad flow, pause persistence, seat changes, simultaneous capacity requests, task creation/editing/deletion, focus persistence/completion, the same-day discount, order placement/cancellation, seat reservation/cancellation, analytics, API failures/retry, and 375px page widths. Screenshots from the checks are saved in `docs/screenshots/`.

![Desktop entrance](docs/screenshots/landing-desktop.png)
![Interactive cafe](docs/screenshots/cafe-desktop.png)
![Mobile menu](docs/screenshots/menu-mobile.png)

## Scope and remaining work

Visual reference: [cafe.pauwee.com](https://cafe.pauwee.com/). At the user's request, the supplied reference room, table, drink, furniture and character files are now used directly. Cafe Tempo retains its own task, recommendation, session, reservation, order and analytics logic. These reference assets are not claimed as original Cafe Tempo artwork.

- Final illustration, typography, and interaction polish belong to the frontend refinement step.
- Focus Passport achievements and password authentication have not been added.
- A session does not automatically mark its task completed; update the task when its work is finished.
- The draft saves elapsed whole minutes from the server clock. A timer reaching zero opens task confirmation; it does not send background notifications.
- This is a shared demo profile, not a secure account boundary. Do not use it for private multi-user data.
- Add the frontend partner's confirmed name and contribution summary before submission. Backend author: Jan Matthew Ferreras. Every group member needs their own meaningful commits.

Server repository: <https://github.com/ferrerasjan/tempo-server>. Client repository: <https://github.com/ferrerasjan/tempo-client>.

## Recovery and task history

All session entry links use the drink workflow. Choosing a space with arrows saves the area immediately, with capacity checks for running timers. Individual illustrated chairs remain decorative. Completion confirmation is persisted separately from saved time, so failures can be retried after closing or refreshing. The next-cup form and saved task ID survive refresh; task/session/order creation reuses persisted request keys after a lost response. New session titles remain unchanged in both history and session details when the task is renamed. Older records fall back to the current task title.

Use Your Orders to consume a purchased item for a five-minute break during an active timer. The timer view retains only play/pause, stop, and room volume. Run `npx.cmd playwright test` while the API is running; database tests use isolated profiles and cleanup.
