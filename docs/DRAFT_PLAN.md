# Working draft plan and screen map

## Inspection

The client repository initially contained only `.gitignore`. The server contained CommonJS Express route modules, seven Mongoose models, middleware, reusable calculations, a seed script, and 27 project endpoints. Authentication was absent. One `GET /api/users` route was added to read existing profiles without hardcoding IDs; it is not login or signup.

The concept calls for a cafe entrance, themed spaces, task planning, focus sessions, virtual orders, seat reservations, and productivity summaries. Credit-based gamification is implemented; optional passport stamps remain outside this draft. The reference site starts at a cafe entrance and proceeds to drink selection. Original temporary SVGs preserve that staged, illustrated feel while the required project flows remain usable.

## Implementation order

1. Set up the required client stack, response types, shared axios instance, services, and state.
2. Build the entrance, profile choice, object-based cafe navigation, and all concept screens.
3. Connect forms and mutations to the API, with validation and recoverable request states.
4. Check the full database flow, mobile navigation, desktop/mobile layouts, and handoff documentation.

## Screens and endpoint mapping

| Route | Screen | Server requests |
| --- | --- | --- |
| `/` | Illustrated entrance with one entry action | None; profile loading is shared |
| `/welcome` | Choose an existing study profile | `GET /users` |
| `/study/drink` | Select one available drink | `GET /menu-items`, `GET /focus-sessions` |
| `/study/size` | Tall / Grande / Venti duration | `GET /menu-items` |
| `/study/label` | Selected drink and name/label | `GET /menu-items` |
| `/study/task` | Task notepad and optional details; prepare session | `GET /tasks/:id` when retrying, `GET /cafe-areas`, `POST /tasks` or `PATCH /tasks/:id`, `POST /focus-sessions` |
| `/cafe` | Clickable cafe scene | Shared profile state |
| `/spaces` | Choose a cafe area | `GET /cafe-areas` |
| `/spaces/:id` | Study now or optional future reservation | `GET /cafe-areas/:id`, `GET /cafe-areas/:id/availability`, `GET /reservations`, `POST /reservations` |
| `/tasks` | Task board and priority | `GET /tasks`, `GET /tasks/priorities`, `DELETE /tasks/:id` |
| `/tasks/new` | New task form | `POST /tasks` |
| `/tasks/:id/edit` | Edit task/status | `GET /tasks/:id`, `PATCH /tasks/:id` |
| `/focus` | Select task/area/energy and request recommendation | `GET /tasks`, `GET /cafe-areas`, `GET /focus-sessions`, `POST /focus/recommendation`, `POST /focus-sessions` |
| `/focus/:id` | Start, pause/resume, stop, scene browsing, seat changes, music, and break | `GET /focus-sessions/:id`, `GET /tasks/:id`, `GET /cafe-areas`, `GET /cafe-areas/:id/availability`, `GET /rewards`, `PATCH /focus-sessions/:id` |
| `/history` | Session history and scores | `GET /focus-sessions`, `GET /tasks`, `GET /cafe-areas` |
| `/menu` | Reward shop, balance, and mission rules | `GET /menu-items`, `GET /rewards` |
| `/order-summary` | Preview and place virtual order | `POST /orders/calculate`, `POST /orders` |
| `/orders` | Order history | `GET /orders` |
| `/orders/:id` | Saved order and cancellation | `GET /orders/:id`, `PATCH /orders/:id` |
| `/reservations` | Reservation history and cancellation | `GET /reservations`, `GET /cafe-areas`, `PATCH /reservations/:id` |
| `/analytics` | Completed work, study statistics, and streaks | `GET /focus/statistics` (includes streak values) |

Paths above are relative to the shared `/api` base URL. List requests use the selected user's ID. Dynamic screens display the server's error for invalid or missing IDs. APIs not needed by a screen remain available for direct API testing.

## UI refinement handoff

Replace files in `public/` or change paths in `src/assets.ts`. Keep cafe links and their accessible labels when replacing the room illustration. Colors and typography live in `src/styles.css`; API logic lives in `src/services/`, request handling in `src/hooks/`, and validation in `src/schemas/`. Avoid duplicating the server's calculations in page components.
