import { t, esc, icon, emptyState, copyText, toast, setFormError } from './ui.js';
import { breadcrumb } from './catalog.js';

const articles = [
  {
    id: 'purchase-guide', icon: 'bag',
    title: ['从选购到查单', 'From shopping to order lookup'],
    summary: ['选规格、下单，以及找回游客订单的步骤。', 'Choose an option, place an order and find it again as a guest.'],
    sections: [
      ['选择商品', 'Choose a product', '打开商品详情，选择规格和数量。可以直接购买，也可以把几件商品放入购物车一起结算。', 'Open a product, then pick an option and quantity. Buy it directly or add several items to your cart.'],
      ['填写结算信息', 'Check out', '游客可直接使用预填的演示邮箱。选择支付渠道后点击模拟付款，会员订单会记录到会员中心。', 'Guests can use the sample email already filled in. Select a payment channel and simulate payment. Member orders appear in the account center.'],
      ['查看订单', 'Find your order', '付款后可以打开订单详情。订单查询页会列出当前浏览器的游客订单，也可以按邮箱或订单号筛选。', 'Open order details after payment. The lookup page lists guest orders in this browser and can filter by email or order number.'],
    ],
    link: ['/', '浏览商品', 'Browse products'],
  },
  {
    id: 'redeem-a-code', icon: 'key',
    title: ['查看和保存兑换码', 'Find and save a redemption code'],
    summary: ['自动交付商品付款后，可在订单详情复制或下载凭证。', 'Copy or download your delivery details after simulated payment.'],
    sections: [
      ['打开订单详情', 'Open order details', '模拟付款后会直接打开订单。之后也可以从游客查单或会员订单列表进入。', 'Simulated payment opens the order automatically. You can also find it later through guest lookup or your account.'],
      ['保存交付内容', 'Save the delivery details', '订单交付后，可以使用复制按钮保存兑换码，也可以下载文本文件。演示兑换码只能在本网站体验。', 'After delivery, copy the redemption code or download the text file. Demo codes are for this storefront only.'],
    ],
    link: ['/guest/orders', '查询订单', 'Find an order'],
  },
  {
    id: 'manual-delivery', icon: 'clock',
    title: ['人工交付订单怎么处理', 'How assisted fulfillment works'],
    summary: ['了解下单时要提供的信息，以及付款后在哪里查看进度。', 'See what to enter at checkout and where to track the order.'],
    sections: [
      ['提交交付资料', 'Enter delivery information', '需要人工处理的商品会在结算时显示对应输入项，例如通知邮箱或账号用户名。请使用演示资料填写。', 'Items that need assistance show their own fields at checkout, such as a notification email or account username. Use sample details.'],
      ['查看处理进度', 'Check the status', '付款后订单进入交付中。可以在订单详情体验完成交付，并查看对应的交付结果。', 'The order moves to processing after payment. In order details, you can simulate fulfillment and see the delivery result.'],
    ],
    link: ['/categories/ai', '浏览 AI 订阅', 'Browse AI subscriptions'],
  },
  {
    id: 'wallet-and-gifts', icon: 'gift',
    title: ['钱包充值与礼品卡兑换', 'Top up your wallet or redeem a gift card'],
    summary: ['查看余额、完成模拟充值，或把礼品卡存入钱包。', 'View your balance, simulate a top-up or redeem a gift card.'],
    sections: [
      ['为钱包充值', 'Top up your wallet', '登录后进入钱包，填写充值金额并完成模拟付款。余额变化会出现在钱包流水。', 'Sign in, open Wallet, enter an amount and complete simulated payment. Your wallet records the credit.'],
      ['兑换礼品卡', 'Redeem a gift card', '输入卡密，或直接兑换演示礼品卡。兑换后的余额可在结算时抵扣订单。', 'Enter a gift card code or redeem the demo card with one click. Apply the credit at checkout.'],
    ],
    link: ['/me/wallet', '打开钱包', 'Open wallet'],
  },
  {
    id: 'after-sales', icon: 'headphones',
    title: ['订单售后与工单', 'Support tickets for orders'],
    summary: ['从订单详情发起售后并查看回复。', 'Open a ticket from order details and follow the conversation.'],
    sections: [
      ['发起工单', 'Open a ticket', '在已完成的订单详情中选择售后支持，填写说明即可提交。', 'Open support on a completed order, describe the issue and submit the ticket.'],
      ['跟进与关闭', 'Follow up and close', '可以在工单页面继续留言、添加附件并刷新回复。问题解决后可以关闭工单。', 'Reply, add attachments and refresh the conversation from the ticket page. Close it after the issue is resolved.'],
    ],
    link: ['/guest/orders', '查询订单', 'Find an order'],
  },
];

