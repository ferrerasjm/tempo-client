# Cafe Tempo

A virtual productivity cafe built with React, Vite, TypeScript, Tailwind CSS, React Router, React Hook Form, Zod, and axios. It connects to the Cafe Tempo Express API and MongoDB Atlas.

## Start the application

Use Node.js 22.12 through 24 and npm 10 or newer, as declared in `package.json`. Open two PowerShell terminals. In the first:

```powershell
cd C:\Users\mjfer\cafe-tempo\server
npm.cmd install
Copy-Item .env.example .env
npm.cmd run seed:reset
npm.cmd run dev
```

Set `MONGO_URI` in the server's private `.env` before seeding. `seed:reset` deletes and recreates only the records owned by `demo@cafetempo.test`, producing predictable presentation data. Use `npm.cmd run seed` when existing demo activity should be preserved. In the second terminal:

```powershell
cd C:\Users\mjfer\cafe-tempo\client
npm.cmd install
npm.cmd run dev
```

Open **http://localhost:5173**. Use `localhost` so it matches the server's default CORS origin. The client defaults to `http://localhost:5000/api`. To change that address, copy `.env.example` to `.env` and edit `VITE_API_URL`; restart Vite afterward. Client environment variables are public, so never put database credentials here.

Click the animated cafe entrance (hover or focus to see **ready to lock in?**), choose **Demo Student**, then choose a drink, its size, a name or label, and a task. The notepad prepares your session; the **Play timer** icon starts it. Use **Explore the Cafe** to return to focus, choose a drink when no timer is unfinished, or visit the Task Board, reward shop, orders, history and analytics. Profile selection is not authentication. The existing backend has no password login; authentication is optional under the rubric and has not been implemented.

## What the application supports

- Create, edit, complete, filter, and delete tasks on the Task Board. Add asks only for task text; Edit shows the same text and task status. Existing planning metadata is preserved when editing. Rows show readable status and saved session totals. Numbered pagination defaults to ten tasks per page, with five/twenty options. The current task links back to its timer; focusing another task explicitly confirms ending the current session before drink setup. An unfinished linked session blocks deletion; completed history is preserved by soft deletion.
- Focus from the Task Board opens drink setup with that task selected. Setup supports new or existing unfinished tasks. At timer completion, confirm the task or continue it with another drink; dismissed completion prompts can be reopened. Newly created sessions preserve their task title in history, while older sessions use the current task title.
- Explore five cafe areas, check availability, reserve a seat, and cancel a reservation.
- Prepare a session through drink selection (Tall 25, Grande 45, Venti 60 minutes), a label, and a task notepad. The recommendation processing API remains available; the UI uses drink sizes for session duration.
- Start, take a purchased reward break, resume, stop, and reload sessions using server timestamps. Stopping saves elapsed whole minutes; sessions under one minute are cancelled.
- Browse the five spaces with arrows; persist a selected space while running, planned, or paused. Full areas are blocked by the server. Pausing releases the seat; resuming checks capacity again.
- Earn Tempo Credits from full focus sessions and task goals; spend them on single-use rewards consumed from Your Orders. A reward unlocks a timed break; unused orders can be refunded.
- The cup overlaps the supplied foreground table. Virtual spaces show only a small timer, play/pause, stop and volume; the plain focus view keeps the task and large timer. Each of the five spaces has its own music track. Music pauses when returning to focus, pausing, stopping, or leaving the room.
- Run a countdown from the persisted session start time and show the recommended break after completion.
- Select a session drink during setup. Spend Tempo Credits on one pastry at a time, preview server-calculated totals/discounts, place an order, view order history, use the pastry from an active timer, and cancel a wholly unused order.
- Read productivity statistics, current streak, longest streak, favorite area, and most ordered drink.
- Recover from failed requests and show validation, empty, loading, and success states.

The focus room uses supplied table, room, drink, pastry, furniture, character, and audio assets. Character captions work on hover and keyboard focus; reduced-motion settings stop their gentle movement. These illustrations do not represent active users or individual chair reservations. Each cafe area maps to a distinct background and music track.

There are 20 content routes plus the /focus setup alias, with a shared component for the add/edit task form. The endpoint map is documented in the server [README](../server/README.md).

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
  styles.css            custom Tailwind theme and shared styling
public/                 supplied reference assets and existing illustrations
```

The server owns prices, discounts, recommendations, priority scores, seat counts, and statistics. The browser owns navigation, display, selected item quantities, and the countdown. Changing artwork or layout does not require rewriting endpoint calls. Reuse the services and hooks when your partner refines the components.

## Verification

```powershell
npm.cmd run build
npm.cmd run typecheck
```

The build and typecheck commands provide the client validation pass. Functional verification is performed manually against the running client and API.

## Scope and remaining work

Visual reference: [cafe.pauwee.com](https://cafe.pauwee.com/). At the user's request, the supplied reference room, table, drink, furniture and character files are now used directly. Cafe Tempo retains its own task, recommendation, session, reservation, order and analytics logic. These reference assets are not claimed as original Cafe Tempo artwork.

Poppins is distributed with its OFL license at `public/fonts/poppins/OFL.txt`. The room music and interface sound files were supplied for this project; confirm their source and redistribution permission with the group before making the repository public or reusing them outside the course submission.

- Focus Passport achievements and password authentication have not been added.
- A session does not automatically mark its task completed; update the task when its work is finished.
- The draft saves elapsed whole minutes from the server clock. A timer reaching zero opens task confirmation; it does not send background notifications.
- This is a shared demo profile, not a secure account boundary. Do not use it for private multi-user data.
- Add the frontend partner's confirmed name and contribution summary before submission. Backend author: Jan Matthew Ferreras. Every group member needs their own meaningful commits.

Server repository: <https://github.com/ferrerasjan/tempo-server>. Client repository: <https://github.com/ferrerasjan/tempo-client>.

## Recovery and task history

All session entry links use the drink workflow. Choosing a space with arrows saves the area immediately, with capacity checks for running timers. Individual illustrated chairs remain decorative. Completion confirmation is persisted separately from saved time, so failures can be retried after closing or refreshing. The next-cup form and saved task ID survive refresh; task/session/order creation reuses persisted request keys after a lost response. New session titles remain unchanged in both history and session details when the task is renamed. Older records fall back to the current task title.

Use the pastry shown on an active timer to start its 5, 10, or 15-minute reward break. The timer view retains play/pause, stop, room volume, and the available pastry.
