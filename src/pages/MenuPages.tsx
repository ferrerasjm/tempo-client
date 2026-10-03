import { useState } from 'react';
import { Link, useNavigate, useParams } from 'react-router-dom';
import { cafeApi } from '../services/cafeApi';
import { useApi } from '../hooks/useApi';
import { useCafe } from '../state/CafeContext';
import { errorMessage } from '../api/http';
import { dateTime } from '../utils/dates';
import { EmptyState, Feedback, LoadState, PageHeading, Status } from '../components/ui';
import { pendingRequest, clearPendingRequest } from '../utils/pendingRequests';
import { MenuArtwork } from '../components/MenuArtwork';

export function MenuPage() {
  const state = useApi(cafeApi.pastries); const { user, basket, setQuantity } = useCafe();
  const rewards = useApi(() => cafeApi.rewards(user!._id), [user!._id]);
  const count = basket.reduce((total, item) => total + item.quantity, 0);
  const selectedCredits = basket.reduce((total, entry) => {
    const item = state.data?.find(menuItem => menuItem._id === entry.menuItem);
    return total + (item?.priceCredits || 0) * entry.quantity;
  }, 0);
  const insufficientCredits = selectedCredits > (rewards.data?.balance ?? 0);
  return <section className="page counter-page centered"><Link className="text-link back-to-focus-link" to="/focus">← Back to Focus</Link><PageHeading eyebrow="At the counter" title="What would you like?" description="Spend earned Tempo Credits on rewards. Use an item from Your Orders for a short focus break." />
    <LoadState {...rewards} retry={rewards.reload}>{rewards.data && <div className="tempo-missions"><p><strong>{rewards.data.balance} Tempo Credits</strong></p></div>}</LoadState>
    <LoadState {...state} retry={state.reload}>{!state.data?.length ? <EmptyState title="The menu isn’t ready yet." /> : <div className="menu-grid">{state.data.map(item => {
      const quantity = basket.find(entry => entry.menuItem === item._id)?.quantity || 0;
      const unaffordable = item.priceCredits > (rewards.data?.balance ?? 0);
      return <article className={`menu-item ${quantity ? 'selected' : ''} ${unaffordable ? 'unaffordable' : ''}`} key={item._id}>
        <button className="menu-pick" aria-label={`Choose ${item.name}`} aria-pressed={quantity > 0} disabled={!item.available} onClick={() => setQuantity(item._id, quantity ? 0 : 1)}><MenuArtwork name={item.name} snack={item.category === 'snack'} /><h2>{item.name}</h2><p>{item.priceCredits} credits {!item.available && '· Unavailable'}</p>{unaffordable && quantity > 0 && <p className="insufficient-credits">Insufficient Credits</p>}</button>
        {quantity > 0 && <div className="quantity-control"><button aria-label={`Remove one ${item.name}`} onClick={() => setQuantity(item._id, quantity - 1)}>−</button><output aria-label={`${item.name} quantity`}>{quantity}</output><button aria-label={`Add one ${item.name}`} disabled={quantity >= 20} onClick={() => setQuantity(item._id, quantity + 1)}>+</button></div>}
      </article>;
    })}</div>}</LoadState>
    <div className="basket-bar">{count > 0 && <span>{`${count} ${count === 1 ? 'item' : 'items'} on your tray`}</span>}{count > 0 ? insufficientCredits ? <button className="button" disabled>Insufficient Credits</button> : <Link className="button" to="/order-summary">Review Order</Link> : <button className="button" disabled>Choose First</button>}</div>
    <Link className="text-link past-orders-link" to="/orders">View Past Orders</Link>
  </section>;
}

export function CheckoutPage() {
  const { user, basket, clearBasket, notify } = useCafe(); const navigate = useNavigate();
  const state = useApi(() => basket.length ? cafeApi.preview(user!._id, basket) : Promise.resolve(null), [user!._id, JSON.stringify(basket)]);
  const [busy, setBusy] = useState(false); const [error, setError] = useState('');
  async function place() {
    setBusy(true); setError('');
    try {
      const requestName = user!._id + '-order-' + JSON.stringify(basket);
      const order = await cafeApi.placeOrder(user!._id, basket, pendingRequest(requestName));
      clearPendingRequest(requestName);
      clearBasket(); notify('Reward Order Placed. Use Your Orders to take a break.'); navigate(`/orders/${order._id}`);
    } catch (reason) { setError(errorMessage(reason)); state.reload(); }
    finally { setBusy(false); }
  }
  return <section className="page narrow checkout-page"><PageHeading eyebrow="Before we make your order" title="A little treat, sorted." description="Prices and any focus discount are checked by the cafe when you order." /><Link className="text-link checkout-back" to="/menu">← Back to Shop</Link><LoadState {...state} retry={state.reload}>
    {!basket.length ? <EmptyState title="Your tray is empty." to="/menu" label="Visit the counter" /> : state.data && <div className="receipt"><p className="eyebrow">cafe tempo · your order</p><div className="receipt-items">{state.data.items.map(item => <div key={item.menuItem}><span>{item.name} × {item.quantity}</span><strong>{item.unitPriceCredits * item.quantity} cr</strong></div>)}</div><dl className="summary-list"><div><dt>Subtotal</dt><dd>{state.data.subtotalCredits} credits</dd></div><div><dt>Focus discount</dt><dd>−{state.data.discountCredits} credits</dd></div><div className="total"><dt>Total</dt><dd>{state.data.totalCredits} Tempo Credits</dd></div><div><dt>Your balance</dt><dd>{state.data.availableCredits} Tempo Credits</dd></div></dl><p className="note">{state.data.focusDiscountApplied ? 'Your completed focus session today earned 10% off.' : 'Complete a focus session today to earn 10% off.'} Use purchased items from Your Orders during an active timer. Each item unlocks one short break.</p><Feedback error={error} />{!state.data.canAfford && <p className="note">Not enough Tempo Credits. Finish a full focus timer or complete its task to earn more.</p>}<button className="button w-full" disabled={busy || !state.data.canAfford} onClick={place}>{busy ? 'Placing your order…' : 'Place Order'}</button></div>}
  </LoadState></section>;
}

