const storageKey = 'syh-shop-demo-v1';
function loadState() {
  const defaults = {
    prefs: { lang: 'zh-CN' },
    cart: [],
    orders: [],
    tickets: [],
    users: [],
    giftCards: [],
    session: null,
  };
  try {
    const saved = JSON.parse(localStorage.getItem(storageKey) || 'null');
    if (!saved || typeof saved !== 'object') return defaults;
    for (const key of ['cart', 'orders', 'tickets', 'users', 'giftCards']) {
      if (Array.isArray(saved[key])) defaults[key] = saved[key];
    }
    const { lang } = saved.prefs || {};
    if (['zh-CN', 'zh-TW', 'en-US'].includes(lang)) defaults.prefs.lang = lang;
    if (typeof saved.session === 'string') defaults.session = saved.session;
    return defaults;
  } catch {
    return defaults;
  }
}

export const state = loadState();
export const activeUser = () => state.users.find(user => user.email === state.session) || null;

export function save() {
  try {
    localStorage.setItem(storageKey, JSON.stringify(state));
    return true;
  } catch {
    return false;
  }
}

const traditional = new Map(Array.from(
  '万萬与與丢丟两兩严嚴个個丰豐临臨为為丽麗举舉义義乐樂习習书書买買乱亂争爭亏虧于於云雲亚亞产產亩畝亲親亿億仅僅从從仓倉仪儀们們价價众眾优優会會伞傘伟偉传傳伤傷伦倫伪偽体體余餘侠俠侣侶侧側侦偵俩倆债債倾傾偿償储儲儿兒兑兌兰蘭关關兴興养養兽獸内內冈岡册冊写寫军軍农農冲沖决決况況冻凍净淨准準凉涼减減凑湊几幾凤鳳凭憑凯凱击擊划劃刘劉则則刚剛创創删刪别別剂劑剑劍剧劇劝勸办辦务務动動励勵劲勁劳勞势勢区區医醫华華协協单單卖賣卢盧卫衛却卻厅廳历歷压壓厌厭县縣参參双雙发發变變叙敘叶葉号號叹嘆听聽启啟员員呐吶呜嗚咏詠响響问問啸嘯喷噴团團园園围圍图圖圆圓国國圣聖场場坏壞块塊坚堅坛壇坝壩墙牆壮壯声聲壳殼处處备備复復够夠头頭夹夾夺奪奖獎奋奮妇婦妈媽娱娛婴嬰孙孫学學宁寧宝寶实實审審宠寵宽寬宾賓对對寻尋导導寿壽将將尔爾层層岁歲岂豈岗崗岛島岭嶺币幣师師帐帳帘簾带帶帮幫干乾库庫应應庙廟废廢开開异異弃棄张張弥彌弯彎弹彈强強归歸录錄彻徹径徑忆憶忧憂怀懷态態怜憐总總恋戀恶惡惊驚惧懼惨慘惩懲惫憊惯慣愿願戏戲户戶扑撲扩擴扫掃扬揚扰擾抚撫护護报報担擔拟擬拥擁拦攔拨撥择擇挂掛挚摯挠撓挡擋挣掙挥揮损損换換据據掷擲揽攬搀攙携攜摄攝摆擺摇搖摊攤撑撐敌敵数數斋齋斗鬥断斷无無旧舊时時旷曠显顯晓曉暂暫术術朴樸机機杀殺杂雜权權条條来來杨楊杰傑极極构構枪槍柜櫃标標栈棧栋棟栏欄树樹样樣档檔桥橋桨槳检檢棱稜楼樓欢歡欧歐歼殲残殘殴毆毁毀毕畢气氣汇匯汤湯沟溝没沒沥瀝沦淪沧滄沪滬泪淚洒灑洁潔浅淺浆漿浇澆测測济濟浓濃涌湧涂塗润潤涨漲涩澀渔漁渗滲湾灣湿濕溃潰溅濺滚滾满滿滨濱滤濾滥濫潇瀟灭滅灯燈灵靈灾災炉爐炼煉烁爍烂爛烛燭烟煙烦煩烧燒热熱焕煥爱愛爷爺牵牽牺犧犹猶狈狽狮獅狱獄猎獵猪豬猫貓献獻环環现現玛瑪琐瑣瑶瑤瓮甕电電画畫畅暢疗療疟瘧疮瘡疯瘋痒癢痪瘓痴癡癞癩皱皺盏盞盐鹽监監盖蓋盘盤眯瞇睁睜瞒瞞矿礦码碼砖磚砚硯础礎确確碍礙礼禮祷禱祸禍离離秃禿种種积積称稱稳穩穷窮窃竊窍竅窝窩窥窺竞競笔筆笼籠筑築筛篩签簽简簡箩籮篮籃篓簍类類粪糞粮糧紧緊纠糾红紅纤纖约約级級纪紀纯純纱紗纲綱纳納纵縱纷紛纸紙纹紋纺紡纽紐线線练練组組细細织織终終绊絆绍紹绎繹经經绑綁绒絨结結绕繞绘繪给給络絡绝絕统統绢絹绣繡继繼续續绳繩维維绵綿绷繃综綜绿綠缀綴缅緬缆纜缓緩缔締缕縷编編缘緣缚縛缝縫缠纏缩縮缮繕缰韁缴繳网網罗羅罚罰罢罷职職联聯聪聰肃肅肠腸肤膚肾腎肿腫胀脹胁脅胜勝胶膠脉脈脏臟脑腦脓膿脚腳脱脫脸臉腊臘腻膩腾騰舆輿舰艦舱艙艰艱艳艷艺藝节節芜蕪苇葦苍蒼苏蘇范範茎莖茧繭荐薦荚莢荡蕩荣榮荧熒莲蓮获獲莹瑩营營萧蕭萨薩葱蔥蒋蔣蓝藍蓟薊蔷薔蔼藹蕴蘊虏虜虑慮虚虛虫蟲蚀蝕蚁蟻蚂螞蚕蠶蛮蠻蛰蟄蜗蝸蝇蠅蝉蟬衅釁衔銜补補衬襯袜襪袭襲装裝裤褲裢褳裥襇褛褸褴襤见見观觀规規觅覓视視览覽觉覺触觸订訂计計认認讥譏讨討让讓训訓议議讯訊记記讲講讳諱许許论論讼訟设設访訪诀訣证證评評识識诈詐诉訴诊診词詞译譯试試诗詩诚誠话話诞誕询詢该該详詳诧詫诫誡语語误誤诱誘诲誨说說诵誦请請诸諸诺諾读讀课課谁誰调調谈談谊誼谋謀谍諜谎謊谐諧谓謂谜謎谢謝谣謠谦謙谨謹谬謬譬譬贝貝贞貞负負贡貢财財责責贤賢败敗账賬货貨质質贩販贪貪贫貧贬貶购購贮貯贯貫贱賤贴貼贵貴贷貸贸貿费費贺賀贼賊贾賈贿賄赁賃赂賂赃贓资資赋賦赌賭赎贖赏賞赔賠赖賴赚賺赛賽赞贊赠贈赡贍赢贏赶趕趋趨跃躍跄蹌踪蹤踊踴踌躊践踐蹑躡蹒蹣躯軀车車轧軋轨軌转轉轮輪软軟轰轟轴軸轻輕载載轿轎较較辅輔辆輛辈輩辉輝辊輥辐輻辑輯输輸辕轅辖轄辗輾辙轍辞辭边邊辽遼达達迁遷过過迈邁运運还還这這进進远遠违違连連迟遲递遞逻邏遗遺遥遙邓鄧邮郵郑鄭酝醞酱醬酿釀释釋鉴鑑针針钉釘钓釣钙鈣钟鐘钢鋼钥鑰钦欽钧鈞钩鉤钮鈕钱錢钳鉗钻鑽铁鐵铃鈴铅鉛铜銅铝鋁铣銑铭銘银銀铸鑄铺鋪链鏈销銷锁鎖锅鍋锈鏽锋鋒锐銳错錯锡錫锣鑼锤錘锦錦键鍵锯鋸锻鍛镀鍍镁鎂镇鎮镜鏡镭鐳镰鐮长長门門闪閃闭閉间間闷悶闸閘闹鬧闺閨闻聞闽閩阀閥阁閣阅閱队隊阳陽阴陰阵陣阶階际際陆陸陈陳陕陝陨隕险險随隨隐隱隶隸难難雏雛雾霧霉黴静靜韦韋韧韌韩韓页頁顶頂顷頃项項顺順须須顽頑顾顧顿頓颁頒颂頌预預领領颇頗颈頸频頻颓頹颖穎颗顆题題颜顏额額颠顛颤顫风風飞飛饥飢饭飯饮飲饰飾饱飽饲飼饼餅馆館馈饋馋饞马馬驯馴驰馳驱驅驳駁驴驢驶駛驻駐驾駕骂罵骄驕骆駱骇駭验驗骑騎骗騙骚騷骤驟鱼魚鲜鮮鲸鯨鳄鱷鳞鱗鸟鳥鸡雞鸣鳴鸥鷗鸭鴨鸽鴿鹅鵝鹊鵲鹏鵬鹤鶴鹦鸚鹰鷹麦麥黄黃齐齊齿齒龄齡龙龍龟龜'
  .matchAll(/(.)(.)/gu), ([, from, to]) => [from, to]));

