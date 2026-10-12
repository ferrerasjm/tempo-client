import { useEffect, useRef, useState } from "react";
import { Link, Navigate, useLocation, useNavigate } from "react-router-dom";
import { cafeApi } from "../services/cafeApi";
import { useApi } from "../hooks/useApi";
import { useCafe } from "../state/CafeContext";
import { errorMessage } from "../api/http";
import { REWARDS_UPDATED_EVENT } from "../utils/rewardsEvents";
import { dateTime } from "../utils/dates";
import {
  EmptyState,
  Feedback,
  LoadState,
  PageHeading,
  Status,
} from "../components/ui";
import { pendingRequest, clearPendingRequest } from "../utils/pendingRequests";
import { MenuArtwork } from "../components/MenuArtwork";
import { TempoCoin } from "../components/TempoCoin";
import { useConfirmation } from "../state/ConfirmationContext";
import { Pagination } from "../components/Pagination";
import { PageNavigation } from "../state/SessionNavigation";
import { sessionReturn } from "../utils/sessionReturn";

export function MenuPage() {
  const state = useApi(cafeApi.pastries);
  const { user, basket, selectOnly, clearBasket } = useCafe();
  const rewards = useApi(() => cafeApi.rewards(user!._id), [user!._id]);
  const sessions = useApi(() => cafeApi.sessions(user!._id), [user!._id]);
  const returnContext = sessionReturn(sessions.data || []);
  const selectedCredits = basket.reduce((total, entry) => {
    const item = state.data?.find(
      (menuItem) => menuItem._id === entry.menuItem,
    );
    return total + (item?.priceCredits || 0) * entry.quantity;
  }, 0);
  const insufficientCredits = selectedCredits > (rewards.data?.balance ?? 0);
  const ownedPastry = rewards.data?.items.find(
    (item) => item.category === "snack",
  );
  useEffect(() => {
    if (ownedPastry && basket.length) clearBasket();
  }, [ownedPastry?.menuItem]);
  useEffect(() => {
    if (!ownedPastry && basket.length > 1) selectOnly(basket[0].menuItem);
  }, [ownedPastry?.menuItem, basket.length]);
  return (
    <section className="page counter-page centered">
      <PageNavigation
        to={returnContext ? `/focus/${returnContext.session._id}` : "/welcome"}
        label={returnContext ? "Back to Session" : "Back to Welcome"}
        backClassName="text-link back-to-focus-link"
      />
      <PageHeading
        eyebrow="At the counter"
        title="What would you like?"
        description="Spend earned Tempo Credits on rewards. Use an item from Your Orders for a short focus break."
      />
      <LoadState {...rewards} retry={rewards.reload}>
        {rewards.data && (
          <div className="tempo-missions reward-credit-card">
            <TempoCoin />
            <span>Tempo Credits</span>
            <strong>{rewards.data.balance.toLocaleString()}</strong>
          </div>
        )}
      </LoadState>
      <LoadState {...state} retry={state.reload}>
        {!state.data?.length ? (
          <EmptyState title="The menu isn’t ready yet." />
        ) : (
          <div className="menu-grid">
            {state.data.map((item) => {
              const quantity =
                basket.find((entry) => entry.menuItem === item._id)?.quantity ||
                0;
              const unaffordable =
                item.priceCredits > (rewards.data?.balance ?? 0);
              return (
                <article
                  className={`menu-item ${quantity ? "selected" : ""} ${unaffordable ? "unaffordable" : ""}`}
                  key={item._id}
                >
                  <button
                    className="menu-pick"
                    aria-label={`Choose ${item.name}`}
                    aria-pressed={quantity > 0}
                    disabled={!item.available || Boolean(ownedPastry)}
                    onClick={() =>
                      quantity ? clearBasket() : selectOnly(item._id)
                    }
                  >
                    <MenuArtwork
                      name={item.name}
                      snack={item.category === "snack"}
                    />
                    <h2>{item.name}</h2>
                    <p>
                      {item.priceCredits} credits{" "}
                      {!item.available && "· Unavailable"}
                    </p>
                    <p className="pastry-break-time">
                      {item.breakMinutes || 5}-minute break
                    </p>
                    {unaffordable && quantity > 0 && (
                      <p className="insufficient-credits">
                        Insufficient Credits
                      </p>
                    )}
                  </button>
                </article>
              );
            })}
          </div>
        )}
      </LoadState>
      {ownedPastry && (
        <p className="note owned-pastry-note">
          Use your {ownedPastry.name} before buying another pastry.
        </p>
      )}
      <div className="basket-bar">
        {basket.length > 0 ? (
          insufficientCredits ? (
            <button className="button" disabled>
              Insufficient Credits
            </button>
          ) : (
            <Link className="button" to="/order-summary">
              Review Order
            </Link>
          )
        ) : (
          <button className="button" disabled>
            Choose First
          </button>
        )}
      </div>
    </section>
  );
}

