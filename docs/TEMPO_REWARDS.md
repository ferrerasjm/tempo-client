# Tempo Credits and reward breaks

## Current mission rules

| Mission | Award | Rule |
| --- | --- | --- |
| Finish a focus session | 20 Tempo Credits | Run the full planned timer, then stop and save. An early stop earns no credits. |
| Complete its task | 15 Tempo Credits | Mark a task completed after a qualifying full session. Awarded once per task, including if it was marked completed before the session ended. |

Task reopening and repeated completion cannot earn the same task award twice. Repeating the stop request cannot earn another session award. The legacy completion route ignores claimed minutes and uses server elapsed time; only a genuinely full timer earns session credits. The first full session earns enough to buy a cookie for the next session.

## Shop and session flow

1. Open Explore → Reward shop. Your balance and mission rules appear above the existing menu.
2. Select items and review the order. The existing server prices and focus discount still apply. Place order is disabled when your balance is insufficient; the server also checks it.
3. The table now shows only the session drink and timer controls. Reward items and Session settings were removed from this presentation. The reward shop still handles purchasing and cancellation; paid items can be consumed from Your Orders during an active timer.
4. The ordinary Pause timer icon freezes focus time until you resume, without consuming an item. Use a purchased item from Your Orders for a break of up to five minutes.
5. Resume timer can end a timed reward break early. The client and server check expiry; the server checks every five seconds even with the page closed. Music follows timer state only in virtual spaces.
6. The break releases the seat. Automatic resume rechecks capacity. If the original area is full or unavailable, the timer stays paused while waiting for a seat. The user can browse another area and resume there.
7. Stop session remains available at any time. Stopping early saves elapsed whole minutes without a mission award.

An entirely unused order can be cancelled for a full refund. Once any item from that order has been used, cancellation is rejected. Used items stay consumed even if the session is stopped or cancelled.

## Server data and API

No additional collection is needed. Permanent award fields live on Task and FocusSession. Paid orders have `creditsCharged: true`. FocusSession stores each consumed reward in `rewardBreaks` along with its current `rewardBreakEndsAt`.

`GET /api/rewards?user=<id>` returns balance, earned/spent credits, available item quantities, mission progress, and break duration. Balance is calculated from permanent awards minus non-cancelled paid orders. Available items are order quantities minus persisted break uses. Existing seed orders are demonstration records, not paid rewards; they give no inventory and deduct no credits. Old completed sessions are not backfilled with awards.

`POST /api/orders/calculate` additionally returns `availableCredits` and `canAfford`. Order creation, cancellation, and reward use share the existing single-process Promise queue so simultaneous requests cannot overspend or reuse an item in this deployment.

To pause until manually resumed, PATCH `/api/focus-sessions/:id` with `{ "action": "pause" }`. To consume a reward for a timed break instead:

```json
{ "action": "pause", "rewardOrder": "<orderId>", "rewardItem": "<menuItemId>" }
```

The server verifies ownership and remaining quantity. Consumption and the pause timestamp are saved in the same session write. The `resume` and `stop` actions keep their existing request format. Award and payment fields are set by the server and cannot be supplied through ordinary forms.

## Frontend handoff and testing

`useFocusRoom.ts` handles timer actions; `cafeApi.ts` handles requests. `tempoRewards.js` owns credit and inventory calculations. Mission amounts and break minutes are constants in that utility. The previous reward-tray and settings components were removed because the table now contains only timer controls.

Tests use isolated Atlas profiles. They cover earning and shopping, mobile layout, ordinary pause persistence, timed reward actions through the API, automatic expiry, insufficient balances, simultaneous purchases, duplicate awards, single-use items, refunds, and full-area resume rejection. Music still awaits the audio file.

This adds credit-based gamification. Focus Passport stamps remain a separate, unimplemented optional feature. Profiles remain demo selection rather than authentication. The queue protects one Node server process; multiple instances need database-level concurrency protection.
