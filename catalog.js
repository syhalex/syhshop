import {
  state, activeUser, save, t, esc, icon, money, select, emptyState, go, refresh, toast, copyText,
  clampQuantity, quantityControl,
} from './ui.js';
import { heroArt, productArt } from './illustrations.js';

export const categories = [
  { id: 'ai', name: 'AI 订阅', en: 'AI subscriptions', icon: 'sparkles' },
  { id: 'tools', name: '效率工具', en: 'Productivity', icon: 'command' },
  { id: 'resources', name: '数字资源', en: 'Digital resources', icon: 'layers' },
  { id: 'gift', name: '礼品卡', en: 'Gift cards', icon: 'gift' },
];

const sku = (id, name, en, price, stock, memberPrice) => ({ id, name, en, price, stock, memberPrice });
const contactField = {
  name: 'accountEmail', label: '接收通知的邮箱', en: 'Notification email',
  placeholder: 'guest@example.test', demoValue: 'guest@example.test', type: 'email', required: true,
};

export const products = [
  {
    id: 'ai-assistant-plus', category: 'ai', name: 'AI 助手 Plus', en: 'AI Assistant Plus',
    description: '适合日常问答、写作与文件处理的订阅兑换码。',
    descriptionEn: 'A subscription code for everyday Q&A, writing and document work.',
    art: 'spark', theme: 'moss', delivery: 'auto', article: 'redeem-a-code',
    skus: [
      sku('month', '1 个月', '1 month', 4900, 28, 4400),
      sku('quarter', '3 个月', '3 months', 12900, 12, 11900),
    ],
  },
  {
    id: 'longform-pro', category: 'ai', name: '长文助手 Pro', en: 'Longform Assistant Pro',
    description: '适合长文阅读与整理，提交接收邮箱后由人工处理。',
    descriptionEn: 'For reading and organizing long documents, with assisted delivery by email.',
    art: 'orbit', theme: 'clay', delivery: 'manual', article: 'manual-delivery',
    fields: [contactField],
    skus: [
      sku('month', '1 个月', '1 month', 6900, 16, 6400),
      sku('quarter', '3 个月', '3 months', 18900, 5, 17500),
    ],
  },
  {
    id: 'workspace-kit', category: 'tools', name: '效率工作台模板', en: 'Workspace Template Kit',
    description: '一套管理任务、项目与每周回顾的工作区模板。',
    descriptionEn: 'A workspace for tasks, projects and weekly reviews.',
    art: 'notebook', theme: 'slate', delivery: 'auto', article: 'redeem-a-code',
    skus: [
      sku('starter', '基础版', 'Starter', 2900, 35, 2500),
      sku('complete', '完整版', 'Complete', 4900, 18, 4300),
    ],
  },
  {
    id: 'syh-gift-card', category: 'gift', name: 'SYH 礼品卡', en: 'SYH Gift Card',
    description: '兑换为 SYH 商店钱包余额，也可以送给朋友。',
    descriptionEn: 'Redeem for SYH wallet credit or give the code to a friend.',
    art: 'gift', theme: 'sand', delivery: 'auto', article: 'wallet-and-gifts', maxQty: 10,
    skus: [
      sku('20', '¥20 面额', '¥20 value', 2000, 50),
      sku('50', '¥50 面额', '¥50 value', 5000, 35),
      sku('100', '¥100 面额', '¥100 value', 10000, 20),
    ],
  },
  {
    id: 'creator-ui-kit', category: 'resources', name: '创作者界面素材包', en: 'Creator UI Kit',
    description: '包含界面组件与图标，适合制作原型和个人项目。',
    descriptionEn: 'Interface components and icons for prototypes and personal projects.',
    art: 'layers', theme: 'iris', delivery: 'auto', article: 'redeem-a-code',
    skus: [
      sku('personal', '个人版', 'Personal', 3900, 24, 3400),
      sku('studio', '工作室版', 'Studio', 8900, 10, 8000),
    ],
  },
  {
    id: 'editor-presets', category: 'resources', name: '影像调色预设', en: 'Photo Preset Collection',
    description: '为日常与旅行照片准备的低饱和色彩预设。',
    descriptionEn: 'Soft color presets for everyday and travel photography.',
    art: 'frame', theme: 'mint', delivery: 'auto', article: 'redeem-a-code',
    skus: [
      sku('digital', '数字下载', 'Digital download', 2400, 21, 2000),
      sku('extended', '扩展版', 'Extended', 4200, 9, 3600),
    ],
  },
  {
    id: 'code-companion', category: 'ai', name: '代码搭档订阅', en: 'Code Companion',
    description: '面向日常开发的代码解释、重构与测试建议。',
    descriptionEn: 'Code explanations, refactoring and test suggestions for everyday development.',
    art: 'code', theme: 'slate', delivery: 'auto', article: 'redeem-a-code',
    skus: [sku('month', '1 个月', '1 month', 5900, 8, 5200)],
  },
  {
    id: 'cloud-space', category: 'tools', name: '云端空间扩容', en: 'Cloud Storage Upgrade',
    description: '为文件备份和跨设备同步增加云端容量。',
    descriptionEn: 'Extra cloud storage for file backups and cross-device sync.',
    art: 'cloud', theme: 'moss', delivery: 'manual', article: 'manual-delivery', memberOnly: true,
    maxQty: 3, stockMode: 'status',
    fields: [contactField],
    skus: [sku('100gb', '100 GB / 1 年', '100 GB / 1 year', 9900, 11, 8900)],
  },
  {
    id: 'font-collection', category: 'resources', name: '编辑字体组合', en: 'Editorial Type Collection',
    description: '适合封面、海报与长文排版的字体组合。',
    descriptionEn: 'A type collection for covers, posters and editorial layouts.',
    art: 'type', theme: 'sand', delivery: 'auto', article: 'redeem-a-code',
    skus: [sku('personal', '个人授权', 'Personal license', 3200, 0)],
  },
  {
    id: 'sound-collection', category: 'resources', name: '环境音效合集', en: 'Ambient Sound Collection',
    description: '用于视频剪辑和播客制作的环境录音素材。',
    descriptionEn: 'Field recordings for video editing and podcast production.',
    art: 'wave', theme: 'clay', delivery: 'auto', article: 'redeem-a-code', minQty: 2, maxQty: 5,
    skus: [sku('standard', '标准版', 'Standard', 2600, 15, 2300)],
  },
  {
    id: 'motion-template', category: 'resources', name: '动态片头模板', en: 'Motion Intro Templates',
    description: '可编辑的片头、字幕和转场模板。',
    descriptionEn: 'Editable intros, title cards and transitions.',
    art: 'play', theme: 'iris', delivery: 'auto', article: 'redeem-a-code',
    skus: [sku('standard', '标准版', 'Standard', 4600, 13, 4000)],
  },
  {
    id: 'meeting-assistant', category: 'ai', name: '会议纪要助手', en: 'Meeting Notes Assistant',
    description: '把会议转录整理成纪要、决定和待办事项。',
    descriptionEn: 'Turn meeting transcripts into notes, decisions and action items.',
    art: 'notebook', theme: 'moss', delivery: 'auto', article: 'redeem-a-code',
    skus: [sku('month', '1 个月', '1 month', 3900, 22, 3500), sku('quarter', '3 个月', '3 months', 9900, 9, 8900)],
  },
  {
    id: 'weekly-planner', category: 'tools', name: '每周计划模板', en: 'Weekly Planner Template',
    description: '集中安排一周的日程、优先事项和回顾。',
    descriptionEn: 'Plan your schedule, priorities and weekly review in one place.',
    art: 'notebook', theme: 'sand', delivery: 'auto', article: 'redeem-a-code',
    skus: [sku('standard', '标准版', 'Standard', 1200, 40, 1000)],
  },
  {
    id: 'presentation-templates', category: 'resources', name: '演示文稿模板包', en: 'Presentation Template Pack',
    description: '为项目汇报提供标题页、图表和时间线版式。',
    descriptionEn: 'Title slides, charts and timelines for project presentations.',
    art: 'layers', theme: 'slate', delivery: 'auto', article: 'redeem-a-code',
    skus: [sku('personal', '个人版', 'Personal', 2800, 26, 2400), sku('team', '团队版', 'Team', 5800, 8, 5200)],
  },
  {
    id: 'ai-translation', category: 'ai', name: '多语言翻译助手', en: 'Translation Assistant',
    description: '支持双语对照和术语表，由人工确认开通。',
    descriptionEn: 'Bilingual review and glossaries, with assisted activation.',
    art: 'type', theme: 'iris', delivery: 'manual', article: 'manual-delivery',
    fields: [contactField],
    skus: [sku('month', '1 个月', '1 month', 3500, 15, 3100)],
  },
  {
    id: 'personal-ledger', category: 'tools', name: '个人账本模板', en: 'Personal Budget Template',
    description: '记录日常收支，按月份和分类汇总。',
    descriptionEn: 'Record income and spending with monthly and category summaries.',
    art: 'notebook', theme: 'mint', delivery: 'auto', article: 'redeem-a-code',
    skus: [sku('standard', '标准版', 'Standard', 1900, 32, 1600)],
  },
  {
    id: 'line-icon-pack', category: 'resources', name: '线条图标合集', en: 'Line Icon Pack',
    description: '统一线宽的导航、编辑和状态图标。',
    descriptionEn: 'Navigation, editing and status icons with consistent strokes.',
    art: 'frame', theme: 'moss', delivery: 'auto', article: 'redeem-a-code',
    skus: [sku('personal', '个人授权', 'Personal license', 2400, 30, 2000), sku('studio', '工作室授权', 'Studio license', 5400, 12, 4900)],
  },
  {
    id: 'spreadsheet-assistant', category: 'ai', name: '表格分析助手', en: 'Spreadsheet Assistant',
    description: '整理表格数据并生成公式建议和统计摘要。',
    descriptionEn: 'Organize tables and get formula suggestions and statistical summaries.',
    art: 'code', theme: 'mint', delivery: 'auto', article: 'redeem-a-code',
    skus: [sku('month', '1 个月', '1 month', 4200, 24, 3800)],
  },
  {
    id: 'focus-timer', category: 'tools', name: '专注计时工具', en: 'Focus Timer',
    description: '按专注和休息时段安排工作，查看每日记录。',
    descriptionEn: 'Schedule focus and break intervals and review your daily sessions.',
    art: 'orbit', theme: 'slate', delivery: 'auto', article: 'redeem-a-code',
    skus: [sku('personal', '个人授权', 'Personal license', 2200, 19, 1800)],
  },
  {
    id: 'podcast-intros', category: 'resources', name: '播客片头音效', en: 'Podcast Intro Sounds',
    description: '用于播客片头、章节切换和片尾的短音频。',
    descriptionEn: 'Short audio clips for podcast intros, chapter breaks and outros.',
    art: 'wave', theme: 'iris', delivery: 'auto', article: 'redeem-a-code',
    skus: [sku('standard', '标准版', 'Standard', 1800, 27, 1500)],
  },
  {
    id: 'image-assistant', category: 'ai', name: '灵感绘图助手', en: 'Image Ideation Assistant',
    description: '用文字草稿生成构图和配色参考。',
    descriptionEn: 'Develop layout and palette references from written briefs.',
    art: 'spark', theme: 'clay', delivery: 'auto', article: 'redeem-a-code',
    skus: [sku('month', '1 个月', '1 month', 4500, 18, 4000)],
  },
  {
    id: 'research-workspace', category: 'tools', name: '文献整理工作台', en: 'Research Reading Workspace',
    description: '按主题管理文献、读书笔记和引文。',
    descriptionEn: 'Organize papers, reading notes and citations by topic.',
    art: 'notebook', theme: 'iris', delivery: 'auto', article: 'redeem-a-code', memberOnly: true,
    skus: [sku('complete', '完整版', 'Complete', 3900, 16, 3300)],
  },
  {
    id: 'paper-textures', category: 'resources', name: '纸张纹理素材包', en: 'Paper Texture Pack',
    description: '适合插画和排版的高分辨率纸面纹理。',
    descriptionEn: 'High-resolution paper textures for illustration and layouts.',
    art: 'frame', theme: 'clay', delivery: 'auto', article: 'redeem-a-code',
    skus: [sku('standard', '标准版', 'Standard', 1600, 25, 1400), sku('print', '印刷版', 'Print edition', 3200, 7, 2800)],
  },
  {
    id: 'file-organizer', category: 'tools', name: '文件批量整理工具', en: 'Batch File Organizer',
    description: '按命名规则批量重命名，并将文件归入不同文件夹。',
    descriptionEn: 'Rename files in batches and sort them into folders using rules.',
    art: 'layers', theme: 'mint', delivery: 'auto', article: 'redeem-a-code',
    skus: [sku('personal', '个人授权', 'Personal license', 3200, 12, 2800)],
  },
  {
    id: 'subtitle-styles', category: 'resources', name: '视频字幕样式包', en: 'Video Caption Styles',
    description: '包含访谈、竖屏和双语字幕的版式。',
    descriptionEn: 'Subtitle layouts for interviews, vertical clips and bilingual video.',
    art: 'play', theme: 'sand', delivery: 'auto', article: 'redeem-a-code',
    skus: [sku('standard', '标准版', 'Standard', 2100, 17, 1800)],
  },
];

