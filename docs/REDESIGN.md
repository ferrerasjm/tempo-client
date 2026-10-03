# A quieter cafe draft

## Animated entrance

The landing page uses the supplied cats-outdoor-cafe.gif, copied unchanged to public/assets/cafe-entrance.gif. The full image links to /welcome for demo profile selection. Hover and keyboard focus show “ready to lock in?”; touch devices show the invitation without hover. The separate Enter button and landing header are removed. The GIF path stays in assets.ts, and the entry presentation lives in entrance.css.

## Full-screen reference direction

The setup and counter now use a large centered white sheet on an original SVG cafe tabletop. Small hanging signs replace the conventional header. The lobby fills the viewport, and the focus screen uses a large countdown, a cup, a curved white table and side arrows.

The arrows preview the five cafe spaces without resetting the timer. Start session takes a seat in the selected space; Reserve this seat moves an already running session after the server checks capacity. The saved area stays unchanged while browsing.

Shared record and form styling remains in styles.css. The immersive presentation is in experience.css. Native dialog navigation still provides access to every project page.

Photographic drink cutouts and real ambient footage are still optional replacements. The layout is closer to the reference, while the current illustrations remain original placeholders.

## What changed

- The header shows the wordmark and one Explore button. Secondary pages live in an accessible dialog with keyboard dismissal.
- The lobby has one primary study action and two cafe objects: the study board and counter.
- The main setup is profile, drink, size, label, and task notepad. Smart focus recommendation remains available through Explore. Durations and session creation come from the server.
- The timer is the main content. Start, reward breaks, resume, and stop are explicit controls. Stop saves elapsed whole minutes; Session details explains seat behavior.
- Five original SVG room illustrations give the space browser distinct moods. Drink selection uses original cup and cookie illustrations.
- The counter starts with four item choices. Quantity controls appear only for selected items.
- Task editing and deletion sit under Manage task.
- Reduced motion preferences are respected; transitions are short, and mobile controls have generous touch targets.

## Reservation flow

Studying now takes a live seat when Start session is clicked; it does not require a separate future booking. A reservation saves a virtual seat for a future visit; it does not start a focus session or physically book a real cafe.

1. Explore a space and open Reserve this space for later.
2. Choose a future start and duration. Input follows the device timezone; the review uses Philippine time.
3. Check availability. The client also checks the selected profile's existing reservations to explain overlaps before confirmation.
4. Review the start, end, space and remaining seats.
5. Confirm. The server rechecks capacity and overlaps before saving.

Change time returns to the form without creating a reservation. A failed confirmation returns to the form with the server error. Upcoming reservations appear first; cancelled and expired reservations are inside a history disclosure.

## Handoff

API calls remain in services/cafeApi.ts. Setup, session actions, and reservations live in hooks/useStudyEntry.ts, hooks/useFocusRoom.ts, and hooks/useReservation.ts. Form validation lives in schemas/forms.ts.

SpaceIllustration and MenuArtwork are original vector placeholders. Replace these presentation components with images without changing the hooks or API contracts. See ASSET_BRIEF.md.

The new flow extends the existing focus-session endpoints with planned/paused state, selected drink fields, persisted timer actions, and shared live-seat capacity checks. The recommendation formula and order discount remain available. Tempo Credits missions and purchased break rewards are implemented. Authentication and passport achievements remain unimplemented. See STUDY_FLOW.md.

## Focus room spacing

All five room scenes fill the viewport width using SVG cover scaling. The foreground table is 235 pixels tall on desktop and 255 pixels on mobile. Essential timer and seat controls remain visible; credits, sound, session details, and break explanations are in the keyboard-accessible Session settings dialog. Purchased rewards remain as small clickable table items. This keeps most of the viewport available for the cafe scene.