function traditionalText(value) {
  return [...value].map(char => traditional.get(char) || char).join('')
    .replaceAll('帳号', '帳號').replaceAll('帳戶', '帳戶')
    .replaceAll('教程', '教學').replaceAll('服務器', '伺服器')
    .replaceAll('用戶', '使用者').replaceAll('余額', '餘額')
    .replaceAll('軟件', '軟體').replaceAll('郵箱', '電子信箱')
    .replaceAll('默認', '預設').replaceAll('登錄', '登入')
    .replaceAll('注冊', '註冊').replaceAll('鏈接', '連結')
    .replaceAll('充值', '儲值').replaceAll('頁面', '頁面');
}

export function t(zh, en = zh) {
  if (state.prefs.lang === 'en-US') return en;
  return state.prefs.lang === 'zh-TW' ? traditionalText(zh) : zh;
}

export function esc(value = '') {
  return String(value ?? '').replace(/[&<>"']/g, character => ({
    '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;',
  })[character]);
}

export const money = cents => `¥${(Number(cents || 0) / 100).toFixed(2)}`;

export function formatDate(value, options = { dateStyle: 'medium', timeStyle: 'short' }) {
  if (!value) return '—';
  const date = new Date(value);
  return Number.isFinite(date.getTime()) ? new Intl.DateTimeFormat(state.prefs.lang, options).format(date) : '—';
}