export const getProduct = id => products.find(product => product.id === id);
export const getSku = (product, skuId) => product?.skus.find(item => item.id === skuId);

export function stockOf(product, variant) {
  if (!product || !variant) return 0;
  const sold = state.orders
    .filter(order => ['completed', 'processing'].includes(order.status) && !order.isDemoSample)
    .flatMap(order => order.items || [])
    .filter(item => item.productId === product.id && item.skuId === variant.id)
    .reduce((sum, item) => sum + item.qty, 0);
  return Math.max(0, variant.stock - sold);
}

export function quantityBounds(product, variant) {
  return {
    min: product?.minQty || 1,
    max: Math.min(stockOf(product, variant), product?.maxQty || Infinity),
  };
}

export function priceOf(variant) {
  return activeUser() && variant.memberPrice != null ? variant.memberPrice : variant.price;
}

function minPrice(product) {
  return Math.min(...product.skus.map(priceOf));
}

function available(product, variant) {
  if (!variant) return product.skus.some(option => available(product, option));
  const { min, max } = quantityBounds(product, variant);
  return max >= min;
}

function nameOf(item) { return t(item.name, item.en); }

function deliveryLabel(product) {
  return product.delivery === 'auto' ? t('自动交付', 'Instant delivery') : t('人工处理', 'Assisted delivery');
}

