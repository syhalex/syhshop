import {
  state, activeUser, bindRefresh, refresh, save, t, esc, icon, toast, emptyState, bindModalDismissal, closeModal, copyWithNotice,
} from './ui.js';
import { renderCatalog, mountCatalog, catalogAction, catalogInput, catalogChange, getProduct, getSku } from './catalog.js';
import { renderContent, contentAction, contentSubmit, contentInput, contentTick } from './content.js';
import { renderCommerce, commerceAction, commerceSubmit, commerceTick } from './commerce.js';
import { renderAccount, accountAction, accountSubmit } from './account.js';

const header = document.getElementById('site-header');
const view = document.getElementById('view');
const footer = document.getElementById('site-footer');
const root = document.documentElement;
const languages = [
  { id: 'zh-CN', name: '简体中文', short: '简中' },
  { id: 'zh-TW', name: '繁體中文', short: '繁中' },
  { id: 'en-US', name: 'English', short: 'EN' },
];

function readRoute() {
  const raw = location.hash.slice(1) || '/';
  const separator = raw.indexOf('?');
  const path = (separator === -1 ? raw : raw.slice(0, separator)).replace(/\/+$/, '') || '/';
  const query = new URLSearchParams(separator === -1 ? '' : raw.slice(separator + 1));
  try {
    const parts = path.split('/').filter(Boolean).map(decodeURIComponent);
    return { path, parts, query };
  } catch {
    return { path: '/invalid', parts: ['invalid'], query };
  }
}

function mainLinks() {
  return [
    { href: '/', symbol: 'bag', name: t('商城', 'Shop'), paths: ['/', '/products', '/categories'] },
    { href: '/guest/orders', symbol: 'receipt', name: t('订单查询', 'Order lookup'), paths: ['/guest/orders'] },
    { href: '/blog', symbol: 'book', name: t('教程', 'Guides'), paths: ['/blog'] },
  ];
}

function moreLinks() {
  return [
    { href: '/2fa', symbol: 'shield-key', name: t('2FA 工具', '2FA tool'), paths: ['/2fa'] },
    { href: '/notice', symbol: 'megaphone', name: t('店铺公告', 'Store notices'), paths: ['/notice'] },
    { href: '/support', symbol: 'headphones', name: t('购买与售后帮助', 'Order support'), paths: ['/support'] },
    { href: '/about', symbol: 'info', name: t('关于商店', 'About'), paths: ['/about'] },
  ];
}

const pathMatches = (base, path) => base === '/' ? base === path : path === base || path.startsWith(base + '/');

function navLink(link, route, className = '') {
  const current = (link.paths || [link.href]).some(path => pathMatches(path, route.path));
  return `<a class="${className}" href="#${link.href}" ${current ? 'aria-current="page"' : ''}>
    ${icon(link.symbol, 16)}<span>${link.name}</span>
  </a>`;
}

function headerMenu(id, label, display, entries, classes = '', active = false) {
  return `<div class="header-menu ${id === 'compact' ? 'compact-nav' : ''}" data-header-menu>
    <button type="button" class="header-control ${classes}" data-menu-toggle aria-controls="menu-${id}" aria-expanded="false" aria-label="${esc(label)}" title="${esc(label)}" ${active ? 'data-active' : ''}>${display}</button>
    <div class="header-menu-panel" id="menu-${id}" hidden inert>${entries}</div>
  </div>`;
}

const cartCount = () => state.cart.reduce((count, item) => count + (Number(item.qty) || 0), 0);

function renderHeader(route) {
  const main = mainLinks();
  const more = moreLinks();
  const user = activeUser();
  const currentLanguage = languages.find(language => language.id === state.prefs.lang);
  const count = cartCount();
  const signIn = user
    ? headerMenu('member', t('会员中心', 'Account'), `${icon('user', 17)}<span>${esc(user.name || user.email)}</span>${icon('chevron-down', 14)}`, [
      navLink({ href: '/me', symbol: 'user', name: t('会员中心', 'My account') }, route),
      navLink({ href: '/me/orders', symbol: 'receipt', name: t('我的订单', 'My orders') }, route),
      navLink({ href: '/me/wallet', symbol: 'wallet', name: t('我的钱包', 'My wallet') }, route),
      `<button type="button" data-action="account-logout">${icon('log-out', 16)}${t('退出登录', 'Sign out')}</button>`,
    ].join(''), 'header-member')
    : `<a class="button primary header-signin" href="#/auth/login">${icon('user', 16)}${t('登录', 'Sign in')}</a>`;
  header.innerHTML = `<div class="header-inner">
    <a class="brand" href="#/">${t('SYH 商店', 'SYH Store')}</a>
    <nav class="top-nav" aria-label="${t('主导航', 'Main navigation')}">
      ${main.map(item => navLink(item, route, 'nav-link')).join('')}
      ${headerMenu('more', t('更多', 'More'), `<span>${t('更多', 'More')}</span>${icon('chevron-down', 13)}`,
        more.map(item => navLink(item, route)).join(''), '', more.some(item => pathMatches(item.href, route.path)))}
    </nav>
    <div class="header-tools">
      <a class="header-control icon-only cart-link" href="#/cart" aria-label="${t('购物车', 'Cart')}" title="${t('购物车', 'Cart')}" ${route.path === '/cart' ? 'aria-current="page"' : ''}>
        ${icon('cart', 19)}<span class="cart-count" ${count > 99 ? 'data-wide' : ''} ${count ? '' : 'hidden'}>${count > 99 ? '99+' : count}</span>
      </a>
      ${headerMenu('language', t('语言', 'Language'), `${icon('globe', 17)}<span class="lang-current">${currentLanguage.short}</span>${icon('chevron-down', 12)}`,
        languages.map(language => `<button type="button" data-action="language" data-lang="${language.id}" aria-pressed="${language.id === currentLanguage.id}">
          ${language.name}${language.id === currentLanguage.id ? `<span class="menu-check">${icon('check', 15)}</span>` : ''}</button>`).join(''),
      )}
      <span class="header-divider" aria-hidden="true"></span>
      ${signIn}
      ${headerMenu('compact', t('更多', 'More'), `${icon('menu', 19)}${icon('x', 19)}`,
        [...main, ...more].map(item => navLink(item, route)).join(''), 'icon-only')}
    </div>
  </div>`;
}