export function go(path, { replace = false } = {}) {
  const next = '#' + (path.startsWith('/') ? path : '/' + path);
  if (location.hash === next) refresh();
  else if (replace) location.replace(next);
  else location.hash = next;
}

let redraw = () => {};
export function bindRefresh(callback) { redraw = callback; }
export function refresh() { redraw(); }

let toastTimer;

function hideToast() {
  const element = document.getElementById('toast');
  if (typeof element.hidePopover === 'function' && element.matches(':popover-open')) element.hidePopover();
  else element.hidden = true;
}

export function toast(message, symbol = 'info') {
  const element = document.getElementById('toast');
  const usePopover = typeof element.showPopover === 'function';
  if (!usePopover) element.removeAttribute('popover');
  element.innerHTML = icon(symbol);
  const text = document.createElement('span');
  text.textContent = message;
  element.append(text);
  element.hidden = false;
  if (usePopover && !element.matches(':popover-open')) element.showPopover();
  clearTimeout(toastTimer);
  toastTimer = setTimeout(hideToast, 3600);
}

export function openModal(title, body) {
  const dialog = document.getElementById('shop-modal');
  if (dialog.open) return;
  const closeLabel = t('关闭弹窗', 'Close dialog');
  hideToast();
  dialog.innerHTML = `<div class="modal-heading"><h2 id="shop-modal-title">${esc(title)}</h2>
    <button type="button" class="icon-button" data-action="modal-close" aria-label="${closeLabel}" autofocus>${icon('x', 19)}</button></div>
    <div class="modal-body">${body}</div>`;
  dialog.showModal();
}