function storeHero() {
  return `<section class="store-hero" aria-labelledby="store-hero-title">
    <div class="hero-copy">
      <h1 id="store-hero-title">${t('数字商品商店', 'Digital goods store')}</h1>
      <p>${t('订阅、效率工具与数字资源', 'Subscriptions, tools and digital resources')}</p>
      <div class="hero-actions">
        <button class="button primary" type="button" data-action="browse-catalog">${t('浏览商品', 'Browse products')}${icon('arrow-down', 16)}</button>
        <a class="button quiet" href="#/guest/orders">${icon('receipt', 17)}${t('查询订单', 'Find an order')}</a>
      </div>
    </div>
    ${heroArt()}
  </section>
  <a class="announcement-strip" href="#/notice">
    <span class="announcement-label">${icon('megaphone', 17)}${t('店铺公告', 'Notice')}</span>
    <span class="announcement-title">${t('SYH 商店前端演示开放体验', 'The SYH storefront demo is open')}</span>
    ${icon('chevron-right', 17)}
  </a>`;
}

function catalogSidebar(selected) {
  const categoryLink = ({ id, name, en, icon: symbol }) => {
    const count = products.filter(product => !id || product.category === id).length;
    return `<a class="category-link${id === selected ? ' selected' : ''}" href="#${id ? `/categories/${id}` : '/'}" ${id === selected ? 'aria-current="page"' : ''}>
      ${icon(symbol, 17)}<span>${t(name, en)}</span><span class="category-count">${count}</span></a>`;
  };
  return `<aside class="catalog-sidebar">
    <section class="panel category-panel" aria-labelledby="category-title">
      <h2 id="category-title">${t('商品分类', 'Categories')}</h2>
      <nav aria-label="${t('商品分类', 'Product categories')}">
        ${[{ id: '', name: '全部商品', en: 'All products', icon: 'grid' }, ...categories].map(categoryLink).join('')}
      </nav>
    </section>
    <section class="panel catalog-help" aria-labelledby="catalog-help-title">
      <h2 id="catalog-help-title">${t('购买帮助', 'Shopping help')}</h2>
      <a href="#/blog/purchase-guide">${icon('book', 16)}<span>${t('从选购到查单', 'Shopping and order lookup')}</span>${icon('chevron-right', 15)}</a>
      <a href="#/support">${icon('headphones', 16)}<span>${t('售后服务', 'Order support')}</span>${icon('chevron-right', 15)}</a>
    </section>
  </aside>`;
}

