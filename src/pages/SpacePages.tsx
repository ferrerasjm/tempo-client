import { useState } from "react";
import { Link, useNavigate, useParams } from "react-router-dom";
import { cafeApi } from "../services/cafeApi";
import { useApi } from "../hooks/useApi";
import { useReservation } from "../hooks/useReservation";
import { useCafe } from "../state/CafeContext";
import { errorMessage } from "../api/http";
import { dateTime } from "../utils/dates";
import {
  EmptyState,
  Feedback,
  Field,
  LoadState,
  PageHeading,
  Status,
} from "../components/ui";
import { SpaceBrowser } from "../components/SpaceBrowser";
import { displayAreaName } from "../assets";
import { SpaceIllustration } from "../components/SpaceIllustration";
import { useConfirmation } from "../state/ConfirmationContext";
import { PageNavigation } from "../state/SessionNavigation";

export function SpacesPage() {
  const state = useApi(cafeApi.areas);
  const [selected, setSelected] = useState("");
  const area =
    state.data?.find((item) => item._id === selected) || state.data?.[0];
  return (
    <section className="page narrow centered">
      <PageNavigation to="/welcome" label="Back to Welcome" />
      <PageHeading
        eyebrow="Find your corner"
        title="Where will you settle in?"
        description="Take a look around. Each corner has its own little rhythm."
      />
      <LoadState {...state} retry={state.reload}>
        {!state.data?.length ? (
          <EmptyState title="The rooms are not ready yet." />
        ) : (
          <>
            <SpaceBrowser
              areas={state.data}
              value={area!._id}
              onChange={setSelected}
            />
            <Link className="button" to={`/spaces/${area!._id}`}>
              Choose This Space →
            </Link>
          </>
        )}
      </LoadState>
    </section>
  );
}

export function AreaPage() {
  const { id = "" } = useParams();
  const state = useApi(() => cafeApi.area(id), [id]);
  const { user, notify } = useCafe();
  const navigate = useNavigate();
  const booking = useReservation(id, user!._id);
  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
  } = booking.form;
  async function reserve() {
    if (await booking.reserve()) {
      notify("Your seat is reserved.");
      navigate("/reservations");
    }
  }
  return (
    <section className="page narrow centered">
      <PageNavigation to="/spaces" label="Back to Cafe Spaces" />
      <LoadState {...state} retry={state.reload}>
        {state.data && (
          <>
            <PageHeading
              eyebrow="Your cafe corner"
              title={displayAreaName(state.data.name)}
              description={state.data.theme}
            />
            <SpaceIllustration name={state.data.name} />
            <p className="note">
              {state.data.capacity} virtual seats · Suggested focus:{" "}
              {state.data.suggestedFocusMinutes} minutes
            </p>
            {state.data.active ? (
              <Link className="button" to={`/focus?area=${id}`}>
                Focus Here Now →
              </Link>
            ) : (
              <p>This space is currently closed.</p>
            )}
            <p className="note">
              You can start focusing without a reservation.
            </p>
            <details className="reservation-details">
              <summary>Reserve This Space For Later</summary>
              <div className="paper-form booking-form">
                <h2>Save a future seat.</h2>
                <p>
                  One virtual seat for you. Times below use your device’s local
                  time.
                </p>
                {booking.checked ? (
                  <div className="booking-review" role="status">
                    <p className="eyebrow">Ready to reserve</p>
                    <p className="note">
                      Review times: Philippine time (UTC+8).
                    </p>
                    <h3>{displayAreaName(state.data.name)}</h3>
                    <dl className="summary-list">
                      <div>
                        <dt>Starts</dt>
                        <dd>{dateTime(booking.checked.startsAt)}</dd>
                      </div>
                      <div>
                        <dt>Ends</dt>
                        <dd>{dateTime(booking.checked.endsAt)}</dd>
                      </div>
                      <div>
                        <dt>Seats available</dt>
                        <dd>{booking.checked.availability.remainingSeats}</dd>
                      </div>
                    </dl>
                    <p className="note">
                      The cafe checks availability again when you confirm.
                    </p>
                    <button
                      className="button w-full"
                      disabled={booking.reserving}
                      onClick={reserve}
                    >
                      {booking.reserving ? "Reserving…" : "Confirm Reservation"}
                    </button>
                    <button
                      className="text-link"
                      disabled={booking.reserving}
                      onClick={booking.changeTime}
                    >
                      Change Time
                    </button>
                  </div>
                ) : (
                  <form onSubmit={handleSubmit(booking.check)} noValidate>
                    <Field label="Start time" error={errors.startsAt?.message}>
                      <input
                        type="datetime-local"
                        disabled={isSubmitting}
                        {...register("startsAt")}
                      />
                    </Field>
                    <Field
                      label="Duration"
                      error={errors.durationMinutes?.message}
                    >
                      <select
                        disabled={isSubmitting}
                        {...register("durationMinutes", {
                          valueAsNumber: true,
                        })}
                      >
                        {[30, 45, 60, 90, 120].map((minutes) => (
                          <option key={minutes} value={minutes}>
                            {minutes} minutes
                          </option>
                        ))}
                      </select>
                    </Field>
                    <button
                      className="button"
                      disabled={isSubmitting || !state.data.active}
                    >
                      {isSubmitting ? "Checking…" : "Check Availability"}
                    </button>
                  </form>
                )}
                <Feedback error={booking.error} />
              </div>
            </details>
          </>
        )}
      </LoadState>
    </section>
  );
}