const pageHeading = (title, trail = '') => `${trail}<div class="page-heading"><h1>${title}</h1></div>`;
const demoCallout = message => `<div class="inline-notice">${icon('info', 17)}<span>${message}</span></div>`;
const resource = (path, symbol, label) => `<a class="resource-link link-effect" href="#${path}">${icon(symbol, 18)}<span>${label}</span>${icon('chevron-right', 16)}</a>`;

function articleCard(article) {
  return `<article class="panel article-card hover-border"><a href="#/blog/${article.id}">
    <span class="article-icon">${icon(article.icon, 24)}</span>
    <div><h2>${t(...article.title)}</h2><p>${t(...article.summary)}</p></div>
    <span class="card-arrow">${icon('arrow-right', 18)}</span>
  </a></article>`;
}

function articleList(keyword = '') {
  const query = keyword.trim().toLocaleLowerCase();
  const matches = articles.filter(article => [article.title, article.summary]
    .flat().some(value => value.toLocaleLowerCase().includes(query))
    || t(...article.title).toLocaleLowerCase().includes(query));
  return matches.length ? matches.map(articleCard).join('') : `<div class="panel">${emptyState('search',
    t('没有找到教程', 'No guides found'), t('试试其他关键词。', 'Try another search term.'))}</div>`;
}

function blogPage(route) {
  if (route.parts[1]) {
    const article = articles.find(item => item.id === route.parts[1]);
    if (!article) return null;
    const [url, zh, en] = article.link;
    return `<article class="article-page">
      ${pageHeading(t(...article.title), breadcrumb([[t('教程', 'Guides'), '/blog'], [t(...article.title)]]))}
      <div class="panel reading-panel">
        <p class="reading-intro">${t(...article.summary)}</p>
        ${article.sections.map(([heading, headingEn, body, bodyEn]) => `<section><h2>${t(heading, headingEn)}</h2><p>${t(body, bodyEn)}</p></section>`).join('')}
        <a class="button primary" href="#${url}">${t(zh, en)}${icon('arrow-right', 16)}</a>
      </div>
    </article>`;
  }
  return `<section class="information-page">
    <div class="page-heading tool-heading"><h1>${t('教程', 'Guides')}</h1>
      <div class="search-field">${icon('search', 17)}<input type="search" id="article-search" maxlength="120" autocomplete="off" aria-label="${t('搜索教程', 'Search guides')}" placeholder="${t('搜索教程', 'Search guides')}">
      <button class="icon-button search-clear" type="button" data-action="article-clear" aria-label="${t('清除搜索', 'Clear search')}" hidden>${icon('x', 15)}</button></div>
    </div>
    <div class="article-list" id="article-results" aria-live="polite">${articleList()}</div>
  </section>`;
}

const faq = [
  ['游客可以下单吗？', 'Can I order as a guest?', '可以。结算时可使用预填的演示邮箱，订单保存在当前浏览器。', 'Yes. Use the sample email at checkout. Your order is stored in this browser.'],
  ['付款后在哪里看交付内容？', 'Where do I find my delivery?', '自动交付的商品可直接在订单详情查看。人工交付的商品会显示处理进度。', 'Instant delivery appears in order details. Assisted orders show their processing status there.'],
  ['怎么联系售后？', 'How do I get support?', '打开已完成订单的详情，选择售后支持并提交工单。', 'Open a completed order and choose support to submit a ticket.'],
  ['可以使用真实付款信息吗？', 'Can I use real payment information?', '这里的付款是模拟操作。请使用演示邮箱和资料。', 'Payments are simulated. Use sample email addresses and details.'],
];

