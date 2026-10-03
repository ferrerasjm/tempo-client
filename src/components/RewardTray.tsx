import { Link } from 'react-router-dom';
import { MenuArtwork } from './MenuArtwork';
import type { RewardItem, TempoRewards } from '../types';

export function RewardTray({ rewards, loading, error, retry, enabled, busy, useItem }: {
  rewards: TempoRewards | null; loading: boolean; error: string; retry: () => void;
  enabled: boolean; busy: boolean; useItem: (item: RewardItem) => void;
}) {
  return <section className="reward-tray" aria-label="Break rewards">
    {loading && !rewards ? <p>Checking your rewards…</p> : error ? <p>Rewards could not be checked. <button className="text-link" onClick={retry}>Retry rewards</button></p> : rewards && <>
      <p>{rewards.balance} Tempo Credits · <Link to="/menu">Reward shop</Link></p>
      {rewards.items.length ? <><div className="table-rewards">{rewards.items.map(item => <button key={item.order + item.menuItem} aria-label={'Take a break with ' + item.name} disabled={!enabled || busy} onClick={() => useItem(item)}><MenuArtwork name={item.name} snack={item.category === 'snack'} /><span>{item.name} × {item.quantity}</span></button>)}</div><p>Click a reward for a break of up to {rewards.breakMinutes} minutes. One item is used.</p></> : <p>Finish your full timer to earn credits for a break reward.</p>}
    </>}
  </section>;
}
