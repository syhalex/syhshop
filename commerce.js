import {
  activeUser, copyButton, copyWithNotice, esc, formatDate, go, icon, money,
  refresh, save, select, state, t, toast, animateRefresh, openModal, closeModal, confirmAction, clampQuantity, quantityControl,
} from './ui.js';
import { getProduct, getSku, priceOf, quantityBounds, stockOf } from './catalog.js';
import { recordReferralCommission } from './account.js';
import { productArt } from './illustrations.js';

const paymentWindow = 15 * 60_000;
const lookupPageSize = 6;
const sampleOrder = { id: 'SYH-DEMO-001', email: 'guest@example.test' };
const channels = [
  ['alipay', '支付宝', 'Alipay', 'redirect', { percent: 3 }],
  ['wechat', '微信支付', 'WeChat Pay', 'redirect', { percent: 3 }],
  ['alipay2', '支付宝（渠道二）', 'Alipay (Channel 2)', 'redirect', { percent: 3 }],
  ['wechat2', '微信支付（渠道二）', 'WeChat Pay (Channel 2)', 'redirect', { percent: 3 }],
  ['unionpay', '银联支付（渠道二）', 'UnionPay (Channel 2)', 'redirect', { fixed: 200 }],
  ['usdt-bsc', 'USDT-BSC', 'USDT-BSC', 'qr'],
  ['usdt-polygon', 'USDT-Polygon', 'USDT-Polygon', 'qr'],
  ['usdt-x-layer', 'USDT-X Layer', 'USDT-X Layer', 'qr'],
  ['usdt-plasma', 'USDT-Plasma', 'USDT-Plasma', 'qr'],
];
const channelLimit = 500000;
let guestFilter = { email: '', orderId: '' };

try {
  const savedGuest = JSON.parse(sessionStorage.getItem('syh-shop-guest') || 'null');
  if (savedGuest && typeof savedGuest.email === 'string' && typeof savedGuest.orderId === 'string') {
    guestFilter = { email: savedGuest.email, orderId: savedGuest.orderId };
  }
} catch { /* A private window may block session storage. */ }

const link = path => `#${path}`;
const productPath = id => `/products/${encodeURIComponent(id)}`;
const payPath = id => `/pay/${encodeURIComponent(id)}`;
const orderPath = order => `${order.owner ? '/me/orders' : '/guest/orders'}/${encodeURIComponent(order.id)}`;
const paymentReference = order => order.paymentRef || `DEMO-${order.id}`;
const loginPath = path => `/auth/login?redirect=${encodeURIComponent(path)}`;
const localName = (product, sku) => t(sku ? sku.name : product.name, sku ? sku.en : product.en);
const itemName = item => t(item.name, item.nameEn || item.en || item.name);
const variantName = item => t(item.variant || '', item.variantEn || item.variant || '');
const localDate = value => value ? formatDate(value) : '—';
const normalizeEmail = value => String(value || '').trim().toLowerCase();
const validEmail = email => /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);
const channelOptions = () => channels.map(([value, zh, en]) => ({ value, label: t(zh, en) }));
const allChannelIds = channels.map(channel => channel[0]);
const channelById = id => channels.find(channel => channel[0] === id) || channels[0];
const ownerMatches = order => Boolean(order?.owner && normalizeEmail(order.owner) === normalizeEmail(activeUser()?.email));
const canSeeOrder = order => order && (!order.owner || ownerMatches(order));
const orderById = id => state.orders.find(order => order.id === id);
const ticketById = id => state.tickets.find(ticket => ticket.id === id);
const ticketForOrder = id => state.tickets.find(ticket => ticket.orderId === id);
const lineKey = line => `${line.productId}/${line.skuId}`;

function setGuestFilter(email = '', orderId = '') {
  guestFilter = { email, orderId };
  try { sessionStorage.setItem('syh-shop-guest', JSON.stringify(guestFilter)); } catch { /* Keep filters in memory. */ }
}

function statusLabel(status) {
  return {
    pending: t('待付款', 'Awaiting payment'),
    processing: t('交付中', 'Processing'),
    completed: t('已完成', 'Completed'),
    canceled: t('已取消', 'Canceled'),
    expired: t('已过期', 'Expired'),
  }[status] || t('订单', 'Order');
}

function statusBadge(status) {
  const badgeIcon = { completed: 'check', pending: 'clock', processing: 'package', expired: 'clock', canceled: 'x' }[status] || 'receipt';
  return `<span class="co-status co-status-${esc(status)}">${icon(badgeIcon, 15)}<span class="co-status-label">${esc(statusLabel(status))}</span></span>`;
}

function actionButton(action, text, { glyph, kind = 'quiet', orderId, extra = '', disabled = false } = {}) {
  return `<button type="button" class="button ${kind}" data-action="${action}"${orderId ? ` data-id="${esc(orderId)}"` : ''}${disabled ? ' disabled' : ''} ${extra}>${glyph ? icon(glyph) : ''}${esc(text)}</button>`;
}

function actionLink(path, text, glyph, kind = 'quiet') {
  return `<a class="button ${kind}" href="${esc(link(path))}">${glyph ? icon(glyph) : ''}<span>${esc(text)}</span></a>`;
}

function page(title, content, { back, backText, side = '' } = {}) {
  return `<section class="commerce">
    ${back ? `<a class="co-back link-effect" href="${esc(link(back))}">${icon('arrow-left', 17)}${esc(backText || t('返回', 'Back'))}</a>` : ''}
    <header class="page-heading co-heading"><h1>${esc(title)}</h1>${side}</header>
    ${content}
  </section>`;
}

function empty(title, description, glyph, action = '') {
  return `<div class="panel empty-state co-empty"><div class="co-empty-icon">${icon(glyph, 26)}</div>
    <h2>${esc(title)}</h2>${description ? `<p class="muted">${esc(description)}</p>` : ''}${action}
  </div>`;
}

function panel(title, glyph, body, extra = '') {
  return `<section class="panel co-panel" ${extra}><h2 class="co-panel-title">${icon(glyph, 19)}${esc(title)}</h2>${body}</section>`;
}

function formField(label, name, { value = '', type = 'text', placeholder = '', required = false, attrs = '' } = {}) {
  return `<label class="field co-field"><span>${esc(label)}${required ? '<span class="co-required" aria-hidden="true"> *</span>' : ''}</span>
    <input class="input" type="${type}" name="${esc(name)}" value="${esc(value)}" placeholder="${esc(placeholder)}" ${required ? 'required' : ''} ${attrs}></label>`;
}

function formError(form, message) {
  const box = form.querySelector('[data-co-error]');
  if (!box) return;
  box.textContent = message;
  box.hidden = !message;
}

const errorBox = () => '<p class="form-error co-error" data-co-error role="alert" hidden></p>';

function getLine(line) {
  const product = getProduct(line.productId);
  if (!product) return null;
  const sku = getSku(product, line.skuId);
  if (!sku || sku.id !== line.skuId) return null;
  const qty = Number(line.qty);
  if (!Number.isSafeInteger(qty) || qty <= 0) return null;
  return { productId: product.id, skuId: sku.id, qty, product, sku, price: priceOf(sku), stock: stockOf(product, sku), ...quantityBounds(product, sku) };
}

function getLines(entries) {
  const lines = entries.map(getLine).filter(Boolean);
  const totals = new Map();
  for (const line of lines) totals.set(line.productId, (totals.get(line.productId) || 0) + line.qty);
  return lines.map(line => {
    if (!line.product.maxQty) return line;
    const otherQty = totals.get(line.productId) - line.qty;
    return { ...line, max: Math.min(line.max, Math.max(0, line.product.maxQty - otherQty)), combinedQty: totals.get(line.productId) };
  });
}

function linesFromCart() {
  return getLines(state.cart);
}

function cartWarnings(lines) {
  const invalid = lines.find(line => line.qty > line.max || line.qty < line.min);
  if (invalid) return `${localName(invalid.product)}: ${quantityWarning(invalid)}`;
  return '';
}

function quantityWarning({ qty, stock, min, max, product, combinedQty }) {
  if (qty > stock || stock < min) return t('库存不足，请调整数量。', 'Not enough stock. Adjust the quantity.');
  if (qty < min) return t(`至少购买 ${min} 件。`, `Minimum purchase: ${min}.`);
  if (combinedQty > product.maxQty) return t(`此商品每笔订单最多 ${product.maxQty} 件。`, `Limit ${product.maxQty} per order for this product.`);
  if (qty > max) return t(`最多购买 ${max} 件。`, `Maximum purchase: ${max}.`);
  return '';
}

function itemArtwork(product) {
  return `<span class="co-item-art" aria-hidden="true">${product ? productArt(product) : icon('package', 24)}</span>`;
}

