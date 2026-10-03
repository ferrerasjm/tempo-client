import { Link } from 'react-router-dom';
import { MenuArtwork } from './MenuArtwork';
import type { RewardItem, TempoRewards } from '../types';

export function RewardTray({ rewards, loading, error, retry, enabled, busy, useItem, compact = false }: {
  rewards: TempoRewards | null; loading: boolean; error: string; retry: () => void;
  enabled: boolean; busy: boolean; useItem: (item: RewardItem) => void;
  compact?: boolean;
}) {
  if (compact && !error && !rewards?.items.length) return null;
  return <section className="reward-tray" aria-label="Break rewards">
    {loading && !rewards ? <p>Checking your rewards…</p> : error ? <p>Rewards could not be checked. <button className="text-link" onClick={retry}>Retry rewards</button></p> : rewards && <>
      {!compact && <p>{rewards.balance} Tempo Credits · <Link to="/menu">Reward shop</Link></p>}
      {rewards.items.length ? <><div className="table-rewards">{rewards.items.map(item => <button key={item.order + item.menuItem} aria-label={'Take a break with ' + item.name} title={'Use ' + item.name + ' for a ' + rewards.breakMinutes + '-minute break'} disabled={!enabled || busy} onClick={() => useItem(item)}><MenuArtwork name={item.name} snack={item.category === 'snack'} /><span className={compact ? 'reward-quantity' : ''}>{compact ? '× ' + item.quantity : item.name + ' × ' + item.quantity}</span></button>)}</div>{!compact && <p>Click a reward for a break of up to {rewards.breakMinutes} minutes. One item is used.</p>}</> : <p>Finish your full timer to earn credits for a break reward.</p>}
    </>}
  </section>;
}