function renderFooter() {
  footer.innerHTML = `<div class="footer-inner">
    <div class="footer-brand"><strong>${t('SYH 商店', 'SYH Store')}</strong><span>${t('前端演示', 'Storefront demo')}</span></div>
    <nav class="footer-links" aria-label="${t('页脚导航', 'Footer navigation')}">
      <a class="link-effect" href="#/terms">${t('服务条款', 'Terms')}</a>
      <a class="link-effect" href="#/privacy">${t('隐私说明', 'Privacy')}</a>
    </nav>
  </div>`;
}

function render({ moveFocus = false, catalogScroll } = {}) {
  const route = readRoute();
  root.lang = state.prefs.lang;
  document.getElementById('skip-link').textContent = t('跳到内容', 'Skip to content');
  renderHeader(route);
  renderFooter();
  const content = renderContent(route) ?? renderCatalog(route) ?? renderCommerce(route) ?? renderAccount(route);
  view.innerHTML = content ?? `<div class="panel">${emptyState('inbox', t('找不到这个页面', 'Page not found'),
    '', `<a class="button primary" href="#/">${icon('arrow-left', 16)}${t('返回商城', 'Back to shop')}</a>`)}`;
  mountCatalog();
  const pageTitle = view.querySelector('h1')?.textContent.trim();
  const brand = t('SYH 商店', 'SYH Store');
  document.title = !pageTitle || route.path === '/' ? brand : `${pageTitle} | ${brand}`;
  if (moveFocus) {
    if (catalogScroll !== undefined) {
      const catalogTop = document.getElementById('catalog')?.getBoundingClientRect().top;
      window.scrollTo(0, Number.isFinite(catalogTop) ? Math.max(0, window.scrollY + catalogTop + catalogScroll) : 0);
    } else window.scrollTo(0, 0);
    view.focus({ preventScroll: true });
  }
  commerceTick();
  contentTick().catch(console.error);
}

function closeMenus(except, restoreFocus = false) {
  document.querySelectorAll('[data-menu-toggle][aria-expanded="true"], [data-select-toggle][aria-expanded="true"]').forEach(trigger => {
    if (trigger === except) return;
    setMenu(trigger, false);
    if (restoreFocus) trigger.focus();
  });
}

function setMenu(trigger, open) {
  const target = trigger.hasAttribute('data-select-toggle')
    ? trigger.closest('[data-select]').querySelector('.select-options')
    : document.getElementById(trigger.getAttribute('aria-controls'));
  if (!target) return;
  if (open) closeMenus(trigger);
  trigger.setAttribute('aria-expanded', String(open));
  target.hidden = !open;
  target.inert = !open;
  if (open && target.matches('.select-options')) {
    target.classList.remove('opens-up');
    if (target.getBoundingClientRect().bottom > window.innerHeight - 10
      && trigger.getBoundingClientRect().top - target.offsetHeight > 85) target.classList.add('opens-up');
  }
}

function chooseOption(option) {
  const container = option.closest('[data-select]');
  const field = container.querySelector('input[type="hidden"]');
  const trigger = container.querySelector('[data-select-toggle]');
  const changed = field.value !== option.dataset.selectOption;
  container.querySelectorAll('[data-select-option]').forEach(item => {
    item.setAttribute('aria-selected', String(item === option));
  });
  trigger.querySelector('[data-select-label]').textContent = option.querySelector('span').textContent;
  field.value = option.dataset.selectOption;
  setMenu(trigger, false);
  trigger.focus();
  if (changed) field.dispatchEvent(new Event('change', { bubbles: true }));
}

function reportError(error) {
  console.error(error);
  toast(t('操作未完成，请重试。', 'The action could not be completed. Try again.'));
}