function productCard(product) {
  const soldOut = !available(product);
  return `<article class="panel product-card hover-border">
    <a class="product-card-link" href="#/products/${product.id}">
      <div class="product-card-art">${productArt(product)}</div>
      <div class="product-card-body">
        <div class="product-card-meta">
          ${icon(soldOut ? 'package' : product.delivery === 'auto' ? 'bolt' : 'clock', 14)}
          ${soldOut ? t('暂时缺货', 'Sold out') : deliveryLabel(product)}
          ${product.memberOnly ? `<span class="product-member-tag">${t('会员专享', 'Members only')}</span>` : ''}
        </div>
        <h3>${nameOf(product)}</h3>
        <p>${t(product.description, product.descriptionEn)}</p>
        <div class="product-card-bottom">
          <span class="card-price">${money(minPrice(product))}${product.skus.length > 1 ? `<small>${t('起', 'from')}</small>` : ''}</span>
          <span class="card-arrow">${icon('arrow-right', 17)}</span>
        </div>
      </div>
    </a>
  </article>`;
}

const targetPageSize = 20;

function resultData(filters, perPage) {
  const keyword = filters.term.trim().toLocaleLowerCase();
  const matches = products.filter(product => {
    if (filters.category && product.category !== filters.category) return false;
    if (filters.inStock && !available(product)) return false;
    return !keyword || [product.name, product.en, product.description, product.descriptionEn, nameOf(product)]
      .some(value => value.toLocaleLowerCase().includes(keyword));
  });
  if (filters.sort === 'price-up') matches.sort((a, b) => minPrice(a) - minPrice(b));
  if (filters.sort === 'price-down') matches.sort((a, b) => minPrice(b) - minPrice(a));
  if (filters.sort === 'latest') matches.reverse();
  const pages = Math.max(1, Math.ceil(matches.length / perPage));
  const page = Math.min(Math.max(1, filters.page), pages);
  return { matches, pages, page, perPage };
}

