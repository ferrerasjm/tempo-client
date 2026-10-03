# A quieter cafe draft

## Full-screen reference direction

The setup and counter now use a large centered white sheet on an original SVG cafe tabletop. Small hanging signs replace the conventional header. The lobby fills the viewport, and the focus screen uses a large countdown, a cup, a curved white table and side arrows.

The arrows switch between the quiet focus presentation and the session's cafe corner. They do not change the saved area, create another session, pause time or reset the countdown. Scene selection is temporary presentation state.

Shared record and form styling remains in styles.css. The immersive presentation is in experience.css. Native dialog navigation still provides access to every project page.

Photographic drink cutouts and real ambient footage are still optional replacements. The layout is closer to the reference, while the current illustrations remain original placeholders.

## What changed

- The header shows the wordmark and one Explore button. Secondary pages live in an accessible dialog with keyboard dismissal.
- The lobby has one primary study action and two cafe objects: the study board and counter.
- Session setup shows task, space, energy, then a suggested rhythm. Recommendations and session creation still come from the server.
- The timer is the main content. Completion opens a short confirmation form; cancellation is under Session details.
- Five original SVG room illustrations give the space browser distinct moods. Drink selection uses original cup and cookie illustrations.
- The counter starts with four item choices. Quantity controls appear only for selected items.
- Task editing and deletion sit under Manage task.
- Reduced motion preferences are respected; transitions are short, and mobile controls have generous touch targets.

## Reservation flow

Studying now does not require a booking. A reservation saves a virtual seat for a future visit; it does not start a focus session or physically book a real cafe.

1. Explore a space and open Reserve this space for later.
2. Choose a future start and duration. Input follows the device timezone; the review uses Philippine time.
3. Check availability. The client also checks the selected profile's existing reservations to explain overlaps before confirmation.
4. Review the start, end, space and remaining seats.
5. Confirm. The server rechecks capacity and overlaps before saving.

Change time returns to the form without creating a reservation. A failed confirmation returns to the form with the server error. Upcoming reservations appear first; cancelled and expired reservations are inside a history disclosure.

## Handoff

API calls remain in services/cafeApi.ts. Session setup and reservation state live in hooks/useStudySetup.ts and hooks/useReservation.ts. Form validation lives in schemas/forms.ts.

SpaceIllustration and MenuArtwork are original vector placeholders. Replace these presentation components with images without changing the hooks or API contracts. See ASSET_BRIEF.md.

No backend endpoint, recommendation formula, order discount, authentication or achievement system was added by this redesign.
