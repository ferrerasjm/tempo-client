import { useState } from 'react';
import { Link, useNavigate, useParams } from 'react-router-dom';
import { cafeApi } from '../services/cafeApi';
import { useApi } from '../hooks/useApi';
import { useCafe } from '../state/CafeContext';
import { errorMessage } from '../api/http';
import { dateTime } from '../utils/dates';
import { EmptyState, Feedback, LoadState, PageHeading, Status } from '../components/ui';
import { MenuArtwork } from '../components/MenuArtwork';

export function MenuPage() {
  const state = useApi(cafeApi.menu); const { basket, setQuantity } = useCafe();
  const count = basket.reduce((total, item) => total + item.quantity, 0);
  return <section className="page counter-page centered"><PageHeading eyebrow="At the counter" title="What would you like?" description="A little something to keep you company. Virtual credits only." />
    <LoadState {...state} retry={state.reload}>{!state.data?.length ? <EmptyState title="The menu isn’t ready yet." /> : <div className="menu-grid">{state.data.map(item => {
      const quantity = basket.find(entry => entry.menuItem === item._id)?.quantity || 0;
      return <article className={`menu-item ${quantity ? 'selected' : ''}`} key={item._id}>
        <button className="menu-pick" aria-label={`Choose ${item.name}`} aria-pressed={quantity > 0} disabled={!item.available} onClick={() => setQuantity(item._id, quantity ? 0 : 1)}><MenuArtwork name={item.name} snack={item.category === 'snack'} /><h2>{item.name}</h2><p>{item.priceCredits} credits {!item.available && '· Unavailable'}</p></button>
        {quantity > 0 && <div className="quantity-control"><button aria-label={`Remove one ${item.name}`} onClick={() => setQuantity(item._id, quantity - 1)}>−</button><output aria-label={`${item.name} quantity`}>{quantity}</output><button aria-label={`Add one ${item.name}`} disabled={quantity >= 20} onClick={() => setQuantity(item._id, quantity + 1)}>+</button></div>}
      </article>;
    })}</div>}</LoadState>
    <div className="basket-bar"><span>{count ? `${count} ${count === 1 ? 'item' : 'items'} on your tray` : 'Choose something to begin.'}</span>{count > 0 ? <Link className="button" to="/order-summary">Review your order →</Link> : <button className="button" disabled>Choose something first</button>}</div>
    <Link className="text-link" to="/orders">Your past orders</Link>
  </section>;
}

export function CheckoutPage() {
  const { user, basket, clearBasket, notify } = useCafe(); const navigate = useNavigate();
  const state = useApi(() => basket.length ? cafeApi.preview(user!._id, basket) : Promise.resolve(null), [user!._id, JSON.stringify(basket)]);
  const [busy, setBusy] = useState(false); const [error, setError] = useState('');
  async function place() {
    setBusy(true); setError('');
    try {
      const order = await cafeApi.placeOrder(user!._id, basket);
      clearBasket(); notify('Your order is placed. Enjoy your little break.'); navigate(`/orders/${order._id}`);
    } catch (reason) { setError(errorMessage(reason)); state.reload(); }
    finally { setBusy(false); }
  }
  return <section className="page narrow"><PageHeading eyebrow="Before we make your order" title="A little treat, sorted." description="Prices and any focus discount are checked by the cafe when you order." /><Link className="text-link" to="/menu">← Change your selection</Link><LoadState {...state} retry={state.reload}>
    {!basket.length ? <EmptyState title="Your tray is empty." to="/menu" label="Visit the counter" /> : state.data && <div className="receipt"><p className="eyebrow">cafe tempo · your order</p><div className="receipt-items">{state.data.items.map(item => <div key={item.menuItem}><span>{item.name} × {item.quantity}</span><strong>{item.unitPriceCredits * item.quantity} cr</strong></div>)}</div><dl className="summary-list"><div><dt>Subtotal</dt><dd>{state.data.subtotalCredits} credits</dd></div><div><dt>Focus discount</dt><dd>−{state.data.discountCredits} credits</dd></div><div className="total"><dt>Total</dt><dd>{state.data.totalCredits} credits</dd></div></dl><p className="note">{state.data.focusDiscountApplied ? 'Your completed focus session today earned 10% off.' : 'Complete a focus session today to earn 10% off.'} Virtual credits only; no payment required.</p><Feedback error={error} /><button className="button w-full" disabled={busy} onClick={place}>{busy ? 'Placing your order…' : 'Place order'}</button></div>}
  </LoadState></section>;
}

export function OrderPage() {
  const { id = '' } = useParams(); const { user, notify } = useCafe();
  const state = useApi(() => cafeApi.order(id), [id]); const [error, setError] = useState(''); const [busy, setBusy] = useState(false);
  async function cancel() {
    if (!window.confirm('Cancel this order?')) return;
    setBusy(true); setError('');
    try { await cafeApi.cancelOrder(id); notify('Order cancelled.'); state.reload(); }
    catch (reason) { setError(errorMessage(reason)); }
    finally { setBusy(false); }
  }
  return <section className="page narrow"><PageHeading eyebrow="From the cafe counter" title="Your order." /><LoadState {...state} retry={state.reload}>{state.data && (state.data.user !== user!._id ? <EmptyState title="This order belongs to another profile." to="/orders" label="Your orders" /> : <div className="receipt"><div className="flex items-center justify-between gap-3"><Status value={state.data.status} /><small>{dateTime(state.data.createdAt)}</small></div><div className="receipt-items">{state.data.items.map(item => <div key={item.menuItem}><span>{item.name} × {item.quantity}</span><strong>{item.unitPriceCredits * item.quantity} cr</strong></div>)}</div><dl className="summary-list"><div><dt>Subtotal</dt><dd>{state.data.subtotalCredits} cr</dd></div><div><dt>Discount</dt><dd>−{state.data.discountCredits} cr</dd></div><div className="total"><dt>Total</dt><dd>{state.data.totalCredits} credits</dd></div></dl><Feedback error={error} /><div className="form-actions"><Link className="button" to="/cafe">Back to the cafe</Link>{state.data.status === 'placed' && <button className="text-link danger" onClick={cancel} disabled={busy}>Cancel order</button>}</div></div>)}</LoadState></section>;
}

export function OrdersPage() {
  const { user } = useCafe(); const state = useApi(() => cafeApi.orders(user!._id), [user!._id]);
  return <section className="page"><PageHeading eyebrow="Your cafe tab" title="A history of little treats." action={<Link className="button" to="/menu">Visit the menu →</Link>} /><LoadState {...state} retry={state.reload}>
    {!state.data?.length ? <EmptyState title="Nothing ordered yet." to="/menu" label="Pick a drink" /> : <div className="record-list">{state.data.map(order => <article className="record-row" key={order._id}><div><h2>{order.items.map(item => `${item.name} × ${item.quantity}`).join(', ')}</h2><p>{dateTime(order.createdAt)} · {order.totalCredits} credits</p><Status value={order.status} /></div><Link className="text-link" to={`/orders/${order._id}`}>View order →</Link></article>)}</div>}
  </LoadState></section>;
}