export function ReservationsPage() {
  const confirm = useConfirmation();
  const { user, notify } = useCafe();
  const state = useApi(async () => {
    const [reservations, areas] = await Promise.all([
      cafeApi.reservations(user!._id),
      cafeApi.areas(),
    ]);
    return { reservations, areas };
  }, [user!._id]);
  const [error, setError] = useState("");
  const [busy, setBusy] = useState("");
  async function cancel(id: string) {
    if (
      !(await confirm({
        title: "Cancel this reservation?",
        message:
          "Your reserved seat will be released. You can make another reservation later.",
        confirmLabel: "Cancel Reservation",
        cancelLabel: "Keep Reservation",
      }))
    )
      return;
    setError("");
    setBusy(id);
    try {
      await cafeApi.cancelReservation(id);
      notify("Reservation cancelled.");
      state.reload();
    } catch (reason) {
      setError(errorMessage(reason));
    } finally {
      setBusy("");
    }
  }
  const upcoming =
    state.data?.reservations.filter(
      (item) =>
        item.status === "active" &&
        new Date(item.endsAt).getTime() > Date.now(),
    ) || [];
  const past =
    state.data?.reservations.filter((item) => !upcoming.includes(item)) || [];
  function rows(items: typeof upcoming) {
    return (
      <div className="record-list">
        {items.map((item) => (
          <article className="record-row" key={item._id}>
            <div>
              <h2>
                {displayAreaName(state.data!.areas.find((area) => area._id === item.area)?.name || "Cafe area")}
              </h2>
              <p>
                {dateTime(item.startsAt)} — {dateTime(item.endsAt)}
              </p>
              <Status
                value={
                  item.status === "active" &&
                  new Date(item.endsAt).getTime() < Date.now()
                    ? "past"
                    : item.status
                }
              />
            </div>
            {upcoming.includes(item) && (
              <button
                className="text-link danger"
                disabled={busy === item._id}
                onClick={() => cancel(item._id)}
              >
                Cancel Reservation
              </button>
            )}
          </article>
        ))}
      </div>
    );
  }
  return (
    <section className="page narrow">
      <PageNavigation to="/welcome" label="Back to Welcome" />
      <PageHeading
        eyebrow="Your reserved corners"
        title="A seat for later."
        description="Reservations save a virtual seat for a future focus session."
        action={
          <Link className="button" to="/spaces">
            Find A Space
          </Link>
        }
      />
      <Feedback error={error} />
      <LoadState {...state} retry={state.reload}>
        {upcoming.length ? (
          rows(upcoming)
        ) : (
          <EmptyState
            title="No upcoming reservations."
            to="/spaces"
            label="Explore The Spaces"
          >
            You can also start focusing straight away.
          </EmptyState>
        )}
        {past.length > 0 && (
          <details className="reservation-details">
            <summary>Past & cancelled reservations ({past.length})</summary>
            {rows(past)}
          </details>
        )}
      </LoadState>
    </section>
  );
}
