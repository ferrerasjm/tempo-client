import { useEffect, useState } from 'react';
import { Link, useNavigate, useParams } from 'react-router-dom';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { cafeApi } from '../services/cafeApi';
import { useApi } from '../hooks/useApi';
import { useCafe } from '../state/CafeContext';
import { errorMessage } from '../api/http';
import { artwork } from '../assets';
import { dateTime, localInput } from '../utils/dates';
import { reservationSchema, type ReservationValues } from '../schemas/forms';
import { EmptyState, Feedback, Field, LoadState, PageHeading, Status } from '../components/ui';
import type { Availability } from '../types';

export function SpacesPage() {
  const state = useApi(cafeApi.areas);
  return <section className="page"><PageHeading eyebrow="Find your corner" title="Where will you settle in?" description="Five spaces, one small intention. Choose the mood that suits your task." /><LoadState {...state} retry={state.reload}>
    {!state.data?.length ? <EmptyState title="The rooms are not ready yet." /> : <div className="space-grid">{state.data.map((area, index) => <Link className={`space-choice space-${index}`} key={area._id} to={`/spaces/${area._id}`}><div className="space-image"><img src={artwork.room} alt="" /><span>{String(index + 1).padStart(2, '0')}</span></div><div className="space-copy"><h2>{area.name} <span aria-hidden="true">↗</span></h2><p>{area.theme}</p><small>{area.capacity} seats · {area.suggestedFocusMinutes} minute suggestion · {area.active ? 'Open' : 'Closed'}</small></div></Link>)}</div>}
  </LoadState></section>;
}

export function AreaPage() {
  const { id = '' } = useParams();
  const state = useApi(() => cafeApi.area(id), [id]);
  const { user, notify } = useCafe();
  const navigate = useNavigate();
  const [checked, setChecked] = useState<{ availability: Availability; startsAt: string; endsAt: string } | null>(null);
  const [error, setError] = useState('');
  const [reserving, setReserving] = useState(false);
  const { register, watch, handleSubmit, formState: { errors, isSubmitting } } = useForm<ReservationValues>({
    resolver: zodResolver(reservationSchema),
    defaultValues: { startsAt: localInput(new Date(Date.now() + 3600000)), endsAt: localInput(new Date(Date.now() + 7200000)) },
  });
  const startsAt = watch('startsAt'); const endsAt = watch('endsAt');
  useEffect(() => { setChecked(null); setError(''); }, [startsAt, endsAt, id]);

  async function check(values: ReservationValues) {
    setError(''); setChecked(null);
    try {
      const start = new Date(values.startsAt).toISOString(); const end = new Date(values.endsAt).toISOString();
      const availability = await cafeApi.availability(id, start, end);
      setChecked({ availability, startsAt: start, endsAt: end });
    } catch (reason) { setError(errorMessage(reason)); }
  }
  async function reserve() {
    if (!checked) return;
    setReserving(true); setError('');
    try {
      await cafeApi.reserve({ user: user!._id, area: id, startsAt: checked.startsAt, endsAt: checked.endsAt });
      notify('Your seat is reserved.'); navigate('/reservations');
    } catch (reason) { setError(errorMessage(reason)); setChecked(null); }
    finally { setReserving(false); }
  }

  return <section className="page"><Link className="text-link" to="/spaces">← All spaces</Link><LoadState {...state} retry={state.reload}>{state.data && <>
    <PageHeading eyebrow="Your cafe corner" title={state.data.name} description={state.data.theme} /><div className="split-layout"><div><img className="room-preview" src={artwork.room} alt="Temporary illustration of your cafe corner." /><p className="note">{state.data.capacity} seats · Suggested session: {state.data.suggestedFocusMinutes} minutes</p><Link className="button secondary" to={`/focus?area=${id}`}>Focus in this space →</Link></div>
    <form className="paper-form" onSubmit={handleSubmit(check)} noValidate><h2>Save yourself a seat.</h2><p>Check a time window before reserving. Dates use your device’s local time.</p>
      <Field label="Start time" error={errors.startsAt?.message}><input type="datetime-local" disabled={isSubmitting || reserving} {...register('startsAt')} /></Field>
      <Field label="End time" error={errors.endsAt?.message}><input type="datetime-local" disabled={isSubmitting || reserving} {...register('endsAt')} /></Field>
      <Feedback error={error} /><button className="button secondary" disabled={isSubmitting || reserving || !state.data.active}>{isSubmitting ? 'Checking…' : 'Check seats'}</button>
      {checked && <div className="availability" role="status"><strong>{checked.availability.remainingSeats} of {checked.availability.capacity} seats available</strong><p>{checked.availability.available ? 'There’s room for you.' : 'This space is unavailable for that time.'}</p><button className="button" type="button" disabled={!checked.availability.available || reserving} onClick={reserve}>{reserving ? 'Reserving…' : 'Reserve a seat'}</button></div>}
    </form></div>
  </>}</LoadState></section>;
}

export function ReservationsPage() {
  const { user, notify } = useCafe();
  const state = useApi(async () => {
    const [reservations, areas] = await Promise.all([cafeApi.reservations(user!._id), cafeApi.areas()]);
    return { reservations, areas };
  }, [user!._id]);
  const [error, setError] = useState(''); const [busy, setBusy] = useState('');
  async function cancel(id: string) {
    if (!window.confirm('Cancel this seat reservation?')) return;
    setError(''); setBusy(id);
    try { await cafeApi.cancelReservation(id); notify('Reservation cancelled.'); state.reload(); }
    catch (reason) { setError(errorMessage(reason)); }
    finally { setBusy(''); }
  }
  return <section className="page"><PageHeading eyebrow="Your reserved corners" title="A seat with your name on it." action={<Link className="button" to="/spaces">Reserve a seat</Link>} /><Feedback error={error} /><LoadState {...state} retry={state.reload}>
    {!state.data?.reservations.length ? <EmptyState title="No reservations yet." to="/spaces" label="Explore the spaces">Choose a room and check its availability.</EmptyState> : <div className="record-list">{state.data.reservations.map(item => { const past = new Date(item.endsAt).getTime() < Date.now(); return <article className="record-row" key={item._id}><div><h2>{state.data!.areas.find(area => area._id === item.area)?.name || 'Cafe area'}</h2><p>{dateTime(item.startsAt)} — {dateTime(item.endsAt)}</p><Status value={item.status === 'active' && past ? 'past' : item.status} /></div>{item.status === 'active' && !past && <button className="text-link danger" disabled={busy === item._id} onClick={() => cancel(item._id)}>Cancel reservation</button>}</article>; })}</div>}
  </LoadState></section>;
}