function cartRow(line, editable = false) {
  const { product, sku, qty, price, min, max } = line;
  const warning = quantityWarning(line);
  return `<div class="co-item" data-co-line="${esc(lineKey(line))}">
    <a class="co-item-media" href="${esc(link(productPath(product.id)))}" aria-label="${esc(localName(product))}">${itemArtwork(product)}</a>
    <div class="co-item-main"><a class="co-item-name" href="${esc(link(productPath(product.id)))}">${esc(localName(product))}</a>
      <div class="co-item-meta"><span>${esc(localName(product, sku))}</span><span>${esc(product.delivery === 'manual' ? t('人工交付', 'Manual delivery') : t('自动发货', 'Instant delivery'))}</span></div>
      ${editable || warning ? `<p class="co-inline-error" data-co-line-warning ${warning ? '' : 'hidden'}>${esc(warning)}</p>` : ''}
    </div>
    ${editable ? quantityControl({ qty, min, max, action: 'co-qty', input: 'cart' }) : `<span class="co-item-qty">× ${qty}</span>`}
    <strong class="co-item-price" data-co-line-price>${money(price * qty)}</strong>
    ${editable ? `<button type="button" class="icon-button co-remove" data-action="co-remove" aria-label="${esc(t('移除商品', 'Remove item'))}">${icon('trash', 17)}</button>` : ''}
  </div>`;
}

function amountRow(label, amount, name = '', kind = '') {
  return `<div class="co-amount ${kind}"><span${name ? ` data-co-label="${name}"` : ''}>${esc(label)}</span><strong${name ? ` data-co-amount="${name}"` : ''}>${amount}</strong></div>`;
}

function renderCart() {
  const lines = linesFromCart();
  if (!lines.length) return page(t('购物车', 'Shopping cart'), empty(
    t('购物车还是空的', 'Your cart is empty'), '', 'cart',
    actionLink('/', t('浏览商品', 'Browse products'), 'arrow-right', 'primary'),
  ));
  const qty = lines.reduce((total, line) => total + line.qty, 0);
  const total = lines.reduce((sum, line) => sum + line.qty * line.price, 0);
  const warning = cartWarnings(lines);
  const mustSignIn = !activeUser() && lines.some(line => line.product.memberOnly);
  const checkoutHref = mustSignIn ? loginPath('/cart') : '/checkout';
  const checkoutLabel = mustSignIn ? t('登录后结算', 'Sign in to check out') : t('前往结算', 'Checkout');
  return page(t('购物车', 'Shopping cart'), `<div class="co-grid">
    ${panel(t('已选商品', 'Selected products'), 'cart', `<div class="co-items">${lines.map(line => cartRow(line, true)).join('')}</div>`)}
    <aside class="co-aside">${panel(t('订单小计', 'Subtotal'), 'receipt', `<div class="co-amounts">
      ${amountRow(t('购买数量', 'Quantity'), qty, 'cart-qty')}
      ${amountRow(t('商品合计', 'Items total'), money(total), 'cart-total', 'co-total')}
      <p class="form-error" data-co-cart-warning ${warning ? '' : 'hidden'}>${esc(warning)}</p>
      <a href="${esc(link(checkoutHref))}" class="button primary" data-co-cart-checkout aria-disabled="${Boolean(warning)}" ${warning ? 'tabindex="-1"' : ''}>
        ${icon(mustSignIn ? 'lock' : 'arrow-right')}${esc(checkoutLabel)}</a>
    </div>`)}</aside></div>`, { back: '/', backText: t('继续选购', 'Continue shopping') });
}

function checkoutLines(query) {
  const id = query.get('product');
  if (!id) return { lines: linesFromCart(), direct: null };
  const product = getProduct(id);
  const skuId = query.get('sku') || product?.skus?.[0]?.id;
  const direct = { productId: id, skuId, qty: Number(query.get('qty') || 1) };
  const line = getLine(direct);
  return { lines: line ? [line] : [], direct };
}

function totalsFor(lines) {
  const subtotal = lines.reduce((sum, line) => sum + line.sku.price * line.qty, 0);
  const baseTotal = lines.reduce((sum, line) => sum + line.price * line.qty, 0);
  return { subtotal, baseTotal, memberDiscount: Math.max(0, subtotal - baseTotal) };
}

function allowedChannels(items) {
  return items.reduce((allowed, item) => {
    const methods = (item.product || getProduct(item.productId))?.paymentMethods;
    return methods?.length ? allowed.filter(id => methods.includes(id)) : allowed;
  }, allChannelIds);
}

function availableChannels(amount, withWallet, balance, allowed) {
  const onlineBase = Math.max(0, amount - (withWallet ? Math.max(0, Number(balance) || 0) : 0));
  return channelOptions().filter(option => allowed.includes(option.value) && (onlineBase <= channelLimit || option.value.startsWith('usdt-')));
}

function quote(baseTotal, channelId, withWallet, balance, allowed = allChannelIds) {
  const options = availableChannels(baseTotal, withWallet, balance, allowed);
  const walletUsed = withWallet ? Math.min(baseTotal, Math.max(0, Number(balance) || 0)) : 0;
  const onlineBase = baseTotal - walletUsed;
  const channel = options.some(option => option.value === channelId) ? channelId : options[0]?.value;
  const method = onlineBase === 0 ? 'wallet' : channel || '';
  const feeRule = onlineBase && channel ? channelById(channel)[4] ?? null : null;
  const fee = feeRule?.fixed ?? (feeRule?.percent ? Math.round(onlineBase * feeRule.percent / 100) : 0);
  return { method, feeRule, fee, walletUsed, total: baseTotal + fee, payable: onlineBase + fee };
}

function feeLabel(rule) {
  if (rule?.percent) return t(`支付手续费（${rule.percent}%）`, `Payment fee (${rule.percent}%)`);
  if (rule?.fixed) return t('支付手续费（固定）', 'Payment fee (fixed)');
  return t('支付手续费', 'Payment fee');
}

function methods(baseTotal, methodId, useWallet, user, { recharge = false, allowed = allChannelIds } = {}) {
  const estimate = quote(baseTotal, methodId, useWallet, user?.balance, allowed);
  return `<div class="co-method" data-co-quote data-base="${baseTotal}" data-recharge="${recharge ? 'true' : 'false'}" data-allowed="${esc(allowed.join(','))}" data-channel-preference="${esc(methodId)}">
    <div class="field co-field"><span>${esc(t('支付渠道', 'Payment channel'))}</span><div data-co-channel>${paymentSelect(baseTotal, estimate.method, useWallet, user?.balance, allowed)}</div></div>
    ${user && !recharge ? `<label class="co-check"><input type="checkbox" name="wallet" value="yes"${useWallet ? ' checked' : ''}${user.balance <= 0 ? ' disabled' : ''}><span class="co-check-icon">${icon('check', 14)}</span><span>${esc(t('使用钱包余额', 'Use wallet balance'))}</span><strong>${money(user.balance)}</strong></label>` : ''}
    <div class="co-amounts">
      ${amountRow(feeLabel(estimate.feeRule), money(estimate.fee), 'fee')}
      ${user && !recharge ? amountRow(t('钱包抵扣', 'Wallet deduction'), money(estimate.walletUsed), 'wallet') : ''}
      ${amountRow(t('应付金额', 'Amount due'), money(estimate.payable), 'payable', 'co-total')}
    </div>
  </div>`;
}

function paymentSelect(baseTotal, methodId, useWallet, balance, allowed) {
  const label = t('支付渠道', 'Payment channel');
  if (methodId === 'wallet') return select({
    name: 'method', value: 'wallet', options: [{ value: 'wallet', label: t('钱包支付', 'Wallet payment') }],
    label, icon: 'wallet', disabled: true,
  });
  const options = availableChannels(baseTotal, useWallet, balance, allowed);
  if (!options.length) return `<p class="form-error co-error">${esc(t('所选商品没有可用的共同支付渠道。', 'No payment channel supports all selected items.'))}</p>`;
  return select({ name: 'method', value: methodId, options, label, icon: 'credit-card' });
}

function manualProducts(lines) {
  const products = new Map();
  for (const { product } of lines) {
    if (product.delivery === 'manual' && product.fields?.length) products.set(product.id, product);
  }
  return [...products.values()];
}