export function CheckoutPage() {
  const { user, basket, clearBasket, notify } = useCafe();
  const navigate = useNavigate();
  const state = useApi(
    () =>
      basket.length
        ? cafeApi.preview(user!._id, basket)
        : Promise.resolve(null),
    [user!._id, JSON.stringify(basket)],
  );
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");
  const placed = useRef(false);
  async function place() {
    setBusy(true);
    setError("");
    try {
      const requestName = user!._id + "-order-" + JSON.stringify(basket);
      await cafeApi.placeOrder(user!._id, basket, pendingRequest(requestName));
      clearPendingRequest(requestName);
      placed.current = true;
      clearBasket();
      try {
        const sessions = await cafeApi.sessions(user!._id);
        const current = sessions.find((session) =>
          ["active", "paused", "planned"].includes(session.status),
        );
        notify(
          current
            ? "Order placed! Your pastry is ready on the table."
            : "Order placed! Start a focus timer to use your pastry.",
        );
        navigate(current ? `/focus/${current._id}` : "/study/drink", {
          replace: true,
        });
      } catch {
        notify(
          "Order placed! We could not check your current timer, so your pastry is saved in Your Orders.",
        );
        navigate("/orders", { replace: true });
      }
    } catch (reason) {
      setError(errorMessage(reason));
      state.reload();
    } finally {
      setBusy(false);
    }
  }
  if (!basket.length && !placed.current) return <Navigate to="/menu" replace />;
  return (
    <section className="page narrow checkout-page">
      <PageNavigation to="/menu" label="Back to Reward Shop" backClassName="text-link checkout-back" />
      <PageHeading
        eyebrow="Before we make your order"
        title="A little treat, sorted."
        description="Prices and any focus discount are checked by the cafe when you order."
      />
      <LoadState {...state} retry={state.reload}>
        {state.data && (
          <div className="receipt">
            <p className="eyebrow">Cafe Tempo · Your Order</p>
            <div className="receipt-items">
              {state.data.items.map((item) => (
                <div key={item.menuItem}>
                  <span>
                    {item.name} × {item.quantity}
                  </span>
                  <strong>
                    {item.unitPriceCredits * item.quantity} credits
                  </strong>
                </div>
              ))}
            </div>
            <dl className="summary-list">
              <div>
                <dt>Subtotal</dt>
                <dd>{state.data.subtotalCredits} credits</dd>
              </div>
              <div>
                <dt>Focus Discount</dt>
                <dd>−{state.data.discountCredits} credits</dd>
              </div>
              <div className="total">
                <dt>Total</dt>
                <dd>{state.data.totalCredits} Tempo Credits</dd>
              </div>
              <div>
                <dt>Your Balance</dt>
                <dd>{state.data.availableCredits} Tempo Credits</dd>
              </div>
            </dl>
            <p className="note">
              {state.data.focusDiscountApplied
                ? "Your completed focus session today earned 10% off."
                : "Complete a focus session today to earn 10% off."}{" "}
              Use purchased items from Your Orders during an active timer. Each
              item unlocks one short break.
            </p>
            <Feedback error={error} />
            {!state.data.canAfford && (
              <p className="note">
                Not enough Tempo Credits. Finish a full focus timer or complete
                its task to earn more.
              </p>
            )}
            <button
              className="button w-full"
              disabled={busy || !state.data.canAfford}
              onClick={place}
            >
              {busy ? "Placing your order…" : "Place Order"}
            </button>
          </div>
        )}
      </LoadState>
    </section>
  );
}