function infoPage(path) {
  if (path === '/notice') return `<section class="information-page">
    ${pageHeading(t('店铺公告', 'Store notices'))}
    <article class="panel reading-panel notice-panel">
      <div class="notice-heading"><span class="article-icon">${icon('megaphone', 24)}</span><h2>${t('SYH 商店前端演示开放体验', 'The SYH storefront demo is open')}</h2></div>
      <p>${t('可体验商品选购、模拟付款、订单交付与会员服务。订单和余额保存在当前浏览器。', 'Try shopping, simulated payments, delivery and membership services. Orders and balances are stored in this browser.')}</p>
      <a href="#/" class="button primary">${t('浏览商品', 'Browse products')}${icon('arrow-right', 16)}</a>
    </article>
  </section>`;
  if (path === '/support') return `<section class="information-page">
    ${pageHeading(t('购买与售后帮助', 'Shopping and order support'))}
    <div class="panel reading-panel faq-panel">
      ${faq.map(([question, questionEn, answer, answerEn]) => `<details class="faq-item">
        <summary>${t(question, questionEn)}${icon('chevron-down', 17)}</summary><p>${t(answer, answerEn)}</p>
      </details>`).join('')}
      <div class="faq-actions"><a class="button primary" href="#/guest/orders">${t('查询游客订单', 'Find a guest order')}${icon('arrow-right', 16)}</a>
      <a class="button subtle" href="#/me/orders">${t('查看会员订单', 'View member orders')}</a></div>
    </div>
  </section>`;
  if (path === '/about') return `<section class="information-page about-page">
    ${pageHeading(t('关于 SYH 商店', 'About SYH Store'))}
    <div class="panel reading-panel"><p class="reading-intro">${t('SYH 商店是一间数字商品店，提供订阅、效率工具、数字资源和礼品卡的购买演示。', 'SYH is a digital storefront demo for subscriptions, productivity tools, digital resources and gift cards.')}</p>
      <div class="info-links">
        ${resource('/notice', 'megaphone', t('店铺公告', 'Store notices'))}
        ${resource('/blog', 'book', t('购买教程', 'Shopping guides'))}
        ${resource('/support', 'headphones', t('购买与售后帮助', 'Shopping and order support'))}
      </div>
    </div>
  </section>`;
  const privacy = path === '/privacy';
  if (path !== '/terms' && !privacy) return null;
  return `<section class="information-page">
    ${pageHeading(privacy ? t('隐私说明', 'Privacy notice') : t('服务条款', 'Terms of service'))}
    <div class="panel reading-panel">${privacy ? `
      <section><h2>${t('浏览器存储', 'Browser storage')}</h2><p>${t('演示会在当前浏览器保存购物车、测试账号、订单及偏好。清除此站点的浏览器数据后，相关记录也会删除。', 'The demo stores cart items, test accounts, orders and preferences in this browser. Clearing site data removes those records.')}</p></section>
      <section><h2>${t('输入的数据', 'Information you enter')}</h2><p>${t('请使用虚拟邮箱和账号资料。2FA 工具只在当前页面内计算，关闭或离开页面后会清除密钥。', 'Use sample email addresses and account details. The 2FA tool computes codes within the page and clears its secrets when you leave.')}</p></section>` : `
      <section><h2>${t('演示服务', 'Demo service')}</h2><p>${t('站内商品、价格、钱包余额和支付结果用于演示交互。模拟付款不会扣款，交付内容也仅用于体验。', 'Products, prices, wallet balances and payment results are demonstration data. Simulated payments do not charge money, and delivery details are for testing.')}</p></section>
      <section><h2>${t('订单帮助', 'Order support')}</h2><p>${t('演示订单可以通过游客查单或会员中心查看，已完成的订单支持发起模拟售后。', 'Find demo orders using guest lookup or your account. Completed orders support simulated support tickets.')}</p></section>`}
    </div>
  </section>`;
}