function deliveryField(product, field, prefill) {
  const name = `delivery-${product.id}-${field.name}`;
  const label = t(field.label, field.en || field.label);
  const placeholder = t(field.placeholder || '', field.placeholderEn || field.placeholder || '');
  if (field.type === 'textarea') return `<label class="field co-field"><span>${esc(label)}${field.required ? '<span class="co-required" aria-hidden="true"> *</span>' : ''}</span><textarea class="input" name="${esc(name)}" placeholder="${esc(placeholder)}" maxlength="500" rows="3" ${field.required ? 'required' : ''}></textarea></label>`;
  if (field.type === 'select' && Array.isArray(field.options)) {
    const options = field.options.map(option => typeof option === 'string' ? { value: option, label: option } : { value: option.value, label: t(option.label, option.en || option.label) });
    return `<div class="field co-field"><span>${esc(label)}</span>${select({ name, options: [{ value: '', label: t('请选择', 'Select an option') }, ...options], value: '', label })}</div>`;
  }
  const type = ['email', 'url', 'number'].includes(field.type) ? field.type : 'text';
  return formField(label, name, { type, placeholder, required: field.required, value: prefill, attrs: 'maxlength="300" autocomplete="off"' });
}

function renderCheckout(route) {
  const { lines, direct } = checkoutLines(route.query);
  const back = direct ? productPath(direct.productId) : '/cart';
  const user = activeUser();
  if (!lines.length) return page(t('订单结算', 'Checkout'), empty(t('没有可结算的商品', 'Nothing to check out'), '', 'bag', actionLink('/', t('浏览商品', 'Browse products'), 'arrow-right', 'primary')));
  if (!user && lines.some(line => line.product.memberOnly)) {
    const current = direct ? `/checkout?${route.query.toString()}` : '/checkout';
    return page(t('订单结算', 'Checkout'), empty(t('该商品需要会员登录', 'Sign in to buy this product'), '', 'lock', actionLink(loginPath(current), t('登录会员', 'Member sign-in'), 'arrow-right', 'primary')), { back });
  }
  const { subtotal, memberDiscount, baseTotal } = totalsFor(lines);
  const allowed = allowedChannels(lines);
  const estimate = quote(baseTotal, channels[0][0], false, user?.balance, allowed);
  const warning = cartWarnings(lines);
  const manual = manualProducts(lines);
  return page(t('订单结算', 'Checkout'), `<form class="co-grid" data-form="co-checkout" novalidate>
    ${direct ? `<input type="hidden" name="productId" value="${esc(direct.productId)}"><input type="hidden" name="skuId" value="${esc(direct.skuId)}"><input type="hidden" name="qty" value="${direct.qty}">` : ''}
    <div class="co-stack">
      ${panel(t('订单商品', 'Order items'), 'bag', `<div class="co-items">${lines.map(line => cartRow(line)).join('')}</div>`)}
      ${user ? panel(t('会员购买', 'Member purchase'), 'shield', `<div class="co-account-id">${icon('mail', 18)}<span>${esc(user.email)}</span></div>`) : panel(t('游客购买', 'Guest purchase'), 'mail', `
        ${formField(t('演示邮箱', 'Demo email'), 'email', { type: 'email', value: sampleOrder.email, placeholder: sampleOrder.email, attrs: 'maxlength="160" autocomplete="off"' })}
        <div class="co-inline-footer"><a class="link-effect" href="${esc(link(loginPath(direct ? `/checkout?${route.query.toString()}` : '/checkout')))}">${esc(t('登录会员购买', 'Sign in as a member'))}${icon('arrow-right', 15)}</a></div>`)}
      ${manual.length ? panel(t('交付信息', 'Delivery information'), 'package', `<div class="co-manual-fields">${manual.map(product => `<section class="co-field-group"><h3>${esc(localName(product))}</h3><div class="co-fields">${product.fields.map(field => deliveryField(product, field, field.demoValue || '')).join('')}</div></section>`).join('')}</div>`) : ''}
    </div>
    <aside class="co-aside co-stack">
      ${panel(t('支付方式', 'Payment method'), 'credit-card', `<div class="co-amounts co-price-top">
        ${amountRow(t('商品小计', 'Items subtotal'), money(subtotal))}
        ${memberDiscount ? amountRow(t('会员优惠', 'Member discount'), `−${money(memberDiscount)}`) : ''}
      </div>${methods(baseTotal, channels[0][0], false, user, { allowed })}
      ${warning ? `<p class="form-error">${esc(warning)}</p>` : ''}${errorBox()}
      <button class="button primary co-wide" type="submit" data-co-checkout-submit data-co-stock-blocked="${Boolean(warning)}" ${warning || !estimate.method ? 'disabled' : ''}>${esc(t('提交订单', 'Place order'))}${icon('arrow-right')}</button>`)}</aside>
  </form>`, { back, backText: direct ? t('返回商品', 'Back to product') : t('返回购物车', 'Back to cart') });
}

function newId(prefix) {
  const suffix = Math.random().toString(36).slice(2, 7).toUpperCase();
  return `${prefix}-${Date.now().toString(36).toUpperCase()}-${suffix}`;
}

function submitCheckout(form, fields) {
  const id = fields.get('productId');
  const rows = id ? [getLine({ productId: id, skuId: fields.get('skuId'), qty: Number(fields.get('qty')) })].filter(Boolean) : linesFromCart();
  const user = activeUser();
  const email = normalizeEmail(user?.email || fields.get('email')) || sampleOrder.email;
  formError(form, '');
  if (!rows.length) return formError(form, t('请先添加商品。', 'Add a product first.'));
  if (!user && rows.some(line => line.product.memberOnly)) return formError(form, t('请登录后购买会员商品。', 'Sign in to purchase members-only products.'));
  const warning = cartWarnings(rows);
  if (warning) return formError(form, warning);
  if (!validEmail(email)) return formError(form, t('请填写有效的演示邮箱。', 'Enter a valid demo email address.'));
  const totals = totalsFor(rows);
  const useWallet = Boolean(user && fields.has('wallet'));
  const preferredChannel = form.querySelector('[data-co-quote]').dataset.channelPreference;
  const estimate = quote(totals.baseTotal, preferredChannel, useWallet, user?.balance, allowedChannels(rows));
  if (!estimate.method) return formError(form, t('请选择可用的支付渠道。', 'Choose an available payment channel.'));

  const manualInput = {};
  for (const product of manualProducts(rows)) {
    const answers = [];
    for (const field of product.fields) {
      const value = String(fields.get(`delivery-${product.id}-${field.name}`) || '').trim();
      const label = t(field.label, field.en || field.label);
      const invalid = value && ((field.type === 'email' && !validEmail(value)) || (field.type === 'number' && !Number.isFinite(Number(value))) || (field.type === 'url' && !/^https?:\/\/\S+$/i.test(value)));
      if ((field.required && !value) || invalid) return formError(form, t(`请核对「${label}」的内容。`, `Check the value for ${label}.`));
      if (value) answers.push({ label: field.label, en: field.en, value });
    }
    manualInput[product.id] = answers;
  }

  const button = form.querySelector('button[type=submit]');
  if (button) button.disabled = true;
  const createdAt = new Date().toISOString();
  const items = rows.map(({ product, sku, qty, price }) => ({
    productId: product.id, skuId: sku.id, name: product.name, nameEn: product.en,
    variant: sku.name, variantEn: sku.en, delivery: product.delivery, qty, price,
  }));
  const order = {
    id: newId('SYH'), kind: 'product', owner: user ? email : null, email,
    createdAt, expiresAt: new Date(Date.now() + paymentWindow).toISOString(), status: 'pending',
    ...totals, ...estimate, useWallet, preferredChannel, items, manualInput,
  };
  state.orders.unshift(order);
  if (!id) {
    const quantities = new Map(items.map(item => [lineKey(item), item.qty]));
    state.cart = state.cart.flatMap(item => {
      const remaining = item.qty - (quantities.get(lineKey(item)) || 0);
      return remaining > 0 ? [{ ...item, qty: remaining }] : [];
    });
  }
  if (!user) setGuestFilter();
  save();
  go(payPath(order.id));
}

function deadline(order) {
  return order.expiresAt ? Date.parse(order.expiresAt) : Date.parse(order.createdAt) + paymentWindow;
}

function countdown(order) {
  const total = Math.max(0, Math.ceil((deadline(order) - Date.now()) / 1000)) || 0;
  return `${String(Math.floor(total / 60)).padStart(2, '0')}:${String(total % 60).padStart(2, '0')}`;
}

function checkExpiry(order) {
  if (order?.status !== 'pending') return false;
  const expires = deadline(order);
  if (!Number.isFinite(expires) || Date.now() < expires) return false;
  order.status = 'expired';
  order.expiredAt = new Date(expires).toISOString();
  save();
  return true;
}

function displayTotal(order) {
  return Math.max(0, Number(order.total) || 0);
}

function paymentBase(order) {
  if (order.baseTotal !== undefined) return order.baseTotal;
  if (order.items?.length) return order.items.reduce((sum, item) => sum + item.qty * item.price, 0);
  return order.amount ?? displayTotal(order) - (order.fee || 0);
}