function emptyCatalog() {
  return `<div class="panel">${emptyState('search', t('没有找到商品', 'No products found'),
    t('可以更换关键词或清除筛选。', 'Try another search or clear your filters.'),
    `<button class="button subtle" data-action="catalog-reset">${t('清除筛选', 'Clear filters')}</button>`)}
  </div>`;
}

function paginationHtml({ pages, page }) {
  const pageButton = (number, label, description, extra = '') =>
    `<button type="button" class="pagination-button ${extra}" data-action="catalog-page" data-page="${number}" ${description}>${label}</button>`;
  return pages > 1 ? `<nav class="catalog-pagination" aria-label="${t('商品分页', 'Catalog pages')}">
    ${pageButton(page - 1, icon('chevron-left', 16), `aria-label="${t('上一页', 'Previous page')}" ${page === 1 ? 'disabled' : ''}`)}
    ${Array.from({ length: pages }, (_, index) => pageButton(index + 1, index + 1,
      index + 1 === page ? 'aria-current="page"' : '')).join('')}
    ${pageButton(page + 1, icon('chevron-right', 16), `aria-label="${t('下一页', 'Next page')}" ${page === pages ? 'disabled' : ''}`)}
  </nav>` : '';
}

const sortOptions = () => [
  { value: 'default', label: t('默认排序', 'Featured') },
  { value: 'price-up', label: t('价格从低到高', 'Price low to high') },
  { value: 'price-down', label: t('价格从高到低', 'Price high to low') },
  { value: 'latest', label: t('最近上架', 'Recently added') },
];

let currentFilters;
let currentPageSize;
let catalogObserver;

function pageSizeFor(grid) {
  const columns = Math.max(1, getComputedStyle(grid).gridTemplateColumns.trim().split(/\s+/).length);
  return Math.ceil(targetPageSize / columns) * columns;
}

export function mountCatalog() {
  catalogObserver?.disconnect();
  const grid = document.querySelector('#catalog-results .product-grid');
  if (!grid) return;
  currentPageSize = pageSizeFor(grid);
  updateResults();
  catalogObserver ??= new ResizeObserver(() => {
    const activeGrid = document.querySelector('#catalog-results .product-grid');
    if (!activeGrid) return;
    const size = pageSizeFor(activeGrid);
    if (size === currentPageSize) return;
    currentPageSize = size;
    updateResults();
  });
  catalogObserver.observe(grid);
}