async function handleClick(event) {
  const element = event.target;
  if (element.closest('a[aria-disabled="true"]')) {
    event.preventDefault();
    return;
  }
  const trigger = element.closest('[data-menu-toggle], [data-select-toggle]');
  if (trigger) {
    setMenu(trigger, trigger.getAttribute('aria-expanded') !== 'true');
    return;
  }
  const option = element.closest('[data-select-option]');
  if (option) {
    chooseOption(option);
    return;
  }
  if (!element.closest('[data-select], [data-header-menu]') || element.closest('[data-header-menu] a')) closeMenus();
  if (element.closest('#skip-link')) {
    event.preventDefault();
    view.focus();
    return;
  }
  const button = element.closest('[data-action]');
  if (!button || button.disabled || button.dataset.busy) return;
  const action = button.dataset.action;
  button.dataset.busy = 'true';
  try {
    if (action === 'modal-close') {
      closeModal();
    } else if (action === 'copy-value') {
      await copyWithNotice(button.dataset.copyValue, button.dataset.copyMessage);
    } else if (action === 'language') {
      if (state.prefs.lang !== button.dataset.lang) {
        state.prefs.lang = button.dataset.lang;
        const user = activeUser();
        if (user) user.locale = state.prefs.lang;
        save();
        refresh();
      } else closeMenus();
      header.querySelector('[aria-controls="menu-language"]')?.focus();
    } else if (!await catalogAction(action, button, event) && !await contentAction(action, button, event)
      && !await commerceAction(action, button, event)) {
      await accountAction(action, button, event);
    }
  } catch (error) {
    reportError(error);
  } finally {
    delete button.dataset.busy;
  }
}

function handleKeys(event) {
  if (event.defaultPrevented || event.isComposing) return;
  if (event.key === 'Enter' && event.target.matches('[data-qty-input]')) {
    event.preventDefault();
    event.target.dispatchEvent(new Event('change', { bubbles: true }));
    return;
  }
  if (event.key === 'Escape') {
    if (document.querySelector('[aria-expanded="true"][data-menu-toggle], [aria-expanded="true"][data-select-toggle]')) event.preventDefault();
    closeMenus(undefined, true);
    return;
  }
  const group = event.target.closest('[data-select], [data-header-menu]');
  if (!group || !['ArrowDown', 'ArrowUp', 'Home', 'End'].includes(event.key)) return;
  const trigger = group.querySelector('[data-select-toggle], [data-menu-toggle]');
  const items = [...group.querySelectorAll('[data-select-option]:not(:disabled), .header-menu-panel a, .header-menu-panel button:not(:disabled)')];
  if (!items.length) return;
  event.preventDefault();
  if (trigger.getAttribute('aria-expanded') !== 'true') setMenu(trigger, true);
  const index = items.indexOf(document.activeElement);
  const step = event.key === 'ArrowUp' ? -1 : 1;
  const next = event.key === 'Home' ? 0 : event.key === 'End' ? items.length - 1
    : index < 0 ? (step < 0 ? items.length - 1 : 0) : (index + step + items.length) % items.length;
  items[next].focus();
}

async function handleSubmit(event) {
  const form = event.target;
  if (!form.matches('form[data-form]')) return;
  event.preventDefault();
  if (form.dataset.busy) return;
  form.dataset.busy = 'true';
  try {
    if (!await contentSubmit(form, event) && !await commerceSubmit(form, event)) await accountSubmit(form, event);
  } catch (error) {
    reportError(error);
  } finally {
    delete form.dataset.busy;
  }
}

bindRefresh(render);
bindModalDismissal();
document.addEventListener('click', handleClick);
document.addEventListener('keydown', handleKeys);
document.addEventListener('submit', handleSubmit);
document.addEventListener('input', event => {
  catalogInput(event);
  contentInput(event);
});
document.addEventListener('change', catalogChange);
document.addEventListener('shop-cart-change', () => {
  const badge = header.querySelector('.cart-count');
  const count = cartCount();
  badge.hidden = !count;
  badge.toggleAttribute('data-wide', count > 99);
  badge.textContent = count > 99 ? '99+' : count;
});
const isCatalog = path => path === '/' || path === '/products' || path.startsWith('/categories/');
history.scrollRestoration = 'manual';
window.addEventListener('hashchange', event => {
  const pathFrom = url => (new URL(url).hash.slice(1).split('?')[0] || '/').replace(/\/$/, '') || '/';
  const previous = pathFrom(event.oldURL);
  const next = pathFrom(event.newURL);
  const catalog = document.getElementById('catalog');
  const catalogScroll = catalog && isCatalog(previous) && isCatalog(next) ? -catalog.getBoundingClientRect().top : undefined;
  closeModal();
  render({ moveFocus: true, catalogScroll });
});
setInterval(() => {
  commerceTick();
  contentTick().catch(console.error);
}, 500);

const availableCart = state.cart.filter(item => getSku(getProduct(item.productId), item.skuId));
if (availableCart.length !== state.cart.length) {
  state.cart = availableCart;
  save();
}
render();