export function OrderPage() {
  const { id = '' } = useParams(); const { user, notify } = useCafe(); const navigate = useNavigate();
  const state = useApi(() => cafeApi.order(id), [id]); const [error, setError] = useState(''); const [busy, setBusy] = useState(false);
  const inventory = useApi(async () => {
    const [rewards, sessions] = await Promise.all([cafeApi.rewards(user!._id), cafeApi.sessions(user!._id)]);
    return { items: rewards.items.filter(item => item.order === id), active: sessions.find(session => session.status === 'active') };
  }, [id, user!._id]);
  async function useReward(menuItem: string) {
    if (!inventory.data?.active || busy) return;
    setBusy(true); setError('');
    try {
      await cafeApi.sessionAction(inventory.data.active._id, 'pause', undefined, { order: id, menuItem, name: '', quantity: 1 });
      notify('Your Five-Minute Reward Break Has Started.'); navigate('/focus/' + inventory.data.active._id);
    } catch (reason) { setError(errorMessage(reason)); inventory.reload(); }
    finally { setBusy(false); }
  }
  async function cancel() {
    if (!window.confirm('Cancel this order?')) return;
    setBusy(true); setError('');
    try { await cafeApi.cancelOrder(id); notify('Order cancelled. Unused Tempo Credits are refunded.'); state.reload(); inventory.reload(); }
    catch (reason) { setError(errorMessage(reason)); }
    finally { setBusy(false); }
  }
  return <section className="page narrow"><PageHeading eyebrow="From the cafe counter" title="Your order." /><LoadState {...state} retry={state.reload}>{state.data && (state.data.user !== user!._id ? <EmptyState title="This order belongs to another profile." to="/orders" label="Your orders" /> : <div className="receipt"><div className="flex items-center justify-between gap-3"><Status value={state.data.status} /><small>{dateTime(state.data.createdAt)}</small></div><div className="receipt-items">{state.data.items.map(item => <div key={item.menuItem}><span>{item.name} × {item.quantity}</span><strong>{item.unitPriceCredits * item.quantity} cr</strong></div>)}</div><dl className="summary-list"><div><dt>Subtotal</dt><dd>{state.data.subtotalCredits} cr</dd></div><div><dt>Discount</dt><dd>−{state.data.discountCredits} cr</dd></div><div className="total"><dt>Total</dt><dd>{state.data.totalCredits} credits</dd></div></dl><Feedback error={error} /><LoadState {...inventory} retry={inventory.reload}>{inventory.data && <div className="reward-actions"><p className="note">{inventory.data.active ? 'Use one item for a five-minute break. Your timer pauses, then resumes when space is available.' : 'Start a focus timer to use a reward.'}</p>{inventory.data.items.map(item => <button className="button secondary" key={item.menuItem} disabled={busy || !inventory.data?.active} onClick={() => void useReward(item.menuItem)}>Use {item.name} For A Break ({item.quantity})</button>)}</div>}</LoadState><div className="form-actions"><Link className="button" to="/history">Go To Your Focus Sessions</Link>{state.data.status === 'placed' && <button className="text-link danger" onClick={cancel} disabled={busy}>Cancel Order</button>}</div></div>)}</LoadState></section>;
}

export function OrdersPage() {
  const { user } = useCafe(); const state = useApi(() => cafeApi.orders(user!._id), [user!._id]);
  return <section className="page"><PageHeading eyebrow="Your cafe tab" title="A history of little treats." action={<Link className="button" to="/menu">Visit the menu →</Link>} /><LoadState {...state} retry={state.reload}>
    {!state.data?.length ? <EmptyState title="Nothing ordered yet." to="/menu" label="Pick a drink" /> : <div className="record-list">{state.data.map(order => <article className="record-row" key={order._id}><div><h2>{order.items.map(item => `${item.name} × ${item.quantity}`).join(', ')}</h2><p>{dateTime(order.createdAt)} · {order.totalCredits} credits</p><Status value={order.status} /></div><Link className="text-link" to={`/orders/${order._id}`}>View order →</Link></article>)}</div>}
  </LoadState></section>;
}
