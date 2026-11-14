import {
  state, activeUser, save, go, refresh, toast, t, esc, icon, money, formatDate,
  select, digest, copyText, copyButton, animateRefresh, openModal, closeModal
} from './ui.js';

const demoEmail = 'demo@syh.example';
const demoPassword = 'SyhDemo2026!';
const demoGiftCode = 'SYH-GIFT-2026';
const pageSize = 7;
const pendingForms = new WeakSet();
let loginVerification = null;
let twoFactorSetup = null;
let recoveryDisplay = null;

const statusOptions = [
  ['pending', '待付款', 'Awaiting payment'], ['processing', '交付中', 'Processing'],
  ['completed', '已完成', 'Completed'], ['canceled', '已取消', 'Canceled'],
  ['expired', '已过期', 'Expired']
];

const paymentChannels = [
  ['alipay', '支付宝', 'Alipay'], ['wechat', '微信支付', 'WeChat Pay'],
  ['alipay2', '支付宝（渠道二）', 'Alipay (Channel 2)'], ['wechat2', '微信支付（渠道二）', 'WeChat Pay (Channel 2)'],
  ['unionpay', '银联支付（渠道二）', 'UnionPay (Channel 2)'], ['usdt-bsc', 'USDT-BSC', 'USDT-BSC'],
  ['usdt-polygon', 'USDT-Polygon', 'USDT-Polygon'],
  ['usdt-x-layer', 'USDT-X Layer', 'USDT-X Layer'], ['usdt-plasma', 'USDT-Plasma', 'USDT-Plasma']
];

const memberPages = [
  ['', 'layout', '账户概览', 'Overview'], ['profile', 'user', '个人资料', 'Profile'],
  ['security', 'shield', '账户安全', 'Security'], ['orders', 'receipt', '我的订单', 'Orders'],
  ['wallet', 'wallet', '钱包', 'Wallet'], ['gift-cards', 'gift', '礼品卡', 'Gift cards'],
  ['affiliate', 'users', '推广返佣', 'Referrals']
];

const ledgerTypes = {
  purchase: ['商品消费', 'Purchase'], recharge: ['账户充值', 'Recharge'],
  gift: ['礼品卡兑换', 'Gift card'], refund: ['订单退款', 'Refund'], withdraw: ['提现', 'Withdrawal']
};

const logTypes = { login: ['邮箱登录', 'Email sign-in'], demo: ['演示账户登录', 'Demo sign-in'] };
const affiliateRate = 0.03;
const confirmationDays = 7;
const minimumWithdrawal = 100;
const alphabet = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ234567';

const now = () => new Date().toISOString();
const randomId = () => crypto.randomUUID().replaceAll('-', '').slice(0, 12).toUpperCase();
const inputValue = (data, name) => String(data.get(name) ?? '').trim();
const normalizedEmail = value => String(value ?? '').trim().toLowerCase();
const userFor = email => state.users.find(user => user.email === normalizedEmail(email));
const userOrders = user => state.orders.filter(order => order.owner === user.email).sort((a, b) => b.createdAt.localeCompare(a.createdAt));
const tr = options => options.map(([value, zh, en]) => ({ value, label: t(zh, en) }));

function accountPath(path, values = {}) {
  const params = new URLSearchParams();
  for (const [key, value] of Object.entries(values)) {
    if (value) params.set(key, value);
  }
  const query = params.toString();
  return `${path}${query ? `?${query}` : ''}`;
}