export function OrdersPage({ embedded = false, onBusyChange, onNavigate, navigating = false }: {
  embedded?: boolean;
  onBusyChange?: (busy: boolean) => void;
  onNavigate?: (to: string) => Promise<void>;
  navigating?: boolean;
} = {}) {
  const { user, notify } = useCafe();
  const navigate = useNavigate();
  const location = useLocation();
  const confirm = useConfirmation();
  const state = useApi(() => cafeApi.orders(user!._id), [user!._id]);
  const rewards = useApi(() => embedded ? cafeApi.rewards(user!._id) : Promise.resolve(null), [user!._id, embedded]);
  const sessions = useApi(() => cafeApi.sessions(user!._id), [user!._id]);
  const [busy, setBusy] = useState("");
  const [error, setError] = useState("");
  const [page, setPage] = useState(1);
  const [pageSize, setPageSize] = useState(10);
  const orders = state.data || [];
  const fromFocus = location.state?.from === "focus";
  const session = fromFocus
    ? sessionReturn(sessions.data || [])
    : null;
  const pageCount = Math.max(1, Math.ceil(orders.length / pageSize));
  const currentPage = Math.min(page, pageCount);
  const visibleOrders = orders.slice(
    (currentPage - 1) * pageSize,
    currentPage * pageSize,
  );
  useEffect(() => {
    if (!state.loading && page > pageCount) setPage(pageCount);
  }, [state.loading, page, pageCount]);
  async function cancel(id: string) {
    if (busy) return;
    if (
      !(await confirm({
        title: "Cancel this order?",
        message: "Unused Tempo Credits will be refunded to your balance.",
        confirmLabel: "Cancel Order",
        cancelLabel: "Keep Order",
      }))
    )
      return;
    setBusy(id);
    onBusyChange?.(true);
    setError("");
    try {
      await cafeApi.cancelOrder(id);
      notify("Order cancelled. Unused Tempo Credits are refunded.");
      window.dispatchEvent(new Event(REWARDS_UPDATED_EVENT));
      state.reload();
      rewards.reload();
    } catch (reason) {
      setError(errorMessage(reason));
    } finally {
      setBusy("");
      onBusyChange?.(false);
    }
  }
  return (
    <section className={embedded ? "orders-page profile-embedded-page" : "page orders-page"}>
      {!embedded && <PageNavigation
        to={session ? `/focus/${session.session._id}` : "/menu"}
        label={session ? "Back to Session" : "Back to Reward Shop"}
      />}
      <div className={embedded ? "orders-heading-row" : undefined}>
        <PageHeading
          eyebrow="Reward Shop"
          title={embedded ? "My Orders" : "Your Orders"}
          description="Review your Tempo Credit purchases from the Reward Shop."
        />
        {embedded && <div className="orders-rewards-actions">
          <dl className="profile-credit-card" aria-busy={rewards.loading}>
            <dt><TempoCoin />Tempo Credits</dt>
            <dd>{rewards.loading ? <span role="status">Loading…</span>
              : rewards.error ? <span className="profile-credit-error"><span role="alert">Balance unavailable.</span><button type="button" onClick={rewards.reload}>Retry</button></span>
              : <strong>{(rewards.data?.balance ?? 0).toLocaleString()}</strong>}</dd>
          </dl>
          <button type="button" className="orders-rewards-link" disabled={Boolean(busy) || navigating}
            onClick={() => {
              if (onNavigate) void onNavigate("/menu").catch((reason) => setError(errorMessage(reason)));
              else navigate("/menu");
            }}>Explore Rewards</button>
        </div>}
      </div>
      <Feedback error={error} />
      <LoadState {...state} retry={state.reload}>
        {!orders.length ? (
          embedded ? <div className="cafe-orders-empty">
            <div className="cafe-orders-empty-art" aria-hidden="true">
              <MenuArtwork name="Cafe Latte" />
              <span className="cafe-orders-heart">♥</span>
              <MenuArtwork name="Fruit Tart" snack />
            </div>
            <h2>No Purchases Yet</h2>
            <p>Your little cafe treats will appear here after your first order.</p>
          </div> : <EmptyState title="No purchases yet." />
        ) : (
          <>
            <div className="record-list">
              {visibleOrders.map((order) => (
                <article className="record-row" key={order._id}>
                  {embedded && <div className="cafe-order-art" aria-hidden="true">
                    <MenuArtwork name={order.items[0]?.name || "Cafe Latte"}
                      snack={/tart|cinnamon|donut|muffin|croissant/i.test(order.items[0]?.name || "")} />
                  </div>}
                  <div className="cafe-order-details">
                    <h2>
                      {order.items
                        .map((item) => `${item.name} × ${item.quantity}`)
                        .join(", ")}
                    </h2>
                    <p>
                      {dateTime(order.createdAt)} · {order.totalCredits} Tempo
                      Credits
                    </p>
                    <Status value={order.status} />
                    {order.discountCredits > 0 && (
                      <p>
                        Includes {order.discountCredits} Tempo Credits off for
                        your completed focus session.
                      </p>
                    )}
                  </div>
                  {order.status === "placed" && order.canCancel === true && (
                    <button
                      type="button"
                      className="text-link danger"
                      disabled={Boolean(busy)}
                      onClick={() => void cancel(order._id)}
                    >
                      {busy === order._id ? "Cancelling..." : "Cancel Order"}
                    </button>
                  )}
                </article>
              ))}
            </div>
            {orders.length > 5 && (
              <Pagination
                currentPage={currentPage}
                pageCount={pageCount}
                pageSize={pageSize}
                label="Order pages"
                itemLabel="Orders per page"
                onPageChange={setPage}
                onPageSizeChange={(size) => {
                  setPageSize(size);
                  setPage(1);
                }}
              />
            )}
          </>
        )}
      </LoadState>
    </section>
  );
}