export function closeModal() {
  document.getElementById('shop-modal').close();
}

export function confirmAction({ title, message, confirmLabel, symbol, onConfirm }) {
  const dialog = document.getElementById('shop-modal');
  if (dialog.open) return;
  openModal(title, `<p>${esc(message)}</p><div class="modal-actions">
    <button class="button quiet" type="button" data-action="modal-close">${t('返回', 'Back')}</button>
    <button class="button destructive" type="button" data-confirm-action>${icon(symbol, 17)}${esc(confirmLabel)}</button>
  </div>`);
  dialog.querySelector('[data-confirm-action]').addEventListener('click', () => {
    closeModal();
    onConfirm();
  }, { once: true });
}

export function bindModalDismissal() {
  const dialog = document.getElementById('shop-modal');
  let gesture;
  const outside = event => {
    const { left, right, top, bottom } = dialog.getBoundingClientRect();
    return event.target === dialog && (event.clientX < left || event.clientX > right || event.clientY < top || event.clientY > bottom);
  };
  dialog.addEventListener('pointerdown', event => {
    if (!event.isPrimary || event.button !== 0) return;
    gesture = outside(event) ? { id: event.pointerId, endOutside: false } : null;
  }, true);
  dialog.addEventListener('pointerup', event => {
    if (gesture?.id === event.pointerId) gesture.endOutside = outside(event);
  }, true);
  dialog.addEventListener('pointercancel', () => { gesture = null; });
  dialog.addEventListener('close', () => { gesture = null; });
  dialog.addEventListener('click', event => {
    const dismiss = gesture?.endOutside && outside(event) && event.detail > 0;
    gesture = null;
    if (dismiss) dialog.close();
  });
}

const reducedMotion = () => matchMedia('(prefers-reduced-motion: reduce)').matches;

export function animateRefresh(button) {
  const glyph = button.querySelector('.icon');
  if (!glyph || reducedMotion()) return;
  glyph.getAnimations().forEach(animation => animation.cancel());
  return glyph.animate([{ transform: 'rotate(0deg)' }, { transform: 'rotate(360deg)' }],
    { duration: 320, easing: 'cubic-bezier(.2,.7,.3,1)' }).finished.catch(() => {});
}