function unavailableOrder(title) {
  return page(title, empty(t('订单不存在或无法访问', 'Order unavailable'), '', 'receipt', actionLink('/guest/orders', t('查找订单', 'Find an order'), 'search', 'primary')));
}

function restrictedOrder(order, title, { payment = false, returnTo = '' } = {}) {
  if (!order) return unavailableOrder(title);
  if (!activeUser()) return page(title, empty(t('登录后查看订单', 'Sign in to view this order'), '', 'lock', actionLink(loginPath(returnTo || (payment ? payPath(order.id) : orderPath(order))), t('登录会员', 'Member sign-in'), 'arrow-right', 'primary')));
  return unavailableOrder(title);
}

function demoQr() {
  const modules = [];
  for (let y = 0; y < 21; y += 1) {
    for (let x = 0; x < 21; x += 1) {
      if ((x < 8 && y < 8) || (x > 12 && y < 8) || (x < 8 && y > 12)) continue;
      if ((x * x + y * y + x * y * 3 + x + y * 2) % 7 > 3) modules.push(`M${x} ${y}h1v1h-1z`);
    }
  }
  return `<svg class="co-qr" viewBox="-2 -2 25 25" aria-hidden="true"><path fill="currentColor" d="${modules.join('')}"/>
    <path fill="none" stroke="currentColor" d="M.5.5h6v6h-6zM14.5.5h6v6h-6zM.5 14.5h6v6h-6z"/><path fill="currentColor" d="M2 2h3v3H2zM16 2h3v3h-3zM2 16h3v3H2z"/></svg>`;
}

function paymentPresentation(order, methodId) {
  if (!methodId) return '';
  const [, zh, en, interaction] = channelById(methodId);
  const wallet = methodId === 'wallet';
  const qr = !wallet && interaction === 'qr';
  const symbol = wallet ? 'wallet' : qr ? 'qr' : 'credit-card';
  const title = wallet ? t('钱包余额', 'Wallet balance') : t(zh, en);
  const label = qr ? t('查看收款码', 'View QR code') : t('复制支付链接', 'Copy payment link');
  const action = wallet ? '' : `<button class="button quiet small co-channel-action" type="button" data-id="${esc(order.id)}"
    data-action="${qr ? 'co-show-qr' : 'co-copy-pay-link'}" title="${esc(label)}" aria-label="${esc(label)}">
    ${icon(qr ? 'qr' : 'link', 15)}<span>${esc(label)}</span></button>`;
  return `<div class="co-pay-stage">
    <span class="co-pay-icon">${icon(symbol, 19)}</span><strong title="${esc(title)}">${esc(title)}</strong>${action}
  </div>`;
}

function paymentAction(estimate) {
  return estimate.method ? `<button class="button primary co-wide" type="submit">${icon('check')}${esc(t('模拟付款', 'Simulate payment'))}</button>` : '';
}

function orderItemRow(item, order) {
  const product = getProduct(item.productId);
  const name = esc(itemName(item));
  return `<div class="co-item co-order-item">${itemArtwork(product)}
    <div class="co-item-main">${product ? `<a class="co-item-name" href="${esc(link(productPath(product.id)))}">${name}</a>` : `<strong class="co-item-name">${name}</strong>`}
      <div class="co-item-meta"><span>${esc(variantName(item))}</span>${order.kind === 'product' ? `<span>${esc((item.delivery || product?.delivery) === 'manual' ? t('人工交付', 'Manual delivery') : t('自动发货', 'Instant delivery'))}</span>` : ''}</div>
    </div><span class="co-item-qty">× ${item.qty}</span><strong class="co-item-price">${money(item.qty * item.price)}</strong>
  </div>`;
}

function orderItems(order) {
  if (order.items?.length) return `<div class="co-items">${order.items.map(item => orderItemRow(item, order)).join('')}</div>`;
  return `<div class="co-account-id">${icon('wallet', 21)}<span>${esc(t('钱包充值', 'Wallet top-up'))}</span><strong>${money(paymentBase(order))}</strong></div>`;
}

function copyableFact(label, value, kind, { code = false, href } = {}) {
  const text = code ? `<code>${esc(value)}</code>` : `<span>${esc(value)}</span>`;
  const content = href ? `<a href="${esc(href)}">${text}</a>` : text;
  return `<div><dt>${esc(label)}</dt><dd class="copy-line">${content}${copyButton(value, kind)}</dd></div>`;
}

function orderFacts(order) {
  const method = channelById(order.method);
  return `<dl class="co-facts">
    ${copyableFact(t('订单号', 'Order number'), order.id, 'order-number', { code: true })}
    <div><dt>${esc(t('创建时间', 'Created'))}</dt><dd>${esc(localDate(order.createdAt))}</dd></div>
    ${order.email ? copyableFact(t('下单邮箱', 'Order email'), order.email, 'order-email') : ''}
    ${order.method && order.status !== 'pending' ? `<div><dt>${esc(t('支付方式', 'Payment method'))}</dt><dd>${esc(order.method === 'wallet' || order.walletUsed && !order.payable ? t('钱包余额', 'Wallet balance') : t(method[1], method[2]))}</dd></div>` : ''}
    ${order.expiresAt && order.status === 'pending' ? `<div><dt>${esc(t('付款截止', 'Payment due by'))}</dt><dd>${esc(localDate(order.expiresAt))}</dd></div>` : ''}
    ${order.paidAt ? `<div><dt>${esc(t('支付时间', 'Paid'))}</dt><dd>${esc(localDate(order.paidAt))}</dd></div>` : ''}
    ${order.paymentRef ? copyableFact(t('支付参考号', 'Payment reference'), order.paymentRef, 'payment-reference', { code: true }) : ''}
    ${order.completedAt ? `<div><dt>${esc(t('完成时间', 'Completed'))}</dt><dd>${esc(localDate(order.completedAt))}</dd></div>` : ''}
    ${order.canceledAt ? `<div><dt>${esc(t('取消时间', 'Canceled'))}</dt><dd>${esc(localDate(order.canceledAt))}</dd></div>` : ''}
    ${order.expiredAt ? `<div><dt>${esc(t('过期时间', 'Expired'))}</dt><dd>${esc(localDate(order.expiredAt))}</dd></div>` : ''}
    ${order.note ? `<div><dt>${esc(t('备注', 'Note'))}</dt><dd>${esc(order.note)}</dd></div>` : ''}
  </dl>`;
}

function renderPayment(route) {
  const title = t('订单支付', 'Payment');
  const id = route.parts[1] || route.query.get('id') || route.query.get('order_no');
  const order = orderById(id);
  if (!canSeeOrder(order)) return restrictedOrder(order, title, { payment: true });
  checkExpiry(order);
  const back = orderPath(order);
  if (order.status !== 'pending') return orderDetail(order);
  const user = ownerMatches(order) ? activeUser() : null;
  const recharge = order.kind === 'recharge';
  const base = paymentBase(order);
  const allowed = recharge ? allChannelIds : allowedChannels(order.items || []);
  const preferredChannel = order.preferredChannel || order.method;
  const estimate = quote(base, preferredChannel, !recharge && order.useWallet, user?.balance, allowed);
  return page(title, `<form class="co-grid" data-form="co-payment" novalidate>
    <input type="hidden" name="orderId" value="${esc(order.id)}">
    <div class="co-stack">
      ${panel(t('订单信息', 'Order information'), 'receipt', `<div class="co-payment-clock">${icon('clock', 19)}<span>${esc(t('剩余付款时间', 'Time to pay'))}</span><strong data-co-countdown="${esc(order.id)}">${countdown(order)}</strong></div>${orderFacts(order)}${orderItems(order)}`)}
      ${panel(t('支付状态', 'Payment status'), 'shield', `<div class="co-payment-buttons">
        ${actionButton('co-refresh-payment', t('刷新状态', 'Refresh status'), { glyph: 'refresh', orderId: order.id })}
        ${actionButton('co-cancel-order', t('取消订单', 'Cancel order'), { glyph: 'x', orderId: order.id, kind: 'quiet co-danger' })}
      </div><details class="co-help"><summary>${icon('circle-help', 16)}${esc(t('已支付但没有收到商品？', 'Paid and waiting for delivery?'))}${icon('chevron-down', 15)}</summary>
      <p>${esc(t('刷新订单状态。付款完成后，自动发货商品可在订单详情领取，人工交付订单会显示处理进度。', 'Refresh your order status. Claim instant delivery in order details, or follow the status of manual delivery.'))}</p></details>`)}
    </div>
    <aside class="co-aside">${panel(t('付款', 'Pay order'), 'credit-card', `<div class="co-amounts co-price-top">${amountRow(recharge ? t('充值金额', 'Top-up amount') : t('商品合计', 'Items total'), money(base))}</div>
      ${methods(base, preferredChannel, Boolean(order.useWallet), user, { recharge, allowed })}
      <div data-co-payment-presentation data-method="${esc(estimate.method)}">${paymentPresentation(order, estimate.method)}</div>
      ${errorBox()}<div data-co-payment-action>${paymentAction(estimate)}</div>`)}</aside>
  </form>`, { back, backText: t('订单详情', 'Order details'), side: statusBadge(order.status) });
}

