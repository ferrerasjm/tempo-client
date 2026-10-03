import { Link } from 'react-router-dom';
import { Modal } from './Modal';
import type { useFocusRoom } from '../hooks/useFocusRoom';
import type { useFocusMusic } from '../hooks/useFocusMusic';

export function FocusSettings({ open, onClose, room, music }: {
  open: boolean; onClose: () => void;
  room: ReturnType<typeof useFocusRoom>; music: ReturnType<typeof useFocusMusic>;
}) {
  const session = room.session;
  if (!session) return null;
  return <Modal open={open} title="Session settings" onClose={onClose}>
    <div className="focus-settings">
      <h3>Sound</h3>
      <div className="music-controls"><button className="text-link" disabled={!music.available || session.status !== 'active' || room.timer.remainingSeconds === 0} onClick={music.toggle}>{music.playing ? 'Pause music' : 'Play music'}</button><label>Volume<input type="range" min={0} max={1} step={.05} value={music.volume} disabled={!music.available} onChange={event => music.setVolume(Number(event.target.value))} /></label></div>
      {!music.available && <p className="note">Background music hasn’t been added yet.</p>}
      {music.error && <p className="note" role="status">{music.error}</p>}
      <h3>Your session</h3>
      <p className="note">{session.plannedMinutes} minute focus · {session.breakMinutes} minute break · {room.timer.elapsedMinutes} minutes focused</p>
      {session.drinkName && <p className="note">{session.drinkSize} {session.drinkName}</p>}
      <button className="text-link" onClick={room.seats.reload}>Refresh seats</button>
      <h3>Break rewards</h3>
      {room.rewards.error ? <p className="note">Rewards could not be checked. <button className="text-link" onClick={room.rewards.reload}>Retry rewards</button></p> : <p className="note">{room.rewards.data?.balance ?? '…'} Tempo Credits · <Link to="/menu" onClick={onClose}>Reward shop</Link></p>}
      <p className="note">Finish your full timer to earn credits for a break reward.</p>
      <p className="note">Click a purchased item on the table for a break of up to five minutes. One item is used and your seat is released. Resuming checks availability again.</p>
      <p className="note">Stopping early saves your focus time but earns no mission credits.</p>
    </div>
  </Modal>;
}