const iconPaths = {
  'arrow-left': '<path d="M19 12H5m7 7-7-7 7-7"/>',
  'arrow-right': '<path d="M5 12h14m-7-7 7 7-7 7"/>',
  'arrow-up': '<path d="M12 19V5m-7 7 7-7 7 7"/>',
  'arrow-down': '<path d="M12 5v14m7-7-7 7-7-7"/>',
  'arrow-up-right': '<path d="M7 17 17 7M7 7h10v10"/>',
  'arrow-down-left': '<path d="M17 7 7 17m10 0H7V7"/>',
  'chevron-left': '<path d="m15 6-6 6 6 6"/>',
  'chevron-right': '<path d="m9 6 6 6-6 6"/>',
  'chevron-up': '<path d="m6 15 6-6 6 6"/>',
  'chevron-down': '<path d="m6 9 6 6 6-6"/>',
  'bag': '<path d="M5 8h14l1.5 13h-17L5 8Z"/><path d="M9 10V6a3 3 0 0 1 6 0v4"/>',
  'cart': '<path d="M2.5 4H5l2.2 11h11.7l2-7.5H6"/><circle cx="9" cy="20" r="1"/><circle cx="18" cy="20" r="1"/>',
  'check': '<path d="m5 12 4 4L19 6"/>',
  'x': '<path d="m6 6 12 12M18 6 6 18"/>',
  'clock': '<circle cx="12" cy="12" r="9"/><path d="M12 7v5l3 2"/>',
  'package': '<path d="m12 3 9 4.5v9L12 21l-9-4.5v-9L12 3Z"/><path d="m3 7.5 9 4.5 9-4.5M12 12v9M7.5 5.25l9 4.5"/>',
  'receipt': '<path d="M5 3h14v18l-3.5-2-3.5 2-3.5-2L5 21V3Z"/><path d="M8.5 8h7m-7 4h7"/>',
  'wallet': '<path d="M20 8V5H6a3 3 0 0 0 0 6h14v8H6a3 3 0 0 1-3-3V8m17 3h1v5h-6a2.5 2.5 0 0 1 0-5h5Z"/><path d="M16 13.5h.01"/>',
  'shield': '<path d="M12 22s7-3.5 7-10V5l-7-3-7 3v7c0 6.5 7 10 7 10Z"/><path d="m9 12 2 2 4-4"/>',
  'shield-key': '<path d="M12 21c-3.8-1.7-7-5.2-7-9.6v-6L12 3l7 2.4v6c0 4.4-3.2 7.9-7 9.6Z"/><circle cx="12" cy="10.7" r="1.9"/><path d="M12 12.6v3.3m0-1.2h1.6"/>',
  'mail': '<rect x="3" y="5" width="18" height="14" rx="2"/><path d="m4 7 8 6 8-6"/>',
  'lock': '<rect x="5" y="10" width="14" height="11" rx="2"/><path d="M8 10V7a4 4 0 0 1 8 0v3m-4 4v3"/>',
  'key': '<circle cx="8" cy="9" r="4"/><path d="m11 12 8 8m-3-3 2-2m-5-1 2-2"/>',
  'copy': '<rect x="8" y="8" width="12" height="12" rx="2"/><path d="M16 5V4H4v12h1"/>',
  'search': '<circle cx="10.5" cy="10.5" r="5.5"/><path d="m15 15 5 5"/>',
  'refresh': '<path d="M20 4v5.5h-5.5M19.5 9.5a8 8 0 1 0 .1 5"/>',
  'circle-help': '<circle cx="12" cy="12" r="9"/><path d="M9.5 9a2.5 2.5 0 1 1 3.1 2.4c-.6.2-.6.6-.6 1.6m0 3h.01"/>',
  'ticket': '<path d="M4 6h16v4a2 2 0 0 0 0 4v4H4v-4a2 2 0 0 0 0-4V6Z"/><path d="M15 6v2m0 3v2m0 3v2"/>',
  'plus': '<path d="M12 5v14M5 12h14"/>',
  'minus': '<path d="M5 12h14"/>',
  'trash': '<path d="M4 7h16M9 7V4h6v3m3 0-1 13H7L6 7m4 4v5m4-5v5"/>',
  'download': '<path d="M12 3v12m-4-4 4 4 4-4M4 16v4h16v-4"/>',
  'external': '<path d="M13 5h6v6m-8 2 8-8m0 9v5H5V5h5"/>',
  'link': '<path d="M10 13a4 4 0 0 0 5.7 0l3.5-3.5a4 4 0 0 0-5.7-5.7l-2 2m2.5 5.2a4 4 0 0 0-5.7 0l-3.5 3.5a4 4 0 0 0 5.7 5.7l2-2"/>',
  'alert': '<path d="m12 3 10 17H2L12 3Zm0 6v5m0 3h.01"/>',
  'inbox': '<path d="M6 4h12l3 8v7H3v-7l3-8Z"/><path d="M3 12h5l2 3h4l2-3h5"/>',
  'calendar': '<rect x="4" y="6" width="16" height="15" rx="2"/><path d="M8 3v6m8-6v6M4 11h16"/>',
  'card': '<rect x="3" y="5" width="18" height="14" rx="2"/><path d="M3 10h18M7 15h3"/>',
  'credit-card': '<rect x="3" y="5" width="18" height="14" rx="2"/><path d="M3 10h18M7 15h3"/>',
  'qr': '<path d="M3 3h7v7H3zm11 0h7v7h-7zM3 14h7v7H3zm11 0h3v3h-3zm7 0v7h-7m-7-14h.01m11 0h.01M7 18h.01"/>',
  'paperclip': '<path d="m9 14 6-6a2 2 0 1 1 3 3l-8 8a4 4 0 0 1-5.7-5.7l8-8a2.5 2.5 0 0 1 3.5 3.5l-6.7 6.7"/>',
  'send': '<path d="m3 4 18 8-18 8 3-8-3-8Zm3 8h15"/>',
  'home': '<path d="m3 11 9-7 9 7v9h-6v-6H9v6H3v-9Z"/>',
  'layout': '<rect x="3" y="4" width="18" height="16" rx="2"/><path d="M3 9h18m-11 0v11"/>',
  'user': '<circle cx="12" cy="8" r="3.5"/><path d="M5 21v-2a7 7 0 0 1 14 0v2"/>',
  'users': '<circle cx="9" cy="8" r="3"/><path d="M3 21v-2a6 6 0 0 1 12 0v2m1-16a3 3 0 0 1 0 6m2 3a5 5 0 0 1 3 5v2"/>',
  'gift': '<path d="M4 11h16v10H4zM3 7h18v4H3zm9 0v14m0-14H8a2.5 2.5 0 1 1 2.2-3.7L12 7Zm0 0h4a2.5 2.5 0 1 0-2.2-3.7L12 7Z"/>',
  'eye': '<path d="M2.5 12s3.5-6 9.5-6 9.5 6 9.5 6-3.5 6-9.5 6-9.5-6-9.5-6Z"/><circle cx="12" cy="12" r="2.5"/>',
  'eye-off': '<path d="m4 4 16 16m-5-2.6c-1 .4-2 .6-3 .6-6 0-9.5-6-9.5-6a18 18 0 0 1 4-4.3m4-1.6 1.5-.1c6 0 9.5 6 9.5 6a18 18 0 0 1-3 3.5"/>',
  'log-out': '<path d="M10 4H4v16h6m0-8h10m-4-4 4 4-4 4"/>',
  'globe': '<circle cx="12" cy="12" r="9"/><ellipse cx="12" cy="12" rx="4" ry="9"/><path d="M3 12h18"/>',
  'info': '<circle cx="12" cy="12" r="9"/><path d="M12 11v5m0-8h.01"/>',
  'smartphone': '<rect x="7" y="2.5" width="10" height="19" rx="2"/><path d="M11 18h2"/>',
  'book': '<path d="M12 6c-3-2-6-2.5-9-2v14c3-.5 6 0 9 2 3-2 6-2.5 9-2V4c-3-.5-6 0-9 2v14Z"/>',
  'megaphone': '<path d="M4 9h5l10-5v16L9 15H4V9Zm4 6 2 5h3m6-9 2-1m-2 4 2 1"/>',
  'grid': '<rect x="4" y="4" width="6" height="6" rx="1"/><rect x="14" y="4" width="6" height="6" rx="1"/><rect x="4" y="14" width="6" height="6" rx="1"/><rect x="14" y="14" width="6" height="6" rx="1"/>',
  'sparkles': '<path d="M11 2.5 13.5 9l6.5 2.5-6.5 2.5-2.5 6.5L8.5 14 2 11.5 8.5 9 11 2.5ZM19 3v5m-2.5-2.5h5m-2.5 12v5m-2.5-2.5h5"/>',
  'command': '<path d="M8 8h8v8H8V8Zm0 0H5.5A2.5 2.5 0 1 1 8 5.5V8Zm8 0V5.5A2.5 2.5 0 1 1 18.5 8H16Zm0 8h2.5a2.5 2.5 0 1 1-2.5 2.5V16Zm-8 0v2.5A2.5 2.5 0 1 1 5.5 16H8Z"/>',
  'layers': '<path d="m12 3 9 5-9 5-9-5 9-5ZM3 12l9 5 9-5M3 16l9 5 9-5"/>',
  'image': '<rect x="3" y="4" width="18" height="16" rx="2"/><circle cx="8" cy="9" r="1.5"/><path d="m3 17 5-4 3 2 4-5 6 6"/>',
  'filter': '<path d="M4 7h16M7 12h10m-7 5h4"/>',
  'sort': '<path d="M8 4v16m-3-3 3 3 3-3m5 3V4m-3 3 3-3 3 3"/>',
  'menu': '<path d="M4 6h16M4 12h16M4 18h16"/>',
  'bolt': '<path d="m13 2-8 12h6l-1 8 9-12h-6l1-8Z"/>',
  'code': '<path d="m8 6-6 6 6 6m8-12 6 6-6 6M14 4l-4 16"/>',
  'tag': '<path d="M3 4h8l10 10-7 7L3 10V4Z"/><circle cx="7.5" cy="8" r="1"/>',
  'message': '<path d="M5 4h14a2 2 0 0 1 2 2v10a2 2 0 0 1-2 2H9l-5 3v-5a2 2 0 0 1-1-2V6a2 2 0 0 1 2-2Z"/><path d="M7 9h10m-10 4h7"/>',
  'headphones': '<path d="M4 14v-3a8 8 0 0 1 16 0v6a4 4 0 0 1-4 4h-3"/><rect x="3" y="12" width="4" height="6" rx="1"/><rect x="17" y="12" width="4" height="6" rx="1"/>',
  'chart': '<path d="M4 4v16h16M8 15v-3m4 3V8m4 7V5"/>',
  'settings': '<path d="m9 4 1-2h4l1 2 2 1 2-.2 2 3-1 2v3l1 2-2 3-2-.2-2 1-1 2h-4l-1-2-2-1-2 .2-2-3 1-2v-3l-1-2 2-3 2 .2 2-1Z"/><circle cx="12" cy="11.5" r="3"/>',
};

