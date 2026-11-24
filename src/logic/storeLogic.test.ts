import test from 'node:test';
import assert from 'node:assert/strict';
import { INITIAL_MENU_ITEMS, createSeedOrders } from '../data/menuData';
import {
  PPN_RATE,
  calculateCartTotals,
  calculateDailySummary,
  createOrderFromCart,
  finishOrderProcessing,
  formatDuration,
  formatRupiah,
  generateQueueNumber,
  getElapsedSeconds,
  pruneOutOfStockFromCart,
  startOrderProcessing,
  toggleMenuStock,
} from './storeLogic';

test('calculateCartTotals computes qty, subtotal, 11% PPN, and grand total accurately', () => {
  const cart = {
    'mkn-01': 2, // 2 * 54000 = 108000
    'mnm-01': 1, // 1 * 28000 = 28000
  };
  const result = calculateCartTotals(cart, INITIAL_MENU_ITEMS);
  assert.equal(result.totalQty, 3);
  assert.equal(result.subtotal, 136000);
  assert.equal(result.ppn, Math.round(136000 * PPN_RATE));
  assert.equal(result.ppn, 14960);
  assert.equal(result.grandTotal, 150960);
  assert.equal(result.items.length, 2);
});

test('calculateCartTotals excludes out-of-stock items', () => {
  const updatedMenu = toggleMenuStock(INITIAL_MENU_ITEMS, 'mkn-01');
  const cart = { 'mkn-01': 2, 'mnm-01': 1 };
  const result = calculateCartTotals(cart, updatedMenu);
  assert.equal(result.totalQty, 1);
  assert.equal(result.subtotal, 28000);
  assert.equal(result.items.length, 1);
  assert.equal(result.items[0].menuId, 'mnm-01');
});

test('generateQueueNumber increments sequentially from existing orders', () => {
  assert.equal(generateQueueNumber([]), 'A-001');
  const seeds = createSeedOrders(1_700_000_000_000);
  assert.equal(generateQueueNumber(seeds), 'A-004');
});

test('order lifecycle transitions waiting -> processing -> finished with accurate timer stop', () => {
  const t0 = 1_700_000_000_000;
  const order = createOrderFromCart(
    { 'mkn-02': 1 },
    INITIAL_MENU_ITEMS,
    [],
    t0
  );
  assert.ok(order);
  assert.equal(order.status, 'waiting');
  assert.equal(order.queueNumber, 'A-001');
  assert.equal(getElapsedSeconds(order, t0 + 15000), 0);

  // Click PROSES at t0 + 10s
  const tStart = t0 + 10_000;
  const processing = startOrderProcessing(order, tStart);
  assert.equal(processing.status, 'processing');
  assert.equal(processing.startedAt, tStart);
  // 42 seconds later timer reads 42s -> 00:42
  assert.equal(getElapsedSeconds(processing, tStart + 42_000), 42);
  assert.equal(formatDuration(42), '00:42');

  // Click FINISH at tStart + 125s (02:05)
  const tFinish = tStart + 125_000;
  const finished = finishOrderProcessing(processing, tFinish);
  assert.equal(finished.status, 'finished');
  assert.equal(finished.durationSeconds, 125);
  assert.equal(formatDuration(finished.durationSeconds), '02:05');

  // Even 5 minutes later, elapsed seconds stays frozen at 125
  assert.equal(getElapsedSeconds(finished, tFinish + 300_000), 125);
});

test('calculateDailySummary aggregates revenue, queue counts, and item recap correctly', () => {
  const seeds = createSeedOrders(1_700_000_000_000);
  const summary = calculateDailySummary(seeds);

  assert.equal(summary.totalOrders, 3);
  assert.equal(summary.waitingCount, 1);
  assert.equal(summary.processingCount, 1);
  assert.equal(summary.finishedCount, 1);
  assert.equal(summary.activeQueueCount, 2);
  assert.equal(summary.totalRevenue, 124320 + 204240 + 115440);
  assert.equal(summary.averageCookSeconds, 260);
  assert.ok(summary.itemRecap.length >= 5);
  assert.equal(summary.itemRecap[0].qtySold, 2);
});

test('pruneOutOfStockFromCart removes unavailable items when admin turns menu OFF', () => {
  const menu = toggleMenuStock(INITIAL_MENU_ITEMS, 'dst-02');
  const pruned = pruneOutOfStockFromCart({ 'dst-02': 3, 'mkn-01': 1 }, menu);
  assert.deepEqual(pruned, { 'mkn-01': 1 });
});

test('formatRupiah formats Indonesian Rupiah cleanly', () => {
  assert.equal(formatRupiah(54000), 'Rp 54.000');
  assert.equal(formatRupiah(0), 'Rp 0');
});