export function renderCatalog(route) {
  if (route.parts[0] === 'products' && route.parts[1]) return productPage(route);
  if (!['/', '/products'].includes(route.path) && route.parts[0] !== 'categories') return null;
  const category = categories.find(entry => entry.id === route.parts[1]);
  if (route.parts[0] === 'categories' && !category) return null;
  const sort = route.query.get('sort');
  const filters = {
    path: route.path,
    category: category?.id || '',
    term: (route.query.get('q') || '').slice(0, 120),
    inStock: route.query.get('stock') === '1',
    sort: sortOptions().some(option => option.value === sort) ? sort : 'default',
    page: Math.floor(Number(route.query.get('page'))) || 1,
  };
  currentFilters = filters;
  const title = category ? nameOf(category) : t('全部商品', 'All products');
  return `${storeHero()}
    <section class="catalog-layout" id="catalog" aria-labelledby="catalog-title">
      ${catalogSidebar(filters.category)}
      <div class="catalog-content">
        <div class="catalog-heading">
          <div class="catalog-title-group"><h2 id="catalog-title" tabindex="-1">${title}</h2>
            <span class="catalog-count" data-result-count aria-live="polite"></span>
          </div>
          <label class="stock-filter">
            <input class="choice-input" type="checkbox" data-stock-filter ${filters.inStock ? 'checked' : ''}>
            <span>${t('仅看有货', 'In stock only')}</span>
          </label>
          <div class="catalog-controls">
            <div class="search-field">${icon('search', 17)}
              <input type="search" autocomplete="off" id="catalog-search" maxlength="120" value="${esc(filters.term)}" aria-label="${t('搜索商品', 'Search products')}" placeholder="${t('搜索商品', 'Search products')}">
              <button type="button" class="icon-button search-clear" data-action="catalog-clear" aria-label="${t('清除搜索', 'Clear search')}" ${filters.term ? '' : 'hidden'}>${icon('x', 15)}</button>
            </div>
            ${select({ name: 'catalogSort', value: filters.sort, options: sortOptions(), label: t('商品排序', 'Sort products'), icon: 'sort' })}
          </div>
        </div>
        <div id="catalog-results">
          <div class="product-grid"></div>
          <div data-catalog-empty hidden>${emptyCatalog()}</div>
          <div data-catalog-pagination></div>
        </div>
      </div>
    </section>`;
}

function countText(count) { return t(`${count} 件商品`, `${count} products`); }

function updateResults() {
  const container = document.getElementById('catalog-results');
  if (!container || !currentFilters) return;
  const { path, term, inStock, sort } = currentFilters;
  const grid = container.querySelector('.product-grid');
  const perPage = pageSizeFor(grid);
  currentPageSize = perPage;
  const data = resultData(currentFilters, perPage);
  currentFilters.page = data.page;
  grid.innerHTML = data.matches.slice((data.page - 1) * data.perPage, data.page * data.perPage).map(productCard).join('');
  container.querySelector('[data-catalog-empty]').hidden = data.matches.length > 0;
  container.querySelector('[data-catalog-pagination]').innerHTML = paginationHtml(data);
  document.querySelector('[data-result-count]').textContent = countText(data.matches.length);
  document.querySelector('[data-action="catalog-clear"]').hidden = !term;
  const query = new URLSearchParams();
  if (term) query.set('q', term);
  if (inStock) query.set('stock', '1');
  if (sort !== 'default') query.set('sort', sort);
  if (data.page > 1) query.set('page', data.page);
  history.replaceState(history.state, '', '#' + path + (query.size ? '?' + query : ''));
}

export function catalogInput(event) {
  if (event.target.id !== 'catalog-search' || !currentFilters) return;
  currentFilters.term = event.target.value;
  currentFilters.page = 1;
  updateResults();
}

export function catalogChange(event) {
  if (event.target.matches('[data-qty-input="product"]')) {
    commitProductQuantity(event.target);
    return;
  }
  if (!currentFilters || !document.getElementById('catalog-results')) return;
  if (event.target.name === 'catalogSort') currentFilters.sort = event.target.value;
  else if (event.target.matches('[data-stock-filter]')) currentFilters.inStock = event.target.checked;
  else return;
  currentFilters.page = 1;
  updateResults();
}

export function breadcrumb(items) {
  return `<nav class="breadcrumb" aria-label="${t('当前位置', 'Breadcrumb')}">
    ${items.map(([label, path], index) => `${index ? icon('chevron-right', 13) : ''}
      ${path ? `<a class="link-effect" href="#${path}">${esc(label)}</a>` : `<span aria-current="page">${esc(label)}</span>`}`).join('')}
  </nav>`;
}

let productChoice = { productId: '', skuId: '', qty: 1, view: 'cover' };
let shareFeedback;