const aliases = {
  close: 'x', box: 'package', checkCircle: 'check', 'check-circle': 'check',
  'shopping-bag': 'bag', 'shopping-cart': 'cart', rotate: 'refresh', 'rotate-ccw': 'refresh',
  'help-circle': 'circle-help', 'alert-circle': 'alert', 'shield-check': 'shield',
  'external-link': 'external', 'qr-code': 'qr', logout: 'log-out', bell: 'megaphone',
  'more-horizontal': 'menu', 'message-circle': 'message', 'life-buoy': 'circle-help',
  'file-text': 'receipt', file: 'receipt', bank: 'card',
};

export function icon(name, size = 18) {
  const key = aliases[name] || name;
  const symbol = Object.hasOwn(iconPaths, key) ? key : 'info';
  return `<svg class="icon icon-${symbol}" width="${Number(size) || 18}" height="${Number(size) || 18}" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.7" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">${iconPaths[symbol]}</svg>`;
}

export function select({ name, value, options, label, icon: iconName, disabled = false }) {
  const current = options.find(item => String(item.value) === String(value)) || options[0];
  return `<div class="custom-select" data-select>
    <input type="hidden" name="${esc(name)}" value="${esc(current?.value)}">
    <button type="button" class="select-trigger" aria-haspopup="listbox" aria-expanded="false" aria-label="${esc(label || current?.label)}" data-select-toggle ${disabled ? 'disabled' : ''}>
      ${iconName ? icon(iconName, 16) : ''}<span data-select-label>${esc(current?.label)}</span>${icon('chevron-down', 15)}
    </button>
    <div class="select-options" role="listbox" aria-label="${esc(label || name)}" hidden inert>
      ${options.map(item => `<button type="button" role="option" aria-selected="${item === current}" data-select-option="${esc(item.value)}" tabindex="-1" ${item.disabled ? 'disabled' : ''}>
        <span>${esc(item.label)}</span>${icon('check', 15)}
      </button>`).join('')}
    </div>
  </div>`;
}

