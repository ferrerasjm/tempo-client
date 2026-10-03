# Focus room presentation

The focus screen uses the images supplied by the user, copied unchanged from Downloads into `public/assets/cafe/`. The arrows select and save a cafe area; running moves check capacity immediately, while planned and paused selection keeps the clock stopped. The illustrated furniture is not clickable seating.

The cup overlaps the center edge of the supplied foreground table, with its base on the white tabletop. Virtual spaces show the small countdown, play/pause and stop icons, plus a volume slider. Task text and the large countdown appear only in the plain focus view. There are no table capacity counts, setup/cancel buttons, settings dialog or reward items on the table. Completed sessions show their saved result and links separately from the live controls.

Ordinary pause freezes the timer without consuming a reward and stays paused until resumed. Purchased rewards can be consumed from Your Orders to begin a five-minute timed break. A configured music track plays only while a timer is running in a virtual space; entering the plain focus view, pausing, stopping or leaving the page stops playback. No audio file is configured yet, at the user's request, so the room slider is currently disabled.

At 00:00, `SessionFinish.tsx` opens a confirmation modal with the selected drink and task. Confirming saves focus time before marking the task complete so the existing credit rules apply. The user can also save without marking the task finished. A second modal then offers available drinks, the three existing sizes and a validated new task title. Go starts the next session in the displayed space; server capacity checks still apply. Closing either modal does not start a new session. Save failures remain visible and retryable, including when the session was saved but the task update failed.

## Assets and components

- `focus-bg.webp`: transparent foreground table in the plain focus view.
- `social-bg.webp`: supplied room background, including its foreground table. All five areas currently share this image because no separate area backgrounds or window video were supplied.
- `table-and-chair.svg` and the four supplied character files (`1-yellow.svg`, `2-green.svg`, `3-blue.svg`, `4-red.svg`): enlarged furniture and seated characters. Four decorative visitors appear in a row on desktop and in two rows on smaller screens. The middle tables sit above the foreground drink. They do not represent profiles or occupy seats.
- Six supplied drink WebP files replace the drawn drink graphics. The existing Cafe Latte uses `latte.webp`, Matcha Tea uses `matcha.webp`, and Hot Chocolate uses the closest supplied chocolate drink image, `mocha.webp`. Menu names, prices and database records were not changed. No snack picture was supplied, so snacks use their name without an invented image.
- `signboard.webp`: preserved in the asset folder for the entrance/counter design step; it is not currently displayed. Its original Sip n' Ship branding has not been edited.
- `src/assets.ts`: centralized image paths.
- `src/components/CafeRoomScene.tsx`: layers the supplied room, furniture, characters and small drinks.
- `src/components/MenuArtwork.tsx`: chooses the supplied drink image from the existing menu name.
- `src/focus-room.css`: timer/table composition, image positioning, captions and mobile styles.

Character movement uses a gentle seven-pixel vertical CSS animation, with staggered timing. Hover or keyboard focus reveals the activity in a white, square-cornered tooltip with a black outline; Escape hides it. Reduced-motion settings stop the movement. This presentation adds no account presence, chair reservations or database changes.

## Check the result

The enlarged Cafe Tempo and Explore the Cafe signs center their artwork and labels. Shared dialogs are centered in the viewport. The Explore menu keeps the drink/timer entry, Task Board, Reward Shop, Your Orders, Focus History, Productivity Analytics and Change Profile. Labels use title case with spaces. Cafe Lobby, recommendation, space-finder and reservation links have been removed from this menu; their pages and API routes are retained for later review.

The menu checks the selected profile's unfinished timer when opened: it offers Return To Focus if one exists, otherwise Choose A Drink. Opening `/study/drink` with an unfinished timer redirects to that timer instead of showing a blocked setup sheet. The saved FocusSession record still supplies pause/resume timestamps, completed time and analytics; it is not an extra setup step.

1. Run both servers using the README commands.
2. Prepare a session or open one through Focus history.
3. Use the scene arrows to visit the cafe areas.
4. Hover or focus a visitor, then dismiss the caption with Escape.
5. Press Play to begin, Pause to freeze the countdown, and Play again to resume. Reload while paused to check persistence.
6. Return to the plain focus view with the arrows: the task returns and the volume slider disappears.
7. Check the layout at 375px and stop the session to save its whole focus minutes.

Run `npm.cmd run build`, `npm.cmd run test:e2e` and `npm.cmd run screenshots` in the client folder. Integration tests use isolated profiles with cleanup hooks; presentation tests use API fixtures and a fake audio element to check room/focus playback transitions without adding an audio file. The screenshot script reads existing demo data. Actual playback must be checked once a track is supplied.

Asset source/reference: https://cafe.pauwee.com/. These supplied reference assets are being used directly at the user's request; they are not original Cafe Tempo illustrations. Their use does not establish compliance with the rubric's originality criterion.

Completion confirmation and pending next-cup details now survive refresh. Reward items can be used from Your Orders, while timer-table controls remain unchanged. See the updated README for request replay and historical task titles.
