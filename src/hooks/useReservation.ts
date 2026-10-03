import { useEffect, useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { reservationSchema, type ReservationValues } from '../schemas/forms';
import { localInput } from '../utils/dates';
import { cafeApi } from '../services/cafeApi';
import { errorMessage } from '../api/http';
import type { Availability } from '../types';

export function useReservation(areaId: string, userId: string) {
  const form = useForm<ReservationValues>({ resolver: zodResolver(reservationSchema), defaultValues: {
    startsAt: localInput(new Date(Date.now() + 3600000)), durationMinutes: 60,
  } });
  const [checked, setChecked] = useState<{ availability: Availability; startsAt: string; endsAt: string } | null>(null);
  const [error, setError] = useState('');
  const [reserving, setReserving] = useState(false);
  const startsAt = form.watch('startsAt');
  const durationMinutes = form.watch('durationMinutes');
  useEffect(() => { setChecked(null); setError(''); }, [startsAt, durationMinutes, areaId]);

  async function check(values: ReservationValues) {
    setError(''); setChecked(null);
    try {
      const start = new Date(values.startsAt).toISOString();
      const end = new Date(new Date(start).getTime() + values.durationMinutes * 60000).toISOString();
      const [availability, ownReservations] = await Promise.all([
        cafeApi.availability(areaId, start, end), cafeApi.reservations(userId),
      ]);
      if (ownReservations.some(item => item.status === 'active' && new Date(item.startsAt) < new Date(end) && new Date(item.endsAt) > new Date(start))) {
        setError('You already have a reservation during this time. Choose another time or cancel the existing reservation.');
      } else if (!availability.available) {
        setError('No seats are available for this time. Try another time or space.');
      } else {
        setChecked({ availability, startsAt: start, endsAt: end });
      }
    } catch (reason) { setError(errorMessage(reason)); }
  }

  async function reserve() {
    if (!checked) return false;
    setReserving(true); setError('');
    try {
      await cafeApi.reserve({ user: userId, area: areaId, startsAt: checked.startsAt, endsAt: checked.endsAt });
      return true;
    } catch (reason) { setError(errorMessage(reason)); setChecked(null); return false; }
    finally { setReserving(false); }
  }
  return { form, checked, error, reserving, check, reserve, changeTime: () => setChecked(null) };
}