export function clampQuantity(value, min, max, fallback) {
  const text = String(value ?? '').trim().replace(/[０-９]/g, digit => String(digit.charCodeAt(0) - 0xFF10));
  const amount = /^\d+$/.test(text) ? Number(text) : fallback;
  return Math.max(min, Math.min(Math.max(min, max), amount));
}

export function quantityControl({ qty, min, max, action, input, disabled = false }) {
  const label = t('购买数量', 'Quantity');
  const fieldDisabled = disabled || max < min;
  const step = (delta, glyph, text, blocked) => `<button type="button" data-action="${action}" data-delta="${delta}"
    aria-label="${t(...text)}" ${fieldDisabled || blocked ? 'disabled' : ''}>${icon(glyph, 15)}</button>`;
  return `<div class="qty-control" role="group" aria-label="${label}">
    ${step(-1, 'minus', ['减少数量', 'Decrease quantity'], qty <= min)}
    <input class="qty-input" type="text" value="${qty}" data-qty-input="${input}" inputmode="numeric"
      maxlength="10" autocomplete="off" aria-label="${label}" ${fieldDisabled ? 'disabled' : ''}>
    ${step(1, 'plus', ['增加数量', 'Increase quantity'], qty >= max)}
  </div>`;
}

export async function digest(value) {
  const data = new TextEncoder().encode(String(value));
  const bytes = new Uint8Array(await crypto.subtle.digest('SHA-256', data));
  return [...bytes].map(byte => byte.toString(16).padStart(2, '0')).join('');
}