function finishFulfillment(order) {
  order.status = 'completed';
  order.completedAt = new Date().toISOString();
  recordReferralCommission(order);
}

function issueCodes(order, item, index) {
  const product = item.productId === 'syh-gift-card' ? getProduct(item.productId) : null;
  const sku = product && getSku(product, item.skuId);
  return Array.from({ length: item.qty }, (_, sequence) => {
    const code = `SYH-${sku ? 'GIFT' : 'DEMO'}-${order.id.replace(/^SYH-/, '')}-${index + 1}${String(sequence + 1).padStart(2, '0')}`;
    if (sku) {
      state.giftCards ??= [];
      state.giftCards.push({ code, amount: sku.price, redeemedBy: null });
    }
    return code;
  });
}

function submitPayment(form, fields) {
  const order = orderById(fields.get('orderId'));
  if (!canSeeOrder(order) || checkExpiry(order) || order.status !== 'pending') return refresh();
  formError(form, '');
  const user = ownerMatches(order) ? activeUser() : null;
  if (order.kind === 'recharge' && !user) return;
  const itemLines = getLines(order.items || []);
  if (order.kind === 'product' && !order.isDemoSample && (itemLines.length !== order.items.length || itemLines.some(line => quantityWarning(line)))) {
    return formError(form, t('部分商品库存已变化，请取消后重新下单。', 'Some items are unavailable. Cancel this order and try again.'));
  }
  const baseTotal = paymentBase(order);
  const useWallet = order.kind !== 'recharge' && Boolean(user && fields.has('wallet'));
  const estimate = quote(baseTotal, fields.get('method'), useWallet, user?.balance, order.kind === 'recharge' ? allChannelIds : allowedChannels(order.items || []));
  if (!estimate.method) return formError(form, t('请选择可用的支付渠道。', 'Choose an available payment channel.'));
  Object.assign(order, estimate, { baseTotal, useWallet, paidAt: new Date().toISOString(), paymentRef: `DEMO-${order.id}` });
  if (order.kind === 'recharge') {
    addTransaction(user, order, 'recharge', baseTotal);
    finishFulfillment(order);
  } else {
    if (estimate.walletUsed) addTransaction(user, order, 'purchase', -estimate.walletUsed);
    order.fulfillment = order.items.map((item, index) => {
      const delivery = item.delivery || itemLines[index]?.product.delivery || 'auto';
      return { ...item, delivery, codes: delivery === 'auto' ? issueCodes(order, item, index) : [] };
    });
    if (order.fulfillment.some(item => item.delivery === 'manual')) order.status = 'processing';
    else finishFulfillment(order);
  }
  save();
  go(order.kind === 'recharge' ? '/me/wallet' : orderPath(order), { replace: true });
  toast(order.kind === 'recharge' ? t('充值已到账', 'Wallet topped up') : t('模拟付款成功', 'Demo payment successful'), 'check');
}

function addTransaction(user, order, type, amount) {
  user.balance = (Number(user.balance) || 0) + amount;
  user.ledger ??= [];
  user.ledger.unshift({ id: order.id, type, amount, balanceAfter: user.balance, createdAt: order.paidAt, note: order.note || order.id });
}

function sampleOrderData() {
  const item = { productId: 'guest-example', skuId: 'standard', qty: 1, name: '数字素材示例', nameEn: 'Sample digital asset', variant: '标准版', variantEn: 'Standard', price: 1900, delivery: 'auto' };
  const paidAt = new Date(Date.now() - 2 * 24 * 60 * 60_000).toISOString();
  return {
    id: sampleOrder.id, owner: null, email: sampleOrder.email, kind: 'product', isDemoSample: true,
    status: 'completed', createdAt: paidAt, paidAt, completedAt: paidAt,
    subtotal: 1900, baseTotal: 1900, fee: 57, total: 1957, payable: 1957, method: 'alipay', items: [item],
    fulfillment: [{ ...item, codes: ['SYH-DEMO-EXAMPLE-001'] }],
  };
}

function findGuestOrders(email, id) {
  return state.orders.filter(order => !order.owner && (!email || order.email === email) && (!id || order.id.toUpperCase() === id));
}

function guestResults(requestedPage) {
  const { email, orderId } = guestFilter;
  const orders = findGuestOrders(email, orderId);
  if (!orders.length) return empty(email || orderId ? t('没有找到匹配的订单', 'No matching orders') : t('还没有游客订单', 'No guest orders yet'), '', 'inbox');
  for (const order of orders) checkExpiry(order);
  const title = state.prefs.lang === 'en-US' ? `${orders.length} ${orders.length === 1 ? 'order' : 'orders'}` : `${orders.length} ${t('笔订单')}`;
  const totalPages = Math.ceil(orders.length / lookupPageSize);
  const currentPage = Math.min(Math.max(1, Number.parseInt(requestedPage, 10) || 1), totalPages);
  const visible = orders.slice((currentPage - 1) * lookupPageSize, currentPage * lookupPageSize);
  return panel(email || orderId ? t('查询结果', 'Results') : t('本地游客订单', 'Local guest orders'), 'receipt', `<div class="co-result-count muted">${esc(title)}</div><div class="co-result-list">${visible.map(order => `<article class="co-result">
    <div class="co-result-icon">${icon('receipt', 20)}</div><div class="co-result-meta">
      <strong>${esc(order.items?.length ? itemName(order.items[0]) : t('订单', 'Order'))}</strong><span>${esc(localDate(order.createdAt))}</span></div>
    <div class="co-result-actions">${statusBadge(order.status)}<strong>${money(displayTotal(order))}</strong>
      ${actionLink(orderPath(order), t('查看详情', 'Details'), 'arrow-right', 'quiet small')}
    </div>
    ${order.status === 'pending' ? `<div class="co-result-pay">
      ${actionLink(payPath(order.id), t('去支付', 'Pay now'), 'credit-card', 'primary small')}
    </div>` : ''}
    <div class="co-result-reference copy-line"><code>${esc(order.id)}</code>${copyButton(order.id, 'order-number')}</div>
  </article>`).join('')}</div>${totalPages > 1 ? `<nav class="co-result-pagination" aria-label="${esc(t('查询结果页码', 'Result pages'))}">
      ${currentPage > 1 ? actionLink(`/guest/orders?page=${currentPage - 1}`, t('上一页', 'Previous'), 'chevron-left', 'subtle') : ''}<span>${currentPage} / ${totalPages}</span>
      ${currentPage < totalPages ? actionLink(`/guest/orders?page=${currentPage + 1}`, t('下一页', 'Next'), 'chevron-right', 'subtle') : ''}</nav>` : ''}`);
}

function renderGuestLookup(route) {
  return page(t('游客订单查询', 'Guest order lookup'), `<div class="co-stack">
    ${panel(t('查找订单', 'Find an order'), 'search', `<form class="co-lookup-form" data-form="co-lookup" novalidate>
      ${formField(t('下单邮箱', 'Order email'), 'email', { type: 'email', value: guestFilter.email, placeholder: sampleOrder.email, attrs: 'autocomplete="off"' })}
      ${formField(t('订单号', 'Order number'), 'orderId', { value: guestFilter.orderId, placeholder: 'SYH-…', attrs: 'autocomplete="off"' })}
      ${errorBox()}
      <div class="co-lookup-buttons"><button class="button primary" type="submit">${icon('search')}${esc(t('查询订单', 'Find orders'))}</button>
        ${actionButton('co-open-sample', t('打开示例订单', 'Open sample order'), { glyph: 'receipt' })}
        ${guestFilter.email || guestFilter.orderId ? actionButton('co-clear-guest', t('清除筛选', 'Clear filters'), { glyph: 'x', kind: 'subtle' }) : ''}
      </div>
    </form>`)}${guestResults(route.query.get('page'))}
  </div>`, { back: '/', backText: t('返回商城', 'Back to shop') });
}

function submitGuest(form, fields) {
  const email = normalizeEmail(fields.get('email'));
  const id = String(fields.get('orderId') || '').trim().toUpperCase();
  if (email && !validEmail(email)) return formError(form, t('请检查邮箱格式。', 'Check the email address.'));
  setGuestFilter(email, id);
  go('/guest/orders');
}