function productPage(route) {
  const product = getProduct(route.parts[1]);
  if (!product) return null;
  const category = categories.find(entry => entry.id === product.category);
  if (productChoice.productId !== product.id) {
    const initial = getSku(product, route.query.get('sku')) || product.skus.find(item => available(product, item)) || product.skus[0];
    productChoice = { productId: product.id, skuId: initial.id, qty: product.minQty || 1, view: 'cover' };
  }
  const variant = getSku(product, productChoice.skuId);
  const stock = stockOf(product, variant);
  const { min, max } = quantityBounds(product, variant);
  const qty = clampQuantity(productChoice.qty, min, max, min);
  productChoice.qty = qty;
  const unit = priceOf(variant);
  const isMember = Boolean(activeUser());
  const inStock = max >= min;
  const purchaseAllowed = inStock && (!product.memberOnly || isMember);
  return `<div class="product-page">
    ${breadcrumb([[t('商城', 'Shop'), '/'], [nameOf(category), '/categories/' + category.id], [nameOf(product)]])}
    <div class="detail-layout">
      <section class="panel product-gallery" aria-label="${t('商品图集', 'Product gallery')}">
        <div class="product-gallery-main" id="gallery-main">${productArt(product, productChoice.view)}</div>
        <div class="product-gallery-thumbs">
          ${['cover', 'detail'].map((view, index) => `<button type="button" class="gallery-thumb" aria-label="${index ? t('细节图', 'Detail image') : t('商品封面', 'Cover image')}" aria-pressed="${productChoice.view === view}" data-action="product-gallery" data-view="${view}">${productArt(product, view)}</button>`).join('')}
        </div>
      </section>
      <section class="panel detail-panel" aria-labelledby="product-title">
        <div class="detail-title">
          <div class="product-card-meta">${icon(product.delivery === 'auto' ? 'bolt' : 'clock', 15)}${deliveryLabel(product)}
          ${product.memberOnly ? `<span class="product-member-tag">${t('会员专享', 'Members only')}</span>` : ''}</div>
          <button class="icon-button subtle product-share" type="button" data-action="product-share" aria-label="${t('复制商品链接', 'Copy product link')}" title="${t('复制商品链接', 'Copy product link')}">${icon('link', 18)}${icon('check', 18)}</button>
        </div>
        <h1 id="product-title">${nameOf(product)}</h1>
        <p class="detail-description">${t(product.description, product.descriptionEn)}</p>
        <div class="detail-price">${money(unit)}${unit < variant.price ? `<del>${money(variant.price)}</del><span class="product-member-tag">${t('会员价', 'Member price')}</span>` : ''}</div>
        <div class="detail-controls">
          <fieldset class="variant-field">
            <legend>${t('规格', 'Options')}</legend>
            <div class="variant-choices">
              ${product.skus.map(option => `<button type="button" class="variant-choice" data-action="product-sku" data-sku="${option.id}" aria-pressed="${option === variant}">
                ${nameOf(option)}${option === variant ? icon('check', 15) : ''}${available(product, option) ? '' : `<span>${t('缺货', 'Sold out')}</span>`}</button>`).join('')}
            </div>
          </fieldset>
          <div class="quantity-line">
            <div class="quantity-field"><span>${t('数量', 'Quantity')}</span>
              ${quantityControl({ qty, min, max, action: 'product-qty', input: 'product' })}
            </div>
            <span class="stock-label">${!inStock ? t('暂时缺货', 'Sold out') : product.stockMode === 'status' ? t('有货', 'In stock') : t(`库存 ${stock} 件`, `${stock} in stock`)}</span>
            ${product.minQty > 1 ? `<span class="stock-label">${t(`${min} 件起购`, `Minimum ${min}`)}</span>` : ''}
            ${inStock && product.maxQty ? `<span class="stock-label">${t(`限购 ${product.maxQty} 件`, `Limit ${product.maxQty}`)}</span>` : ''}
          </div>
        </div>
        <div class="detail-actions">
          ${product.memberOnly && !isMember
            ? `<a class="button primary" href="#/auth/login?next=${encodeURIComponent(route.path)}">${t('登录后购买', 'Sign in to buy')}${icon('arrow-right', 17)}</a>`
            : `<button class="button subtle" type="button" data-action="product-cart" ${purchaseAllowed ? '' : 'disabled'}>${icon('cart', 18)}${t('加入购物车', 'Add to cart')}</button>
              <button class="button primary" type="button" data-action="product-buy" ${purchaseAllowed ? '' : 'disabled'}>${t('立即购买', 'Buy now')}${icon('arrow-right', 17)}</button>`}
        </div>
      </section>
    </div>
    <div class="detail-lower">
      <section class="panel product-info"><h2>${t('商品详情', 'Product details')}</h2>
        <p>${t(product.description, product.descriptionEn)}</p>
        <dl class="info-rows">
          <div><dt>${t('商品分类', 'Category')}</dt><dd>${nameOf(category)}</dd></div>
          <div><dt>${t('交付方式', 'Fulfillment')}</dt><dd>${deliveryLabel(product)}</dd></div>
          <div><dt>${t('订单凭证', 'Order receipt')}</dt><dd>${t('付款后可在订单详情查看', 'Available in order details after payment')}</dd></div>
        </dl>
      </section>
      <section class="panel product-info"><h2>${t('使用与售后', 'Use and support')}</h2>
        <a class="resource-link link-effect" href="#/blog/${product.article}">${icon('book', 18)}<span>${t('查看使用教程', 'Read the guide')}</span>${icon('chevron-right', 16)}</a>
        <a class="resource-link link-effect" href="#/support">${icon('headphones', 18)}<span>${t('购买与售后帮助', 'Shopping and order support')}</span>${icon('chevron-right', 16)}</a>
      </section>
    </div>
  </div>`;
}