let totpEntries = [];
let lastCounter = -1;
let otpVersion = 0;

function totpPage() {
  return `<section class="tool-page">
    ${pageHeading(t('2FA 动态码', '2FA codes'))}
    <div class="tool-layout">
      <section class="panel tool-panel">
        <form data-form="totp" novalidate>
          <label class="field"><span>${t('密钥', 'Secret keys')}</span>
            <textarea class="input" id="totp-secrets" name="secrets" rows="5" autocomplete="off" spellcheck="false" placeholder="${t('每行一个 Base32 密钥', 'One Base32 secret per line')}" maxlength="8192"></textarea>
          </label>
          <p class="form-error" role="alert" hidden></p>
          <div class="tool-actions">
            <button class="button primary" type="submit">${icon('key', 17)}${t('生成动态码', 'Generate codes')}</button>
            <button class="button quiet" type="button" data-action="totp-clear">${t('清空', 'Clear')}</button>
            <button class="button subtle tool-example" type="button" data-action="totp-example">${t('填入示例', 'Fill sample')}</button>
          </div>
        </form>
      </section>
      <section class="panel tool-panel tool-output">
        <div class="tool-output-heading"><h2>${t('动态码', 'Generated codes')}</h2><span id="totp-timer" hidden></span></div>
        <div id="totp-results">${emptyState('shield-key', t('等待生成', 'No codes yet'))}</div>
      </section>
    </div>
    ${demoCallout(t('密钥仅在此页面内用于计算动态码。', 'Secret keys are used to calculate codes within this page.'))}
  </section>`;
}

function base32Bytes(value) {
  const alphabet = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ234567';
  const text = value.replace(/\s+/g, '').toUpperCase().replace(/=+$/, '');
  if (text.length < 8 || !/^[A-Z2-7]+$/.test(text)) throw new Error('Invalid Base32');
  const bytes = [];
  let buffer = 0;
  let bits = 0;
  for (const char of text) {
    buffer = (buffer << 5) | alphabet.indexOf(char);
    bits += 5;
    if (bits >= 8) {
      bits -= 8;
      bytes.push((buffer >>> bits) & 255);
    }
  }
  return new Uint8Array(bytes);
}

async function readTotpEntry(line, index) {
  let secret = line;
  let label = t(`密钥 ${index + 1}`, `Secret ${index + 1}`);
  let period = 30;
  let digits = 6;
  let hash = 'SHA-1';
  if (line.startsWith('otpauth://')) {
    const uri = new URL(line);
    if (uri.hostname !== 'totp') throw new Error('Expected TOTP');
    secret = uri.searchParams.get('secret') || '';
    label = decodeURIComponent(uri.pathname.slice(1)) || label;
    period = Number(uri.searchParams.get('period')) || 30;
    digits = Number(uri.searchParams.get('digits')) || 6;
    const algorithm = uri.searchParams.get('algorithm');
    if (algorithm && ['SHA1', 'SHA256', 'SHA512'].includes(algorithm.toUpperCase())) {
      hash = algorithm.toUpperCase().replace('SHA', 'SHA-');
    }
  }
  if (period < 5 || period > 180 || !Number.isInteger(period) || ![6, 7, 8].includes(digits)) {
    throw new Error('Invalid parameters');
  }
  const key = await crypto.subtle.importKey('raw', base32Bytes(secret), { name: 'HMAC', hash }, false, ['sign']);
  return { key, label, digits, period };
}

async function totpCode(entry, epoch) {
  const counter = new ArrayBuffer(8);
  new DataView(counter).setBigUint64(0, BigInt(Math.floor(epoch / entry.period)));
  const hmac = new Uint8Array(await crypto.subtle.sign('HMAC', entry.key, counter));
  const offset = hmac.at(-1) & 15;
  const value = new DataView(hmac.buffer).getUint32(offset) & 0x7fffffff;
  return String(value % (10 ** entry.digits)).padStart(entry.digits, '0');
}