function orderAmounts(order) {
  const subtotal = order.subtotal ?? paymentBase(order);
  const recharge = order.kind === 'recharge';
  return `<div class="co-amounts">
    ${amountRow(recharge ? t('充值金额', 'Top-up amount') : t('商品小计', 'Items subtotal'), money(subtotal))}
    ${order.memberDiscount ? amountRow(t('会员优惠', 'Member discount'), `−${money(order.memberDiscount)}`) : ''}
    ${order.fee ? amountRow(feeLabel(order.feeRule), money(order.fee)) : ''}
    ${amountRow(t('订单合计', 'Order total'), money(displayTotal(order)), '', 'co-total')}
    ${order.walletUsed ? amountRow(t('钱包抵扣', 'Wallet deduction'), money(order.walletUsed)) + amountRow(t('渠道支付', 'Paid online'), money(order.payable)) : ''}
  </div>`;
}

function fulfillmentCodes(order) {
  return (order.fulfillment || []).flatMap(item => item.codes || []);
}

function deliveryPanel(order) {
  if (order.kind === 'recharge' || !['completed', 'processing'].includes(order.status)) return '';
  const items = order.fulfillment || [];
  const manual = items.filter(item => item.delivery === 'manual');
  const automatic = items.filter(item => item.delivery !== 'manual' && item.codes?.length);
  return panel(t('交付信息', 'Delivery'), 'package', `<div class="co-delivery-groups">
    ${automatic.map(item => {
      const kind = item.productId === 'syh-gift-card' ? 'gift-card-code' : 'delivery-code';
      return `<section class="co-delivery-group"><h3>${esc(itemName(item))}</h3><div class="co-delivery-codes">
        ${item.codes.map(code => `<div class="co-delivery-code copy-line"><code>${esc(code)}</code>${copyButton(code, kind)}</div>`).join('')}
      </div></section>`;
    }).join('')}
    ${automatic.length ? `<div class="co-delivery-actions">
      ${actionButton('co-copy-delivery', t('复制交付内容', 'Copy delivery'), { glyph: 'copy', orderId: order.id })}
      ${actionButton('co-download-delivery', t('下载文本', 'Download text'), { glyph: 'download', orderId: order.id })}
    </div>` : ''}
    ${manual.map(item => `<section class="co-delivery-group"><h3>${esc(itemName(item))}</h3><div class="co-delivery-state">${icon(order.status === 'processing' ? 'clock' : 'check', 16)}<span>${esc(order.status === 'processing' ? t('正在处理人工交付', 'Manual delivery in progress') : t('人工交付已完成', 'Manual delivery complete'))}</span></div>
      ${order.manualInput?.[item.productId]?.length ? `<dl class="co-facts">${order.manualInput[item.productId].map(field =>
        copyableFact(t(field.label, field.en || field.label), field.value, 'delivery-info')).join('')}</dl>` : ''}
    </section>`).join('')}
    ${order.status === 'processing' ? `<div class="co-delivery-actions">${actionButton('co-finish-delivery', t('模拟完成交付', 'Simulate fulfillment'), { glyph: 'check', orderId: order.id })}</div>` : ''}
  </div>`);
}

const ticketCategories = [
  ['not_received', '没有收到商品', 'Item not received'],
  ['not_working', '交付内容无法使用', 'Delivery does not work'],
  ['refund', '申请退款', 'Refund request'],
  ['other', '其他问题', 'Other issue'],
];

function ticketCategory(value) {
  const [, zh, en] = ticketCategories.find(category => category[0] === value) || ticketCategories.at(-1);
  return t(zh, en);
}

function ticketStatus(status) {
  return {
    waiting_staff: t('等待回复', 'Awaiting support'),
    waiting_customer: t('客服已回复', 'Support replied'),
    closed: t('已关闭', 'Closed'),
  }[status] || t('工单', 'Ticket');
}

function ticketBadge(ticket) {
  return `<span class="co-status co-status-${ticket.status === 'closed' ? 'canceled' : ticket.status === 'waiting_customer' ? 'completed' : 'pending'}">${icon(ticket.status === 'closed' ? 'check' : 'ticket', 15)}${esc(ticketStatus(ticket.status))}</span>`;
}

function attachmentPicker() {
  return `<div class="co-attachments"><label class="button quiet co-attachment-trigger">${icon('paperclip', 17)}<span>${esc(t('添加截图', 'Attach screenshots'))}</span><input type="file" name="attachments" accept="image/png,image/jpeg,image/webp,image/gif" multiple></label><span class="muted" data-co-file-names aria-live="polite"></span></div>`;
}

function ticketComposer(id, { reply = false } = {}) {
  const categories = ticketCategories.map(([value, zh, en]) => ({ value, label: t(zh, en) }));
  return `<form class="co-ticket-form" data-form="${reply ? 'co-ticket-reply' : 'co-ticket-start'}" novalidate>
    <input type="hidden" name="${reply ? 'ticketId' : 'orderId'}" value="${esc(id)}">
    ${reply ? '' : `<div class="field co-field"><span>${esc(t('问题类型', 'Issue type'))}</span>${select({ name: 'category', options: categories, value: 'delivery', label: t('问题类型', 'Issue type'), icon: 'ticket' })}</div>`}
    <label class="field co-field"><span>${esc(reply ? t('回复', 'Reply') : t('问题描述', 'Description'))}</span><textarea class="input" name="message" maxlength="2000" rows="${reply ? 3 : 4}" placeholder="${esc(reply ? t('补充说明或回复客服', 'Add details or reply') : t('描述遇到的问题', 'Describe the issue'))}"></textarea></label>
    ${attachmentPicker()}
    ${errorBox()}<button class="button primary" type="submit">${icon('send')}${esc(reply ? t('发送回复', 'Send reply') : t('提交工单', 'Submit ticket'))}</button>
  </form>`;
}

function supportPanel(order) {
  if (order.kind !== 'product' || order.status !== 'completed') return '';
  const ticket = ticketForOrder(order.id);
  if (ticket) return panel(t('售后工单', 'Support ticket'), 'ticket', `<div class="co-ticket-preview">
    <strong>${esc(ticketCategory(ticket.category))}</strong>${ticketBadge(ticket)}${actionLink(`/ticket/${encodeURIComponent(ticket.id)}`, t('查看工单', 'View ticket'), 'arrow-right')}
    <div class="co-ticket-reference copy-line"><code>${esc(ticket.id)}</code>${copyButton(ticket.id, 'ticket-number')}</div>
  </div>`);
  return panel(t('售后工单', 'Support ticket'), 'ticket', actionButton(
    'co-start-ticket', t('提交问题', 'Start a ticket'), { glyph: 'plus', orderId: order.id, kind: 'subtle' },
  ));
}

function renderOrderDetail(route, guest) {
  const title = t('订单详情', 'Order details');
  const id = route.parts.at(-1);
  const order = orderById(id);
  if (!order || Boolean(order.owner) === guest) return unavailableOrder(title);
  if (!canSeeOrder(order)) return restrictedOrder(order, title);
  checkExpiry(order);
  return orderDetail(order);
}

function orderDetail(order) {
  const back = order.owner ? '/me/orders' : '/guest/orders';
  return page(t('订单详情', 'Order details'), `<div class="co-grid">
    <div class="co-stack">
      ${panel(order.kind === 'recharge' ? t('充值记录', 'Recharge') : t('订单商品', 'Order items'), order.kind === 'recharge' ? 'wallet' : 'bag', orderItems(order))}
      ${deliveryPanel(order)}${supportPanel(order)}
    </div>
    <aside class="co-aside co-stack">${panel(t('订单信息', 'Order information'), 'receipt', `${orderFacts(order)}${orderAmounts(order)}
      ${order.status === 'pending' ? `<div class="co-order-pay">${actionLink(payPath(order.id), t('继续支付', 'Continue to payment'), 'credit-card', 'primary')}</div>` : ''}`)}</aside>
  </div>`, { back, backText: t('返回订单', 'Back to orders'), side: statusBadge(order.status) });
}