export async function copyText(value) {
  try {
    await navigator.clipboard.writeText(value);
    return true;
  } catch {
    const active = document.activeElement;
    const field = document.createElement('textarea');
    field.value = value;
    field.style.cssText = 'position:fixed;top:0;left:0;width:1px;height:1px;opacity:0;pointer-events:none';
    (active?.closest('dialog[open]') || document.body).append(field);
    try {
      field.focus({ preventScroll: true });
      field.select();
      return document.execCommand('copy');
    } catch {
      return false;
    } finally {
      field.remove();
      if (active instanceof HTMLElement && active.isConnected) active.focus({ preventScroll: true });
    }
  }
}

const copyLabels = {
  'order-number': ['复制订单号', 'Copy order number', '已复制订单号', 'Order number copied'],
  'order-email': ['复制下单邮箱', 'Copy order email', '已复制下单邮箱', 'Order email copied'],
  'delivery-code': ['复制兑换码', 'Copy redemption code', '已复制兑换码', 'Redemption code copied'],
  'delivery-info': ['复制交付信息', 'Copy delivery information', '已复制交付信息', 'Delivery information copied'],
  'gift-card-code': ['复制礼品卡卡密', 'Copy gift card code', '已复制礼品卡卡密', 'Gift card code copied'],
  'ticket-number': ['复制工单号', 'Copy ticket number', '已复制工单号', 'Ticket number copied'],
  'payment-reference': ['复制支付参考号', 'Copy payment reference', '已复制支付参考号', 'Payment reference copied'],
};

export function copyButton(value, kind) {
  const [label, labelEn, message, messageEn] = copyLabels[kind];
  const title = esc(t(label, labelEn));
  const text = esc(value).replaceAll('\r', '&#13;').replaceAll('\n', '&#10;');
  return `<button type="button" class="icon-button copy-button" data-action="copy-value" data-copy-value="${text}"
    data-copy-message="${esc(t(message, messageEn))}" aria-label="${title}" title="${title}">${icon('copy', 16)}</button>`;
}

export async function copyWithNotice(value, message) {
  const copied = await copyText(value);
  toast(copied ? message : t('复制失败，可手动选中文本复制。', 'Copy failed. Select and copy the text manually.'), copied ? 'check' : 'alert');
}

export function setFormError(form, message = '') {
  const error = form.querySelector('.form-error');
  if (!error) return;
  error.textContent = message;
  error.hidden = !message;
}

export function emptyState(symbol, heading, details = '', action = '') {
  return `<div class="empty-state">
    <span class="empty-icon">${icon(symbol, 27)}</span>
    <strong>${heading}</strong>${details ? `<p>${details}</p>` : ''}
    ${action}
  </div>`;
}