export async function contentTick() {
  const list = document.getElementById('totp-results');
  if (!list || !totpEntries.length) return;
  const seconds = Math.floor(Date.now() / 1000);
  if (seconds === lastCounter) return;
  lastCounter = seconds;
  const version = otpVersion;
  const codes = await Promise.all(totpEntries.map(async entry => ({
    label: entry.label, code: await totpCode(entry, seconds), left: entry.period - seconds % entry.period,
  })));
  if (!list.isConnected || version !== otpVersion) return;
  document.getElementById('totp-timer').hidden = false;
  document.getElementById('totp-timer').textContent = t(`${codes[0].left} 秒后更新`, `Refreshes in ${codes[0].left}s`);
  if (codes.some(({ code }, index) => list.querySelectorAll('[data-otp-code]')[index]?.textContent !== code)) {
    list.innerHTML = `<div class="tool-results-list">${codes.map(({ label, code }) => `<div class="otp-result">
      <div><span>${esc(label)}</span><code data-otp-code>${code}</code></div>
      <button class="icon-button subtle" type="button" data-action="totp-copy" data-code="${code}" aria-label="${t('复制动态码', 'Copy code')}">${icon('copy', 17)}</button>
    </div>`).join('')}</div>`;
  }
}

export function renderContent(route) {
  if (route.path !== '/2fa' && totpEntries.length) {
    totpEntries = [];
    otpVersion++;
  }
  if (route.path === '/2fa') return totpPage();
  if (route.parts[0] === 'blog') return blogPage(route);
  return infoPage(route.path);
}

export function contentInput(event) {
  if (event.target.id !== 'article-search') return;
  document.getElementById('article-results').innerHTML = articleList(event.target.value);
  document.querySelector('[data-action="article-clear"]').hidden = !event.target.value;
}

export async function contentAction(action, element) {
  if (action === 'article-clear') {
    const input = document.getElementById('article-search');
    input.value = '';
    contentInput({ target: input });
    input.focus();
    return true;
  }
  if (action === 'totp-copy') {
    toast(await copyText(element.dataset.code) ? t('已复制动态码', 'Code copied') : t('请手动复制动态码', 'Copy the code manually'));
    return true;
  }
  if (action === 'totp-clear' || action === 'totp-example') {
    const input = document.getElementById('totp-secrets');
    input.value = action === 'totp-example' ? 'JBSWY3DPEHPK3PXP' : '';
    setFormError(input.form);
    if (action === 'totp-clear') {
      totpEntries = [];
      otpVersion++;
      document.getElementById('totp-timer').hidden = true;
      document.getElementById('totp-results').innerHTML = emptyState('shield-key', t('等待生成', 'No codes yet'));
    }
    input.focus();
    return true;
  }
  return false;
}

export async function contentSubmit(form) {
  if (form.dataset.form !== 'totp') return false;
  setFormError(form);
  const lines = new FormData(form).get('secrets').split(/\n/).map(value => value.trim()).filter(Boolean);
  const limit = 20;
  if (!lines.length || lines.length > limit) {
    setFormError(form, !lines.length ? t('请先填写输入框。', 'Enter a value first.') : t(`最多输入 ${limit} 项。`, `Enter up to ${limit} items.`));
    return true;
  }
  try {
    const parsed = await Promise.allSettled(lines.map(readTotpEntry));
    if (!form.isConnected) return true;
    const invalid = parsed.findIndex(result => result.status === 'rejected');
    if (invalid !== -1) {
      setFormError(form, t(`第 ${invalid + 1} 行的密钥无效。`, `Invalid secret on line ${invalid + 1}.`));
      return true;
    }
    totpEntries = parsed.map(result => result.value);
    otpVersion++;
    lastCounter = -1;
    await contentTick();
  } catch {
    setFormError(form, t('无法生成动态码，请核对密钥。', 'Could not generate a code. Check the secret.'));
  }
  return true;
}