function renderTicket(route) {
  const title = t('售后工单', 'Support ticket');
  const ticket = ticketById(route.parts[1]);
  const order = ticket && orderById(ticket.orderId);
  if (!canSeeOrder(order)) return restrictedOrder(order, title, { returnTo: route.path });
  const history = ticket.messages.map(message => `<article class="co-ticket-message${message.author === 'staff' ? ' is-staff' : ''}">
    <div><strong>${esc(message.author === 'staff' ? t('店铺客服', 'Store support') : t('你', 'You'))}</strong><time datetime="${esc(message.createdAt)}">${esc(localDate(message.createdAt))}</time></div>
    ${message.text ? `<p>${esc(message.text)}</p>` : ''}
    ${message.attachments?.length ? `<ul>${message.attachments.map(attachment => `<li>${attachment.preview ? `<img src="${esc(attachment.preview)}" alt="" width="84" height="66">` : icon('paperclip', 14)}<span>${esc(attachment.name)}</span></li>`).join('')}</ul>` : ''}
  </article>`).join('');
  return page(title, `<div class="co-grid">
    ${panel(t('工单对话', 'Conversation'), 'ticket', `<div class="co-ticket-log">${history}</div>${ticket.status === 'closed' ? `<p class="co-ticket-note">${esc(t('发送新回复可重新打开此工单。', 'Send another reply to reopen the ticket.'))}</p>` : ''}${ticketComposer(ticket.id, { reply: true })}`)}
    <aside class="co-aside">${panel(t('工单信息', 'Ticket information'), 'receipt', `<dl class="co-facts">
      ${copyableFact(t('工单号', 'Ticket number'), ticket.id, 'ticket-number', { code: true })}
      <div><dt>${esc(t('问题类型', 'Issue type'))}</dt><dd>${esc(ticketCategory(ticket.category))}</dd></div>
      ${copyableFact(t('订单号', 'Order number'), order.id, 'order-number', { code: true, href: link(orderPath(order)) })}
    </dl><div class="co-ticket-actions">
      ${actionButton('co-ticket-refresh', t('刷新工单', 'Refresh ticket'), { glyph: 'refresh', orderId: ticket.id })}
      ${ticket.status === 'waiting_staff' ? actionButton('co-ticket-simulate', t('模拟客服回复', 'Simulate support reply'), { glyph: 'send', orderId: ticket.id }) : ''}
      ${ticket.status !== 'closed' ? actionButton('co-ticket-close', t('问题已解决，关闭工单', 'Close resolved ticket'), { glyph: 'check', orderId: ticket.id }) : ''}
    </div>`)}</aside>
  </div>`, { back: orderPath(order), backText: t('返回订单详情', 'Back to order details'), side: ticketBadge(ticket) });
}

const fileTypes = ['image/png', 'image/jpeg', 'image/webp', 'image/gif'];

async function attachmentPreview(file) {
  try {
    const image = await createImageBitmap(file);
    const scale = Math.min(1, 280 / Math.max(image.width, image.height));
    const canvas = document.createElement('canvas');
    canvas.width = Math.max(1, Math.round(image.width * scale));
    canvas.height = Math.max(1, Math.round(image.height * scale));
    canvas.getContext('2d').drawImage(image, 0, 0, canvas.width, canvas.height);
    image.close();
    return canvas.toDataURL('image/webp', .68);
  } catch {
    return '';
  }
}

async function submitTicket(form, fields, reply) {
  const ticket = reply ? ticketById(fields.get('ticketId')) : null;
  const order = orderById(reply ? ticket?.orderId : fields.get('orderId'));
  if (!canSeeOrder(order) || order.kind !== 'product' || order.status !== 'completed' || (reply && !ticket)) return;
  const existing = ticketForOrder(order.id);
  if (!reply && existing) return go(`/ticket/${encodeURIComponent(existing.id)}`);
  formError(form, '');
  const message = String(fields.get('message') || '').trim();
  const category = fields.get('category');
  const files = fields.getAll('attachments').filter(file => typeof file !== 'string' && file.size > 0);
  if (!reply && !ticketCategories.some(option => option[0] === category)) return formError(form, t('请选择问题类型。', 'Select an issue type.'));
  if ((!message && !files.length) || message.length > 2000) return formError(form, t('请填写问题描述或添加截图。', 'Describe the issue or attach a screenshot.'));
  if (files.length > 3) return formError(form, t('最多可以添加 3 张截图。', 'Attach up to three screenshots.'));
  if (files.some(file => !fileTypes.includes(file.type) || file.size > 5 * 1024 * 1024)) return formError(form, t('请选择不超过 5 MB 的 PNG、JPG、WebP 或 GIF 图片。', 'Choose PNG, JPG, WebP or GIF images of up to 5 MB each.'));
  const button = form.querySelector('button[type=submit]');
  if (button?.disabled) return;
  if (button) button.disabled = true;
  try {
    const attachments = await Promise.all(files.map(async file => ({ name: file.name, type: file.type, preview: await attachmentPreview(file) })));
    const createdAt = new Date().toISOString();
    const entry = { author: 'buyer', text: message, createdAt, attachments };
    if (reply) {
      ticket.messages.push(entry);
      ticket.status = 'waiting_staff';
      ticket.updatedAt = createdAt;
      save();
      refresh();
      toast(t('回复已发送', 'Reply sent'));
      return;
    }
    if (ticketForOrder(order.id)) return go(`/ticket/${encodeURIComponent(ticketForOrder(order.id).id)}`);
    const newTicket = { id: newId('TK'), orderId: order.id, status: 'waiting_staff', category, createdAt, updatedAt: createdAt, messages: [entry] };
    state.tickets.unshift(newTicket);
    save();
    closeModal();
    go(`/ticket/${encodeURIComponent(newTicket.id)}`);
    toast(t('工单已提交', 'Ticket submitted'));
  } catch {
    formError(form, t('工单暂未保存，请重试。', 'The ticket could not be saved. Try again.'));
  } finally {
    if (button) button.disabled = false;
  }
}

function openSampleOrder() {
  if (!orderById(sampleOrder.id)) {
    state.orders.push(sampleOrderData());
    save();
  }
  setGuestFilter();
  go(orderPath(sampleOrder));
}

function updateCartQuantity(input, delta = 0) {
  const key = input.closest('[data-co-line]').dataset.coLine;
  const line = state.cart.find(item => lineKey(item) === key);
  const current = linesFromCart().find(item => lineKey(item) === key);
  if (!line || !current) return;
  const { min, max } = current;
  const fallback = current.qty;
  let qty = clampQuantity(input.value, min, max, fallback);
  if (delta) qty = clampQuantity(qty + delta, min, max, fallback);
  if (max < min) qty = fallback;
  input.value = qty;
  if (qty === line.qty) return;
  line.qty = qty;
  save();

  const lines = linesFromCart();
  const byKey = new Map(lines.map(item => [lineKey(item), item]));
  for (const row of document.querySelectorAll('[data-co-line]')) {
    const item = byKey.get(row.dataset.coLine);
    if (!item) continue;
    const field = row.querySelector('[data-qty-input="cart"]');
    const blocked = item.max < item.min;
    field.disabled = blocked;
    row.querySelector('[data-delta="-1"]').disabled = blocked || item.qty <= item.min;
    row.querySelector('[data-delta="1"]').disabled = blocked || item.qty >= item.max;
    row.querySelector('[data-co-line-price]').textContent = money(item.price * item.qty);
    const warning = row.querySelector('[data-co-line-warning]');
    const message = quantityWarning(item);
    warning.hidden = !message;
    warning.textContent = message;
  }
  document.querySelector('[data-co-amount="cart-qty"]').textContent = lines.reduce((sum, item) => sum + item.qty, 0);
  document.querySelector('[data-co-amount="cart-total"]').textContent = money(lines.reduce((sum, item) => sum + item.qty * item.price, 0));

  const warning = cartWarnings(lines);
  const summary = document.querySelector('[data-co-cart-warning]');
  const checkout = document.querySelector('[data-co-cart-checkout]');
  summary.hidden = !warning;
  summary.textContent = warning;
  checkout.setAttribute('aria-disabled', String(Boolean(warning)));
  checkout.tabIndex = warning ? -1 : 0;
  document.dispatchEvent(new Event('shop-cart-change'));
}

function removeCartItem(element) {
  const key = element.closest('[data-co-line]')?.dataset.coLine;
  const line = linesFromCart().find(item => lineKey(item) === key);
  if (!line) return;
  const name = localName(line.product);
  confirmAction({
    title: t('移除商品？', 'Remove item?'),
    message: t(`将「${name}」从购物车移除。`, `Remove “${name}” from your cart.`),
    confirmLabel: t('确认移除', 'Remove item'), symbol: 'trash',
    onConfirm() {
      const index = state.cart.findIndex(item => lineKey(item) === key);
      if (index < 0) return;
      state.cart.splice(index, 1);
      save();
      refresh();
      document.querySelector('[data-co-cart-checkout], .co-empty .button')?.focus({ preventScroll: true });
      toast(t('商品已移除', 'Item removed'), 'check');
    },
  });
}