function nextPath(value) {
  return typeof value === 'string' && /^\/(?![\\/]|auth(?:\/|\?|$))[^\r\n#]*$/u.test(value) ? value : '/me';
}

function action(name, label, iconName, options = {}) {
  const classes = `button ${options.classes || 'quiet'}`;
  const value = options.value == null ? '' : ` data-value="${esc(options.value)}"`;
  return `<button type="button" class="${classes}" data-action="${name}"${value}>${iconName ? icon(iconName) : ''}${label}</button>`;
}

function link(path, label, iconName, classes = 'button quiet') {
  return `<a class="${classes}" href="#${esc(path)}">${iconName ? icon(iconName) : ''}${label}</a>`;
}

function submit(label, iconName, classes = 'button primary') {
  return `<button type="submit" class="${classes}">${label}${iconName ? icon(iconName) : ''}</button>`;
}

function errorSlot() {
  return '<p class="form-error acct-error" role="alert" hidden></p>';
}

function message(form, value) {
  const error = form.querySelector('.acct-error');
  if (!error) return;
  error.hidden = !value;
  error.textContent = value || '';
}

function showFieldError(form, field) {
  if (!field || field.validity.valid) return false;
  const label = field.labels?.[0];
  const name = label?.querySelector('span')?.textContent || label?.textContent?.trim() || '';
  let invalid = t('请检查填写内容。', 'Check this field.');
  if (field.validity.typeMismatch && field.type === 'email') invalid = t('请填写有效的邮箱地址。', 'Enter a valid email address.');
  else if (field.validity.valueMissing) invalid = t(name ? `请填写${name}。` : '请填写必填项。', name ? `Enter ${name.toLowerCase()}.` : 'Complete this required field.');
  field.setAttribute('aria-invalid', 'true');
  field.focus();
  message(form, invalid);
  return true;
}

function field(name, label, attributes = '', value = '') {
  return `<label class="field acct-field"><span>${label}</span><input class="input" name="${name}" ${attributes} value="${esc(value)}"></label>`;
}

function passwordField(name, label, autocomplete = 'current-password') {
  return `<div class="field acct-field"><label for="acct-password-${name}">${label}</label>
    <div class="acct-password"><input class="input" id="acct-password-${name}" name="${name}" type="password" autocomplete="${autocomplete}" maxlength="128" required>
      <button type="button" class="icon-button" data-action="account-password-toggle" aria-label="${t('显示密码', 'Show password')}" aria-pressed="false">${icon('eye')}</button></div></div>`;
}

function twoFactorField(recoveryAllowed = true) {
  return `<div class="field acct-field"><label for="acct-otp">${recoveryAllowed ? t('动态验证码或恢复码', 'Authenticator or recovery code') : t('动态验证码', 'Authenticator code')}</label>
    <div class="acct-field-line"><input class="input" id="acct-otp" name="otp" autocomplete="one-time-code" maxlength="24" required>
      ${action('account-demo-otp', t('使用演示动态码', 'Use demo code'), 'clock', { classes: 'subtle' })}</div></div>`;
}

function renderAuth(route, page) {
  const next = nextPath(route.query.get('next') || route.query.get('redirect'));
  const invite = route.query.get('invite') || route.query.get('ref') || '';
  const params = { next: next === '/me' ? '' : next, invite };
  const authLink = name => accountPath(`/auth/${name}`, params);
  const titles = {
    login: t('登录会员账户', 'Sign in'), register: t('注册会员账户', 'Create an account'),
    forgot: t('重置密码', 'Reset password')
  };

  if (activeUser()) {
    queueMicrotask(() => go(next, { replace: true }));
    return '';
  }

  const verifying = page === 'login' && loginVerification?.next === next && Date.now() < loginVerification.expires;
  let body;
  if (verifying) {
    body = `<form class="acct-form" data-form="account-verify-login" novalidate>
      ${twoFactorField()}${errorSlot()}${submit(t('验证并登录', 'Verify and sign in'), 'arrow-right', 'button primary acct-submit')}
      ${action('account-cancel-verify', t('返回登录', 'Back to sign in'), 'chevron-left')}</form>`;
  } else if (page === 'register') {
    body = `<form class="acct-form" data-form="account-register" novalidate>
      <input type="hidden" name="next" value="${esc(next)}">
      <div class="acct-form-grid">${field('name', t('昵称', 'Display name'), 'autocomplete="nickname" maxlength="32" required')}
        ${field('email', t('邮箱地址', 'Email address'), 'type="email" autocomplete="email" maxlength="120" required')}</div>
      ${passwordField('newPassword', t('设置演示密码', 'Demo password'), 'new-password')}
      ${field('invite', t('邀请码（选填）', 'Invite code (optional)'), 'autocomplete="off" maxlength="32"', invite)}
      ${errorSlot()}${submit(t('创建账户', 'Create account'), 'arrow-right', 'button primary acct-submit')}</form>`;
  } else if (page === 'forgot') {
    body = `<form class="acct-form" data-form="account-forgot" novalidate>
      <input type="hidden" name="next" value="${esc(next)}">
      ${field('email', t('账户邮箱', 'Account email'), 'type="email" autocomplete="email" maxlength="120" required')}
      ${passwordField('newPassword', t('新密码', 'New password'), 'new-password')}
      ${errorSlot()}${submit(t('保存新密码', 'Save new password'), 'arrow-right', 'button primary acct-submit')}
      ${link(authLink('login'), t('返回登录', 'Back to sign in'), 'chevron-left')}</form>`;
  } else {
    body = `${action('account-demo', t('使用演示账户', 'Use demo account'), 'user', { classes: 'primary acct-demo-button', value: next })}
    <div class="acct-auth-divider"></div><form class="acct-form" data-form="account-login" novalidate>
      <input type="hidden" name="next" value="${esc(next)}">
      ${field('email', t('邮箱地址', 'Email address'), 'type="email" autocomplete="username" maxlength="120" required')}
      ${passwordField('password', t('密码', 'Password'))}
      <a class="acct-text-link acct-forgot link-effect" href="#${esc(authLink('forgot'))}">${t('忘记密码', 'Forgot password')}</a>
      ${errorSlot()}${submit(t('登录', 'Sign in'), 'arrow-right', 'button subtle acct-submit')}
    </form>`;
  }

  return `<section class="acct-auth"><div class="acct-auth-back">${link('/', t('返回商店', 'Back to shop'), 'chevron-left')}</div>
    <div class="panel acct-auth-panel"><div class="acct-auth-heading"><h1>${verifying ? t('两步验证', 'Two-factor verification') : titles[page]}</h1>
      ${verifying ? `<p>${esc(loginVerification.email)}</p>` : ''}</div>
      ${page !== 'forgot' && !verifying ? `<nav class="segmented acct-auth-tabs" aria-label="${t('会员入口', 'Account access')}">
        <a href="#${esc(authLink('login'))}"${page === 'login' ? ' aria-current="page"' : ''}>${t('登录', 'Sign in')}</a>
        <a href="#${esc(authLink('register'))}"${page === 'register' ? ' aria-current="page"' : ''}>${t('注册', 'Register')}</a></nav>` : ''}
      ${body}</div></section>`;
}

function memberHeading(title, right = '') {
  return `<div class="acct-page-title"><h2 id="acct-section-heading">${title}</h2>${right}</div>`;
}

function sectionPanel(title, content, aside = '', classes = '') {
  return `<section class="panel acct-panel ${classes}"><div class="acct-panel-heading"><h3>${title}</h3>${aside}</div>${content}</section>`;
}

function emptyState(iconName, label, extra = '') {
  return `<div class="empty-state acct-empty">${icon(iconName, 25)}<p>${label}</p>${extra}</div>`;
}

function orderKind(order) {
  return order.kind === 'recharge' ? t('钱包充值', 'Wallet recharge') : t('商品订单', 'Product order');
}

function orderTitle(order) {
  if (order.kind === 'recharge') return t('钱包充值', 'Wallet recharge');
  const item = order.items?.[0];
  if (!item) return orderKind(order);
  return t(item.name, item.nameEn || item.name) + (order.items.length > 1 ? ` +${order.items.length - 1}` : '');
}

function orderState(order) {
  return order.status === 'pending' && Date.parse(order.expiresAt) <= Date.now() ? 'expired' : order.status;
}

function orderStatus(order) {
  const entry = statusOptions.find(([value]) => value === orderState(order));
  const label = entry ? t(entry[1], entry[2]) : t('处理中', 'Processing');
  return `<span class="acct-status acct-status-${esc(entry?.[0] || 'processing')}">${label}</span>`;
}

function orderList(orders) {
  return `<div class="acct-order-list">${orders.map(order => `<div class="acct-order-row hover-border">
    <a class="acct-order-link" href="#/me/orders/${encodeURIComponent(order.id)}">
      <span class="acct-order-heading">
        <span class="acct-order-icon" aria-hidden="true">${icon(order.kind === 'recharge' ? 'wallet' : 'receipt', 19)}</span>
        <span class="acct-order-meta"><strong>${esc(orderTitle(order))}</strong><small>${esc(order.id)}</small></span>
      </span>
      <time class="acct-order-date" datetime="${esc(order.createdAt)}">${esc(formatDate(order.createdAt))}</time>
      ${orderStatus(order)}<strong class="acct-amount">${money(order.total)}</strong>${icon('chevron-right', 16)}
    </a>
    ${copyButton(order.id, 'order-number')}</div>`).join('')}</div>`;
}

function summaryLink(path, label, value, iconName) {
  return `<a class="panel acct-summary-card hover-border" href="#${esc(path)}"><div><span>${label}</span><strong>${value}</strong></div>
    <span class="acct-summary-icon" aria-hidden="true">${icon(iconName, 21)}</span></a>`;
}

function renderOverview(user) {
  const orders = userOrders(user);
  const products = orders.filter(order => order.kind === 'product');
  const pending = orders.filter(order => orderState(order) === 'pending');
  return `${memberHeading(t('账户概览', 'Overview'))}<div class="acct-summary-grid">
    ${summaryLink('/me/wallet', t('钱包余额', 'Wallet balance'), money(user.balance), 'wallet')}
    ${summaryLink('/me/orders', t('商品订单', 'Product orders'), products.length, 'receipt')}
    ${summaryLink('/me/orders?status=pending', t('待付款商品订单', 'Unpaid product orders'), pending.filter(order => order.kind === 'product').length, 'clock')}
  </div>${sectionPanel(t('最近订单', 'Recent orders'), orders.length ? orderList(orders.slice(0, 5)) : emptyState('receipt', t('还没有订单', 'No orders yet'), link('/', t('浏览商品', 'Browse products'), 'arrow-right', 'button subtle')), link('/me/orders', t('查看全部', 'View all'), 'chevron-right'))}`;
}

function renderProfile(user) {
  const language = select({ name: 'lang', value: user.locale || state.prefs.lang, label: t('界面语言', 'Language'), icon: 'globe', options: [
    { value: 'zh-CN', label: '简体中文' }, { value: 'zh-TW', label: '繁體中文' }, { value: 'en-US', label: 'English' }
  ] });
  return `${memberHeading(t('个人资料', 'Profile'))}
    <section class="panel acct-panel"><form class="acct-form" data-form="account-profile" novalidate>
      ${field('name', t('昵称', 'Display name'), 'autocomplete="nickname" maxlength="32" required', user.name)}
      <div class="field acct-field"><span>${t('邮箱地址', 'Email address')}</span><div class="acct-field-line">
        <input class="input" type="email" readonly value="${esc(user.email)}" aria-label="${t('邮箱地址', 'Email address')}">
        ${link('/me/security?panel=email', t('更换', 'Change'), '', 'button subtle')}</div></div>
      <div class="field acct-field"><span>${t('界面语言', 'Language')}</span>${language}</div>
      ${errorSlot()}<div class="acct-form-actions">${submit(t('保存资料', 'Save profile'), 'check')}</div></form></section>`;
}

function setupForm(secret) {
  return `<form class="acct-form acct-content-form" data-form="account-enable-2fa" novalidate>
    <div class="field acct-field"><label for="acct-auth-key">${t('验证器设置密钥', 'Authenticator setup key')}</label>
      <div class="acct-field-line"><input class="input acct-mono" id="acct-auth-key" value="${esc(secret)}" readonly>
        ${action('account-copy', t('复制', 'Copy'), 'copy', { classes: 'subtle', value: secret })}</div></div>
    ${twoFactorField(false)}${errorSlot()}<div class="acct-form-actions">${submit(t('启用两步验证', 'Enable two-factor verification'), 'shield')}
      ${action('modal-close', t('取消', 'Cancel'))}</div></form>`;
}

function recoveryPanel(user) {
  if (!user.twoFactor?.secret) return '';
  const count = user.twoFactor.recoveryHashes?.length || 0;
  const codes = recoveryDisplay?.email === user.email ? recoveryDisplay.codes : [];
  const content = `<div class="acct-setting-row"><div><strong>${t('恢复码', 'Recovery codes')}</strong>
      <span>${count} ${t('枚可用', 'available')}</span></div>${action('account-regenerate-recovery', t('重新生成', 'Regenerate'), 'refresh', { classes: 'subtle' })}</div>
    ${codes.length ? `<div class="acct-recovery-display"><div class="acct-recovery-grid">${codes.map(code => `<code>${esc(code)}</code>`).join('')}</div>
      ${action('account-copy', t('复制恢复码', 'Copy recovery codes'), 'copy', { classes: 'subtle', value: codes.join('\n') })}</div>` : ''}`;
  return sectionPanel(t('账户恢复', 'Account recovery'), content);
}

function logList(user) {
  return user.logins?.length ? `<div class="acct-log-list">${user.logins.map(entry => {
    const type = logTypes[entry.type] || logTypes.login;
    return `<div class="acct-log-row"><span class="acct-log-icon">${icon('log-out', 16)}</span>
      <span><strong>${t(type[0], type[1])}</strong><small>${esc(entry.browser)}</small></span>
      <time datetime="${esc(entry.createdAt)}">${esc(formatDate(entry.createdAt))}</time></div>`;
  }).join('')}</div>` : emptyState('clock', t('暂无登录记录', 'No sign-in history'));
}

function renderSecurity(user, route) {
  const panel = route.query.get('panel');
  const enabled = Boolean(user.twoFactor?.secret);
  const emailForm = panel === 'email' ? `<form class="acct-form acct-content-form acct-inline-form" data-form="account-email" novalidate>
    ${field('email', t('新邮箱地址', 'New email address'), 'type="email" autocomplete="email" maxlength="120" required')}
    ${errorSlot()}<div class="acct-form-actions">${submit(t('保存邮箱', 'Save email'), 'check')}${link('/me/security', t('取消', 'Cancel'))}</div></form>` : '';
  const passwordForm = panel === 'password' ? `<form class="acct-form acct-content-form acct-inline-form" data-form="account-password" novalidate>
    ${passwordField('newPassword', t('新密码', 'New password'), 'new-password')}${errorSlot()}
    <div class="acct-form-actions">${submit(t('保存新密码', 'Save new password'), 'check')}${link('/me/security', t('取消', 'Cancel'))}</div></form>` : '';
  const accountSettings = `<div class="acct-setting-row"><div><strong>${t('登录邮箱', 'Sign-in email')}</strong><span>${esc(user.email)}</span></div>
    ${link('/me/security?panel=email', t('更换邮箱', 'Change email'), '', 'button subtle')}</div>${emailForm}
    <div class="acct-setting-row"><div><strong>${t('账户密码', 'Password')}</strong>${user.demo && !user.passwordChanged ? `<span>${t('演示密码', 'Demo password')} <code>${demoPassword}</code></span>` : ''}</div>
    ${link('/me/security?panel=password', t('修改密码', 'Change password'), '', 'button subtle')}</div>${passwordForm}`;
  const twoFactor = `<div class="acct-setting-row"><div><strong>${t('验证器应用', 'Authenticator app')}</strong>
    <span>${enabled ? t('已启用', 'Enabled') : t('未启用', 'Disabled')}</span></div>
    ${enabled ? link('/me/security?panel=disable', t('停用', 'Disable'), '', 'button subtle') : action('account-setup-2fa', t('设置验证器', 'Set up authenticator'), 'shield', { classes: 'subtle' })}</div>
    ${panel === 'disable' && enabled ? `<form class="acct-form acct-content-form acct-inline-form" data-form="account-disable-2fa" novalidate>
      ${twoFactorField()}${errorSlot()}<div class="acct-form-actions">${submit(t('停用两步验证', 'Disable two-factor verification'), 'shield')}
      ${link('/me/security', t('取消', 'Cancel'))}</div></form>` : ''}`;
  return `${memberHeading(t('账户安全', 'Security'))}
    ${sectionPanel(t('登录凭据', 'Credentials'), accountSettings)}
    ${sectionPanel(t('两步验证', 'Two-factor verification'), twoFactor)}
    ${recoveryPanel(user)}${sectionPanel(t('登录记录', 'Sign-in history'), logList(user))}`;
}

function pagination(path, query, page, totalPages) {
  if (totalPages < 2) return '';
  const previous = page > 1 ? link(accountPath(path, { ...query, page: page - 1 }), t('上一页', 'Previous'), 'chevron-left', 'button subtle') : '';
  const next = page < totalPages ? link(accountPath(path, { ...query, page: page + 1 }), t('下一页', 'Next'), 'chevron-right', 'button subtle') : '';
  return `<nav class="acct-pagination" aria-label="${t('分页', 'Pagination')}"><span>${previous}</span><span>${page} / ${totalPages}</span><span>${next}</span></nav>`;
}

function renderOrders(user, route) {
  const kind = route.query.get('type') === 'recharge' ? 'recharge' : 'product';
  const requestedStatus = route.query.get('status');
  const status = statusOptions.some(([value]) => value === requestedStatus) ? requestedStatus : '';
  const query = (route.query.get('q') || '').slice(0, 120);
  const matches = userOrders(user).filter(order => order.kind === kind && (!status || orderState(order) === status)
    && `${order.id} ${orderTitle(order)} ${order.items?.map(item => item.name).join(' ') || ''}`.toLowerCase().includes(query.toLowerCase()));
  const totalPages = Math.max(1, Math.ceil(matches.length / pageSize));
  const page = Math.max(1, Math.min(totalPages, parseInt(route.query.get('page'), 10) || 1));
  const filters = { type: kind, status, q: query };
  const path = '/me/orders';
  return `${memberHeading(t('我的订单', 'Orders'))}<section class="panel acct-panel">
    <nav class="segmented acct-order-tabs" aria-label="${t('订单类型', 'Order type')}">
      ${[['product', t('商品订单', 'Product orders')], ['recharge', t('充值订单', 'Recharge orders')]].map(([key, label]) =>
        `<a href="#${esc(accountPath(path, { ...filters, type: key }))}"${key === kind ? ' aria-current="page"' : ''}>${label}</a>`).join('')}</nav>
    <form class="acct-order-filters" data-form="account-order-search" novalidate><input type="hidden" name="type" value="${kind}">
      <label class="acct-filter-search">${icon('search', 17)}<input class="input" type="search" name="q" value="${esc(query)}" maxlength="120"
        aria-label="${t('商品名或订单号', 'Product name or order number')}" placeholder="${t('商品名或订单号', 'Product name or order number')}"></label>
      ${select({ name: 'status', value: status, label: t('订单状态', 'Order status'), options: [{ value: '', label: t('全部状态', 'All statuses') }, ...tr(statusOptions)] })}
      ${submit(t('查询', 'Search'), '', 'button subtle')}
      ${status || query ? link(accountPath(path, { type: kind }), t('清除', 'Clear')) : ''}</form>
    ${matches.length ? orderList(matches.slice((page - 1) * pageSize, page * pageSize)) : emptyState('receipt', t('没有匹配的订单', 'No matching orders'))}
    ${pagination(path, filters, page, totalPages)}</section>`;
}

function signedMoney(amount) {
  return `${amount >= 0 ? '+' : '−'}${money(Math.abs(amount))}`;
}

function ledgerList(user) {
  const ledger = [...(user.ledger || [])].sort((a, b) => b.createdAt.localeCompare(a.createdAt));
  if (!ledger.length) return emptyState('wallet', t('暂无余额变动', 'No wallet activity'));
  let running = user.balance;
  return `<div class="acct-table-wrap"><table class="acct-table"><thead><tr>
    <th scope="col">${t('时间', 'Date')}</th><th scope="col">${t('类型', 'Type')}</th><th scope="col">${t('方向', 'Direction')}</th>
    <th scope="col">${t('金额', 'Amount')}</th><th scope="col">${t('变动后余额', 'Balance after')}</th><th scope="col">${t('备注', 'Note')}</th>
    </tr></thead><tbody>${ledger.map(entry => {
    const after = entry.balanceAfter ?? running;
    running -= entry.amount;
    const labels = ledgerTypes[entry.type] || ['余额调整', 'Balance adjustment'];
    return `<tr><td><time datetime="${esc(entry.createdAt)}">${esc(formatDate(entry.createdAt))}</time></td>
      <td>${t(labels[0], labels[1])}</td><td>${entry.amount < 0 ? t('支出', 'Debit') : t('收入', 'Credit')}</td>
      <td class="acct-amount ${entry.amount >= 0 ? 'acct-income' : ''}">${signedMoney(entry.amount)}</td>
      <td class="acct-amount">${money(after)}</td><td>${esc(entry.note || '—')}</td></tr>`;
  }).join('')}</tbody></table></div>`;
}

function renderWallet(user) {
  const form = `<form class="acct-form" data-form="account-recharge" novalidate>
    <div class="acct-form-grid"><div class="field acct-field"><label for="acct-recharge-amount">${t('充值金额', 'Recharge amount')}</label>
      <div class="acct-price-input"><span>¥</span><input class="input" id="acct-recharge-amount" name="amount" inputmode="decimal" placeholder="0.00" maxlength="9" required></div></div>
      <div class="field acct-field"><span>${t('支付渠道', 'Payment channel')}</span>
        ${select({ name: 'method', value: 'alipay', label: t('支付渠道', 'Payment channel'), icon: 'credit-card', options: tr(paymentChannels) })}</div></div>
    <div class="acct-quick-amounts" aria-label="${t('快捷金额', 'Quick amounts')}">${[10, 30, 50, 100].map(value => action('account-fill-amount', money(value * 100), '', { classes: 'subtle', value })).join('')}</div>
    ${field('note', t('充值备注（选填）', 'Note (optional)'), 'maxlength="80" autocomplete="off"')}${errorSlot()}
    <div class="acct-form-actions">${submit(t('创建充值订单', 'Create recharge order'), 'arrow-right')}</div></form>`;
  return `${memberHeading(t('钱包', 'Wallet'), link('/me/orders?type=recharge', t('充值订单', 'Recharge orders'), 'receipt', 'button subtle'))}
    <div class="acct-wallet-grid"><section class="panel acct-panel acct-balance-panel"><div>${icon('wallet', 22)}${t('可用余额', 'Available balance')}</div>
      <strong class="acct-amount">${money(user.balance)}</strong>${link('/me/gift-cards', t('兑换礼品卡', 'Redeem gift card'), 'gift', 'button subtle')}</section>
    ${sectionPanel(t('余额充值', 'Recharge balance'), form)}</div>
    ${sectionPanel(t('余额流水', 'Wallet activity'), ledgerList(user))}`;
}

function renderGiftCards(user) {
  const used = state.giftCards?.find(card => card.code === demoGiftCode)?.redeemedBy;
  const form = `<form class="acct-form acct-content-form" data-form="account-gift" novalidate>
    ${field('giftCode', t('礼品卡卡密', 'Gift card code'), 'autocapitalize="characters" autocomplete="off" maxlength="80" required')}
    ${errorSlot()}<div class="acct-form-actions">${submit(t('兑换到钱包', 'Redeem to wallet'), 'arrow-right')}</div></form>`;
  return `${memberHeading(t('礼品卡', 'Gift cards'), link('/me/wallet', t('打开钱包', 'Open wallet'), 'wallet', 'button subtle'))}
    <div class="acct-wallet-grid acct-gift-grid">${sectionPanel(t('兑换礼品卡', 'Redeem a gift card'), form)}
      <aside class="panel acct-panel acct-balance-panel"><div>${icon('wallet', 22)}${t('当前钱包余额', 'Current wallet balance')}</div>
        <strong class="acct-amount">${money(user.balance)}</strong></aside></div>
    ${!used ? `<section class="panel acct-panel acct-demo-gift"><h3>${t('演示礼品卡', 'Demo gift card')}</h3>
      <span class="acct-amount">${money(2000)}</span>${action('account-redeem-example', t('兑换演示礼品卡', 'Redeem demo gift card'), 'gift', { classes: 'subtle' })}
      <div class="acct-gift-reference copy-line"><code>${demoGiftCode}</code>${copyButton(demoGiftCode, 'gift-card-code')}</div></section>` : ''}`;
}

function affiliateTotals(affiliate) {
  const time = Date.now();
  const available = affiliate.commissions.filter(item => Date.parse(item.availableAt) <= time).reduce((sum, item) => sum + item.amount, 0);
  const reserved = affiliate.withdrawals.filter(item => item.status !== 'rejected').reduce((sum, item) => sum + item.amount, 0);
  const pending = affiliate.commissions.filter(item => Date.parse(item.availableAt) > time).reduce((sum, item) => sum + item.amount, 0);
  return { available: Math.max(0, available - reserved), pending, reserved };
}

function affiliateHistory(items, type) {
  const isCommission = type === 'commission';
  if (!items.length) return emptyState(isCommission ? 'receipt' : 'wallet', isCommission ? t('暂无佣金记录', 'No commission yet') : t('暂无提现记录', 'No withdrawals yet'));
  return `<div class="acct-table-wrap"><table class="acct-table"><thead><tr>
    <th scope="col">${t('时间', 'Date')}</th><th scope="col">${isCommission ? t('关联订单', 'Order') : t('提现方式', 'Method')}</th>
    <th scope="col">${t('金额', 'Amount')}</th><th scope="col">${t('状态', 'Status')}</th></tr></thead>
    <tbody>${items.map(item => {
    const ready = isCommission ? Date.parse(item.availableAt) <= Date.now() : item.status === 'completed';
    const status = isCommission ? (ready ? t('已结算', 'Settled') : t('待结算', 'Awaiting settlement')) : (ready ? t('已到账', 'Sent') : t('待审核', 'Under review'));
    return `<tr><td><time datetime="${esc(item.createdAt)}">${esc(formatDate(item.createdAt))}</time></td>
      <td>${esc(isCommission ? item.orderId : item.method === 'alipay' ? t('支付宝', 'Alipay') : 'USDT')}</td>
      <td class="acct-amount">${money(item.amount)}</td><td><span class="acct-status acct-status-${ready ? 'completed' : 'pending'}">${status}</span></td></tr>`;
  }).join('')}</tbody></table></div>`;
}

function renderAffiliate(user, route) {
  const affiliate = user.affiliate;
  const title = memberHeading(t('推广返佣', 'Referrals'));
  const terms = `<dl class="acct-affiliate-terms"><div><dt>${t('佣金比例', 'Commission rate')}</dt><dd>3%</dd></div>
    <div><dt>${t('结算周期', 'Settlement period')}</dt><dd>${t('7 天', '7 days')}</dd></div>
    <div><dt>${t('最低提现', 'Minimum withdrawal')}</dt><dd>${money(minimumWithdrawal)}</dd></div></dl>`;
  if (!affiliate) return `${title}${sectionPanel(t('推广计划', 'Referral program'), `${terms}<div class="acct-form-actions">
    ${action('account-affiliate-activate', t('开启推广', 'Activate referrals'), 'arrow-right', { classes: 'primary' })}</div>`)}`;

  const url = new URL(location.href);
  url.hash = accountPath('/auth/register', { invite: affiliate.code });
  const totals = affiliateTotals(affiliate);
  const tab = route.query.get('tab') === 'withdrawals' ? 'withdrawals' : 'commissions';
  const withdrawing = route.query.get('panel') === 'withdraw';
  const withdrawal = `<form class="acct-form acct-content-form acct-inline-form" data-form="account-withdraw" novalidate>
    <div class="acct-form-grid"><div class="field acct-field"><label for="acct-withdraw-amount">${t('提现金额', 'Withdrawal amount')}</label>
      <div class="acct-price-input"><span>¥</span><input class="input" id="acct-withdraw-amount" name="amount" inputmode="decimal" maxlength="9" required></div></div>
      <div class="field acct-field"><span>${t('提现方式', 'Withdrawal method')}</span>
        ${select({ name: 'method', value: 'alipay', label: t('提现方式', 'Withdrawal method'), options: tr([['alipay', '支付宝', 'Alipay'], ['usdt', 'USDT', 'USDT']]) })}</div></div>
    ${field('destination', t('演示收款账户', 'Demo payout account'), 'maxlength="120" autocomplete="off" required')}${errorSlot()}
    <div class="acct-form-actions">${submit(t('申请提现', 'Request withdrawal'), 'arrow-right')}${link('/me/affiliate', t('取消', 'Cancel'))}</div></form>`;
  return `${title}${sectionPanel(t('推广链接', 'Referral link'), `<div class="acct-field-line acct-referral-link">
    <input class="input" aria-label="${t('推广链接', 'Referral link')}" value="${esc(url.href)}" readonly>
    ${action('account-copy', t('复制链接', 'Copy link'), 'copy', { classes: 'subtle', value: url.href })}</div>${terms}`)}
    ${sectionPanel(t('推广收益', 'Referral earnings'), `<dl class="acct-affiliate-terms acct-earnings"><div><dt>${t('可提现佣金', 'Available commission')}</dt><dd>${money(totals.available)}</dd></div>
      <div><dt>${t('待结算佣金', 'Pending commission')}</dt><dd>${money(totals.pending)}</dd></div>
      <div><dt>${t('已申请提现', 'Withdrawals requested')}</dt><dd>${money(totals.reserved)}</dd></div></dl>
      ${withdrawing ? withdrawal : ''}`, link('/me/affiliate?panel=withdraw', t('申请提现', 'Request withdrawal'), 'arrow-right', 'button subtle'))}
    <section class="panel acct-panel"><nav class="segmented acct-order-tabs" aria-label="${t('推广记录类型', 'Referral record type')}">
      <a href="#/me/affiliate?tab=commissions"${tab === 'commissions' ? ' aria-current="page"' : ''}>${t('佣金记录', 'Commission history')}</a>
      <a href="#/me/affiliate?tab=withdrawals"${tab === 'withdrawals' ? ' aria-current="page"' : ''}>${t('提现记录', 'Withdrawal history')}</a></nav>
      ${tab === 'commissions' ? affiliateHistory(affiliate.commissions, 'commission') : affiliateHistory(affiliate.withdrawals, 'withdrawal')}</section>`;
}

export function renderAccount(route) {
  const [area, page = '', detail] = route.parts;
  if (area === 'auth' && ['login', 'register', 'forgot'].includes(page) && !detail) return renderAuth(route, page);
  if (area !== 'me' || detail || !memberPages.some(([key]) => key === page)) return null;
  const user = activeUser();
  if (!user) {
    const next = route.path + (route.query.size ? '?' + route.query : '');
    queueMicrotask(() => go(accountPath('/auth/login', { next }), { replace: true }));
    return '';
  }
  const pages = { '': renderOverview, profile: renderProfile, security: renderSecurity, orders: renderOrders,
    wallet: renderWallet, 'gift-cards': renderGiftCards, affiliate: renderAffiliate };
  return `<section class="acct-workspace"><div class="page-heading acct-heading"><h1>${t('会员中心', 'Member center')}</h1>
    ${link('/', t('继续选购', 'Continue shopping'), 'arrow-right', 'button quiet')}</div><div class="acct-layout">
    <aside class="panel acct-nav"><div class="acct-identity"><div class="acct-avatar" aria-hidden="true">${icon('user', 20)}</div>
      <div><strong>${esc(user.name)}</strong><span>${esc(user.email)}</span></div></div>
      <nav aria-label="${t('会员导航', 'Member navigation')}">${memberPages.map(([key, name, zh, en]) =>
        `<a href="#/me${key ? `/${key}` : ''}"${key === page ? ' aria-current="page"' : ''}>${icon(name, 17)}<span>${t(zh, en)}</span></a>`).join('')}</nav>
      ${action('account-logout', t('退出登录', 'Sign out'), 'log-out', { classes: 'quiet acct-sign-out' })}</aside>
    <section class="acct-main" aria-labelledby="acct-section-heading">${pages[page](user, route)}</section></div></section>`;
}

function setBrowserLog(user, type) {
  const agent = navigator.userAgent;
  const browser = agent.includes('Edg/') ? 'Microsoft Edge' : agent.includes('Firefox/') ? 'Firefox'
    : agent.includes('Chrome/') ? 'Chrome' : agent.includes('Safari/') ? 'Safari' : t('当前浏览器', 'Current browser');
  user.logins = [{ type, browser, createdAt: now() }, ...(user.logins || [])].slice(0, 20);
}

function signIn(user, type, next) {
  loginVerification = null;
  recoveryDisplay = null;
  state.session = user.email;
  if (user.locale) state.prefs.lang = user.locale;
  setBrowserLog(user, type);
  save();
  go(nextPath(next));
  toast(t('登录成功', 'Signed in'));
}

function signOut() {
  state.session = null;
  loginVerification = null;
  twoFactorSetup = null;
  recoveryDisplay = null;
  save();
  go('/auth/login');
  toast(t('已退出登录', 'Signed out'));
}

async function useDemoAccount(next) {
  let user = state.users.find(account => account.demo);
  if (!user) {
    if (userFor(demoEmail)) return toast(t('演示邮箱已被本地账户使用', 'The demo address belongs to a local account'));
    const passwordHash = await digest(demoPassword);
    user = state.users.find(account => account.demo);
    if (!user) {
      const paidAt = new Date(Date.now() - 24 * 60 * 60_000).toISOString();
      const rechargedAt = new Date(Date.now() - 2 * 24 * 60 * 60_000).toISOString();
      const orderId = 'SYH-DEMO-2401';
      const rechargeId = 'SYH-R-DEMO-2401';
      const item = { productId: 'demo-sample', skuId: 'standard', name: '专注工作台模板', nameEn: 'Focus workspace template',
        variant: '标准版', variantEn: 'Standard', price: 2900, qty: 1, delivery: 'auto' };
      user = { email: demoEmail, name: t('演示会员', 'Demo member'), passwordHash, demo: true, balance: 7100,
        locale: state.prefs.lang, ledger: [
          { id: orderId, type: 'purchase', amount: -2900, balanceAfter: 7100, createdAt: paidAt, note: orderId },
          { id: rechargeId, type: 'recharge', amount: 10000, balanceAfter: 10000, createdAt: rechargedAt, note: rechargeId }
        ] };
      state.users.push(user);
      state.orders.unshift({ id: orderId, owner: user.email, email: user.email, kind: 'product', isDemoSample: true,
        status: 'completed', createdAt: paidAt, paidAt, completedAt: paidAt, subtotal: 2900, baseTotal: 2900,
        fee: 0, total: 2900, walletUsed: 2900, payable: 0, method: 'wallet', items: [item],
        fulfillment: [{ ...item, codes: ['SYH-DEMO-TEMPLATE-2401'] }] },
      { id: rechargeId, owner: user.email, email: user.email, kind: 'recharge', status: 'completed',
        createdAt: rechargedAt, paidAt: rechargedAt, completedAt: rechargedAt, baseTotal: 10000,
        total: 10000, payable: 10000, fee: 0, method: 'alipay', items: [] });
    }
  }
  signIn(user, 'demo', next);
}

function authenticatorKey() {
  return [...crypto.getRandomValues(new Uint8Array(32))].map(byte => alphabet[byte & 31]).join('');
}

async function authenticatorCode(secret, offset = 0) {
  let buffer = 0;
  let bits = 0;
  const bytes = [];
  for (const character of secret) {
    buffer = (buffer << 5) | alphabet.indexOf(character);
    bits += 5;
    if (bits >= 8) {
      bits -= 8;
      bytes.push((buffer >> bits) & 255);
    }
  }
  const key = await crypto.subtle.importKey('raw', new Uint8Array(bytes), { name: 'HMAC', hash: 'SHA-1' }, false, ['sign']);
  const counter = new DataView(new ArrayBuffer(8));
  counter.setBigUint64(0, BigInt(Math.floor(Date.now() / 30_000) + offset));
  const hash = new DataView(await crypto.subtle.sign('HMAC', key, counter));
  const index = hash.getUint8(hash.byteLength - 1) & 15;
  return String((hash.getUint32(index) & 0x7fffffff) % 1000000).padStart(6, '0');
}

async function verifyOtp(secret, code) {
  if (!/^\d{6}$/.test(code)) return false;
  const candidates = await Promise.all([-1, 0, 1].map(offset => authenticatorCode(secret, offset)));
  return candidates.includes(code);
}

async function verifySecondFactor(user, code) {
  if (!user.twoFactor?.secret) return false;
  if (await verifyOtp(user.twoFactor.secret, code)) return true;
  const hash = await digest(code.replace(/\s/g, '').toUpperCase());
  const position = user.twoFactor.recoveryHashes?.indexOf(hash) ?? -1;
  if (position < 0) return false;
  user.twoFactor.recoveryHashes.splice(position, 1);
  return true;
}

async function generateRecovery(user) {
  const codes = Array.from({ length: 8 }, () => randomId().match(/.{4}/g).join('-'));
  const hashes = await Promise.all(codes.map(code => digest(code)));
  if (activeUser() !== user || !user.twoFactor) return;
  user.twoFactor.recoveryHashes = hashes;
  recoveryDisplay = { email: user.email, codes };
}

function parseCents(value) {
  if (!/^\d{1,5}(?:\.\d{1,2})?$/.test(value)) return null;
  const [whole, fractional = ''] = value.split('.');
  return Number(whole) * 100 + Number(fractional.padEnd(2, '0'));
}

export function recordReferralCommission(order) {
  if (order.kind !== 'product' || !order.owner || order.status !== 'completed') return;
  const purchaser = userFor(order.owner);
  if (!purchaser?.referredBy) return;
  const affiliate = state.users.find(user => user.affiliate?.code === purchaser.referredBy && user !== purchaser)?.affiliate;
  if (!affiliate || affiliate.commissions.some(item => item.orderId === order.id)) return;
  const amount = Math.round((order.baseTotal ?? order.total ?? 0) * affiliateRate);
  if (amount < 1) return;
  const createdAt = order.completedAt || now();
  affiliate.commissions.unshift({ orderId: order.id, amount, createdAt,
    availableAt: new Date(Date.parse(createdAt) + confirmationDays * 24 * 60 * 60_000).toISOString() });
}

const accountActions = {
  'account-demo': async element => {
    element.disabled = true;
    try { await useDemoAccount(element.dataset.value); }
    finally { element.disabled = false; }
  },
  'account-logout': () => signOut(),
  'account-cancel-verify': () => {
    loginVerification = null;
    refresh();
  },
  'account-password-toggle': element => {
    const input = element.parentElement.querySelector('input');
    const show = input.type === 'password';
    input.type = show ? 'text' : 'password';
    element.innerHTML = icon(show ? 'eye-off' : 'eye');
    element.setAttribute('aria-pressed', String(show));
    element.setAttribute('aria-label', show ? t('隐藏密码', 'Hide password') : t('显示密码', 'Show password'));
  },
  'account-demo-otp': async element => {
    const form = element.closest('form');
    const user = activeUser() || userFor(loginVerification?.email);
    const secret = form?.dataset.form === 'account-enable-2fa' ? twoFactorSetup?.secret : user?.twoFactor?.secret;
    if (!secret) return;
    form.elements.otp.value = await authenticatorCode(secret);
    form.requestSubmit();
  },
  'account-copy': async element => {
    const copied = await copyText(element.dataset.value);
    toast(copied ? t('已复制', 'Copied') : t('复制失败，请手动选择内容。', 'Copy failed. Select and copy the text.'));
  },
  'account-setup-2fa': () => {
    const user = activeUser();
    if (!user || user.twoFactor) return;
    recoveryDisplay = null;
    twoFactorSetup = { email: user.email, secret: authenticatorKey() };
    openModal(t('设置验证器', 'Set up authenticator'), setupForm(twoFactorSetup.secret));
  },
  'account-regenerate-recovery': async element => {
    const user = activeUser();
    if (!user?.twoFactor) return;
    const animation = animateRefresh(element);
    await generateRecovery(user);
    save();
    await animation;
    if (element.isConnected) refresh();
    toast(t('已生成新的恢复码', 'New recovery codes generated'), 'check');
  },
  'account-fill-amount': element => {
    const form = element.closest('form');
    form.elements.amount.value = element.dataset.value;
    form.elements.amount.focus();
  },
  'account-redeem-example': () => {
    const input = document.querySelector('.acct-workspace input[name="giftCode"]');
    if (!input) return;
    input.value = demoGiftCode;
    input.form.requestSubmit();
  },
  'account-affiliate-activate': () => {
    const user = activeUser();
    if (!user || user.affiliate) return;
    const commissions = [];
    if (user.demo) {
      const availableAt = new Date(Date.now() - 60_000).toISOString();
      const createdAt = new Date(Date.now() - (confirmationDays + 1) * 24 * 60 * 60_000).toISOString();
      commissions.push({ orderId: 'SYH-DEMO-REFERRAL', amount: 660, createdAt, availableAt });
    }
    user.affiliate = { code: randomId().slice(0, 8), commissions, withdrawals: [] };
    save();
    refresh();
    toast(t('已开启推广', 'Referrals activated'));
  }
};

export async function accountAction(name, element) {
  if (!Object.hasOwn(accountActions, name)) return false;
  try {
    await accountActions[name](element);
  } catch {
    toast(t('操作未完成，请重试。', 'The action could not be completed. Try again.'));
  }
  return true;
}

const accountForms = {
  'account-login': async (form, data) => {
    const user = userFor(data.get('email'));
    if (!user || user.passwordHash !== await digest(data.get('password'))) return message(form, t('邮箱或密码有误。', 'The email or password is incorrect.'));
    if (activeUser()) return;
    const next = nextPath(data.get('next'));
    if (user.twoFactor?.secret) {
      loginVerification = { email: user.email, next, expires: Date.now() + 5 * 60_000 };
      return refresh();
    }
    signIn(user, 'login', next);
  },
  'account-verify-login': async (form, data) => {
    const login = loginVerification;
    if (!login || login.expires <= Date.now()) {
      loginVerification = null;
      return refresh();
    }
    const user = userFor(login.email);
    if (!user || !await verifySecondFactor(user, inputValue(data, 'otp'))) return message(form, t('验证码或恢复码有误。', 'The authenticator or recovery code is incorrect.'));
    if (loginVerification === login && !activeUser()) signIn(user, 'login', login.next);
  },
  'account-register': async (form, data) => {
    const email = normalizedEmail(data.get('email'));
    const name = inputValue(data, 'name');
    const invite = inputValue(data, 'invite').toUpperCase();
    if (!name || name.length > 32) return message(form, t('请填写 1 至 32 个字符的昵称。', 'Enter a display name of 1 to 32 characters.'));
    if (invite && !state.users.some(user => user.affiliate?.code === invite)) return message(form, t('未找到该邀请码。', 'This invite code could not be found.'));
    const passwordHash = await digest(data.get('newPassword'));
    if (userFor(email) || email === demoEmail) return message(form, t('此邮箱不可用于注册。', 'This email is unavailable.'));
    if (activeUser()) return;
    const user = { email, name, passwordHash, balance: 0, ledger: [], locale: state.prefs.lang, referredBy: invite || null };
    state.users.push(user);
    signIn(user, 'login', data.get('next'));
  },
  'account-forgot': async (form, data) => {
    const user = userFor(data.get('email'));
    if (!user) return message(form, t('未找到该演示账户。', 'Demo account not found.'));
    user.passwordHash = await digest(data.get('newPassword'));
    user.passwordChanged = true;
    save();
    go(accountPath('/auth/login', { next: nextPath(data.get('next')) }));
    toast(t('已更新密码', 'Password updated'));
  },
  'account-profile': (form, data, user) => {
    const name = inputValue(data, 'name');
    const lang = data.get('lang');
    if (!name || name.length > 32) return message(form, t('请填写 1 至 32 个字符的昵称。', 'Enter a display name of 1 to 32 characters.'));
    if (!['zh-CN', 'zh-TW', 'en-US'].includes(lang)) return message(form, t('请选择界面语言。', 'Choose a display language.'));
    user.name = name;
    user.locale = lang;
    state.prefs.lang = lang;
    save();
    refresh();
    toast(t('已保存个人资料', 'Profile saved'));
  },
  'account-password': async (form, data, user) => {
    const hash = await digest(data.get('newPassword'));
    if (activeUser() !== user) return;
    user.passwordHash = hash;
    user.passwordChanged = true;
    save();
    go('/me/security');
    toast(t('已更新密码', 'Password updated'));
  },
  'account-email': (form, data, user) => {
    const email = normalizedEmail(data.get('email'));
    if (userFor(email) || email === demoEmail) return message(form, t('此邮箱不可用。', 'This email is unavailable.'));
    if (activeUser() !== user) return;
    const oldEmail = user.email;
    for (const order of state.orders) {
      if (order.owner === oldEmail) {
        order.owner = email;
        order.email = email;
      }
    }
    for (const card of state.giftCards) {
      if (card.redeemedBy === oldEmail) card.redeemedBy = email;
    }
    for (const ticket of state.tickets || []) {
      if (ticket.owner === oldEmail) ticket.owner = email;
    }
    state.session = email;
    user.email = email;
    recoveryDisplay = null;
    twoFactorSetup = null;
    save();
    go('/me/security');
    toast(t('已更换邮箱', 'Email updated'));
  },
  'account-enable-2fa': async (form, data, user) => {
    const setup = twoFactorSetup;
    if (setup?.email !== user.email || !await verifyOtp(setup.secret, inputValue(data, 'otp'))) return message(form, t('请填写当前动态验证码。', 'Enter the current authenticator code.'));
    if (activeUser() !== user || setup !== twoFactorSetup) return;
    user.twoFactor = { secret: setup.secret, recoveryHashes: [] };
    twoFactorSetup = null;
    await generateRecovery(user);
    save();
    closeModal();
    go('/me/security');
    toast(t('已启用两步验证', 'Two-factor verification enabled'));
  },
  'account-disable-2fa': async (form, data, user) => {
    if (!await verifySecondFactor(user, inputValue(data, 'otp'))) return message(form, t('验证码或恢复码有误。', 'The authenticator or recovery code is incorrect.'));
    if (activeUser() !== user) return;
    delete user.twoFactor;
    recoveryDisplay = null;
    save();
    go('/me/security');
    toast(t('已停用两步验证', 'Two-factor verification disabled'));
  },
  'account-order-search': (form, data) => {
    go(accountPath('/me/orders', { type: inputValue(data, 'type'), q: inputValue(data, 'q'), status: inputValue(data, 'status') }));
  },
  'account-recharge': (form, data, user) => {
    const amount = parseCents(inputValue(data, 'amount'));
    const method = data.get('method');
    if (!amount || amount < 100 || amount > 1000000) return message(form, t('请输入 ¥1.00 至 ¥10,000.00 的充值金额。', 'Enter a recharge amount from ¥1.00 to ¥10,000.00.'));
    if (!paymentChannels.some(([value]) => value === method)) return message(form, t('请选择支付方式。', 'Choose a payment method.'));
    if (amount > 500000 && !method.startsWith('usdt-')) return message(form, t('超过 ¥5,000.00 的充值请使用 USDT。', 'Use USDT for recharges above ¥5,000.00.'));
    const id = `SYH-R-${randomId()}`;
    const createdAt = now();
    state.orders.unshift({ id, createdAt, expiresAt: new Date(Date.now() + 15 * 60_000).toISOString(), kind: 'recharge',
      owner: user.email, email: user.email, status: 'pending', amount, baseTotal: amount, total: amount, items: [],
      note: inputValue(data, 'note').slice(0, 80), method });
    save();
    go(`/pay/${encodeURIComponent(id)}`);
  },
  'account-gift': (form, data, user) => {
    const code = inputValue(data, 'giftCode').toUpperCase();
    let card = state.giftCards.find(entry => entry.code.toUpperCase() === code);
    if (!card && code === demoGiftCode) {
      card = { code, amount: 2000, redeemedBy: null };
      state.giftCards.push(card);
    }
    if (!card) return message(form, t('未找到这张礼品卡。', 'Gift card not found.'));
    if (card.redeemedBy) return message(form, t('这张礼品卡已兑换。', 'This gift card has already been redeemed.'));
    card.redeemedBy = user.email;
    card.redeemedAt = now();
    user.balance += card.amount;
    user.ledger.unshift({ id: card.code, type: 'gift', amount: card.amount, balanceAfter: user.balance,
      createdAt: card.redeemedAt, note: card.code });
    save();
    refresh();
    toast(t('礼品卡金额已转入钱包', 'Gift card value added to your wallet'));
  },
  'account-withdraw': (form, data, user) => {
    if (!user.affiliate) return;
    const amount = parseCents(inputValue(data, 'amount'));
    const method = data.get('method');
    const destination = inputValue(data, 'destination');
    if (!amount || amount < minimumWithdrawal) return message(form, t('最低提现金额为 ¥1.00。', 'The minimum withdrawal is ¥1.00.'));
    if (amount > affiliateTotals(user.affiliate).available) return message(form, t('提现金额超过可用佣金。', 'The amount exceeds your available commission.'));
    if (!destination || !['alipay', 'usdt'].includes(method)) return message(form, t('请选择提现方式并填写演示收款账户。', 'Choose a method and enter a demo payout account.'));
    user.affiliate.withdrawals.unshift({ id: randomId(), createdAt: now(), amount, method, destination, status: 'pending' });
    save();
    go('/me/affiliate?tab=withdrawals');
    toast(t('已提交演示提现申请', 'Demo withdrawal requested'));
  }
};

const publicForms = new Set(['account-login', 'account-verify-login', 'account-register', 'account-forgot']);

export async function accountSubmit(form) {
  const name = form.dataset.form;
  if (!Object.hasOwn(accountForms, name)) return false;
  if (pendingForms.has(form)) return true;
  const user = activeUser();
  if (!user && !publicForms.has(name)) return true;
  for (const field of form.querySelectorAll('[aria-invalid]')) field.removeAttribute('aria-invalid');
  const invalid = [...form.elements].find(field => field.willValidate && !field.validity.valid);
  if (showFieldError(form, invalid)) return true;
  pendingForms.add(form);
  const button = form.querySelector('button[type="submit"]');
  if (button) button.disabled = true;
  message(form, '');
  try {
    await accountForms[name](form, new FormData(form), user);
  } catch {
    message(form, t('操作未完成，请重试。', 'The action could not be completed. Try again.'));
  } finally {
    pendingForms.delete(form);
    if (button) button.disabled = false;
  }
  return true;
}