function commitProductQuantity(input) {
  const product = getProduct(productChoice.productId);
  const { min, max } = quantityBounds(product, getSku(product, productChoice.skuId));
  productChoice.qty = clampQuantity(input.value, min, max, productChoice.qty);
  input.value = productChoice.qty;
  const stepper = input.closest('.qty-control');
  stepper.querySelector('[data-delta="-1"]').disabled = max < min || productChoice.qty <= min;
  stepper.querySelector('[data-delta="1"]').disabled = max < min || productChoice.qty >= max;
  return productChoice.qty;
}

export async function catalogAction(action, element) {
  if (action === 'browse-catalog') {
    document.getElementById('catalog').scrollIntoView({ behavior: matchMedia('(prefers-reduced-motion: reduce)').matches ? 'auto' : 'smooth', block: 'start' });
    document.getElementById('catalog-title').focus({ preventScroll: true });
    return true;
  }
  if (action === 'catalog-reset' || action === 'catalog-clear') {
    if (action === 'catalog-reset') {
      currentFilters.inStock = false;
      document.querySelector('[data-stock-filter]').checked = false;
    }
    const input = document.getElementById('catalog-search');
    input.value = '';
    input.focus();
    input.dispatchEvent(new Event('input', { bubbles: true }));
    return true;
  }
  if (action === 'catalog-page') {
    currentFilters.page = Number(element.dataset.page);
    updateResults();
    document.getElementById('catalog').scrollIntoView({ block: 'start' });
    document.querySelector('.catalog-pagination [aria-current="page"]')?.focus({ preventScroll: true });
    return true;
  }
  if (!action.startsWith('product-')) return false;
  const product = getProduct(productChoice.productId);
  const variant = getSku(product, productChoice.skuId);
  if (!product || !variant) return true;
  const { min, max } = quantityBounds(product, variant);
  switch (action) {
    case 'product-gallery': {
      productChoice.view = element.dataset.view;
      document.getElementById('gallery-main').innerHTML = productArt(product, productChoice.view);
      document.querySelectorAll('.gallery-thumb').forEach(thumb => {
        thumb.setAttribute('aria-pressed', String(thumb === element));
      });
      break;
    }
    case 'product-sku': {
      productChoice.skuId = element.dataset.sku;
      productChoice.qty = min;
      refresh();
      document.querySelector('.variant-choice[aria-pressed="true"]')?.focus({ preventScroll: true });
      break;
    }
    case 'product-qty': {
      const input = element.closest('.qty-control').querySelector('.qty-input');
      input.value = commitProductQuantity(input) + Number(element.dataset.delta);
      commitProductQuantity(input);
      break;
    }
    case 'product-share': {
      const copied = await copyText(location.href);
      if (copied) {
        element.dataset.copied = '';
        clearTimeout(shareFeedback);
        shareFeedback = setTimeout(() => delete element.dataset.copied, 1550);
      }
      toast(copied ? t('已复制商品链接', 'Product link copied') : t('可从地址栏复制链接', 'Copy the link from the address bar'), copied ? 'check' : 'info');
      break;
    }
    case 'product-cart': {
      const quantity = commitProductQuantity(document.querySelector('[data-qty-input="product"]'));
      const existing = state.cart.find(item => item.productId === product.id && item.skuId === variant.id);
      const qty = (existing?.qty || 0) + quantity;
      const combinedQty = state.cart.filter(item => item.productId === product.id).reduce((sum, item) => sum + item.qty, 0) + quantity;
      if (qty > max || (product.maxQty && combinedQty > product.maxQty)) {
        toast(t('购物车中的数量已达到可购上限', 'The cart quantity would exceed the purchase limit'));
        return true;
      }
      if (existing) existing.qty = qty;
      else state.cart.push({ productId: product.id, skuId: variant.id, qty });
      save();
      document.dispatchEvent(new Event('shop-cart-change'));
      toast(t('已加入购物车', 'Added to cart'));
      break;
    }
    case 'product-buy': {
      const qty = commitProductQuantity(document.querySelector('[data-qty-input="product"]'));
      const query = new URLSearchParams({ product: product.id, sku: variant.id, qty });
      go('/checkout?' + query);
      break;
    }
    default: return false;
  }
  return true;
}