function paymentControls(event) {
  const { target } = event;
  if (!(target instanceof HTMLInputElement)) return;
  if (target.matches('[data-qty-input="cart"]')) {
    updateCartQuantity(target);
    return;
  }
  if (target.name === 'attachments') {
    const files = Array.from(target.files || []);
    const names = target.closest('.co-attachments')?.querySelector('[data-co-file-names]');
    if (names) names.textContent = files.map(file => file.name).join(', ');
    return;
  }
  const quoteBox = target.closest('[data-co-quote]');
  if (!quoteBox || !['method', 'wallet'].includes(target.name)) return;
  const form = quoteBox.closest('form');
  const fields = new FormData(form);
  const useWallet = quoteBox.dataset.recharge !== 'true' && fields.has('wallet');
  const base = Number(quoteBox.dataset.base);
  const balance = activeUser()?.balance;
  const allowed = quoteBox.dataset.allowed.split(',').filter(Boolean);
  const channel = quoteBox.querySelector('[data-co-channel]');
  const selected = fields.get('method');
  if (target.name === 'method' && selected !== 'wallet') quoteBox.dataset.channelPreference = selected;
  const estimate = quote(base, quoteBox.dataset.channelPreference, useWallet, balance, allowed);
  quoteBox.querySelector('[data-co-label="fee"]').textContent = feeLabel(estimate.feeRule);
  if (target.name === 'wallet') {
    const options = availableChannels(base, useWallet, balance, allowed);
    if (channel.querySelector('input')?.value !== estimate.method || channel.querySelectorAll('[data-select-option]').length !== options.length) {
      channel.innerHTML = paymentSelect(base, estimate.method, useWallet, balance, allowed);
    }
  }
  for (const [name, amount] of Object.entries({ fee: estimate.fee, wallet: estimate.walletUsed, payable: estimate.payable })) {
    const box = quoteBox.querySelector(`[data-co-amount="${name}"]`);
    if (box) box.textContent = money(amount);
  }
  const presentation = form.querySelector('[data-co-payment-presentation]');
  const checkoutSubmit = form.querySelector('[data-co-checkout-submit]');
  if (checkoutSubmit) checkoutSubmit.disabled = !estimate.method || checkoutSubmit.dataset.coStockBlocked === 'true';
  const order = presentation && orderById(fields.get('orderId'));
  if (order && canSeeOrder(order) && order.status === 'pending' && !checkExpiry(order)) {
    Object.assign(order, estimate, { useWallet, preferredChannel: quoteBox.dataset.channelPreference });
    save();
    if (presentation.dataset.method !== estimate.method) {
      presentation.innerHTML = paymentPresentation(order, estimate.method);
      presentation.dataset.method = estimate.method;
      form.querySelector('[data-co-payment-action]').innerHTML = paymentAction(estimate);
    }
  }
}

if (typeof document !== 'undefined') document.addEventListener('change', paymentControls);

function downloadCodes(order, value) {
  const objectUrl = URL.createObjectURL(new Blob([value], { type: 'text/plain;charset=utf-8' }));
  const anchor = document.createElement('a');
  anchor.href = objectUrl;
  anchor.download = `${order.id}.txt`;
  document.body.append(anchor);
  anchor.click();
  anchor.remove();
  setTimeout(() => URL.revokeObjectURL(objectUrl), 1000);
}

export function renderCommerce(route) {
  const [area, child, id] = route.parts;
  if (area === 'cart' && !child) return renderCart();
  if (area === 'checkout' && !child) return renderCheckout(route);
  if (area === 'pay') return renderPayment(route);
  if (area === 'guest' && child === 'orders') return id ? renderOrderDetail(route, true) : renderGuestLookup(route);
  if ((area === 'me' && child === 'orders' && id) || (['orders', 'recharge-orders'].includes(area) && child)) return renderOrderDetail(route, false);
  if (area === 'ticket' && child) return renderTicket(route);
  return null;
}

export async function commerceSubmit(form) {
  const action = form.dataset.form;
  if (!action?.startsWith('co-')) return false;
  const fields = new FormData(form);
  if (action === 'co-checkout') submitCheckout(form, fields);
  else if (action === 'co-payment') submitPayment(form, fields);
  else if (action === 'co-lookup') submitGuest(form, fields);
  else if (action === 'co-ticket-start' || action === 'co-ticket-reply') await submitTicket(form, fields, action === 'co-ticket-reply');
  else return false;
  return true;
}

function resolveTicketAction(action, ticket, button) {
  if (!ticket || !canSeeOrder(orderById(ticket.orderId))) return;
  if (action === 'co-ticket-refresh') {
    animateRefresh(button);
    toast(t('工单已刷新', 'Ticket refreshed'), 'check');
    return;
  }
  if (action === 'co-ticket-close') {
    confirmAction({
      title: t('关闭售后工单？', 'Close this ticket?'),
      message: t('工单将标记为已解决，回复后可以重新打开。', 'This ticket will be marked as resolved. A new reply will reopen it.'),
      confirmLabel: t('确认关闭', 'Close ticket'), symbol: 'check',
      onConfirm() {
        if (ticket.status === 'closed') return;
        ticket.status = 'closed';
        ticket.updatedAt = new Date().toISOString();
        save();
        refresh();
        toast(t('工单已关闭', 'Ticket closed'), 'check');
      },
    });
    return;
  }
  if (action === 'co-ticket-simulate' && ticket.status === 'waiting_staff') {
    ticket.status = 'waiting_customer';
    ticket.updatedAt = new Date().toISOString();
    ticket.messages.push({ author: 'staff', text: t('已收到你的留言。需要补充信息时，可以在这里回复。', 'We received your message. Reply here if you have details to add.'), createdAt: ticket.updatedAt });
    save();
  }
  refresh();
  toast(t('已生成演示回复', 'Demo reply added'), 'check');
}

export async function commerceAction(action, element) {
  if (!action?.startsWith('co-')) return false;
  const id = element.dataset.id;
  if (action === 'co-qty') {
    updateCartQuantity(element.closest('.qty-control').querySelector('.qty-input'), Number(element.dataset.delta));
  } else if (action === 'co-remove') removeCartItem(element);
  else if (action === 'co-open-sample') openSampleOrder();
  else if (action === 'co-clear-guest') {
    setGuestFilter();
    go('/guest/orders');
  } else if (['co-ticket-close', 'co-ticket-refresh', 'co-ticket-simulate'].includes(action)) resolveTicketAction(action, ticketById(id), element);
  else {
    const order = orderById(id);
    if (!canSeeOrder(order)) return true;
    if (action === 'co-cancel-order' && !checkExpiry(order) && order.status === 'pending') {
      confirmAction({
        title: t('取消订单？', 'Cancel this order?'),
        message: t(`订单 ${order.id} 将停止付款。`, `Order ${order.id} will be closed for payment.`),
        confirmLabel: t('确认取消订单', 'Confirm cancellation'), symbol: 'x',
        onConfirm() {
          if (checkExpiry(order) || order.status !== 'pending') return;
          order.status = 'canceled';
          order.canceledAt = new Date().toISOString();
          save();
          go(orderPath(order), { replace: true });
          toast(t('订单已取消', 'Order canceled'), 'check');
        },
      });
    } else if (action === 'co-refresh-payment') {
      if (checkExpiry(order)) go(orderPath(order), { replace: true });
      else animateRefresh(element);
      toast(t('已刷新支付状态', 'Payment status refreshed'), 'check');
    } else if (action === 'co-show-qr' && order.status === 'pending' && channelById(order.method)[3] === 'qr') {
      const reference = paymentReference(order);
      openModal(t('演示收款码', 'Demo payment QR code'), `<div class="co-modal-qr">${demoQr()}</div>
        <div class="co-modal-reference copy-line"><code>${esc(reference)}</code>${copyButton(reference, 'payment-reference')}</div>`);
    } else if (action === 'co-start-ticket' && order.kind === 'product' && order.status === 'completed' && !ticketForOrder(id)) {
      openModal(t('提交售后工单', 'Submit a support ticket'), ticketComposer(id));
    } else if (action === 'co-finish-delivery' && order.status === 'processing') {
      finishFulfillment(order);
      save();
      refresh();
      toast(t('模拟交付已完成', 'Demo fulfillment complete'));
    } else if (action === 'co-download-delivery') downloadCodes(order, fulfillmentCodes(order).join('\n'));
    else if (action === 'co-copy-delivery') {
      await copyWithNotice(fulfillmentCodes(order).join('\n'), t('已复制交付内容', 'Delivery copied'));
    } else if (action === 'co-copy-pay-link') {
      await copyWithNotice(new URL(link(payPath(order.id)), location.href).href, t('已复制支付链接', 'Payment link copied'));
    }
  }
  return true;
}

export function commerceTick() {
  for (const element of document.querySelectorAll('[data-co-countdown]')) {
    const order = orderById(element.dataset.coCountdown);
    if (!order) continue;
    if (checkExpiry(order)) {
      closeModal();
      go(orderPath(order), { replace: true });
      toast(t('订单已过期', 'Order expired'));
    } else {
      const remaining = countdown(order);
      if (element.textContent !== remaining) element.textContent = remaining;
    }
  }
}
