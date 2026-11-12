/* 伴学宠物 · 班级积分乐园 */
(function () {
  'use strict';

  /* ================= 幻兽定义 ================= */
  const PETS = {
    fire:   { name: '小火狐', emoji: '🦊', glow: 'rgba(255,120,60,.5)' },
    water:  { name: '泡泡龟', emoji: '🐢', glow: 'rgba(80,170,255,.5)' },
    grass:  { name: '芽芽龙', emoji: '🐲', glow: 'rgba(110,230,140,.5)' },
    thunder:{ name: '电电鼠', emoji: '🐹', glow: 'rgba(255,220,70,.55)' },
    light:  { name: '星光鹿', emoji: '🦌', glow: 'rgba(255,240,180,.5)' }
  };

  /* ---- 50 种幻兽池：5 经典（有成长立绘）+ 45 班级专属（动态绘制，班内不重复分配）---- */
  const EXTRA_PETS = [
    ['云朵羊','🐑',210],['焰尾狮','🦁',25],['冰霜熊','🐻',190],['影风狼','🐺',260],['蹦蹦兔','🐰',320],
    ['呆呆猪','🐷',340],['阔耳蛙','🐸',130],['灵动猴','🐵',30],['憨憨象','🐘',220],['甜甜猫','🐱',45],
    ['咕咕鸡','🐤',50],['淘淘鸭','🦆',55],['蓝鲸灵','🐳',205],['海豚音','🐬',195],['章鱼侠','🐙',280],
    ['河豚炮','🐡',15],['虾兵卫','🦐',10],['螃蟹将','🦀',8],['蜜蜂侠','🐝',48],['彩蝶仙','🦋',300],
    ['瓢虫盾','🐞',0],['甲壳骑士','🪲',270],['蜗牛慢递','🐌',110],['鹰眼卫','🦅',35],['鸮学士','🦉',28],
    ['企鹅绅士','🐧',200],['火烈鸟','🦩',350],['孔雀屏','🦚',170],['隐身龙','🦎',95],['硬汉鳄','🐊',100],
    ['冲锋犀','🦏',235],['泡泡河马','🦛',250],['闪电斑马','🦓',40],['瞭望鹿鹿','🦒',65],['拳击袋鼠','🦘',18],
    ['慢悠树懒','🦥',150],['探员浣熊','🦝',20],['针甲刺猬','🦔',60],['沙漠驼','🐪',42],['夜影蝠','🦇',265],
    ['锦鲤运','🐟',5],['珊瑚鱼灵','🐠',165],['墨影鱿','🦑',290],['雪原猛犸','🦣',230],['三角龙卫','🦕',120]
  ];
  const CLASSIC_HUE = { fire: 20, water: 205, grass: 125, thunder: 52, light: 65 };
  const CREATURES = Object.keys(PETS).map((id) =>
    ({ id, name: PETS[id].name, emoji: PETS[id].emoji, hue: CLASSIC_HUE[id], classic: true, glow: PETS[id].glow })
  ).concat(EXTRA_PETS.map((x, i) =>
    ({ id: 'c' + (i + 1), name: x[0], emoji: x[1], hue: x[2], classic: false, glow: 'hsla(' + x[2] + ',85%,62%,.55)' })
  ));
  const petMeta = (id) => {
    for (const c of CREATURES) if (c.id === id) return c;
    return { id, name: '神秘幻兽', emoji: '🥚', hue: 260, classic: false, glow: 'hsla(260,85%,62%,.55)' };
  };
  const creatureCache = {};
  /* 老电脑可能没有彩色 emoji 字体（canvas 上画出来是空白），
     提前检测：emoji 画不出彩色像素时，改画名字首字，保证每只幻兽都有形象 */
  const _emojiOK = {};
  function emojiOK(ch) {
    if (_emojiOK[ch] !== undefined) return _emojiOK[ch];
    try {
      const t = document.createElement('canvas'); t.width = t.height = 48;
      const c = t.getContext('2d');
      c.font = '34px serif'; c.textAlign = 'center'; c.textBaseline = 'middle';
      c.fillText(ch, 24, 26);
      const d = c.getImageData(0, 0, 48, 48).data;
      let colorful = 0;
      for (let i = 0; i < d.length; i += 4) {
        if (d[i + 3] > 30) {
          const mx = Math.max(d[i], d[i + 1], d[i + 2]), mn = Math.min(d[i], d[i + 1], d[i + 2]);
          if (mx - mn > 40) colorful++;
        }
      }
      _emojiOK[ch] = colorful > 12;
      return _emojiOK[ch];
    } catch (e) { return true; }
  }
  function creatureURL(id, si) {
    const key = id + '-' + si;
    if (creatureCache[key]) return creatureCache[key];
    const c = petMeta(id);
    const S = 256;
    const cv = document.createElement('canvas');
    cv.width = S; cv.height = S;
    const g = cv.getContext('2d');
    const pal = { 1: [88, 75], 2: [80, 62], 3: [66, 46], 4: [46, 30] }[si];
    const grad = g.createLinearGradient(0, 0, S, S);
    grad.addColorStop(0, 'hsl(' + c.hue + ',75%,' + pal[0] + '%)');
    grad.addColorStop(1, 'hsl(' + c.hue + ',82%,' + pal[1] + '%)');
    g.fillStyle = grad;
    g.fillRect(0, 0, S, S);
    g.fillStyle = 'rgba(255,255,255,.25)';
    g.beginPath(); g.arc(S * 0.3, S * 0.28, S * 0.3, 0, 7); g.fill();
    if (si >= 3) {
      g.strokeStyle = 'rgba(255,255,255,.5)'; g.lineWidth = 5;
      g.beginPath(); g.arc(S / 2, S / 2, S * 0.40, 0, 7); g.stroke();
    }
    if (si === 4) {
      g.strokeStyle = '#ffd76e'; g.lineWidth = 8;
      g.beginPath(); g.arc(S / 2, S / 2, S * 0.44, 0, 7); g.stroke();
      g.font = '30px serif'; g.textAlign = 'center'; g.textBaseline = 'middle';
      g.fillText('✨', S * 0.82, S * 0.16); g.fillText('✨', S * 0.18, S * 0.18);
    }
    if (emojiOK(c.emoji)) {
      g.font = (118 + si * 15) + 'px serif';
      g.textAlign = 'center'; g.textBaseline = 'middle';
      g.fillText(c.emoji, S / 2, S / 2 + 8);
    } else {
      /* 兜底：用名字首字 + 白色描边，不同幻兽仍有区分（底色 hue 本就不同） */
      g.font = 'bold ' + (96 + si * 10) + 'px sans-serif';
      g.textAlign = 'center'; g.textBaseline = 'middle';
      g.lineWidth = 6; g.strokeStyle = 'rgba(255,255,255,.85)';
      g.strokeText((c.name || '兽').slice(0, 1), S / 2, S / 2 + 8);
      g.fillStyle = '#fff';
      g.fillText((c.name || '兽').slice(0, 1), S / 2, S / 2 + 8);
    }
    const url = cv.toDataURL('image/jpeg', 0.85);
    creatureCache[key] = url;
    return url;
  }
  /* 班内不重复抽取：优先未被占用的幻兽，50 种全用完才允许重复 */
  function pickType() {
    const used = {};
    (P.d && P.d.kids ? P.d.kids : []).forEach((k) => { if (k.pet && k.pet.type) used[k.pet.type] = true; });
    const pool = CREATURES.filter((c) => !used[c.id]);
    const src = pool.length ? pool : CREATURES;
    return src[Math.floor(Math.random() * src.length)].id;
  }
  const STAGES = [
    { min: 1, name: '幻兽蛋', suffix: 'egg', cls: 'egg' },
    { min: 3, name: '幼年期', suffix: 'baby', cls: '' },
    { min: 6, name: '成长期', suffix: 'growth', cls: '' },
    { min: 9, name: '成年期', suffix: 'adult', cls: '' },
    { min: 12, name: '究极体', suffix: 'ultimate', cls: '' }
  ];
  const MILESTONES = [5, 10, 15, 20];   // 这些等级解锁神秘伙伴
  const expNeed = (lv) => 20 + (lv - 1) * 12;
  const stageIdxOf = (lv) => { let i = 0; STAGES.forEach((s, j) => { if (lv >= s.min) i = j; }); return i; };
  /* 全部 50 只幻兽都有图片立绘（经典五系为原立绘，c 系为 AI 立绘 + 四阶段合成图） */
  const imgFor = (el, si) => si === 0 ? 'images/egg.jpg' : 'images/' + el + '-' + STAGES[si].suffix + '.jpg';
  const petImg = (k) => imgFor(k.skin || k.pet.type, stageIdxOf(k.pet.lv));
  const petEmoji = (k) => stageOf(k.pet.lv).emoji || petMeta(k.pet.type).emoji;

  /* v3.19 默认任务：课堂加减分清单（负数为扣分项，老师可逐个改分值/自定义） */
  const DEFAULT_TASKS = [
    { id: 'n1', name: '作业优秀', pts: 2, icon: '📕', ds: '书写认真、正确率高' },
    { id: 'n2', name: '交作业', pts: 1, icon: '📥', ds: '按时交齐' },
    { id: 'n3', name: '会背课文', pts: 2, icon: '🗣️', ds: '当堂背诵通过' },
    { id: 'n4', name: '考试良好', pts: 2, icon: '📗', ds: '85 分以上' },
    { id: 'n5', name: '考试优秀', pts: 4, icon: '🌟', ds: '95 分以上' },
    { id: 'n6', name: '满分', pts: 6, icon: '💯', ds: '100 分' },
    { id: 'n7', name: '考试进步', pts: 2, icon: '📈', ds: '比上次有提高' },
    { id: 'n8', name: '不交作业', pts: -2, icon: '📝', ds: '当天没交' },
    { id: 'n9', name: '不打卡', pts: -1, icon: '📅', ds: '忘记打卡' },
    { id: 'n10', name: '上课说话', pts: -3, icon: '🤫', ds: '影响课堂秩序' }
  ];
  /* 快捷加减分按钮：+1 +2 +4 +6 / -1 -2 -3 */
  const AMT_DEF = { pos: [1, 2, 4, 6], neg: [1, 2, 3], recent: [] };
  /* 老版本自带的 7 个默认任务名，升级时换成上面这套课堂清单 */
  const LEGACY_TASK_NAMES = ['完成作业', '阅读 30 分钟', '口算全对', '做家务', '运动半小时', '早睡早起', '练字一页'];
  const DEFAULT_REWARDS = [
    { id: 'r1', name: '看动画 20 分钟', cost: 10, icon: '📺', desc: '当天有效', on: true },
    { id: 'r2', name: '一份小零食', cost: 8, icon: '🍪', desc: '', on: true },
    { id: 'r6', name: '经验药水', cost: 16, icon: '🧪', kind: 'exp', exp: 30, desc: '幻兽 +30 经验', on: true },
    { id: 'r7', name: '成长果实', cost: 30, icon: '🍎', kind: 'exp', exp: 60, desc: '幻兽 +60 经验', on: true },
    { id: 'r3', name: '周末多玩 30 分钟', cost: 15, icon: '🎮', desc: '', on: true },
    { id: 'r4', name: '小礼物', cost: 30, icon: '🎁', desc: '老师准备的小奖品', on: true },
    { id: 'r5', name: '愿望卡（一个心愿）', cost: 50, icon: '⭐', desc: '', on: true }
  ];

  /* ================= 存储 ================= */
  const KEY = 'beast.v1';
  const GROUPS_DEFAULT = ['第一组', '第二组', '第三组', '第四组'];
  const P = {
    d: null,
    load() {
      try { this.d = JSON.parse(localStorage.getItem(KEY)); } catch (e) { this.d = null; }
      if (this.d && Array.isArray(this.d.kids)) {
        if (!this.d.cls) this.d.cls = freshCls();
        if (!Array.isArray(this.d.cls.groups) || !this.d.cls.groups.length) this.d.cls.groups = GROUPS_DEFAULT.slice();
        if (!this.d.cls.rnd) this.d.cls.rnd = { pool: [], round: 0 };
        if (Array.isArray(this.d.rewards)) this.d.rewards.forEach((r) => {
          if (r.on === undefined) r.on = true;
          if (r.desc === undefined) r.desc = '';
          if (r.kind === undefined) r.kind = 'gift';
          if (r.kind === 'exp' && !r.exp) r.exp = r.cost;
        });
        /* 老数据补上「经验道具」样本奖品（只补一次，删掉不会再长回来） */
        if (!this.d.expGiftSeeded) {
          if (Array.isArray(this.d.rewards) && this.d.rewards.length && !this.d.rewards.some((r) => r.kind === 'exp')) {
            this.d.rewards = this.d.rewards.concat(JSON.parse(JSON.stringify(DEFAULT_REWARDS.filter((r) => r.kind === 'exp'))));
          }
          this.d.expGiftSeeded = true;
        }
        /* v3.19：默认任务换成课堂加减分清单，老用户升级一次（改过名的旧任务保留） */
        if (!this.d.tasksV19) {
          if (!Array.isArray(this.d.tasks)) this.d.tasks = [];
          const kept = this.d.tasks.filter((t) => !LEGACY_TASK_NAMES.includes(t.name));
          const has = {};
          kept.forEach((t) => { has[t.name] = 1; });
          const add = DEFAULT_TASKS.filter((t) => !has[t.name]).map((t) => JSON.parse(JSON.stringify(t)));
          this.d.tasks = add.concat(kept);
          this.d.tasksV19 = true;
        }
        /* 快捷分值默认 +1/+2/+4/+6 与 -1/-2/-3；老师自己改过就保留自己的 */
        if (!this.d.amtsV19) {
          const a = this.d.amts;
          const untouched = !a || !Array.isArray(a.pos) ||
            (a.pos.join(',') === '1,2,3,5,10' && (a.neg || []).join(',') === '1,2');
          if (untouched) this.d.amts = { pos: AMT_DEF.pos.slice(), neg: AMT_DEF.neg.slice(), recent: [] };
          this.d.amtsV19 = true;
        }
        if (!Array.isArray(this.d.classes)) this.d.classes = [];
        if (this.d.clsId === undefined) this.d.clsId = null;
        this.d.kids.forEach((k) => {
          if (!k.dex) k.dex = {};
          if (!k.companions) k.companions = [];
          if (!k.milestones) k.milestones = [];
          if (!k.daily) k.daily = {};
          /* 旧数据 / 迁移中丢了幻兽的学生：自动补一只，避免头像空白 */
          if (!k.pet || !k.pet.type) {
            const t = pickType();
            k.pet = { name: petMeta(t).name, type: t, exp: 0, lv: (k.pet && k.pet.lv) || 3 };
          }
          if (k.skin === undefined) k.skin = null;
          if (k.group === undefined) k.group = '';
          if (!k.dex.egg) k.dex.egg = true;
          STAGES.forEach((s) => { if (k.pet.lv >= s.min && s.suffix !== 'egg') k.dex[k.pet.type + '-' + s.suffix] = true; });
        });
        // 迁移：单班数据 → 多班结构
        if (!this.d.classes.length && this.d.kids.length) {
          const cid = 'c' + Date.now().toString(36);
          this.d.classes.push({
            id: cid, name: this.d.cls.name || (this.d.cls.on ? '我的班级' : '家庭'),
            kids: this.d.kids, groups: this.d.cls.groups.slice(),
            period: this.d.cls.period, rnd: this.d.cls.rnd, since: this.d.cls.since || Date.now()
          });
          if (!this.d.clsId) this.d.clsId = cid;
        }
        if (!this.d.clsId && this.d.classes.length) this.d.clsId = this.d.classes[0].id;
      }
      return this.d;
    },
    /** 把当前编辑中的名单/设置写回 classes 里对应的班 */
    sync() {
      const d = this.d;
      if (!d || !d.cls || !d.cls.on || !Array.isArray(d.classes) || !d.clsId) return;
      const e = d.classes.find((c) => c.id === d.clsId);
      if (!e) return;
      e.name = d.cls.name; e.kids = d.kids; e.groups = d.cls.groups;
      e.period = d.cls.period; e.rnd = d.cls.rnd; e.since = d.cls.since;
    },
    save() { this.sync(); try { localStorage.setItem(KEY, JSON.stringify(this.d)); } catch (e) { toast('存储空间不足，请在「数据」里导出后清理'); } },
    fresh() {
      return {
        pin: null,
        cur: null,
        kids: [],
        tasks: JSON.parse(JSON.stringify(DEFAULT_TASKS)),
        rewards: JSON.parse(JSON.stringify(DEFAULT_REWARDS)),
        pending: [],
        log: [],
        doneToday: {},   // 'kidId|taskId|2026-11-10': true
        redeemHis: [],   // 已兑换记录（老师查看用）
        admin: false,
        amts: { pos: AMT_DEF.pos.slice(), neg: AMT_DEF.neg.slice(), recent: [] },
        cls: freshCls(),
        classes: [],
        clsId: null,
        redeemHis: [],
        expGiftSeeded: true
      };
    }
  };
  function freshCls() {
    return { on: false, name: '', groups: GROUPS_DEFAULT.slice(), period: 'today', rnd: { pool: [], round: 0 }, since: Date.now() };
  }

  const kid = () => P.d.kids.find((k) => k.id === P.d.cur) || P.d.kids[0];
  const todayStr = () => { const t = new Date(); return t.getFullYear() + '-' + String(t.getMonth() + 1).padStart(2, '0') + '-' + String(t.getDate()).padStart(2, '0'); };
  const stageOf = (lv) => { let s = STAGES[0]; for (const x of STAGES) if (lv >= x.min) s = x; return s; };
  const fmtTime = (ts) => { const d = new Date(ts); return String(d.getMonth() + 1).padStart(2, '0') + '-' + String(d.getDate()).padStart(2, '0') + ' ' + String(d.getHours()).padStart(2, '0') + ':' + String(d.getMinutes()).padStart(2, '0'); };

  function toast(msg) {
    const t = document.getElementById('toast');
    t.textContent = msg; t.classList.add('show');
    clearTimeout(t._tm); t._tm = setTimeout(() => t.classList.remove('show'), 1800);
  }
  function esc(s) { return String(s == null ? '' : s).replace(/[&<>"']/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c])); }
  const uid = () => Date.now().toString(36) + Math.random().toString(36).slice(2, 6);
  const $view = document.getElementById('view');

  /* ================= 核心逻辑 ================= */
  function addExp(k, n) {
    k.pet.exp += n;
    const before = k.pet.lv;
    while (k.pet.exp >= expNeed(k.pet.lv)) {
      k.pet.exp -= expNeed(k.pet.lv);
      k.pet.lv += 1;
      addLog(k, '⬆️', k.pet.name + ' 升到了 Lv.' + k.pet.lv, 0);
      if (stageIdxOf(before) !== stageIdxOf(k.pet.lv)) {
        k.dex[k.pet.type + '-' + STAGES[stageIdxOf(k.pet.lv)].suffix] = true;
        evoFX(k);
      }
    }
    if (k.pet.lv > before) {
      toast(k.pet.name + ' 升级啦！Lv.' + k.pet.lv);
      checkMilestone(k);
    }
    P.save();
  }
  function checkDex(k) {
    if (!k.dex.egg) k.dex.egg = true;
    STAGES.forEach((s) => { if (k.pet.lv >= s.min && s.suffix !== 'egg') k.dex[k.pet.type + '-' + s.suffix] = true; });
  }
  function dexCount(k) { return Object.keys(k.dex).length; }
  function checkMilestone(k) {
    const lv = k.pet.lv;
    const hit = MILESTONES.find((m) => lv >= m && !k.milestones.includes(m));
    if (!hit) return;
    k.milestones.push(hit);
    const others = Object.keys(PETS).filter((t) => t !== k.pet.type && !k.companions.some((c) => c.type === t));
    const pool = others.length ? others : Object.keys(PETS).filter((t) => t !== k.pet.type);
    if (!pool.length) return;
    const type = pool[Math.floor(Math.random() * pool.length)];
    k.companions.push({ type, from: hit });
    k.dex[type + '-baby'] = true;
    P.save();
    revealFX(k, type, hit);
  }
  function revealFX(k, type, fromLv) {
    const p = PETS[type];
    const m = document.createElement('div');
    m.className = 'evo-mask';
    m.innerHTML = '<div class="evo-box"><div class="big img"><img src="images/' + type + '-baby.jpg" alt=""></div>' +
      '<h2>神秘伙伴降临！</h2><p>Lv.' + fromLv + ' 里程碑达成 · 解锁 <b>' + p.name + '</b><br>去图鉴让它出战吧</p>' +
      '<button class="btn sm" style="margin-top:14px;background:#ffd76e;color:#5b3a00" id="rvOk">太棒了！</button></div>';
    for (let i = 0; i < 12; i++) {
      const s = document.createElement('i');
      s.className = 'sparkle';
      s.style.left = (46 + Math.random() * 8) + '%';
      s.style.top = (55 + Math.random() * 20) + '%';
      s.style.animationDelay = (Math.random() * .5) + 's';
      m.querySelector('.evo-box').appendChild(s);
    }
    document.body.appendChild(m);
    requestAnimationFrame(() => m.classList.add('in'));
    const close = () => { m.classList.remove('in'); setTimeout(() => m.remove(), 320); };
    m.querySelector('#rvOk').onclick = close;
    m.onclick = (e) => { if (e.target === m) close(); };
  }
  function grantPoints(k, n, reason) {
    k.points += n;
    if (!k.daily) k.daily = {};
    if (n > 0) { const t = todayStr(); k.daily[t] = (k.daily[t] || 0) + n; }
    addLog(k, n >= 0 ? '✨' : '🧾', reason, n);
    if (n > 0) addExp(k, n);
    P.save();
  }
  function addLog(k, em, text, delta, kind) {
    P.d.log.unshift({ ts: Date.now(), kid: k.id, kidName: k.name, em, text, d: delta, kind: kind || null });
    if (P.d.log.length > 800) P.d.log.length = 800;
  }

  /* ================= 快捷分值（可自定义） ================= */
  function amts() {
    if (!P.d.amts || typeof P.d.amts !== 'object') P.d.amts = { pos: AMT_DEF.pos.slice(), neg: AMT_DEF.neg.slice(), recent: [] };
    const a = P.d.amts;
    if (!Array.isArray(a.pos) || !a.pos.length) a.pos = AMT_DEF.pos.slice();
    if (!Array.isArray(a.neg)) a.neg = AMT_DEF.neg.slice();
    if (!Array.isArray(a.recent)) a.recent = [];
    return a;
  }
  /** 面板上要显示的分值：正分、负分，再接最近用过的自定义分值 */
  function amtNums() {
    const a = amts(), out = [];
    a.pos.forEach((n) => { const v = Math.abs(Math.trunc(n)); if (v && !out.includes(v)) out.push(v); });
    a.neg.forEach((n) => { const v = -Math.abs(Math.trunc(n)); if (v && !out.includes(v)) out.push(v); });
    a.recent.forEach((n) => { if (n && !out.includes(n)) out.push(n); });
    return out;
  }
  /** 把输入框里的 "1,2,3" 解析成分值数组，neg=true 时转成负数 */
  function parseAmts(str, neg) {
    const out = [];
    String(str).split(/[,，、\s]+/).forEach((x) => {
      const n = Math.abs(Math.trunc(Number(x)));
      if (n > 0 && n <= 999 && !out.includes(n)) out.push(n);
    });
    return out.slice(0, 6).map((n) => (neg ? -n : n));
  }
  function amtsHTML(sm) {
    return '<div class="amts' + (sm ? ' sm' : '') + '" id="amtRow">' +
      amtNums().map((n) => '<button data-n="' + n + '"' + (n < 0 ? ' class="neg"' : '') + '>' + (n > 0 ? '+' : '') + n + '</button>').join('') +
      '<button class="cus" data-cus="1">± 自定</button></div>' +
      '<div class="amt-cus" id="amtCusBox"><input id="amtCusIn" type="number" inputmode="numeric" step="1" placeholder="输入分值，如 8 或 -3">' +
      '<button id="amtCusOk">确定</button></div>';
  }
  /** 绑定分值按钮 + 自定义输入，state.amt 是当前选中分值 */
  function wireAmts(m, state, onChange) {
    const row = m.querySelector('#amtRow');
    if (!row) return;
    const box = m.querySelector('#amtCusBox');
    const inp = m.querySelector('#amtCusIn');
    const cusBtn = row.querySelector('[data-cus]');
    let cusVal = null;
    const paint = () => {
      row.querySelectorAll('button[data-n]').forEach((b) => b.classList.toggle('on', +b.dataset.n === state.amt));
      cusBtn.classList.toggle('on', cusVal !== null && cusVal === state.amt);
      cusBtn.textContent = cusVal === null ? '± 自定' : (cusVal > 0 ? '+' : '') + cusVal;
    };
    row.querySelectorAll('button[data-n]').forEach((b) => (b.onclick = () => {
      state.amt = +b.dataset.n; cusVal = null; box.classList.remove('on');
      paint(); if (onChange) onChange();
    }));
    cusBtn.onclick = () => {
      box.classList.add('on');
      inp.value = cusVal === null ? '' : cusVal;
      setTimeout(() => inp.focus(), 40);
    };
    const apply = () => {
      const raw = String(inp.value).trim();
      const n = Math.trunc(Number(raw));
      if (!raw || !isFinite(n) || !n) return toast('请输入一个非 0 的整数');
      if (Math.abs(n) > 999) return toast('分值请控制在 ±999 以内');
      state.amt = n; cusVal = n;
      const a = amts();
      a.recent = [n].concat(a.recent.filter((x) => x !== n)).slice(0, 2);
      P.save();
      box.classList.remove('on');
      paint(); if (onChange) onChange();
    };
    m.querySelector('#amtCusOk').onclick = apply;
    inp.onkeydown = (e) => { if (e.key === 'Enter') { e.preventDefault(); apply(); } };
    paint();
  }
  function evoFX(k) {
    const st = stageOf(k.pet.lv);
    const m = document.createElement('div');
    m.className = 'evo-mask';
    m.innerHTML = '<div class="evo-box"><div class="big img"><img src="' + imgFor(k.skin || k.pet.type, stageIdxOf(k.pet.lv)) + '" alt=""></div>' +
      '<h2>进化！' + st.name + '</h2><p>' + esc(k.pet.name) + ' 变得更强了</p></div>';
    for (let i = 0; i < 12; i++) {
      const s = document.createElement('i');
      s.className = 'sparkle';
      s.style.left = (46 + Math.random() * 8) + '%';
      s.style.top = (55 + Math.random() * 20) + '%';
      s.style.animationDelay = (Math.random() * .5) + 's';
      m.querySelector('.evo-box').appendChild(s);
    }
    document.body.appendChild(m);
    requestAnimationFrame(() => m.classList.add('in'));
    m.onclick = () => { m.classList.remove('in'); setTimeout(() => m.remove(), 320); };
    setTimeout(() => { if (m.parentNode) { m.classList.remove('in'); setTimeout(() => m.remove(), 320); } }, 3200);
  }

  /* ================= 通用弹层 ================= */
  function openSheet(html, onMount) {
    const m = document.createElement('div');
    m.className = 'sheet-mask';
    m.innerHTML = '<div class="sheet"><div class="sheet-bar"></div>' + html + '</div>';
    document.body.appendChild(m);
    requestAnimationFrame(() => m.classList.add('in'));
    const close = () => { m.classList.remove('in'); setTimeout(() => m.remove(), 280); };
    m.addEventListener('click', (e) => { if (e.target === m) close(); });
    if (onMount) onMount(m, close);
    return close;
  }

  /* ================= 首次引导 ================= */
  function welcome() {
    if (document.querySelector('.welcome')) return;
    const el = document.createElement('div');
    el.className = 'welcome';
    document.body.appendChild(el);
    stepRole(el);
  }

  function stepRole(el) {
    el.innerHTML =
      '<div class="big"><img src="images/egg.jpg" alt="" style="width:110px;height:110px;border-radius:26px;box-shadow:0 10px 40px rgba(255,215,110,.45)"></div>' +
      '<h2>伴学宠物</h2>' +
      '<p>表现好就加分，积分让宠物升级进化 —— 班级和家庭都能用</p>' +
      '<div class="w-role">' +
      '<button data-r="class"><b>🎒 我是老师 · 带一个班</b><span>全班名单、批量加减分、光荣榜</span></button>' +
      '<button data-r="family"><b>🏠 我是家长 · 陪孩子</b><span>1-3 个孩子的积分与宠物养成</span></button>' +
      '</div>' +
      '<div class="w-ver">版本 v3.20.4 · 如果手机上还是旧版，请完全关闭页面后重新打开<br>' +
      '<a class="w-help" href="help.html" target="_blank" rel="noopener">📖 使用说明（新手必看）</a></div>' +
      '<button class="btn ghost w-mig" id="wMig">📲 已有数据？扫码迁移过来</button>';
    el.querySelectorAll('.w-role button').forEach((b) => (b.onclick = () => {
      if (b.dataset.r === 'class') stepClass(el); else stepFamily(el);
    }));
    el.querySelector('#wMig').onclick = () => qrImportSheet(true);
  }

  function stepClass(el) {
    el.innerHTML =
      '<h2 style="margin-top:0">建一个班</h2>' +
      '<p>先填班名，再把学生名单粘进来（可以不填，之后随时导入）</p>' +
      '<div class="field"><label>班级名称</label><input id="wcName" maxlength="14" placeholder="比如：三年二班" value="三年二班"></div>' +
      '<div class="field"><label>学生名单（一行一个，可选分组）</label>' +
      '<textarea id="wcList" rows="5" placeholder="张小明 第一组&#10;李小红 第一组&#10;王小刚 第二组"></textarea></div>' +
      '<div class="w-tip">提示：40 人以内粘贴进来最方便，重名会自动跳过</div>' +
      '<button class="btn" id="wcGo">开启班级模式 🎉</button>' +
      '<button class="w-back" id="wcBack">‹ 返回</button>';
    el.querySelector('#wcBack').onclick = () => stepRole(el);
    el.querySelector('#wcGo').onclick = () => {
      const name = el.querySelector('#wcName').value.trim() || '我的班级';
      const txt = el.querySelector('#wcList').value;
      const r = createClass(name, txt);
      if (!P.d.kids.length) { P.d.kids = [newStu('小明', '')]; P.d.cur = P.d.kids[0].id; P.save(); }
      P.d.admin = true;
      P.save();
      el.remove();
      location.hash = '#/class';
      render();
      toast('班级已创建' + (r.added ? '，导入 ' + r.added + ' 人' : '') + '，可在「老师」里加更多班');
    };
  }

  function stepFamily(el) {
    let type = 'fire';
    el.innerHTML =
      '<h2 style="margin-top:0">开始养成</h2>' +
      '<p>孩子做任务赚积分，幻兽跟着升级进化；积分还能在商店兑换奖励。</p>' +
      '<div class="field"><label>孩子的名字 / 称呼</label><input id="wName" placeholder="比如：小明、姐姐、哥哥" maxlength="8"></div>' +
      '<div style="margin-top:16px;font-size:13px;font-weight:650;opacity:.9">选一只初始幻兽蛋</div>' +
      '<div class="pet-picks">' + Object.entries(PETS).map(([k, p]) =>
        '<button data-t="' + k + '" class="' + (k === 'fire' ? 'on' : '') + '">' + p.emoji + '</button>').join('') + '</div>' +
      '<button class="btn" id="wGo">开始养成 🎉</button>' +
      '<button class="w-back" id="wcBack">‹ 返回</button>';
    el.querySelector('#wcBack').onclick = () => stepRole(el);
    el.querySelectorAll('.pet-picks button').forEach((b) => (b.onclick = () => {
      el.querySelectorAll('.pet-picks button').forEach((x) => x.classList.remove('on'));
      b.classList.add('on'); type = b.dataset.t;
    }));
    el.querySelector('#wGo').onclick = () => {
      const name = el.querySelector('#wName').value.trim() || '宝贝';
      const k = { id: uid(), name, points: 0, daily: {}, pet: { name: PETS[type].name, type, exp: 0, lv: 1 }, dex: { egg: true }, companions: [], milestones: [], skin: null };
      P.d.kids.push(k);
      P.d.cur = k.id;
      P.d.log.unshift({ ts: Date.now(), kid: k.id, kidName: name, em: '🥚', text: name + ' 的幻兽之旅开始了', d: 0 });
      P.save();
      el.remove();
      render();
      toast('🥚 ' + PETS[type].name + ' 破壳迎新，做任务让它快快成长吧');
    };
  }

  /* ================= 页面：幻兽（首页） ================= */
  function viewHome() {
    const k = kid();
    if (!k) return;
    const st = stageOf(k.pet.lv);
    const need = expNeed(k.pet.lv);
    const pct = Math.min(100, Math.round((k.pet.exp / need) * 100));
    const weekPts = ptsSince(k, weekStart());
    const third = isClass() ? rankOf(k.id, 'total') : st.min;
    const thirdLbl = isClass() ? '全班排名' : '进化等级';
    $view.innerHTML = '<div class="page home-page">' +
      kidsRow() +
      '<div class="stage" style="--pet-glow:' + petMeta(k.pet.type).glow + '">' +
      '<div class="stars"></div>' +
      '<div class="lv-badge">Lv.' + k.pet.lv + '</div>' +
      '<div class="pet-zone"><div class="aura"><div class="pet ' + st.cls + '" id="petTap"><img src="' + petImg(k) + '" alt=""></div></div></div>' +
      '<div class="pet-name">' + esc(displayName(k)) + '</div>' +
      '<div class="pet-stage">' + st.name + ' · ' + petMeta(k.skin || k.pet.type).name + '</div>' +
      '<div class="exp-row"><div class="exp-bar"><i style="width:' + pct + '%"></i></div>' +
      '<div class="exp-num">' + k.pet.exp + '/' + need + ' EXP</div></div>' +
      '<div class="stats"><div><b>' + k.points + '</b><span>积分</span></div>' +
      '<div><b>' + weekPts + '</b><span>本周获得</span></div>' +
      '<div><b>' + third + '</b><span>' + thirdLbl + '</span></div></div>' +
      '</div>' +
      '<div class="pet-actions">' +
      '<button class="act-btn" id="actPet"><span class="em">🤚</span>摸摸头<small>免费 · 开心</small></button>' +
      '<button class="act-btn" id="actFeed"><span class="em">🍖</span>喂食<small>2 积分 +2EXP</small></button>' +
      '<button class="act-btn" id="actPlay"><span class="em">🎈</span>陪玩<small>3 积分 +3EXP</small></button>' +
      '</div>' +
      (isClass() ? '<div class="quick-links">' +
        '<a href="#/dex">📖 我的图鉴</a><a href="#/tasks">✅ 今日任务</a><a href="#/board">🏆 光荣榜</a><a href="#/lucky">🎡 幸运抽奖</a></div>'
        : '<button class="cls-cta" id="homeClsCta"><span>🏫</span><div><b>我是老师？开启班级模式</b><small>全班加减分 · 光荣榜 · 随机点名</small></div><i>›</i></button>') +
      '<div class="section-h"><h2>最近动态</h2><a class="more" href="#/log">全部记录</a></div>' +
      '<div id="recentLogs">' + recentLogsHTML(k) + '</div>' +
      '</div>';

    const cta = document.getElementById('homeClsCta');
    if (cta) cta.onclick = () => newClassSheet();
    document.getElementById('petTap').onclick = () => {
      const p = document.querySelector('.pet');
      p.style.transform = 'scale(1.15)';
      setTimeout(() => (p.style.transform = ''), 220);
      toast(k.pet.name + ' 很开心 ✨');
    };
    document.getElementById('actPet').onclick = () => toast(k.pet.name + ' 眯起眼睛享受 🥰');
    document.getElementById('actFeed').onclick = () => spendAct(k, 2, 2, '🍖 喂了一顿大餐', '吃饱啦！');
    document.getElementById('actPlay').onclick = () => spendAct(k, 3, 3, '🎈 陪它玩了一场', '玩得超开心！');
  }
  function spendAct(k, cost, exp, logText, msg) {
    if (k.points < cost) { toast('积分不够啦，先去完成任务赚积分吧'); return; }
    k.points -= cost;
    addLog(k, cost === 2 ? '🍖' : '🎈', logText, -cost);
    addExp(k, exp);
    P.save();
    toast(k.pet.name + ' ' + msg + ' +' + exp + 'EXP');
    viewHome();
  }
  function kidsRow() {
    if (isClass()) {
      const k = kid();
      if (!k) return '';
      return '<div class="me-bar">' +
        '<span class="av"><img src="' + petImg(k) + '" alt=""></span>' +
        '<div class="mb-t"><b>' + esc(k.name) + '</b><small>' + (k.group ? esc(k.group) + ' · ' : '') + '全班第 ' + rankOf(k.id, 'total') + ' 名 · ' + k.points + ' 分</small></div>' +
        '<button id="switchStu">换人</button></div>';
    }
    return '<div class="kids-row">' +
      P.d.kids.map((k) =>
        '<div class="kid-chip' + (k.id === P.d.cur ? ' on' : '') + '" data-k="' + k.id + '">' +
        '<span class="av"><img src="' + petImg(k) + '" alt=""></span>' + esc(displayName(k)) +
        '<span class="pts">' + k.points + '分</span></div>').join('') +
      (P.d.admin ? '<div class="kid-chip" id="addKid">＋ 添加</div>' : '') +
      '</div>';
  }
  function openStuPicker() {
    openSheet('<div class="sheet-h">选择学生</div><div class="tiny">点一下切换到该同学</div>' +
      '<div class="stu-grid sm" id="spGrid" style="margin-top:12px">' + P.d.kids.map((k) =>
        '<div class="stu' + (k.id === P.d.cur ? ' sel' : '') + '" data-k="' + k.id + '">' +
        '<div class="av"><img src="' + petImg(k) + '" alt="" loading="lazy"></div>' +
        '<div class="nm">' + esc(k.name) + '</div><div class="pt">' + k.points + '</div></div>').join('') + '</div>',
      (m, close) => {
        m.querySelectorAll('.stu').forEach((c) => (c.onclick = () => { P.d.cur = c.dataset.k; P.save(); close(); render(); }));
      });
  }
  function displayName(k) {
    return k.skin ? petMeta(k.skin).name : k.pet.name;
  }
  function recentLogsHTML(k) {
    const items = P.d.log.filter((l) => l.kid === k.id).slice(0, 4);
    if (!items.length) return '<div class="card empty">还没有记录，去做个任务吧</div>';
    return items.map(logItemHTML).join('');
  }
  function logItemHTML(l) {
    return '<div class="log-item"><span class="em">' + l.em + '</span>' +
      '<div class="body"><div class="lt">' + esc(l.text) + '</div><div class="lm">' + esc(l.kidName) + ' · ' + fmtTime(l.ts) + '</div></div>' +
      (l.d ? '<div class="ld ' + (l.d > 0 ? 'plus' : 'minus') + '">' + (l.d > 0 ? '+' : '') + l.d + '</div>' : '') +
      '</div>';
  }

  function bindKidsRow() {
    document.querySelectorAll('.kid-chip[data-k]').forEach((c) => (c.onclick = () => {
      P.d.cur = c.dataset.k; P.save(); render();
    }));
    const ak = document.getElementById('addKid');
    if (ak) ak.onclick = addKidSheet;
    const sw = document.getElementById('switchStu');
    if (sw) sw.onclick = openStuPicker;
  }

  function addKidSheet() {
    const gs = groupsOf();
    openSheet(
      '<div class="sheet-h">添加' + (isClass() ? '学生' : '孩子') + '</div><div class="tiny">每' + (isClass() ? '名学生' : '个孩子') + '有独立的积分、幻兽和记录</div>' +
      '<div class="field"><label>名字 / 称呼</label><input id="nkName" maxlength="8" placeholder="比如：妹妹"></div>' +
      (isClass() && gs.length ? '<div class="field"><label>小组（可选）</label><select id="nkGroup"><option value="">不分组</option>' +
        gs.map((g) => '<option value="' + esc(g) + '">' + esc(g) + '</option>').join('') + '</select></div>' : '') +
      '<div style="margin-top:14px"><button class="btn" id="nkGo">创建</button></div>',
      (m, close) => {
        m.querySelector('#nkGo').onclick = () => {
          const name = m.querySelector('#nkName').value.trim();
          if (!name) return toast('先填个名字吧');
          const gsel = m.querySelector('#nkGroup');
          const k = newStu(name, '', 1);
          P.d.kids.push(k);
          P.d.cur = k.id;
          P.save(); close(); render();
          toast(name + ' 加入了，抽到了 ' + petMeta(k.pet.type).name + ' ' + petMeta(k.pet.type).emoji);
        };
      });
  }

  /* ================= 页面：任务 ================= */
  function viewTasks() {
    const k = kid();
    const today = todayStr();
    $view.innerHTML = '<div class="page">' +
      kidsRow() +
      '<div class="section-h"><h2>今日任务</h2><span class="sub">点击提交，等' + ROLE() + '确认后积分到账</span>' +
      (P.d.admin ? '<a class="more" id="taskMg">管理任务 ›</a>' : '') + '</div>' +
      '<div id="taskList" class="col-list">' +
      (P.d.tasks.length ? P.d.tasks.map((t) => {
        const done = P.d.doneToday[k.id + '|' + t.id + '|' + today];
        const neg = t.pts < 0;
        return '<div class="entry' + (done ? ' done' : '') + (neg ? ' neg' : '') + '" data-t="' + t.id + '">' +
          (done ? '<div class="tick"></div>' : '') +
          '<div class="em">' + t.icon + '</div>' +
          '<div class="body"><div class="nm">' + esc(t.name) + (neg ? ' <span class="tag-off">扣分</span>' : '') + '</div><div class="ds">' + esc(t.ds || ' ') + '</div></div>' +
          '<div class="val">' + (t.pts > 0 ? '+' : '') + t.pts + '</div><div class="chev">' + (done ? '✓ 已提交' : '打卡 ›') + '</div></div>';
      }).join('') : '<div class="card empty">还没有任务' + (P.d.admin ? '，点右上「管理任务」添加' : '，请' + ROLE() + '在右上角「' + ROLE() + '」里添加') + '</div>') +
      '</div></div>';
    bindKidsRow();
    const tmg = document.getElementById('taskMg');
    if (tmg) tmg.onclick = () => manageSheet('task');
    document.querySelectorAll('#taskList .entry').forEach((e) => (e.onclick = () => submitTask(e.dataset.t)));
  }
  function submitTask(tid) {
    const k = kid();
    const t = P.d.tasks.find((x) => x.id === tid);
    const key = k.id + '|' + tid + '|' + todayStr();
    if (P.d.doneToday[key]) return toast('这个任务今天已经提交过了');
    P.d.doneToday[key] = true;
    P.d.pending.push({ id: uid(), kidId: k.id, kind: 'task', refId: tid, ts: Date.now() });
    P.save();
    toast('已提交「' + t.name + '」，等' + ROLE() + '确认 🙋');
    viewTasks();
  }

  /* ================= 页面：商店 ================= */
  function viewShop() {
    const k = kid();
    const all = P.d.rewards;
    const list = P.d.admin ? all : all.filter((r) => r.on !== false);
    $view.innerHTML = '<div class="page">' +
      kidsRow() +
      '<div class="section-h"><h2>奖励商店</h2><span class="sub">当前 ' + k.points + ' 积分' + (P.d.admin ? '' : ' · 兑换后由' + ROLE() + '确认') + '</span>' +
      (P.d.admin ? '<a class="more" id="shopMg">管理礼品 ›</a>' : '') + '</div>' +
      '<a class="lot-banner" href="#/lucky"><span class="lb-em">🎡</span>' +
      '<span class="lb-t"><b>幸运大转盘</b><small>按奖池标价抽 · 含经验道具与礼品</small></span><i>去抽奖 ›</i></a>' +
      '<div id="shopList" class="col-list">' +
      (list.length ? list.map((r) => {
        const ok = k.points >= r.cost;
        const off = r.on === false;
        const isExp = r.kind === 'exp';
        return '<div class="entry gold' + (isExp ? ' exp' : '') + (off ? ' off' : '') + '" data-r="' + r.id + '">' +
          '<div class="em">' + r.icon + '</div>' +
          '<div class="body"><div class="nm">' + esc(r.name) + (isExp ? ' <span class="tag-exp">+' + (r.exp || r.cost) + ' 经验</span>' : '') + (off ? ' <span class="tag-off">已下架</span>' : '') + '</div>' +
          '<div class="ds">' + r.cost + ' 积分 · ' + (isExp ? '兑换后直接加经验' : (r.desc ? esc(r.desc) : '找老师领取')) + '</div></div>' +
          '<div class="val">-' + r.cost + '</div><div class="chev">' + (off ? '下架中' : ok ? '兑换 ›' : '积分不足') + '</div></div>';
      }).join('') : '<div class="card empty">商店还是空的，' + (P.d.admin ? '点右上「管理礼品」添加' : '请' + ROLE() + '添加礼品') + '</div>') +
      '</div>' +
      (P.d.admin ? '<div class="tiny" style="text-align:center;margin-top:2px">只有老师能看到「管理礼品」，学生端只显示上架的礼品</div>' : '') +
      '</div>';
    bindKidsRow();
    const sm = document.getElementById('shopMg');
    if (sm) sm.onclick = giftManageSheet;
    document.querySelectorAll('#shopList .entry').forEach((e) => (e.onclick = () => redeem(e.dataset.r)));
  }
  function redeem(rid) {
    const k = kid();
    const r = P.d.rewards.find((x) => x.id === rid);
    if (!r) return;
    if (r.on === false) return toast('这个礼品已下架');
    if (k.points < r.cost) { toast('积分还不够，还差 ' + (r.cost - k.points) + ' 分'); return; }
    openSheet(
      '<div class="sheet-h">兑换确认</div>' +
      '<div class="card" style="margin-top:10px"><div style="font-size:34px;text-align:center">' + r.icon + '</div>' +
      '<div style="text-align:center;font-weight:700;font-size:16px;margin-top:6px">' + esc(r.name) + '</div>' +
      '<div class="tiny" style="text-align:center;margin-top:4px">' +
      (r.kind === 'exp'
        ? '花费 ' + r.cost + ' 积分 · 立即给「' + esc(k.pet.name) + '」+' + (r.exp || r.cost) + ' 经验'
        : '花费 ' + r.cost + ' 积分 · 提交后由' + ROLE() + '确认') + '</div></div>' +
      '<div style="margin-top:14px"><button class="btn gold" id="rGo">' + (r.kind === 'exp' ? '立即兑换并使用 🧪' : '提交兑换请求 🎁') + '</button></div>',
      (m, close) => {
        m.querySelector('#rGo').onclick = () => {
          if (r.kind === 'exp') {
            const n = r.exp || r.cost;
            k.points -= r.cost;
            addLog(k, r.icon || '🧪', '兑换「' + r.name + '」', -r.cost);
            addRedeemHis(k, r, r.cost, 'exp');
            P.save();
            addExp(k, n);
            close();
            toast('「' + r.name + '」已使用，' + k.pet.name + ' +' + n + ' 经验');
            render();
            return;
          }
          P.d.pending.push({ id: uid(), kidId: k.id, kind: 'reward', refId: rid, ts: Date.now() });
          P.save(); close();
          toast('兑换请求已提交，去找' + ROLE() + '确认吧');
          render();
        };
      });
  }

  /* ================= 页面：幸运抽奖（奖池 = 商店礼品） ================= */
  /* 奖品直接从「奖励商店」里上架的礼品中抽，票价按礼品定价动态计算：
     先算中奖时的期望价值（奖池定价的调和平均），再留 30% 空奖、按 65% 返还率反推票价。
     老师改礼品定价，抽奖价格自动跟着变，长期也不会积分通胀。 */
  const LOT_MAX = 7;          // 转盘最多放 7 件礼品（再加 1 个空奖扇区）
  const LOT_EMPTY_P = 0.3;    // 空奖概率
  const LOT_RETURN = 0.65;    // 长期返还率
  const LOT_HUES = [268, 200, 152, 100, 42, 20, 320];
  /* ---- 通用转盘：扇区从 12 点顺时针、指针固定在正上方 ---- */
  const wheelRot = {};
  function wheelHTML(id, items, hub) {
    const n = items.length, seg = 360 / n;
    /* 用 from 把渐变起点整体转过半个扇区：0 号扇区中心正对顶部指针。
       不能把色标写成负角度（conic-gradient 会把负位置钳到 0，
       导致第一个扇区变窄、最后一个被补色撑宽），from 角取正值等价。 */
    const from = 360 - seg / 2;
    const stops = items.map((it, i) =>
      'hsl(' + it.hue + ',68%,' + (i % 2 ? 50 : 58) + '%) ' + (i * seg) + 'deg ' + ((i + 1) * seg) + 'deg').join(',');
    /* 标签用三角函数按百分比定位，不做旋转变换：文字永远正立，
       也避开部分手机 WebView 对「rotate + translate + rotate」链式变换渲染错乱的问题 */
    const R = n >= 8 ? 32 : 34;
    const labels = items.map((it, i) => {
      const a = i * seg * Math.PI / 180;   // 与扇区中心严格同角度（扇区中心 = i*seg）
      const x = (50 + R * Math.sin(a)).toFixed(2);
      const y = (50 - R * Math.cos(a)).toFixed(2);
      return '<div class="wheel-lb" style="left:' + x + '%;top:' + y + '%">' +
        '<b>' + (it.icon || '') + '</b><span>' + esc(it.label) + '</span></div>';
    }).join('');
    return '<div class="wheel-wrap"><div class="wheel">' +
      '<div class="wheel-face" id="' + id + 'F" style="background:conic-gradient(from ' + from + 'deg,' + stops + ');transform:rotate(' + (wheelRot[id] || 0) + 'deg)">' + labels + '</div>' +
      '<div class="wheel-hub">' + (hub || '🎯') + '</div><div class="wheel-pin"></div></div></div>';
  }
  function spinWheel(id, n, idx, cb) {
    const face = document.getElementById(id + 'F');
    if (!face) return;
    const seg = 360 / n;
    /* 扇区 idx 的中心在 idx*seg 处，转到 12 点（0deg）即停在该扇区正中 */
    const from = wheelRot[id] || 0;
    let to = Math.floor(from / 360) * 360 + (((-idx * seg) % 360) + 360) % 360;
    while (to - from < 360 * 4) to += 360;
    wheelRot[id] = to;
    face.style.transition = 'transform 4.4s cubic-bezier(.13,.72,.12,1)';
    face.style.transform = 'rotate(' + to + 'deg)';
    setTimeout(cb, 4550);
  }

  const shuffleArr = (a) => { const x = a.slice(); for (let i = x.length - 1; i > 0; i--) { const j = Math.floor(Math.random() * (i + 1)); const t = x[i]; x[i] = x[j]; x[j] = t; } return x; };
  const lotPool = () => (P.d.rewards || []).filter((r) => r.on !== false && r.cost > 0);
  const lotOnWheel = () => lotPool().slice(0, LOT_MAX);
  const lotSumInv = (pool) => pool.reduce((s, r) => s + 1 / r.cost, 0);
  const lotAvg = (pool) => pool.reduce((s, r) => s + r.cost, 0) / pool.length;
  /** 单次票价：由奖池定价与返还率反推 */
  function lotAutoPrice() {
    const pool = lotOnWheel();
    if (!pool.length) return 0;
    const cond = pool.length / lotSumInv(pool);    // 中奖时的期望价值（调和平均）
    return Math.max(5, Math.min(200, Math.round((1 - LOT_EMPTY_P) * cond / LOT_RETURN)));
  }
  function lotPrice() {
    if (!lotOnWheel().length) return 0;
    const ov = Math.round(Number(P.d.lotPriceOv) || 0);
    return ov > 0 ? Math.min(999, ov) : lotAutoPrice();   // 老师自定义票价优先
  }
  /** 长期返还率（票价被老师改过就按实际票价算） */
  function lotReturn() {
    const pool = lotOnWheel(), price = lotPrice();
    if (!pool.length || !price) return 0;
    return (1 - LOT_EMPTY_P) * (pool.length / lotSumInv(pool)) / price;
  }
  /** 某个礼品的实际中奖概率（越贵越难中） */
  function lotProb(r) {
    const pool = lotOnWheel();
    if (!pool.length) return 0;
    return (1 - LOT_EMPTY_P) * (1 / r.cost) / lotSumInv(pool);
  }
  /** 返回奖池下标，-1 表示空奖 */
  function lotPick() {
    const pool = lotOnWheel();
    if (!pool.length || Math.random() < LOT_EMPTY_P) return -1;
    const S = lotSumInv(pool);
    let x = Math.random() * S;
    for (let i = 0; i < pool.length; i++) { x -= 1 / pool[i].cost; if (x < 0) return i; }
    return pool.length - 1;
  }
  const pctStr = (p) => (p * 100 >= 10 ? Math.round(p * 100) + '%' : (p * 100).toFixed(1) + '%');
  const shortName = (s) => (s.length > 7 ? s.slice(0, 7) + '…' : s);

  function lotteryLogHTML(k) {
    const rows = P.d.log.filter((l) => l.kid === k.id && l.kind === 'lottery').slice(0, 6);
    if (!rows.length) return '<div class="card empty">还没抽过，来试试手气？</div>';
    return rows.map((l) =>
      '<div class="lot-log"><span class="ll-e">' + l.em + '</span><span class="ll-t">' + esc(l.text.replace('幸运抽奖 · ', '')) + '</span>' +
      '<span class="ll-d' + (l.d > 0 ? ' up' : '') + '">' + (l.d > 0 ? '+' + l.d : '') + '</span></div>').join('');
  }

  let lotSpinning = false;
  function viewLucky() {
    const k = kid();
    if (!k) return;
    const pool = lotOnWheel();
    const allCnt = lotPool().length;
    const price = lotPrice();
    const lg = P.d.lottery || (P.d.lottery = { n: 0 });
    const today = lg.day === todayStr() ? (lg.today || 0) : 0;
    const enough = price > 0 && k.points >= price;
    const items = pool.map((r, i) => ({
      label: r.kind === 'exp' ? '+' + (r.exp || r.cost) + '经验' : shortName(r.name),
      icon: r.icon || '🎁', hue: LOT_HUES[i % LOT_HUES.length]
    })).concat([{ label: '谢谢参与', icon: '😅', hue: 218 }]);

    const left = '<div class="lucky-hero">' +
      '<div class="lh-l"><b>幸运大转盘</b><small>' + (price ? '抽一次 ' + price + ' 积分 · 抽实物或幻兽经验' : '奖池还没上架礼品') + '</small></div>' +
      '<div class="lh-r"><b id="lkPts">' + k.points + '</b><small>我的积分</small></div></div>' +
      (!pool.length
        ? '<div class="card empty" style="padding:26px 16px">老师还没上架礼品，暂时不能抽奖<br><span class="tiny">到「商店 → 管理礼品」加几个奖品就能开抽</span></div>'
        : wheelHTML('luck', items, '🎡') +
          '<button class="btn gold lk-spin" id="spinBtn"' + (enough ? '' : ' disabled') + '>' +
          (enough ? '🎡 花 ' + price + ' 积分抽一次' : '积分不足，还差 ' + (price - k.points) + ' 分') + '</button>' +
          '<div class="tiny" style="text-align:center">今日已抽 <b id="lkN">' + today + '</b> 次 · 累计 ' + (lg.n || 0) + ' 次</div>');

    const right = pool.length
      ? '<div class="section-h"><h2>奖池与概率</h2><span class="sub">共 ' + pool.length + ' 件</span>' +
        (P.d.admin ? '<a class="more" id="lkMg">管理奖池 ›</a>' : '') + '</div>' +
        '<div class="odds">' + pool.map((r, i) =>
          '<div class="od-row"><span class="od-ic" style="background:hsl(' + LOT_HUES[i % LOT_HUES.length] + ',85%,92%)">' + (r.icon || '🎁') + '</span>' +
          '<span class="od-nm">' + esc(r.name) + '</span><span class="od-p">' + pctStr(lotProb(r)) + '</span>' +
          '<span class="od-v">' + (r.kind === 'exp' ? '+' + (r.exp || r.cost) + ' 经验' : r.cost + ' 分') + '</span></div>').join('') +
        '<div class="od-row"><span class="od-ic" style="background:hsl(218,20%,92%)">😅</span>' +
        '<span class="od-nm">谢谢参与</span><span class="od-p">' + Math.round(LOT_EMPTY_P * 100) + '%</span><span class="od-v">无</span></div>' +
        '</div>' +
        '<div class="tiny">奖池平均定价 ' + lotAvg(pool).toFixed(1) + ' 分，抽一次 ' + price + ' 分，长期返还约 ' + Math.round(lotReturn() * 100) +
        '%' + (P.d.lotPriceOv > 0 ? '（票价由老师设定）' : '') +
        '。抽中实物礼品会进「待确认」找老师领取；<b>抽中经验道具直接加给幻兽</b>，无需确认。' +
        (allCnt > pool.length ? '<br>商店共 ' + allCnt + ' 件礼品，转盘只放前 ' + pool.length + ' 件，可在「管理礼品」里调整顺序。' : '') +
        '</div>'
      : '';

    $view.innerHTML = '<div class="page lucky-page">' +
      kidsRow() +
      '<div class="lk-left">' + left + '</div>' +
      '<div class="lk-right">' + right +
      '<div class="section-h"><h2>我的抽奖记录</h2></div>' +
      '<div id="lkLog">' + lotteryLogHTML(k) + '</div>' +
      '</div></div>';
    bindKidsRow();
    const btn = document.getElementById('spinBtn');
    if (btn) btn.onclick = () => doLottery(k);
    const mg = document.getElementById('lkMg');
    if (mg) mg.onclick = () => giftManageSheet();
  }
  function doLottery(k) {
    if (lotSpinning) return;
    const price = lotPrice();
    const pool = lotOnWheel();
    if (!price) return toast('奖池还是空的，请老师先上架礼品');
    if (k.points < price) return toast('积分不够，还差 ' + (price - k.points) + ' 分');
    lotSpinning = true;
    const btn = document.getElementById('spinBtn');
    if (btn) { btn.disabled = true; btn.textContent = '转动中…'; }
    k.points -= price;
    addLog(k, '🎟️', '幸运抽奖 · 门票', -price, 'lottery');
    P.save();
    const pts = document.getElementById('lkPts');
    if (pts) pts.textContent = k.points;
    const idx = lotPick();
    spinWheel('luck', pool.length + 1, idx < 0 ? pool.length : idx, () => { lotSpinning = false; lotResult(k, idx); });
  }
  function lotResult(k, idx) {
    const pool = lotOnWheel();
    const r = idx >= 0 ? pool[idx] : null;
    const isExp = !!(r && r.kind === 'exp');
    let expGain = 0, lvBefore = k.pet.lv;
    if (r && isExp) {
      /* 经验道具：抽到即生效，直接喂给幻兽，不进待确认 */
      expGain = r.exp || r.cost;
      addLog(k, r.icon || '🧪', '抽奖获得「' + r.name + '」· +' + expGain + ' 经验', 0, 'lottery');
      addExp(k, expGain);
    } else if (r) {
      P.d.pending.push({ id: uid(), kidId: k.id, kind: 'reward', refId: r.id, ts: Date.now(), via: 'lottery' });
      addLog(k, r.icon || '🎁', '抽奖获得「' + r.name + '」', 0, 'lottery');
    }
    const lg = P.d.lottery || (P.d.lottery = { n: 0 });
    lg.n = (lg.n || 0) + 1;
    if (lg.day !== todayStr()) { lg.day = todayStr(); lg.today = 0; }
    lg.today = (lg.today || 0) + 1;
    P.save();

    const pts = document.getElementById('lkPts');
    if (pts) pts.textContent = k.points;
    const n = document.getElementById('lkN');
    if (n) n.textContent = lg.today;
    const log = document.getElementById('lkLog');
    if (log) log.innerHTML = lotteryLogHTML(k);
    const btn = document.getElementById('spinBtn');
    if (btn) {
      const price = lotPrice();
      const poor = k.points < price;
      btn.disabled = poor;
      btn.textContent = poor ? '积分不足，还差 ' + (price - k.points) + ' 分' : '🎡 花 ' + price + ' 积分抽一次';
    }

    const m = document.createElement('div');
    m.className = 'evo-mask';
    m.innerHTML = '<div class="evo-box lot' + (r ? ' big' : '') + '">' +
      '<div class="lot-ic">' + (r ? (r.icon || '🎁') : '⭐') + '</div>' +
      '<h2>' + (r ? '抽中啦！' : '差一点点') + '</h2>' +
      '<p>' + (!r
        ? '谢谢参与，下次说不定就中了'
        : isExp
          ? '「' + esc(r.name) + '」<br><b>+' + expGain + ' 经验</b> 已喂给 ' + esc(k.pet.name) +
            '（Lv.' + k.pet.lv + '）' + (k.pet.lv > lvBefore ? '<br>还升了 ' + (k.pet.lv - lvBefore) + ' 级！' : '')
          : '「' + esc(r.name) + '」价值 ' + r.cost + ' 分<br>已放进「待确认」，找老师领取') + '</p>' +
      '<button class="btn sm" id="lotOk" style="margin-top:14px' + (r ? ';background:#ffd76e;color:#5b3a00' : '') + '">' + (r ? '收下' : '知道了') + '</button></div>';
    for (let i = 0; i < (r ? 14 : 6); i++) {
      const s = document.createElement('i');
      s.className = 'sparkle';
      s.style.left = (45 + Math.random() * 10) + '%';
      s.style.top = (52 + Math.random() * 16) + '%';
      s.style.animationDelay = (Math.random() * .5) + 's';
      m.querySelector('.evo-box').appendChild(s);
    }
    document.body.appendChild(m);
    requestAnimationFrame(() => m.classList.add('in'));
    const close = () => { m.classList.remove('in'); setTimeout(() => m.remove(), 300); };
    m.querySelector('#lotOk').onclick = close;
    m.onclick = (e) => { if (e.target === m) close(); };
  }

  /* ================= 页面：记录 ================= */
  function viewLog() {
    $view.innerHTML = '<div class="page">' +
      kidsRow() +
      '<div class="section-h"><h2>积分记录</h2><span class="sub">最近 300 条</span></div>' +
      (P.d.log.length ? P.d.log.filter((l) => l.kid === P.d.cur).map(logItemHTML).join('') : '<div class="card empty">还没有记录</div>') +
      '</div>';
    bindKidsRow();
  }

  /* ================= 页面：图鉴 ================= */
  function viewDex() {
    const k = kid();
    const els = Object.keys(PETS);
    const total = 1 + els.length * 4;   // 蛋 + 20
    const got = dexCount(k);
    const pct = Math.round((got / total) * 100);
    const card = (key, img, name, sub, unlocked, extra) =>
      '<div class="dex-card' + (unlocked ? '' : ' locked') + '" ' + (extra || '') + '>' +
      '<div class="dx-img">' + (unlocked ? '<img src="' + img + '" alt="">' : '<span class="lk">🔒</span>') + '</div>' +
      '<div class="dx-nm">' + (unlocked ? name : '？？？') + '</div>' +
      '<div class="dx-sub">' + sub + '</div></div>';

    let html = '<div class="page">' + kidsRow() +
      '<div class="section-h"><h2>幻兽图鉴</h2><span class="sub">' + got + '/' + total + ' · ' + pct + '%</span></div>' +
      '<div class="exp-bar dark" style="border-radius:99px"><i style="width:' + pct + '%"></i></div>' +
      '<div class="dex-grid" style="margin-top:12px">' +
      card('egg', 'images/egg.jpg', '神秘幻兽蛋', '旅程起点', !!k.dex.egg) +
      els.map((el) => STAGES.slice(1).map((s) => {
        const key = el + '-' + s.suffix;
        const un = !!k.dex[key];
        const companion = k.companions.some((c) => c.type === el) && s.suffix === 'baby';
        const extra = un && companion ? 'data-skin="' + el + '" data-tip="tap"' : '';
        return card(key, 'images/' + key + '.jpg', PETS[el].name, s.name + (companion ? ' · 伙伴' : ''), un, extra);
      }).join('')).join('') +
      '</div>' +
      '<div class="tiny" style="margin:4px 2px">解锁条件：幻兽进化填充本系形态；达到 Lv.5/10/15/20 会降临神秘伙伴，点伙伴卡片可让牠出战。</div>' +
      '</div>';
    $view.innerHTML = html;
    bindKidsRow();
    document.querySelectorAll('.dex-card[data-skin]').forEach((c) => (c.onclick = () => {
      const el = c.dataset.skin;
      k.skin = (k.skin === el) ? null : el;
      P.save();
      toast(k.skin ? PETS[el].name + ' 出战！' : '已换回 ' + k.pet.name);
      render();
    }));
  }

  /* ================= 家长入口 ================= */
  function parentEntry() {
    if (!P.d.pin) return setPinSheet();
    const m = document.createElement('div');
    m.className = 'sheet-mask';
    let entered = '';
    m.innerHTML = '<div class="sheet"><div class="sheet-bar"></div>' +
      '<div class="sheet-h" style="text-align:center">输入' + ROLE() + ' PIN</div>' +
      '<div class="tiny" style="text-align:center">首次使用？先设置一个 4 位 PIN</div>' +
      '<div class="pin-dots">' + [0, 1, 2, 3].map((i) => '<i data-i="' + i + '"></i>').join('') + '</div>' +
      '<div class="pin-pad">' + [1, 2, 3, 4, 5, 6, 7, 8, 9, 'C', 0, '⌫'].map((x) => '<button data-x="' + x + '">' + x + '</button>').join('') + '</div>' +
      '</div>';
    document.body.appendChild(m);
    requestAnimationFrame(() => m.classList.add('in'));
    const close = () => { m.classList.remove('in'); setTimeout(() => m.remove(), 280); };
    const dots = m.querySelectorAll('.pin-dots i');
    const paint = () => dots.forEach((d, i) => d.classList.toggle('on', i < entered.length));
    m.querySelectorAll('.pin-pad button').forEach((b) => (b.onclick = () => {
      const x = b.dataset.x;
      if (x === 'C') entered = '';
      else if (x === '⌫') entered = entered.slice(0, -1);
      else if (entered.length < 4) entered += x;
      paint();
      if (entered.length === 4) {
        setTimeout(() => {
          if (entered === P.d.pin) { P.d.admin = true; P.save(); close(); toast('' + ROLE() + '模式已开启'); render(); parentPanel(); }
          else { entered = ''; paint(); toast('PIN 不对，再试试'); }
        }, 160);
      }
    }));
    m.addEventListener('click', (e) => { if (e.target === m) close(); });
  }
  function setPinSheet() {
    let first = '';
    let step = 1;
    const m = document.createElement('div');
    m.className = 'sheet-mask';
    m.innerHTML = '<div class="sheet"><div class="sheet-bar"></div>' +
      '<div class="sheet-h" style="text-align:center" id="pinTitle">设置' + ROLE() + ' PIN（第 1 步）</div>' +
      '<div class="tiny" style="text-align:center">4 位数字，之后管理积分、确认任务都要用它</div>' +
      '<div class="pin-dots">' + [0, 1, 2, 3].map((i) => '<i></i>').join('') + '</div>' +
      '<div class="pin-pad">' + [1, 2, 3, 4, 5, 6, 7, 8, 9, 'C', 0, '⌫'].map((x) => '<button data-x="' + x + '">' + x + '</button>').join('') + '</div>' +
      '</div>';
    document.body.appendChild(m);
    requestAnimationFrame(() => m.classList.add('in'));
    const close = () => { m.classList.remove('in'); setTimeout(() => m.remove(), 280); };
    let entered = '';
    const dots = m.querySelectorAll('.pin-dots i');
    const paint = () => dots.forEach((d, i) => d.classList.toggle('on', i < entered.length));
    m.querySelectorAll('.pin-pad button').forEach((b) => (b.onclick = () => {
      const x = b.dataset.x;
      if (x === 'C') entered = '';
      else if (x === '⌫') entered = entered.slice(0, -1);
      else if (entered.length < 4) entered += x;
      paint();
      if (entered.length === 4) {
        if (step === 1) { first = entered; entered = ''; step = 2; m.querySelector('#pinTitle').textContent = '再输入一遍确认（第 2 步）'; paint(); return; }
        if (entered === first) { P.d.pin = first; P.d.admin = true; P.save(); close(); toast('PIN 已设置，' + ROLE() + '模式开启'); render(); parentPanel(); }
        else { entered = ''; step = 1; first = ''; m.querySelector('#pinTitle').textContent = '两次不一致，重新设置（第 1 步）'; paint(); }
      }
    }));
    m.addEventListener('click', (e) => { if (e.target === m) close(); });
  }

  function parentPanel() {
    if (!P.d.admin) return;
    const pend = P.d.pending;
    openSheet(
      '<div class="sheet-h">' + (isClass() ? '老师面板' : '家长面板') + '</div>' +
      '<div class="tiny">' + (isClass() ? '数据只保存在这台设备上，换设备请用「数据备份」迁移' : '退出家长模式请在底部点「退出」，或等待下次打开自动退出') + '</div>' +
      (isClass() ? '<div class="cls-now" id="ppCls"><span>🏫</span><b>' + esc(P.d.cls.name || '我的班级') + '</b>' +
        '<small>' + P.d.kids.length + ' 人 · 共 ' + P.d.classes.length + ' 个班</small><i>切换 ›</i></div>' : '') +
      (isClass() ? '<div class="teacher-tools"' + (P.d.classes.length > 1 ? ' style="grid-template-columns:repeat(5,1fr)"' : '') + '>' +
        '<button id="ttBatch"><b>⚡</b>批量加分</button>' +
        '<button id="ttRnd"><b>🎲</b>随机点名</button>' +
        '<button id="ttRos"><b>👥</b>名单</button>' +
        '<button id="ttBrd"><b>🏆</b>光荣榜</button>' +
        (P.d.classes.length > 1 ? '<button id="ttCmp"><b>📊</b>跨班</button>' : '') + '</div>' : '') +
      '<div class="section-h" style="margin-top:14px"><h2>待确认 <span class="sub">' + pend.length + ' 条</span></h2></div>' +
      '<div id="pendList">' + (pend.length ? pend.map((p) => {
        const k = P.d.kids.find((x) => x.id === p.kidId) || { name: '?' };
        const t = p.kind === 'task' ? P.d.tasks.find((x) => x.id === p.refId) : P.d.rewards.find((x) => x.id === p.refId);
        const label = p.kind === 'task'
          ? (t ? t.name : '任务') + ' · ' + (t && t.pts < 0 ? '' : '+') + (t ? t.pts : '?')
          : (t ? t.name : '奖励') + (p.via === 'lottery' ? ' · 抽奖奖品（免费领）' : ' · -' + (t ? t.cost : '?'));
        return '<div class="pend-item"><div class="body"><div class="pn">' + esc(k.name) + ' · ' + esc(label) + '</div>' +
          '<div class="pd">' + fmtTime(p.ts) + (p.kind === 'task' ? ' · 完成打卡' : (p.via === 'lottery' ? ' · 抽奖奖品' : ' · 兑换奖励')) + '</div></div>' +
          '<div class="ops"><button class="ok" data-ok="' + p.id + '">✓</button><button class="no" data-no="' + p.id + '">✕</button></div></div>';
      }).join('') : '<div class="empty" style="padding:16px 0">没有待确认的事项</div>') + '</div>' +

      '<div class="section-h" style="margin-top:18px"><h2>快速加减分</h2></div>' +
      (isClass()
        ? '<div class="tiny" style="margin:4px 2px">全班 ' + P.d.kids.length + ' 人，建议用批量加分一次点多人</div>' +
          '<div style="margin-top:10px"><button class="btn" id="qaGo2">⚡ 打开批量加减分</button></div>'
        : '<div class="seg" id="pkSeg">' + P.d.kids.map((k, i) => '<button data-k="' + k.id + '"' + (i === 0 ? ' class="on"' : '') + '>' + esc(k.name) + '</button>').join('') + '</div>' +
          '<div id="amtGrid">' + amtsHTML() + '</div>' +
          '<div class="field"><label>理由（可选，会记入记录）</label><input id="why" placeholder="比如：主动帮忙、考了满分"></div>' +
          '<div style="margin-top:12px"><button class="btn" id="awardGo">确认加减分</button></div>') +

      '<div class="section-h" style="margin-top:20px"><h2>管理</h2></div>' +
      (isClass() ? '<div class="btn-row"><button class="btn ghost" id="mgCls">班级设置</button><button class="btn ghost" id="mgRoster">名单管理</button></div>' +
        '<div class="btn-row" style="margin-top:9px"><button class="btn ghost" id="mgTask">任务管理</button><button class="btn ghost" id="mgReward">奖励管理</button></div>' +
        '<div class="btn-row" style="margin-top:9px"><button class="btn ghost" id="mgRedeem">🎁 兑换记录</button><button class="btn ghost" id="mgRnd">🎲 随机点名</button></div>' +
        '<div class="btn-row" style="margin-top:9px"><button class="btn ghost" id="mgPin">' + (P.d.pin ? '修改 PIN' : '设置 PIN 防误触') + '</button><button class="btn ghost" id="mgData">数据备份</button></div>' +
        '<div class="btn-row" style="margin-top:9px"><button class="btn ghost" id="mgAmt">快捷分值</button><button class="btn ghost" id="mgHelp">📖 使用说明</button></div>'
        : '<div class="btn-row"><button class="btn ghost" id="mgTask">任务管理</button><button class="btn ghost" id="mgReward">奖励管理</button></div>' +
        '<div class="btn-row" style="margin-top:9px"><button class="btn ghost" id="mgRedeem">🎁 兑换记录</button><button class="btn ghost" id="mgRnd">🎲 随机点名</button></div>' +
        '<div class="btn-row" style="margin-top:9px"><button class="btn ghost" id="mgKid">孩子管理</button><button class="btn ghost" id="mgData">数据备份</button></div>' +
        '<div class="btn-row" style="margin-top:9px"><button class="btn ghost" id="mgToClass">🎒 开启班级模式（带班用）</button></div>' +
        '<div class="btn-row" style="margin-top:9px"><button class="btn ghost" id="mgAmt">快捷分值</button><button class="btn ghost" id="mgHelp">📖 使用说明</button></div>') +
      '<div style="margin-top:14px"><button class="btn ghost" id="exitAdmin">退出' + ROLE() + '模式</button></div>',
      (m, close) => {
        const pendPaint = () => {
          const list = m.querySelector('#pendList');
          const pend2 = P.d.pending;
          list.innerHTML = pend2.length ? pend2.map((p) => {
            const k = P.d.kids.find((x) => x.id === p.kidId) || { name: '?' };
            const t = p.kind === 'task' ? P.d.tasks.find((x) => x.id === p.refId) : P.d.rewards.find((x) => x.id === p.refId);
            const label = p.kind === 'task'
              ? (t ? t.name : '任务') + ' · ' + (t && t.pts < 0 ? '' : '+') + (t ? t.pts : '?')
              : (t ? t.name : '奖励') + (p.via === 'lottery' ? ' · 抽奖奖品（免费领）' : ' · -' + (t ? t.cost : '?'));
            return '<div class="pend-item"><div class="body"><div class="pn">' + esc(k.name) + ' · ' + esc(label) + '</div>' +
              '<div class="pd">' + fmtTime(p.ts) + '</div></div>' +
              '<div class="ops"><button class="ok" data-ok="' + p.id + '">✓</button><button class="no" data-no="' + p.id + '">✕</button></div></div>';
          }).join('') : '<div class="empty" style="padding:16px 0">没有待确认的事项</div>';
          bindPend(m);
        };
        const bindPend = (mm) => {
          mm.querySelectorAll('[data-ok]').forEach((b) => (b.onclick = () => resolvePend(b.dataset.ok, true, pendPaint)));
          mm.querySelectorAll('[data-no]').forEach((b) => (b.onclick = () => resolvePend(b.dataset.no, false, pendPaint)));
        };
        bindPend(m);

        let pk = P.d.kids[0] && P.d.kids[0].id;
        const ast = { amt: amts().pos[1] || amts().pos[0] || 1 };
        m.querySelectorAll('#pkSeg button').forEach((b) => (b.onclick = () => {
          m.querySelectorAll('#pkSeg button').forEach((x) => x.classList.remove('on'));
          b.classList.add('on'); pk = b.dataset.k;
        }));
        wireAmts(m, ast);
        const ag = m.querySelector('#awardGo');
        if (ag) ag.onclick = () => {
          const k = P.d.kids.find((x) => x.id === pk);
          if (!k) return toast('先添加孩子');
          const n = ast.amt;
          const why = m.querySelector('#why').value.trim();
          grantPoints(k, n, why || (n > 0 ? '' + ROLE() + '奖励' : '' + ROLE() + '扣除'));
          P.save();
          toast(esc(k.name) + ' ' + (n > 0 ? '+' : '') + n + ' 分已' + (n > 0 ? '到账' : '扣除'));
          m.querySelector('#why').value = '';
          render();
        };
        const q2 = m.querySelector('#qaGo2');
        if (q2) q2.onclick = () => { close(); quickAward([]); };

        m.querySelector('#mgTask').onclick = () => manageSheet('task');
        m.querySelector('#mgReward').onclick = () => { close(); giftManageSheet(); };
        const mgk = m.querySelector('#mgKid');
        if (mgk) mgk.onclick = () => kidManageSheet();
        m.querySelector('#mgData').onclick = () => { close(); dataSheet(); };
        m.querySelector('#exitAdmin').onclick = () => { P.d.admin = false; P.save(); close(); toast('已退出' + (isClass() ? '老师' : '家长') + '模式'); render(); };
        const tt = (id, fn) => { const b = m.querySelector('#' + id); if (b) b.onclick = fn; };
        tt('ttBatch', () => { close(); quickAward([]); });
        tt('ttRnd', () => { close(); randomPick(); });
        tt('mgRnd', () => { close(); randomPick(); });
        tt('mgRedeem', () => { close(); redeemBoardSheet(); });
        tt('ttRos', () => { close(); rosterSheet(); });
        tt('ttBrd', () => { close(); location.hash = '#/board'; render(); });
        tt('mgHelp', () => window.open('help.html', '_blank'));
        tt('mgAmt', () => { close(); amtSetupSheet(); });
        tt('mgCls', () => { close(); classSetupSheet(); });
        tt('mgRoster', () => { close(); rosterSheet(); });
        tt('mgPin', () => { close(); setPinSheet(); });
        tt('ppCls', () => { close(); classListSheet(); });
        tt('ttCmp', () => { close(); location.hash = '#/compare'; render(); });
        tt('mgToClass', () => { close(); newClassSheet(); });
      });
  }
  function addRedeemHis(k, r, cost, via) {
    if (!Array.isArray(P.d.redeemHis)) P.d.redeemHis = [];
    P.d.redeemHis.unshift({
      id: uid(), kidId: k.id, kidName: k.name, name: r.name, icon: r.icon || '🎁',
      cost: cost || 0, via: via || 'shop', ts: Date.now()
    });
    if (P.d.redeemHis.length > 300) P.d.redeemHis.length = 300;
  }
  function resolvePend(pid, ok, repaint) {
    const i = P.d.pending.findIndex((x) => x.id === pid);
    if (i < 0) return;
    const p = P.d.pending[i];
    const k = P.d.kids.find((x) => x.id === p.kidId);
    P.d.pending.splice(i, 1);
    if (k) {
      if (p.kind === 'task') {
        const t = P.d.tasks.find((x) => x.id === p.refId);
        if (ok && t) grantPoints(k, t.pts, (t.pts < 0 ? '登记' : '完成任务') + '「' + t.name + '」');
        else if (!ok) { delete P.d.doneToday[k.id + '|' + p.refId + '|' + todayStr()]; toast('已拒绝'); }
      } else {
        const r = P.d.rewards.find((x) => x.id === p.refId);
        if (ok && r) {
          if (p.via === 'lottery') {
            addLog(k, '🎁', '领取抽奖奖品「' + r.name + '」', 0);
            addRedeemHis(k, r, 0, 'lottery');
            toast('已发放 ' + r.name);
          } else if (k.points < r.cost) toast('积分不足，无法兑换');
          else {
            k.points -= r.cost;
            addLog(k, '🎁', '兑换奖励「' + r.name + '」', -r.cost);
            addRedeemHis(k, r, r.cost, 'shop');
            toast('已兑换 ' + r.name);
          }
        }
      }
    }
    P.save(); repaint(); render();
  }

  /* ---------- 兑换记录（老师视角：待兑换 / 已兑换） ---------- */
  function redeemBoardSheet() {
    const waitList = () => P.d.pending.filter((p) => p.kind === 'reward');
    const his = () => (P.d.redeemHis || []);
    openSheet(
      '<div class="sheet-h">兑换记录</div>' +
      '<div class="tiny">所有同学的兑换申请与历史，都在这里</div>' +
      '<div class="seg" id="rbSeg" style="grid-template-columns:repeat(2,1fr);margin-top:10px">' +
      '<button data-t="wait" class="on">待兑换 · <b id="rbN1">' + waitList().length + '</b></button>' +
      '<button data-t="done">已兑换 · <b id="rbN2">' + his().length + '</b></button></div>' +
      '<div id="rbList" style="margin-top:6px"></div>',
      (m, close) => {
        let tab = 'wait';
        const paint = () => {
          const box = m.querySelector('#rbList');
          if (tab === 'wait') {
            const list = waitList();
            box.innerHTML = list.length ? list.map((p) => {
              const k = P.d.kids.find((x) => x.id === p.kidId) || { name: '?' };
              const r = P.d.rewards.find((x) => x.id === p.refId) || { name: '已删除的奖品', icon: '🎁', cost: 0 };
              return '<div class="pend-item"><div style="font-size:21px;width:28px;text-align:center;flex:0 0 auto">' + (r.icon || '🎁') + '</div>' +
                '<div class="body"><div class="pn">' + esc(k.name) + ' · ' + esc(r.name) + '</div>' +
                '<div class="pd">' + fmtTime(p.ts) + (p.via === 'lottery' ? ' · 抽奖奖品（免费领）' : ' · 扣 ' + r.cost + ' 分') + '</div></div>' +
                '<div class="ops"><button class="ok" data-ok="' + p.id + '">✓</button><button class="no" data-no="' + p.id + '">✕</button></div></div>';
            }).join('') : '<div class="empty" style="padding:22px 0">没有待兑换的申请</div>';
          } else {
            const list = his().slice(0, 80);
            box.innerHTML = list.length ? list.map((h) =>
              '<div class="pend-item"><div style="font-size:21px;width:28px;text-align:center;flex:0 0 auto">' + (h.icon || '🎁') + '</div>' +
              '<div class="body"><div class="pn">' + esc(h.kidName) + ' · ' + esc(h.name) + '</div>' +
              '<div class="pd">' + fmtTime(h.ts) + ' · ' + (h.via === 'lottery' ? '抽奖奖品' : (h.via === 'exp' ? '经验道具 · 扣 ' + h.cost + ' 分' : '扣 ' + h.cost + ' 分')) + '</div></div>' +
              '<div class="tag-exp">已兑换</div></div>').join('') : '<div class="empty" style="padding:22px 0">还没有兑换记录</div>';
          }
          m.querySelectorAll('[data-ok]').forEach((b) => (b.onclick = () => resolvePend(b.dataset.ok, true, () => { paint(); render(); })));
          m.querySelectorAll('[data-no]').forEach((b) => (b.onclick = () => resolvePend(b.dataset.no, false, () => { paint(); render(); })));
          m.querySelector('#rbN1').textContent = waitList().length;
          m.querySelector('#rbN2').textContent = his().length;
        };
        m.querySelectorAll('#rbSeg button').forEach((b) => (b.onclick = () => {
          m.querySelectorAll('#rbSeg button').forEach((x) => x.classList.remove('on'));
          b.classList.add('on'); tab = b.dataset.t; paint();
        }));
        paint();
      });
  }

  /* ---------- 任务 / 奖励管理 ---------- */
  let manageRepaint = null;
  /* 老师反馈的课堂常用加减分模板（负数为扣分项，导入后可逐个改分值） */
  const CLASS_TASK_TPL = [
    { name: '作业优秀', pts: 2, icon: '📕' },
    { name: '交作业', pts: 1, icon: '📥' },
    { name: '会背课文', pts: 2, icon: '🗣️' },
    { name: '考试良好', pts: 2, icon: '📗' },
    { name: '考试优秀', pts: 4, icon: '🌟' },
    { name: '满分', pts: 6, icon: '💯' },
    { name: '考试进步', pts: 2, icon: '📈' },
    { name: '不交作业', pts: -2, icon: '📝' },
    { name: '不打卡', pts: -1, icon: '📅' },
    { name: '上课说话', pts: -3, icon: '🤫' }
  ];
  function taskSheet(id) {
    const t = P.d.tasks.find((x) => x.id === id);
    if (!t) return;
    openSheet(
      '<div class="sheet-h">编辑任务</div>' +
      '<div class="tiny">分值、名称、说明都由老师定；负数表示扣分项（如 -2），确认后给学生扣分</div>' +
      '<div class="field"><label>任务名称</label><input id="tkName" maxlength="20" value="' + esc(t.name) + '"></div>' +
      '<div class="field"><label>分值（扣分项填负数，如 -2）</label><input id="tkPts" type="number" inputmode="numeric" value="' + t.pts + '"></div>' +
      '<div class="field"><label>说明（可选）</label><input id="tkDs" maxlength="30" value="' + esc(t.ds || '') + '"></div>' +
      '<div style="margin-top:14px"><button class="btn gold" id="tkSave">保存</button></div>' +
      '<div style="margin-top:9px"><button class="btn ghost" id="tkDel" style="color:var(--bad)">删除这个任务</button></div>',
      (m, close) => {
        m.querySelector('#tkSave').onclick = () => {
          const name = m.querySelector('#tkName').value.trim();
          const pts = parseInt(m.querySelector('#tkPts').value, 10);
          if (!name) return toast('给任务起个名字');
          if (!pts || Math.abs(pts) > 999) return toast('分值请填非 0 数字（扣分项填负数）');
          t.name = name; t.pts = pts; t.ds = m.querySelector('#tkDs').value.trim();
          P.save(); close(); if (manageRepaint) manageRepaint(); render();
          toast('已保存，之后按新分值发分');
        };
        m.querySelector('#tkDel').onclick = () => {
          if (!confirm('删除任务「' + t.name + '」？')) return;
          P.d.tasks = P.d.tasks.filter((x) => x.id !== t.id);
          P.save(); close(); if (manageRepaint) manageRepaint(); render(); toast('已删除');
        };
      });
  }
  function manageSheet(kind) {
    const isTask = kind === 'task';
    const list = isTask ? P.d.tasks : P.d.rewards;
    const ptsTxt = (n) => (n > 0 ? '+' : '') + n;
    const rowHTML = (x) => isTask
      ? '<div class="pend-item"><div class="body"><div class="pn">' + x.icon + ' ' + esc(x.name) + '</div><div class="pd">' + ptsTxt(x.pts) + ' 分 · ' + esc(x.ds || '') + '</div></div><div class="ops"><button class="ok" data-ed="' + x.id + '">✏️</button><button class="no" data-del="' + x.id + '">🗑</button></div></div>'
      : '<div class="pend-item"><div class="body"><div class="pn">' + x.icon + ' ' + esc(x.name) + '</div><div class="pd">' + x.cost + ' 积分</div></div><div class="ops"><button class="ok" data-del="' + x.id + '">🗑</button></div></div>';
    openSheet(
      '<div class="sheet-h">' + (isTask ? '任务管理' : '奖励管理') + '</div>' +
      (isTask ? '<div class="tiny">加分、扣分项都由老师自定义：分值填负数（如 -2）就是扣分项</div>' +
        '<button class="btn ghost" id="mgTpl" style="width:100%;margin-top:10px">📋 一键加入课堂常用项（作业 / 考试 / 纪律）</button>' : '') +
      '<div id="mgList" style="margin-top:10px">' + (list.length ? list.map(rowHTML).join('') : '<div class="empty">空空如也</div>') + '</div>' +
      '<div class="section-h" style="margin-top:16px"><h2>新增</h2></div>' +
      '<div class="field"><label>名称</label><input id="mgName" maxlength="20"></div>' +
      '<div class="field"><label>' + (isTask ? '分值（扣分项填负数，如 -2）' : '所需积分') + '</label><input id="mgPts" type="number" inputmode="numeric"' + (isTask ? '' : ' min="1"') + '></div>' +
      (isTask ? '<div class="field"><label>说明（可选）</label><input id="mgDs" maxlength="30"></div>' : '') +
      '<div style="margin-top:14px"><button class="btn" id="mgAdd">添加</button></div>',
      (m, close) => {
        const repaint = () => { m.querySelector('#mgList').innerHTML = list.length ? list.map(rowHTML).join('') : '<div class="empty">空空如也</div>'; bindDel(); bindEd(); render(); };
        const bindDel = () => m.querySelectorAll('[data-del]').forEach((b) => (b.onclick = () => {
          const i = list.findIndex((x) => x.id === b.dataset.del);
          if (i >= 0) { list.splice(i, 1); P.save(); repaint(); }
        }));
        const bindEd = () => m.querySelectorAll('[data-ed]').forEach((b) => (b.onclick = () => {
          if (isTask) taskSheet(b.dataset.ed);
          else giftSheet(b.dataset.ed);
        }));
        const tpl = m.querySelector('#mgTpl');
        if (tpl) tpl.onclick = () => {
          let add = 0;
          CLASS_TASK_TPL.forEach((x) => {
            if (list.some((t) => t.name === x.name)) return;
            list.push(Object.assign({ id: uid(), ds: '' }, x)); add++;
          });
          P.save(); repaint();
          toast(add ? '已加入 ' + add + ' 个常用项，分值可再逐个改' : '常用项都已经在列表里啦');
        };
        manageRepaint = repaint;
        bindDel(); bindEd();
        m.querySelector('#mgAdd').onclick = () => {
          const name = m.querySelector('#mgName').value.trim();
          const pts = parseInt(m.querySelector('#mgPts').value, 10);
          if (!name || !pts) return toast('名称和分值都要填哦');
          if (!isTask && pts < 1) return toast('所需积分请填大于 0 的数字');
          if (isTask && Math.abs(pts) > 999) return toast('分值请在 ±999 以内');
          const icons = isTask ? ['📘', '🎯', '🏃', '🧩', '🎨', '🎵', '🛏️'] : ['🍿', '🎡', '🛴', '🎈', '🧁', '🎪', '🚗'];
          const item = isTask
            ? { id: uid(), name, pts, icon: icons[Math.floor(Math.random() * icons.length)], ds: m.querySelector('#mgDs').value.trim() }
            : { id: uid(), name, cost: pts, icon: icons[Math.floor(Math.random() * icons.length)] };
          list.push(item); P.save();
          m.querySelector('#mgName').value = ''; m.querySelector('#mgPts').value = '';
          if (m.querySelector('#mgDs')) m.querySelector('#mgDs').value = '';
          toast('已添加'); repaint();
        };
      });
  }

  /* ---------- 孩子管理 ---------- */
  function kidManageSheet() {
    const rowHTML = (k) => '<div class="pend-item"><div class="body"><div class="pn"><img class="mini-av" src="' + petImg(k) + '" alt=""> ' + esc(k.name) +
      '<span class="tiny" style="margin-left:8px">Lv.' + k.pet.lv + ' · ' + k.points + ' 分 · 图鉴' + dexCount(k) + '/21</span></div>' +
      '<div class="pd">' + petMeta(k.pet.type).name + (k.companions.length ? ' · 伙伴×' + k.companions.length : '') + '</div></div>' +
      '<div class="ops"><button class="ok" data-ren="' + k.id + '">✏️</button><button class="no" data-delk="' + k.id + '">🗑</button></div></div>';
    openSheet(
      '<div class="sheet-h">孩子管理</div>' +
      '<div style="margin-top:10px">' + P.d.kids.map(rowHTML).join('') + '</div>' +
      '<div style="margin-top:14px"><button class="btn" id="kmAdd">＋ 添加孩子</button></div>',
      (m, close) => {
        const repaint = () => { m.querySelector('#kmList') && (m.querySelectorAll('.pend-item').forEach((e) => e.remove()), P.d.kids.forEach((k) => m.querySelector('.sheet').insertAdjacentHTML('beforeend', ''))); render(); };
        m.querySelectorAll('[data-ren]').forEach((b) => (b.onclick = () => {
          const k = P.d.kids.find((x) => x.id === b.dataset.ren);
          openSheet('<div class="sheet-h">改名</div><div class="field"><input id="rnV" maxlength="8" value="' + esc(k.name) + '"></div>' +
            '<div style="margin-top:14px"><button class="btn" id="rnGo">保存</button></div>',
            (mm, cc) => {
              mm.querySelector('#rnGo').onclick = () => {
                const v = mm.querySelector('#rnV').value.trim();
                if (v) { k.name = v; P.save(); render(); }
                cc();
              };
            });
        }));
        m.querySelectorAll('[data-delk]').forEach((b) => (b.onclick = () => {
          if (P.d.kids.length <= 1) return toast('至少保留一个孩子');
          const k = P.d.kids.find((x) => x.id === b.dataset.delk);
          openSheet('<div class="sheet-h">删除 ' + esc(k.name) + '？</div><div class="tiny" style="margin-top:6px">该孩子的积分、幻兽和记录都会一并删除，不可恢复。</div>' +
            '<div class="btn-row" style="margin-top:16px"><button class="btn ghost" id="dlNo">取消</button><button class="btn" id="dlYes" style="background:var(--bad)">删除</button></div>',
            (mm, cc) => {
              mm.querySelector('#dlNo').onclick = cc;
              mm.querySelector('#dlYes').onclick = () => {
                P.d.kids = P.d.kids.filter((x) => x.id !== k.id);
                P.d.log = P.d.log.filter((l) => l.kid !== k.id);
                P.d.pending = P.d.pending.filter((p) => p.kidId !== k.id);
                if (P.d.cur === k.id) P.d.cur = P.d.kids[0].id;
                P.save(); cc(); close(); render(); toast('已删除');
              };
            });
        }));
        m.querySelector('#kmAdd').onclick = () => { close(); addKidSheet(); };
      });
  }

  /* ---------- 礼品管理（老师/家长维护） ---------- */
  let giftRepaint = null;
  const GIFT_ICONS = ['🎁', '🍪', '🍿', '🍦', '🍕', '📺', '🎮', '🎬', '🎡', '🎪', '🎨', '🎵',
    '⚽', '🏊', '🛴', '🚗', '🧸', '📚', '✏️', '🎯', '😴', '🐾', '🎫', '💎',
    '🧪', '🍎', '🌟', '⚗️', '🍯', '🐣'];
  function giftRows() {
    if (!P.d.rewards.length) return '<div class="empty" style="padding:14px 0">还没有礼品，点下面添加</div>';
    return P.d.rewards.map((r) => {
      const isExp = r.kind === 'exp';
      return '<div class="pend-item' + (r.on === false ? ' off' : '') + '">' +
        '<div style="font-size:22px;width:30px;text-align:center;flex:0 0 auto">' + r.icon + '</div>' +
        '<div class="body"><div class="pn">' + esc(r.name) + (isExp ? '<span class="tag-exp" style="margin-left:6px">+' + (r.exp || r.cost) + ' 经验</span>' : '') +
        '<span class="tiny" style="margin-left:6px">' + r.cost + ' 分</span></div>' +
        '<div class="pd">' + (r.desc ? esc(r.desc) : (isExp ? '抽到/兑换后直接加经验' : '无说明')) + (r.on === false ? ' · 已下架' : '') + '</div></div>' +
        '<div class="ops"><button class="ok" data-ed="' + r.id + '">✏️</button><button class="no" data-tg="' + r.id + '">' + (r.on === false ? '▶' : '⏸') + '</button></div></div>';
    }).join('');
  }
  function giftManageSheet() {
    openSheet(
      '<div class="sheet-h">礼品管理</div>' +
      '<div class="tiny">学生用积分兑换，兑换申请会进老师面板的「待确认」；<b>上架的礼品同时就是抽奖奖池</b>，抽奖票价按这些礼品的定价自动计算。经验道具不用确认，抽到/兑换后立刻加给幻兽。</div>' +
      '<div id="gmList" style="margin-top:12px">' + giftRows() + '</div>' +
      '<div class="section-h" style="margin-top:16px"><h2>抽奖票价</h2></div>' +
      '<div class="field"><label>抽一次花多少积分</label><input id="gmPrice" type="number" min="0" inputmode="numeric" value="' + (P.d.lotPriceOv || 0) + '">' +
      '<div class="tiny" id="gmPriceTip">填 0 = 按奖池自动算（当前自动价 ' + lotAutoPrice() + ' 分 · 30% 空奖）；填正整数 = 用你定的价</div></div>' +
      '<div class="btn-row" style="margin-top:8px"><button class="btn ghost sm" id="gmPriceSave">保存票价</button></div>' +
      '<div style="margin-top:14px"><button class="btn gold" id="gmAdd">＋ 添加礼品 / 经验道具</button></div>' +
      '<div class="btn-row" style="margin-top:9px"><button class="btn ghost" id="gmReset">恢复默认礼品</button></div>',
      (m, close) => {
        const repaint = () => {
          if (!m.isConnected) return;
          m.querySelector('#gmList').innerHTML = giftRows();
          bind();
          render();
        };
        giftRepaint = repaint;
        const bind = () => {
          m.querySelectorAll('[data-ed]').forEach((b) => (b.onclick = () => giftSheet(b.dataset.ed)));
          m.querySelectorAll('[data-tg]').forEach((b) => (b.onclick = () => {
            const r = P.d.rewards.find((x) => x.id === b.dataset.tg);
            if (!r) return;
            r.on = r.on === false;
            P.save(); repaint();
            toast(r.on ? '「' + r.name + '」已上架' : '「' + r.name + '」已下架，学生看不到');
          }));
        };
        bind();
        m.querySelector('#gmPriceSave').onclick = () => {
          const v = parseInt(m.querySelector('#gmPrice').value, 10);
          if (isNaN(v) || v < 0) return toast('填 0 或正整数');
          P.d.lotPriceOv = v; P.save();
          m.querySelector('#gmPriceTip').innerHTML = '填 0 = 按奖池自动算（当前自动价 ' + lotAutoPrice() + ' 分 · 30% 空奖）；填正整数 = 用你定的价';
          render();
          toast(v > 0 ? '票价已设为 ' + v + ' 分' : '票价已恢复自动计算');
        };
        m.querySelector('#gmAdd').onclick = () => giftSheet(null);
        m.querySelector('#gmReset').onclick = () => {
          if (!confirm('恢复为默认礼品？你自己加的礼品会被清掉。')) return;
          P.d.rewards = JSON.parse(JSON.stringify(DEFAULT_REWARDS));
          P.save(); repaint(); toast('已恢复默认礼品');
        };
      });
  }
  function giftSheet(editId) {
    const editing = editId ? P.d.rewards.find((r) => r.id === editId) : null;
    let icon = editing ? editing.icon : '🎁';
    let kind = editing && editing.kind === 'exp' ? 'exp' : 'gift';
    openSheet(
      '<div class="sheet-h">' + (editing ? '编辑奖品' : '添加奖品') + '</div>' +
      '<div class="tiny">实物礼品兑换后由老师发放；经验道具在抽到/兑换后<b>立刻加给幻兽</b>，不用确认</div>' +
      '<div class="seg" id="gKind" style="grid-template-columns:repeat(2,1fr)">' +
      '<button data-k="gift">🎁 实物礼品</button><button data-k="exp">🧪 经验道具</button></div>' +
      '<div class="field"><label>选个图标</label><div class="icon-grid" id="gIcons">' +
      GIFT_ICONS.map((e) => '<button data-e="' + e + '"' + (e === icon ? ' class="on"' : '') + '>' + e + '</button>').join('') + '</div></div>' +
      '<div class="field"><label id="gNameLb">礼品名称</label><input id="gName" maxlength="16" placeholder="比如：换座位一次" value="' + (editing ? esc(editing.name) : '') + '"></div>' +
      '<div class="field" id="gExpWrap" style="display:none"><label>增加经验</label><input id="gExp" type="number" min="1" inputmode="numeric" value="' + (editing && editing.exp ? editing.exp : 30) + '"><div class="tiny" style="margin-top:6px">抽到或兑换后，幻兽直接获得这个数量的经验</div></div>' +
      '<div class="field"><label id="gCostLb">所需积分</label><input id="gCost" type="number" min="1" inputmode="numeric" value="' + (editing ? editing.cost : '10') + '">' +
      '<div class="tiny" id="gCostTip" style="margin-top:6px">这个积分既是兑换价，也是抽奖标价：越贵中奖概率越低，同时参与抽奖票价计算</div></div>' +
      '<div class="field"><label>说明（可选，学生能看到）</label><input id="gDesc" maxlength="24" placeholder="比如：每周限 1 次" value="' + (editing ? esc(editing.desc || '') : '') + '"></div>' +
      '<div style="margin-top:14px"><button class="btn gold" id="gSave">' + (editing ? '保存修改' : '添加') + '</button></div>' +
      (editing ? '<div style="margin-top:9px"><button class="btn ghost" id="gDel" style="color:var(--bad)">删除这个奖品</button></div>' : ''),
      (m, close) => {
        const paintKind = () => {
          m.querySelectorAll('#gKind button').forEach((b) => b.classList.toggle('on', b.dataset.k === kind));
          m.querySelector('#gExpWrap').style.display = kind === 'exp' ? '' : 'none';
          m.querySelector('#gCostLb').textContent = kind === 'exp' ? '兑换价 / 抽奖标价' : '所需积分';
          m.querySelector('#gCostTip').style.display = kind === 'exp' ? '' : 'none';
          m.querySelector('#gNameLb').textContent = kind === 'exp' ? '道具名称' : '礼品名称';
          const nm = m.querySelector('#gName');
          nm.placeholder = kind === 'exp' ? '比如：经验药水' : '比如：换座位一次';
          if (kind === 'exp' && icon === '🎁') {
            icon = '🧪';
            m.querySelectorAll('#gIcons button').forEach((x) => x.classList.toggle('on', x.dataset.e === '🧪'));
          }
        };
        m.querySelectorAll('#gKind button').forEach((b) => (b.onclick = () => {
          kind = b.dataset.k; paintKind();
        }));
        m.querySelectorAll('#gIcons button').forEach((b) => (b.onclick = () => {
          m.querySelectorAll('#gIcons button').forEach((x) => x.classList.remove('on'));
          b.classList.add('on'); icon = b.dataset.e;
        }));
        paintKind();
        const back = () => { close(); if (giftRepaint) giftRepaint(); };
        m.querySelector('#gSave').onclick = () => {
          const name = m.querySelector('#gName').value.trim();
          const cost = parseInt(m.querySelector('#gCost').value, 10);
          const desc = m.querySelector('#gDesc').value.trim();
          const expVal = parseInt(m.querySelector('#gExp').value, 10);
          if (!name) return toast('给奖品起个名字');
          if (!cost || cost < 1) return toast('积分请填大于 0 的数字');
          if (kind === 'exp' && (!expVal || expVal < 1)) return toast('经验请填大于 0 的数字');
          const patch = { name, cost, desc, icon, on: editing ? editing.on !== false : true, kind };
          if (kind === 'exp') patch.exp = expVal;
          else patch.exp = null;
          if (editing) Object.assign(editing, patch);
          else P.d.rewards.push(Object.assign({ id: uid() }, patch));
          P.save();
          toast(editing ? '已保存' : '已添加「' + name + '」');
          back();
        };
        const del = m.querySelector('#gDel');
        if (del) del.onclick = () => {
          if (!confirm('删除「' + editing.name + '」？')) return;
          P.d.rewards = P.d.rewards.filter((x) => x.id !== editing.id);
          P.save(); toast('已删除'); back();
        };
      });
  }

  /* ---------- 数据备份 ---------- */
  function dataSheet() {
    openSheet(
      '<div class="sheet-h">数据备份</div>' +
      '<div class="tiny" style="margin-top:6px">数据默认只存在本机浏览器里。开了「云同步」后，多台设备可共用同一份数据。</div>' +
      '<div class="btn-row" style="margin-top:16px">' +
      '<button class="btn ghost" id="expBtn">导出 JSON</button><button class="btn ghost" id="impBtn">导入 JSON</button></div>' +
      '<div class="mig">' +
      '<button class="btn gold" id="qrOut">📤 发到手机<em>生成二维码，手机扫一下</em></button>' +
      '<button class="btn" id="qrIn">📥 扫码接收<em>扫另一台设备的二维码</em></button>' +
      '</div>' +
      '<div style="margin-top:10px"><button class="btn" id="syncBtn" style="background:linear-gradient(135deg,#3b82f6,#6366f1)">☁️ 云同步（多设备互通）</button></div>' +
      '<div style="margin-top:10px"><button class="btn ghost" id="resetBtn" style="color:var(--bad)">清空全部数据</button></div>' +
      '<input type="file" id="impFile" accept=".json" style="display:none">',
      (m, close) => {
        m.querySelector('#expBtn').onclick = () => {
          const blob = new Blob([JSON.stringify(P.d)], { type: 'application/json' });
          const a = document.createElement('a');
          a.href = URL.createObjectURL(blob);
          a.download = 'banxue-backup-' + todayStr() + '.json';
          a.click();
          toast('已导出');
        };
        m.querySelector('#qrOut').onclick = () => { close(); qrExportSheet(); };
        m.querySelector('#qrIn').onclick = () => { close(); qrImportSheet(false); };
        const syBtn = m.querySelector('#syncBtn');
        if (syBtn) syBtn.onclick = () => {
          if (window.BEAST_SYNC) window.BEAST_SYNC.open();
          else toast('同步模块未加载，请刷新页面');
        };
        const file = m.querySelector('#impFile');
        m.querySelector('#impBtn').onclick = () => file.click();
        file.onchange = () => {
          const f = file.files[0];
          if (!f) return;
          const rd = new FileReader();
          rd.onload = () => {
            try {
              const d = JSON.parse(rd.result);
              if (!d || !Array.isArray(d.kids)) throw 0;
              /* 归一化成多班结构并打时间戳，避免刚导入就被云端旧数据盖回 */
              P.d = adoptImported(d); P.save(); close(); render(); toast('导入成功');
            } catch (e) { toast('文件格式不对'); }
          };
          rd.readAsText(f);
        };
        m.querySelector('#resetBtn').onclick = () => {
          openSheet('<div class="sheet-h">清空全部数据？</div><div class="tiny" style="margin-top:6px">积分、幻兽、记录将全部删除，且不可恢复。</div>' +
            '<div class="btn-row" style="margin-top:16px"><button class="btn ghost" id="rsNo">取消</button><button class="btn" id="rsYes" style="background:var(--bad)">全部清空</button></div>',
            (mm, cc) => {
              mm.querySelector('#rsNo').onclick = cc;
              mm.querySelector('#rsYes').onclick = () => {
                P.d = P.fresh(); localStorage.removeItem(KEY); P.save();
                P.d.admin = true;
                cc(); close(); close(); render();
                parentPanel();
                toast('已清空');
              };
            });
        };
      });
  }

  /* ================= 班级模式 ================= */
  const isClass = () => !!(P.d && P.d.cls && P.d.cls.on);
  const ROLE = () => (isClass() ? '老师' : '家长');
  const weekStart = () => { const d = new Date(); const w = (d.getDay() + 6) % 7; d.setDate(d.getDate() - w); d.setHours(0, 0, 0, 0); return d.getTime(); };
  const dayStart = () => { const d = new Date(); d.setHours(0, 0, 0, 0); return d.getTime(); };
  function ptsSince(k, from) {
    let s = 0; const dd = k.daily || {};
    for (const key in dd) { if (new Date(key + 'T00:00:00').getTime() >= from) s += dd[key]; }
    return s;
  }
  function rankBy(period) {
    const from = period === 'today' ? dayStart() : period === 'week' ? weekStart() : 0;
    const rows = P.d.kids.map((k) => ({ k, v: period === 'total' ? k.points : ptsSince(k, from) }));
    rows.sort((a, b) => b.v - a.v || a.k.name.localeCompare(b.k.name, 'zh'));
    let rk = 0, prev = null;
    rows.forEach((r, i) => { if (prev === null || r.v !== prev) { rk = i + 1; prev = r.v; } r.rank = rk; });
    return rows;
  }
  const rankOf = (id, period) => { const r = rankBy(period || 'total').find((x) => x.k.id === id); return r ? r.rank : 0; };
  const classTotal = (period) => rankBy(period).reduce((s, r) => s + r.v, 0);
  const groupsOf = () => { const set = []; P.d.kids.forEach((k) => { if (k.group && !set.includes(k.group)) set.push(k.group); }); return set; };
  function newStu(name, group, lv) {
    const type = pickType();
    return {
      id: uid(), name, group: group || '', points: 0, daily: {},
      pet: { name: petMeta(type).name, type, exp: 0, lv: lv || 3 },
      dex: { egg: true }, companions: [], milestones: [], skin: null
    };
  }

  /* ---------- 多班级 ---------- */
  function loadClass(id) {
    const e = P.d.classes.find((c) => c.id === id);
    if (!e) return false;
    P.d.clsId = id;
    P.d.kids = e.kids || [];
    P.d.cls.name = e.name || '我的班级';
    P.d.cls.groups = (e.groups || []).slice();
    P.d.cls.period = e.period || 'today';
    P.d.cls.rnd = e.rnd || { pool: [], round: 0 };
    P.d.cls.since = e.since || Date.now();
    P.d.cur = P.d.kids[0] ? P.d.kids[0].id : null;
    return true;
  }
  function switchClass(id) {
    if (id === P.d.clsId) return;
    P.save();
    const before = P.d.cls.name;
    if (loadClass(id)) {
      clsFilter = { q: '', g: '' };
      P.save(); render();
      toast('已切换到 ' + P.d.cls.name);
    }
  }
  function createClass(name, listText) {
    P.save();
    const id = 'c' + uid();
    P.d.classes.push({ id, name, kids: [], groups: GROUPS_DEFAULT.slice(), period: 'today', rnd: { pool: [], round: 0 }, since: Date.now() });
    P.d.cls.on = true;
    loadClass(id);
    const r = importRoster(listText || '', true);
    if (!P.d.cur && P.d.kids.length) P.d.cur = P.d.kids[0].id;
    P.save();
    return r;
  }
  function deleteClass(id) {
    if (P.d.classes.length <= 1) { toast('至少要保留一个班'); return; }
    P.d.classes = P.d.classes.filter((c) => c.id !== id);
    if (P.d.clsId === id) { loadClass(P.d.classes[0].id); }
    P.save(); render();
  }
  function classStat(e) {
    const from = dayStart();
    const sum = (e.kids || []).reduce((s, k) => s + ptsSince(k, from), 0);
    return { n: (e.kids || []).length, sum };
  }
  function classListSheet() {
    const rows = P.d.classes.map((e) => {
      const st = classStat(e);
      const cur = e.id === P.d.clsId;
      return '<div class="cls-row' + (cur ? ' on' : '') + '" data-c="' + e.id + '">' +
        '<div class="cr-av">' + (cur ? '✓' : '🏫') + '</div>' +
        '<div class="cr-t"><b>' + esc(e.name) + '</b><small>' + st.n + ' 人 · 今日 +' + st.sum + '</small></div>' +
        (cur ? '<span class="cr-tag">当前</span>' : '<span class="cr-go">切换 ›</span>') + '</div>';
    }).join('');
    openSheet(
      '<div class="sheet-h">我的班级</div>' +
      '<div class="tiny">共 ' + P.d.classes.length + ' 个班，数据互相独立</div>' +
      (P.d.classes.length > 1 ? '<div style="margin-top:12px"><button class="btn ghost" id="cmpGo">📊 跨班对比总览</button></div>' : '') +
      '<div style="margin-top:12px">' + rows + '</div>' +
      '<div style="margin-top:14px"><button class="btn" id="ncGo">＋ 新建班级</button></div>' +
      '<div class="tiny" style="margin-top:10px">班级之间学生名单、积分、幻兽各自独立；任务和奖励规则是全年级通用的。</div>',
      (m, close) => {
        m.querySelectorAll('.cls-row').forEach((r) => (r.onclick = () => {
          const id = r.dataset.c;
          close();
          if (id !== P.d.clsId) switchClass(id);
        }));
        m.querySelector('#ncGo').onclick = () => { close(); newClassSheet(); };
        const cg = m.querySelector('#cmpGo');
        if (cg) cg.onclick = () => { close(); location.hash = '#/compare'; render(); };
      });
  }
  function newClassSheet() {
    openSheet(
      '<div class="sheet-h">新建班级</div>' +
      '<div class="field"><label>班级名称</label><input id="ncName" maxlength="14" placeholder="比如：四年一班"></div>' +
      '<div class="field"><label>学生名单（可先空着）</label><textarea id="ncList" rows="7" placeholder="张小明 第一组&#10;李小红 第一组&#10;王小刚 第二组" style="width:100%;padding:12px;border-radius:13px;border:1.5px solid var(--line);font-family:inherit;font-size:14px;line-height:1.7;resize:vertical"></textarea></div>' +
      '<div style="margin-top:12px"><button class="btn" id="ncCreate">创建并切换过去</button></div>',
      (m, close) => {
        m.querySelector('#ncCreate').onclick = () => {
          const name = m.querySelector('#ncName').value.trim();
          if (!name) return toast('先给班级起个名');
          const r = createClass(name, m.querySelector('#ncList').value);
          close(); location.hash = '#/class'; render();
          toast('已创建「' + name + '」' + (r.added ? '，导入 ' + r.added + ' 人' : '，去导入名单吧'));
        };
      });
  }

  /* ---------- 全班墙 ---------- */
  let clsFilter = { q: '', g: '' };
  function viewClass() {
    const rows = rankBy('total');
    const rankMap = {}; rows.forEach((r) => { rankMap[r.k.id] = r.rank; });
    const list = P.d.kids.filter((k) => (!clsFilter.g || k.group === clsFilter.g) && (!clsFilter.q || k.name.indexOf(clsFilter.q) >= 0));
    const gs = groupsOf();
    $view.innerHTML = '<div class="page cls-page">' +
      '<div class="cls-hero">' +
      '<div class="ch-top"><div style="min-width:0">' +
      '<button class="ch-nm" id="chSwitch">' + esc(P.d.cls.name || '我的班级') + '<i>⌄</i></button>' +
      '<div class="ch-sub">' + P.d.kids.length + ' 名学生 · 今日全班 +' + classTotal('today') + (P.d.classes.length > 1 ? ' · 共 ' + P.d.classes.length + ' 个班' : '') + '</div></div>' +
      '<button class="ch-set" id="clsSet">⚙️</button></div>' +
      '<div class="ch-acts"' + (P.d.classes.length > 1 ? ' style="grid-template-columns:repeat(4,1fr)"' : '') + '>' +
      '<button id="qaAll"><span>⚡</span>全班加分</button>' +
      '<button id="qaBatch"><span>☑️</span>批量加分</button>' +
      '<button id="qaRnd"><span>🎲</span>随机点名</button>' +
      (P.d.classes.length > 1 ? '<button id="qaCmp"><span>📊</span>跨班对比</button>' : '') +
      '</div></div>' +
      '<div class="cls-tools">' +
      '<input id="clsQ" placeholder="搜索学生" value="' + esc(clsFilter.q) + '">' +
      '<button id="clsRoster">名单</button></div>' +
      (gs.length ? '<div class="chips" id="clsGs">' + ['全部'].concat(gs).map((g) =>
        '<button data-g="' + (g === '全部' ? '' : esc(g)) + '" class="' + ((g === '全部' && !clsFilter.g) || g === clsFilter.g ? 'on' : '') + '">' + esc(g) + '</button>').join('') + '</div>' : '') +
      '<div class="stu-grid" id="stuGrid">' +
      (list.length ? list.map((k) => {
        const r = rankMap[k.id];
        return '<div class="stu' + (r <= 3 ? ' top' + r : '') + '" data-k="' + k.id + '">' +
          '<div class="av"><img src="' + petImg(k) + '" alt="" loading="lazy"></div>' +
          '<div class="nm">' + esc(k.name) + '</div>' +
          '<div class="pt">' + k.points + '</div>' +
          (r <= 3 ? '<i class="rk">' + ['🥇', '🥈', '🥉'][r - 1] + '</i>' : '') +
          '</div>';
      }).join('') : '<div class="card empty" style="grid-column:1/-1">' + (P.d.kids.length ? '没有匹配的学生' : '还没有学生，点右上「名单」导入') + '</div>') +
      '</div></div>';

    const q = document.getElementById('clsQ');
    q.oninput = () => { clsFilter.q = q.value.trim(); const p = q.selectionStart; viewClass(); const n = document.getElementById('clsQ'); n.focus(); n.setSelectionRange(p, p); };
    document.getElementById('chSwitch').onclick = classListSheet;
    document.getElementById('clsSet').onclick = classSetupSheet;
    document.getElementById('clsRoster').onclick = rosterSheet;
    document.getElementById('qaAll').onclick = () => quickAward(P.d.kids.map((k) => k.id));
    document.getElementById('qaBatch').onclick = () => quickAward([]);
    document.getElementById('qaRnd').onclick = randomPick;
    const qc = document.getElementById('qaCmp');
    if (qc) qc.onclick = () => { location.hash = '#/compare'; render(); };
    const gsEl = document.getElementById('clsGs');
    if (gsEl) gsEl.querySelectorAll('button').forEach((b) => (b.onclick = () => { clsFilter.g = b.dataset.g; viewClass(); }));
    document.querySelectorAll('.stu').forEach((c) => (c.onclick = () => stuSheet(c.dataset.k)));
  }

  /* ---------- 单个学生操作 ---------- */
  const WHY_POS = ['积极回答', '作业优秀', '主动帮忙', '进步明显', '纪律优秀'];
  const WHY_NEG = ['上课讲话', '作业未交', '打闹'];
  function stuSheet(id) {
    const k = P.d.kids.find((x) => x.id === id);
    if (!k) return;
    const rTotal = rankOf(k.id, 'total');
    const rWeek = rankOf(k.id, 'week');
    openSheet(
      '<div class="stu-head"><div class="av"><img src="' + petImg(k) + '" alt=""></div>' +
      '<div><div class="sh-nm">' + esc(k.name) + '</div>' +
      '<div class="sh-sub">' + (k.group ? esc(k.group) + ' · ' : '') + (k.skin ? petMeta(k.skin).name : k.pet.name) + ' Lv.' + k.pet.lv + '</div>' +
      '<div class="sh-pt"><b>' + k.points + '</b> 分 · 本周 +' + ptsSince(k, weekStart()) + ' · 第 ' + rTotal + ' 名</div></div></div>' +
      amtsHTML() +
      '<div class="chips" id="shWhy">' + WHY_POS.concat(WHY_NEG).map((w, i) =>
        '<button data-w="' + esc(w) + '"' + (i === 0 ? ' class="on"' : '') + '>' + esc(w) + '</button>').join('') + '</div>' +
      '<div class="field"><input id="shCustom" maxlength="20" placeholder="或自己写个理由（可选）"></div>' +
      '<div style="margin-top:12px"><button class="btn" id="shGo">确认加分</button></div>' +
      '<div class="btn-row" style="margin-top:9px"><button class="btn ghost sm" id="shOpen" style="flex:1">看幻兽主页</button>' +
      '<button class="btn ghost sm" id="shCard" style="flex:1">生成成长卡</button></div>',
      (m, close) => {
        const st = { amt: amts().pos[0] || 1 };
        let why = WHY_POS[0];
        // 选了负分自动把理由切到扣分常用语（反之亦然）
        const syncWhy = () => {
          const cur = m.querySelector('#shWhy button.on');
          const curW = cur ? cur.dataset.w : why;
          if ((st.amt < 0 && WHY_POS.includes(curW)) || (st.amt > 0 && WHY_NEG.includes(curW))) {
            why = st.amt < 0 ? WHY_NEG[0] : WHY_POS[0];
            m.querySelectorAll('#shWhy button').forEach((b) => b.classList.toggle('on', b.dataset.w === why));
          }
          m.querySelector('#shGo').textContent = st.amt > 0 ? '确认加分' : '确认扣分';
        };
        wireAmts(m, st, syncWhy);
        syncWhy();
        m.querySelectorAll('#shWhy button').forEach((b) => (b.onclick = () => {
          m.querySelectorAll('#shWhy button').forEach((x) => x.classList.remove('on'));
          b.classList.add('on'); why = b.dataset.w;
        }));
        m.querySelector('#shGo').onclick = () => {
          const cus = m.querySelector('#shCustom').value.trim();
          const amt = st.amt;
          grantPoints(k, amt, cus || why);
          toast(k.name + ' ' + (amt > 0 ? '+' : '') + amt + ' 分');
          close(); render();
        };
        m.querySelector('#shOpen').onclick = () => { P.d.cur = k.id; P.save(); close(); location.hash = '#/home'; render(); };
        m.querySelector('#shCard').onclick = () => { close(); growthCard(k); };
      });
  }

  /* ---------- 批量 / 全班加分 ---------- */
  function quickAward(preset) {
    let sel = new Set(preset || []);
    const gs = groupsOf();
    openSheet(
      '<div class="sheet-h" id="qaTitle">' + (preset && preset.length === P.d.kids.length && P.d.kids.length ? '全班加分' : '批量加减分') + '</div>' +
      '<div class="tiny" id="qaSub">点学生选中，可多选；底部选分值和理由后一次提交</div>' +
      '<div class="chips" id="qaTools" style="margin-top:10px"><button data-all="1">全选</button><button data-all="0">清空</button>' +
      (gs.length ? gs.map((g) => '<button data-g="' + esc(g) + '">' + esc(g) + '</button>').join('') : '') + '</div>' +
      '<div class="stu-grid sm" id="qaGrid">' + P.d.kids.map((k) =>
        '<div class="stu' + (sel.has(k.id) ? ' sel' : '') + '" data-k="' + k.id + '">' +
        '<div class="av"><img src="' + petImg(k) + '" alt="" loading="lazy"></div>' +
        '<div class="nm">' + esc(k.name) + '</div><i class="ck">✓</i></div>').join('') + '</div>' +
      '<div class="qa-bar">' +
      amtsHTML(true) +
      '<div class="chips" id="qaWhy">' + WHY_POS.concat(WHY_NEG).map((w, i) =>
        '<button data-w="' + esc(w) + '"' + (i === 0 ? ' class="on"' : '') + '>' + esc(w) + '</button>').join('') + '</div>' +
      '<button class="btn" id="qaGo" style="margin-top:10px">给 0 人加分</button></div>',
      (m, close) => {
        const st = { amt: amts().pos[0] || 1 };
        let why = WHY_POS[0];
        const syncWhy = () => {
          const cur = m.querySelector('#qaWhy button.on');
          const curW = cur ? cur.dataset.w : why;
          if ((st.amt < 0 && WHY_POS.includes(curW)) || (st.amt > 0 && WHY_NEG.includes(curW))) {
            why = st.amt < 0 ? WHY_NEG[0] : WHY_POS[0];
            m.querySelectorAll('#qaWhy button').forEach((b) => b.classList.toggle('on', b.dataset.w === why));
          }
        };
        const paint = () => {
          m.querySelectorAll('#qaGrid .stu').forEach((c) => c.classList.toggle('sel', sel.has(c.dataset.k)));
          m.querySelector('#qaGo').textContent = '给 ' + sel.size + ' 人' + (st.amt > 0 ? '加分' : '扣分');
          m.querySelector('#qaGo').disabled = !sel.size;
        };
        m.querySelectorAll('#qaGrid .stu').forEach((c) => (c.onclick = () => {
          const id = c.dataset.k; sel.has(id) ? sel.delete(id) : sel.add(id); paint();
        }));
        m.querySelectorAll('#qaTools button').forEach((b) => (b.onclick = () => {
          if (b.dataset.all === '1') P.d.kids.forEach((k) => sel.add(k.id));
          else if (b.dataset.all === '0') sel.clear();
          else { const g = b.dataset.g; const ids = P.d.kids.filter((k) => k.group === g).map((k) => k.id); const all = ids.every((i) => sel.has(i)); ids.forEach((i) => (all ? sel.delete(i) : sel.add(i))); }
          paint();
        }));
        wireAmts(m, st, () => { syncWhy(); paint(); });
        m.querySelectorAll('#qaWhy button').forEach((b) => (b.onclick = () => {
          m.querySelectorAll('#qaWhy button').forEach((x) => x.classList.remove('on'));
          b.classList.add('on'); why = b.dataset.w;
        }));
        paint();
        m.querySelector('#qaGo').onclick = () => {
          if (!sel.size) return toast('先选学生');
          let n = 0;
          sel.forEach((id) => { const k = P.d.kids.find((x) => x.id === id); if (k) { grantPoints(k, st.amt, why); n++; } });
          close(); render();
          toast('已给 ' + n + ' 人 ' + (st.amt > 0 ? '+' : '') + st.amt + ' 分');
        };
      });
  }

  /* ---------- 随机点名（全班 / 组内，带紧张感动画） ---------- */
  let AC = null;
  function beep(freq, dur, vol, when) {
    if (P.d.snd === false) return;
    try {
      AC = AC || new (window.AudioContext || window.webkitAudioContext)();
      const t = AC.currentTime + (when || 0);
      const o = AC.createOscillator(), g = AC.createGain();
      o.type = 'triangle'; o.frequency.value = freq;
      g.gain.setValueAtTime(0.0001, t);
      g.gain.linearRampToValueAtTime(vol, t + 0.012);
      g.gain.exponentialRampToValueAtTime(0.0001, t + dur);
      o.connect(g); g.connect(AC.destination);
      o.start(t); o.stop(t + dur + 0.03);
    } catch (e) { /* 静音环境忽略 */ }
  }
  /* 老虎机式「哒」声：音调随进度攀升，越到后面越揪心 */
  function tickSnd(p) {
    if (P.d.snd === false) return;
    try {
      AC = AC || new (window.AudioContext || window.webkitAudioContext)();
      const t = AC.currentTime;
      const o = AC.createOscillator(), g = AC.createGain();
      o.type = 'square';
      o.frequency.setValueAtTime(300 + p * 460, t);
      o.frequency.exponentialRampToValueAtTime(300 + p * 460 + 90, t + 0.04);
      g.gain.setValueAtTime(0.0001, t);
      g.gain.linearRampToValueAtTime(0.045, t + 0.005);
      g.gain.exponentialRampToValueAtTime(0.0001, t + 0.055);
      o.connect(g); g.connect(AC.destination);
      o.start(t); o.stop(t + 0.07);
    } catch (e) { /* 静音环境忽略 */ }
  }
  /* 揭晓音效：上行琶音 C5-E5-G5-C6，最后叠一个明亮和弦 */
  function winJingle() {
    if (P.d.snd === false) return;
    const notes = [523.25, 659.25, 783.99, 1046.5];
    notes.forEach((f, i) => beep(f, i === notes.length - 1 ? 0.32 : 0.13, 0.11, i * 0.115));
    beep(1318.5, 0.3, 0.055, notes.length * 0.115);
    beep(1567.98, 0.3, 0.045, notes.length * 0.115 + 0.02);
  }
  function rndPool(key) {
    const c = P.d.cls;
    if (!c.rnd) c.rnd = { pool: [], round: 0 };
    if (!c.rnd.pools) c.rnd.pools = {};
    const idsOf = () => P.d.kids.filter((k) => key === 'all' || k.group === key).map((k) => k.id);
    let st = c.rnd.pools[key];
    if (!st || !Array.isArray(st.pool)) st = c.rnd.pools[key] = { pool: shuffleArr(idsOf()), round: 1 };
    if (!st.pool.length) { st.pool = shuffleArr(idsOf()); st.round = (st.round || 0) + 1; }
    return st;
  }
  function randomPick() {
    if (!P.d.kids.length) return toast('先导入名单');
    const gs = groupsOf();
    const scopes = [{ key: 'all', name: '全班', n: P.d.kids.length }]
      .concat(gs.map((g) => ({ key: g, name: g, n: P.d.kids.filter((k) => k.group === g).length })))
      .filter((x) => x.n > 0);
    if (scopes.length <= 1) return startPick('all', '全班');
    openSheet(
      '<div class="sheet-h">随机点名</div>' +
      '<div class="tiny">选一个范围开始，抽过的人本轮不再重复</div>' +
      '<div class="pk-scopes">' + scopes.map((x) =>
        '<button data-s="' + esc(x.key) + '"><b>' + esc(x.name) + '</b><small>' + x.n + ' 人</small></button>').join('') + '</div>' +
      '<div class="tiny" style="text-align:center;margin-top:12px">点一下就开始抽，全程约 3 秒</div>',
      (m, close) => {
        m.querySelectorAll('[data-s]').forEach((b) => (b.onclick = () => {
          const key = b.dataset.s;
          close();
          startPick(key, key === 'all' ? '全班' : key);
        }));
      });
  }
  function startPick(key, label) {
    const st = rndPool(key);
    const id = st.pool.shift();
    const k = P.d.kids.find((x) => x.id === id);
    if (!k) return toast('这个范围里没有学生');
    P.save();
    const pool = P.d.kids.filter((x) => key === 'all' || x.group === key);
    const left = st.pool.length;

    const m = document.createElement('div');
    m.className = 'pk-stage';
    m.innerHTML =
      '<div class="pk-head"><span>' + esc(label) + ' · 第 ' + st.round + ' 轮</span><span>还剩 ' + left + ' 人</span></div>' +
      '<button class="pk-mute" id="pkMute">' + (P.d.snd === false ? '🔇' : '🔊') + '</button>' +
      '<div class="pk-ring"><div class="pk-av" id="pkAv"><img id="pkImg" src="' + petImg(pool[0] || k) + '" alt=""></div></div>' +
      '<div class="pk-name" id="pkName">···</div>' +
      '<div class="pk-hint" id="pkHint">正在抽取…</div>' +
      '<div class="pk-ops2" id="pkOps" style="display:none"></div>';
    document.body.appendChild(m);
    requestAnimationFrame(() => m.classList.add('in'));

    const nm = m.querySelector('#pkName');
    const img = m.querySelector('#pkImg');
    const hint = m.querySelector('#pkHint');
    let n = 0, delay = 42;
    const TOTAL = 26;
    const tick = () => {
      const r = pool[Math.floor(Math.random() * pool.length)];
      nm.textContent = r.name;
      img.src = petImg(r);
      nm.classList.remove('flip'); void nm.offsetWidth; nm.classList.add('flip');
      tickSnd(n / TOTAL);
      if (n >= TOTAL) { lock(); return; }
      n += 1;
      delay = 42 + Math.pow(n / TOTAL, 2.6) * 300;   // 先快后慢，制造紧张感
      setTimeout(tick, delay);
    };

    function lock() {
      nm.textContent = k.name;
      img.src = petImg(k);
      nm.classList.remove('flip');
      nm.classList.add('lock');
      m.classList.add('locked');
      hint.textContent = '就是你！';
      winJingle();
      if (navigator.vibrate) { try { navigator.vibrate([30, 50, 120]); } catch (e) {} }
      for (let i = 0; i < 22; i++) {
        const sp = document.createElement('i');
        sp.className = 'sparkle pk-spark';
        sp.style.left = (50 + (Math.random() - 0.5) * 46) + '%';
        sp.style.top = (40 + Math.random() * 22) + '%';
        sp.style.animationDelay = (Math.random() * 0.6) + 's';
        m.appendChild(sp);
      }
      const ops = m.querySelector('#pkOps');
      ops.style.display = 'flex';
      ops.innerHTML = amts().pos.slice(0, 2).map((x) => '<button class="btn sm" data-p="' + x + '" style="background:#ffd76e;color:#5b3a00">+' + x + ' 分</button>').join('') +
        '<button class="btn sm ghost" id="pkAgain" style="color:#fff;border-color:rgba(255,255,255,.45);background:transparent">再来一次</button>' +
        '<button class="btn sm ghost" id="pkClose" style="color:rgba(255,255,255,.75);background:transparent">结束</button>';
      ops.querySelectorAll('[data-p]').forEach((b) => (b.onclick = () => {
        const add = parseInt(b.dataset.p, 10);
        grantPoints(k, add, '随机点名 · 回答正确');
        toast(k.name + ' +' + add + ' 分');
        b.disabled = true;
        render();
      }));
      ops.querySelector('#pkAgain').onclick = () => { closeStage(); startPick(key, label); };
      ops.querySelector('#pkClose').onclick = closeStage;
    }
    const closeStage = () => { m.classList.remove('in'); setTimeout(() => m.remove(), 260); };
    m.querySelector('#pkMute').onclick = () => {
      P.d.snd = P.d.snd === false;
      P.save();
      m.querySelector('#pkMute').textContent = P.d.snd === false ? '🔇' : '🔊';
      toast(P.d.snd === false ? '已静音' : '已开启音效');
    };
    setTimeout(tick, 260);
  }

  /* ---------- 光荣榜 ---------- */
  function viewBoard() {
    const p = P.d.cls.period || 'today';
    const rows = rankBy(p);
    const label = { today: '今日', week: '本周', total: '总榜' };
    const top = rows.slice(0, 3);
    const rest = rows.slice(3);
    const podium = (r, idx) => r ? '<div class="pd-' + (idx + 1) + '" data-k="' + r.k.id + '"><div class="pd-av"><img src="' + petImg(r.k) + '" alt=""></div>' +
      '<div class="pd-nm">' + esc(r.k.name) + '</div><div class="pd-v">' + r.v + '</div>' +
      '<div class="pd-base">' + (idx + 1) + '</div></div>' : '';
    const gs = groupsOf();
    const gStat = gs.map((g) => {
      const ms = P.d.kids.filter((k) => k.group === g);
      const sum = ms.reduce((s, k) => s + (p === 'total' ? k.points : ptsSince(k, p === 'today' ? dayStart() : weekStart())), 0);
      return { g, sum, avg: ms.length ? sum / ms.length : 0, n: ms.length };
    }).sort((a, b) => b.avg - a.avg);
    const maxAvg = Math.max(1, ...gStat.map((x) => x.avg));

    $view.innerHTML = '<div class="page board-page">' +
      '<div class="seg" id="bdSeg" style="grid-template-columns:repeat(3,1fr)">' +
      ['today', 'week', 'total'].map((x) => '<button data-p="' + x + '"' + (p === x ? ' class="on"' : '') + '>' + label[x] + '</button>').join('') + '</div>' +
      (rows.length ? '<div class="podium">' + podium(top[1], 1) + podium(top[0], 0) + podium(top[2], 2) + '</div>' : '') +
      '<div class="section-h"><h2>' + label[p] + '排行</h2><span class="sub">全班共 +' + rows.reduce((s, r) => s + r.v, 0) + ' 分</span></div>' +
      '<div class="board">' + (rest.length ? rest.map((r) =>
        '<div class="bd-row" data-k="' + r.k.id + '"><span class="bd-rk">' + r.rank + '</span>' +
        '<span class="bd-av"><img src="' + petImg(r.k) + '" alt="" loading="lazy"></span>' +
        '<span class="bd-nm">' + esc(r.k.name) + (r.k.group ? '<i>' + esc(r.k.group) + '</i>' : '') + '</span>' +
        '<span class="bd-v">' + r.v + '</span></div>').join('') : (rows.length ? '<div class="card empty">只有 3 名学生上榜</div>' : '<div class="card empty">还没有学生</div>')) + '</div>' +
      (gStat.length > 1 ? '<div class="section-h"><h2>小组 PK</h2><span class="sub">按人均分</span></div>' +
        '<div class="card">' + gStat.map((x) => '<div class="gpk"><div class="gp-h"><b>' + esc(x.g) + '</b><span>' + x.n + ' 人 · 人均 ' + x.avg.toFixed(1) + '</span></div>' +
          '<div class="gp-bar"><i style="width:' + Math.max(4, (x.avg / maxAvg) * 100) + '%"></i></div></div>').join('') + '</div>' : '') +
      '</div>';
    document.querySelectorAll('#bdSeg button').forEach((b) => (b.onclick = () => { P.d.cls.period = b.dataset.p; P.save(); render(); }));
    document.querySelectorAll('.bd-row').forEach((r) => (r.onclick = () => stuSheet(r.dataset.k)));
    document.querySelectorAll('.podium [data-k]').forEach((d) => (d.onclick = () => stuSheet(d.dataset.k)));
  }

  /* ---------- 跨班对比 ---------- */
  let cmpPeriod = 'total';
  function viewCompare() {
    if (!isClass() || P.d.classes.length < 2) {
      $view.innerHTML = '<div class="page"><div class="card empty" style="padding:34px 16px;text-align:center">' +
        '至少要 2 个班才能对比<br><span class="tiny">去「全班 → 班级名 → 新建班级」再加一个班</span></div></div>';
      return;
    }
    P.save();
    const from = cmpPeriod === 'today' ? dayStart() : cmpPeriod === 'week' ? weekStart() : 0;
    const val = (k) => (cmpPeriod === 'total' ? k.points : ptsSince(k, from));
    const rows = P.d.classes.map((e) => {
      const kids = e.kids || [];
      const sum = kids.reduce((s, k) => s + val(k), 0);
      const lv = kids.length ? kids.reduce((s, k) => s + k.pet.lv, 0) / kids.length : 0;
      const sorted = kids.slice().sort((a, b) => val(b) - val(a));
      return { e, n: kids.length, sum, avg: kids.length ? sum / kids.length : 0, lv, top: sorted[0], topV: sorted[0] ? val(sorted[0]) : 0 };
    }).sort((a, b) => b.avg - a.avg || b.sum - a.sum);
    const maxAvg = Math.max(1, ...rows.map((r) => r.avg));
    const label = { today: '今日', week: '本周', total: '总榜' }[cmpPeriod];

    // 年级混排 TOP10
    const all = [];
    P.d.classes.forEach((c) => (c.kids || []).forEach((k) => all.push({ k, cls: c, v: val(k) })));
    all.sort((a, b) => b.v - a.v || a.k.name.localeCompare(b.k.name, 'zh'));
    const topAll = all.filter((x) => x.v > 0).slice(0, 10);

    $view.innerHTML = '<div class="page">' +
      '<div class="section-h"><h2>跨班对比</h2><span class="sub">' + P.d.classes.length + ' 个班 · 按人均积分排</span></div>' +
      '<div class="seg" id="cmpSeg" style="grid-template-columns:repeat(3,1fr)">' +
      ['today', 'week', 'total'].map((x) => '<button data-p="' + x + '"' + (cmpPeriod === x ? ' class="on"' : '') + '>' +
        (x === 'today' ? '今日' : x === 'week' ? '本周' : '总榜') + '</button>').join('') + '</div>' +
      '<div class="cmp-list col2">' + rows.map((r, i) =>
        '<div class="cmp-card' + (i === 0 && r.avg > 0 ? ' lead' : '') + '" data-c="' + r.e.id + '">' +
        '<div class="cc-h"><span class="cc-rk">' + (i + 1) + '</span><b>' + esc(r.e.name) + '</b>' +
        (r.e.id === P.d.clsId ? '<span class="cc-cur">当前</span>' : '') +
        '<span class="cc-avg">' + r.avg.toFixed(1) + '<i>人均</i></span></div>' +
        '<div class="cc-bar"><i style="width:' + Math.max(r.avg > 0 ? 4 : 0, (r.avg / maxAvg) * 100) + '%"></i></div>' +
        '<div class="cc-m"><span><b>' + r.n + '</b> 人</span><span>合计 <b>' + r.sum + '</b> 分</span><span>平均 <b>Lv.' + r.lv.toFixed(1) + '</b></span></div>' +
        (r.top ? '<div class="cc-star">👑 ' + label + '之星 ' + esc(r.top.name) + (r.topV ? ' +' + r.topV : ' 0 分') + '</div>' : '') +
        '</div>').join('') + '</div>' +
      '<div class="section-h"><h2>年级 TOP 10</h2><span class="sub">' + label + ' · 所有班混排</span></div>' +
      (topAll.length ? '<div class="board">' + topAll.map((x, i) =>
        '<div class="bd-row" data-c="' + x.cls.id + '" data-k="' + x.k.id + '">' +
        '<span class="bd-rk' + (i < 3 ? ' hot' : '') + '">' + (i + 1) + '</span>' +
        '<span class="bd-av"><img src="' + petImg(x.k) + '" alt="" loading="lazy"></span>' +
        '<span class="bd-nm">' + esc(x.k.name) + '<i>' + esc(x.cls.name) + '</i></span>' +
        '<span class="bd-v">' + x.v + '</span></div>').join('') + '</div>'
        : '<div class="card empty">' + label + '还没有人得分</div>') +
      '<div class="tiny" style="text-align:center;margin-top:4px">点班级卡片可以切换过去；点 TOP10 里的学生可以查看他的幻兽</div>' +
      '</div>';

    document.querySelectorAll('#cmpSeg button').forEach((b) => (b.onclick = () => { cmpPeriod = b.dataset.p; render(); }));
    document.querySelectorAll('.cmp-card').forEach((c) => (c.onclick = () => {
      if (c.dataset.c === P.d.clsId) { location.hash = '#/class'; render(); return; }
      switchClass(c.dataset.c); location.hash = '#/class';
    }));
    document.querySelectorAll('.bd-row').forEach((r) => (r.onclick = () => {
      if (r.dataset.c !== P.d.clsId) switchClass(r.dataset.c);
      const k = P.d.kids.find((x) => x.id === r.dataset.k);
      if (k) { P.d.cur = k.id; P.save(); stuSheet(k.id); }
    }));
  }

  /* ---------- 自定义快捷分值 ---------- */
  function amtSetupSheet() {
    const a = amts();
    openSheet(
      '<div class="sheet-h">自定义加减分按钮</div>' +
      '<div class="tiny" style="margin-top:4px">填常用分值，逗号隔开，最多各 6 个；扣分填正数就会自动变成「−」</div>' +
      '<div class="field"><label>加分按钮</label><input id="asPos" inputmode="numeric" placeholder="1,2,3,5,10" value="' + a.pos.join(',') + '"></div>' +
      '<div class="field"><label>扣分按钮</label><input id="asNeg" inputmode="numeric" placeholder="1,2" value="' + a.neg.map((n) => Math.abs(n)).join(',') + '"></div>' +
      '<div class="tiny" style="margin:12px 2px 6px">效果预览</div>' +
      '<div class="amts" id="asPrev"></div>' +
      '<div class="btn-row" style="margin-top:14px"><button class="btn ghost" id="asReset">恢复默认</button><button class="btn" id="asSave">保存</button></div>',
      (m, close) => {
        const posIn = m.querySelector('#asPos');
        const negIn = m.querySelector('#asNeg');
        const prev = m.querySelector('#asPrev');
        const draw = () => {
          const list = parseAmts(posIn.value, false).concat(parseAmts(negIn.value, true));
          prev.innerHTML = list.length
            ? list.map((n) => '<button class="' + (n < 0 ? 'neg' : '') + '" disabled>' + (n > 0 ? '+' : '') + n + '</button>').join('')
            : '<span class="tiny">还没有分值</span>';
        };
        posIn.oninput = draw; negIn.oninput = draw; draw();
        m.querySelector('#asReset').onclick = () => {
          posIn.value = AMT_DEF.pos.join(',');
          negIn.value = AMT_DEF.neg.join(',');
          draw();
        };
        m.querySelector('#asSave').onclick = () => {
          const pos = parseAmts(posIn.value, false);
          const neg = parseAmts(negIn.value, true);
          if (!pos.length) return toast('加分按钮至少留一个');
          a.pos = pos; a.neg = neg; a.recent = [];
          P.save(); close(); toast('已保存，点学生试试');
        };
      });
  }

  /* ---------- 班级设置 ---------- */
  function classSetupSheet() {
    openSheet(
      '<div class="sheet-h">班级设置</div>' +
      '<div class="field"><label>班级名称</label><input id="cnName" maxlength="14" placeholder="比如：三年二班" value="' + esc(P.d.cls.name) + '"></div>' +
      '<div class="section-h" style="margin-top:16px"><h2>积分配置</h2></div>' +
      '<div class="tiny" style="margin:2px 2px 8px">排行榜默认周期</div>' +
      '<div class="seg" id="cnPeriod" style="grid-template-columns:repeat(3,1fr)">' +
      [['today', '今日'], ['week', '本周'], ['total', '总榜']].map(([v, t]) => '<button data-v="' + v + '"' + (P.d.cls.period === v ? ' class="on"' : '') + '>' + t + '</button>').join('') + '</div>' +
      '<div class="section-h" style="margin-top:16px"><h2>快捷分值</h2></div>' +
      '<div class="tiny" style="margin:2px 2px 8px">加减分面板上的按钮可自己定；临时要别的分值，点「± 自定」即可</div>' +
      '<div class="btn-row"><button class="btn ghost" id="csAmt">自定义加减分按钮</button></div>' +
      '<div class="section-h" style="margin-top:16px"><h2>班级</h2></div>' +
      '<div class="tiny" style="margin:2px 2px 8px">共 ' + P.d.classes.length + ' 个班，每个班的名单和积分互相独立</div>' +
      '<div class="btn-row"><button class="btn ghost" id="csSwitch">切换班级</button><button class="btn ghost" id="csNew">＋ 新建班级</button></div>' +
      '<div class="btn-row" style="margin-top:9px"><button class="btn ghost" id="csDel" style="color:var(--bad)">删除当前班级</button></div>' +
      '<div class="section-h" style="margin-top:18px"><h2>名单</h2></div>' +
      '<div class="btn-row" style="margin-top:8px"><button class="btn ghost" id="csRoster">导入 / 管理名单</button></div>' +
      '<div class="section-h" style="margin-top:18px"><h2>学期重置</h2></div>' +
      '<div class="btn-row" style="margin-top:8px"><button class="btn ghost" id="csResetPts">只清空积分</button><button class="btn ghost" id="csResetAll">全新开始</button></div>' +
      '<div class="tiny" style="margin-top:8px">「只清空积分」保留幻兽等级和图鉴；「全新开始」所有幻兽回到幻兽蛋。</div>' +
      '<div class="section-h" style="margin-top:18px"><h2>模式</h2></div>' +
      '<div class="btn-row" style="margin-top:8px"><button class="btn ghost" id="csExit">关闭班级模式（回到家庭版）</button></div>',
      (m, close) => {
        m.querySelector('#cnName').onchange = (e) => { P.d.cls.name = e.target.value.trim(); P.save(); render(); };
        m.querySelectorAll('#cnPeriod button').forEach((b) => (b.onclick = () => {
          m.querySelectorAll('#cnPeriod button').forEach((x) => x.classList.remove('on'));
          b.classList.add('on'); P.d.cls.period = b.dataset.v; P.save();
        }));
        m.querySelector('#csAmt').onclick = () => { close(); amtSetupSheet(); };
        m.querySelector('#csRoster').onclick = () => { close(); rosterSheet(); };
        m.querySelector('#csSwitch').onclick = () => { close(); classListSheet(); };
        m.querySelector('#csNew').onclick = () => { close(); newClassSheet(); };
        m.querySelector('#csDel').onclick = () => {
          const cur = P.d.classes.find((c) => c.id === P.d.clsId);
          if (!cur) return;
          if (P.d.classes.length <= 1) return toast('至少要保留一个班');
          if (!confirm('删除「' + cur.name + '」？该班 ' + (cur.kids || []).length + ' 名学生的积分和幻兽都会删除，不可恢复。')) return;
          const nm = cur.name;
          deleteClass(cur.id);
          close(); toast('已删除「' + nm + '」');
        };
        m.querySelector('#csResetPts').onclick = () => resetSheet(false);
        m.querySelector('#csResetAll').onclick = () => resetSheet(true);
        m.querySelector('#csExit').onclick = () => {
          P.d.cls.on = false; P.save(); close(); location.hash = '#/home'; render(); toast('已回到家庭模式');
        };
      });
  }
  function resetSheet(all) {
    openSheet('<div class="sheet-h">' + (all ? '全新开始？' : '清空积分？') + '</div>' +
      '<div class="tiny" style="margin-top:6px">' + (all ? '全部学生的积分、幻兽等级、图鉴、记录都会清空。' : '积分和记录清零，幻兽等级与图鉴保留。') + '名单不会删除。</div>' +
      '<div class="btn-row" style="margin-top:16px"><button class="btn ghost" id="rsN">取消</button><button class="btn" id="rsY" style="background:var(--bad)">确定</button></div>',
      (m, c) => {
        m.querySelector('#rsN').onclick = c;
        m.querySelector('#rsY').onclick = () => {
          P.d.kids.forEach((k) => {
            k.points = 0; k.daily = {};
            if (all) {
              const type = k.pet.type;
              k.pet = { name: petMeta(type).name, type, exp: 0, lv: 1 };
              k.dex = { egg: true }; k.companions = []; k.milestones = []; k.skin = null;
            }
          });
          P.d.log = []; P.d.pending = []; P.d.doneToday = {};
          P.d.cls.since = Date.now();
          P.save(); c(); render(); toast('已重置');
        };
      });
  }

  /* ---------- 名单管理 ---------- */
  function rosterSheet() {
    openSheet(
      '<div class="sheet-h">名单管理</div>' +
      '<div class="tiny">当前 ' + P.d.kids.length + ' 人</div>' +
      '<div class="btn-row" style="margin-top:10px"><button class="btn" id="rsImport">批量粘贴导入</button><button class="btn ghost" id="rsOne">＋ 添加一人</button></div>' +
      '<div style="margin-top:14px;max-height:46vh;overflow:auto" id="rsList">' + rosterRows() + '</div>',
      (m, close) => {
        const repaint = () => { m.querySelector('#rsList').innerHTML = rosterRows(); bindRows(); render(); };
        const bindRows = () => {
          m.querySelectorAll('[data-del]').forEach((b) => (b.onclick = () => {
            const k = P.d.kids.find((x) => x.id === b.dataset.del);
            if (!k) return;
            if (!confirm('删除 ' + k.name + ' 的积分和幻兽记录？')) return;
            P.d.kids = P.d.kids.filter((x) => x.id !== k.id);
            P.d.log = P.d.log.filter((l) => l.kid !== k.id);
            if (P.d.cur === k.id) P.d.cur = (P.d.kids[0] || {}).id;
            P.save(); repaint(); toast('已删除');
          }));
          m.querySelectorAll('[data-ren]').forEach((b) => (b.onclick = () => {
            const k = P.d.kids.find((x) => x.id === b.dataset.ren);
            const v = prompt('新的名字', k.name);
            if (v && v.trim()) { k.name = v.trim(); P.save(); repaint(); }
          }));
        };
        bindRows();
        m.querySelector('#rsImport').onclick = () => { close(); importSheet(); };
        m.querySelector('#rsOne').onclick = () => { close(); addKidSheet(); };
      });
  }
  function rosterRows() {
    if (!P.d.kids.length) return '<div class="empty">还没有学生</div>';
    return P.d.kids.map((k, i) => '<div class="pend-item"><div class="body"><div class="pn">' + (i + 1) + '. ' + esc(k.name) +
      '<span class="tiny" style="margin-left:8px">' + (k.group ? esc(k.group) : '未分组') + ' · ' + k.points + ' 分 · Lv.' + k.pet.lv + '</span></div></div>' +
      '<div class="ops"><button class="ok" data-ren="' + k.id + '">✏️</button><button class="no" data-del="' + k.id + '">🗑</button></div></div>').join('');
  }
  function importSheet() {
    openSheet(
      '<div class="sheet-h">导入名单</div>' +
      '<div class="tiny" style="margin-top:6px">一行一个学生。想分组就写成「小明 第一组」，用空格或逗号隔开。</div>' +
      '<div class="field"><textarea id="imTx" rows="9" placeholder="张小明&#10;李小红 第一组&#10;王小刚,第二组" style="width:100%;padding:12px;border-radius:13px;border:1.5px solid var(--line);font-family:inherit;font-size:14px;line-height:1.7;resize:vertical"></textarea></div>' +
      '<label class="ck-line"><input type="checkbox" id="imRep"> 覆盖原名单（不勾选则追加，重名自动跳过）</label>' +
      '<div style="margin-top:12px"><button class="btn" id="imGo">导入</button></div>',
      (m, close) => {
        m.querySelector('#imGo').onclick = () => {
          const txt = m.querySelector('#imTx').value;
          const rep = m.querySelector('#imRep').checked;
          const r = importRoster(txt, rep);
          close(); render();
          toast('导入 ' + r.added + ' 人' + (r.skip ? '，跳过重名 ' + r.skip : ''));
        };
      });
  }
  function importRoster(text, replace) {
    const lines = String(text || '').split(/\r?\n/).map((s) => s.trim()).filter(Boolean);
    if (replace) { P.d.kids = []; P.d.log = []; P.d.pending = []; P.d.cur = null; }
    let added = 0, skip = 0;
    lines.forEach((line) => {
      line = line.replace(/^\d+[.、,，\s]+/, '');
      const parts = line.split(/[\s,，、\t]+/).filter(Boolean);
      const name = parts[0];
      if (!name) return;
      let group = parts[1] || '';
      if (group && !P.d.cls.groups.includes(group)) P.d.cls.groups.push(group);
      if (P.d.kids.some((x) => x.name === name)) { skip++; return; }
      P.d.kids.push(newStu(name, group));
      added++;
    });
    if (!P.d.cur && P.d.kids.length) P.d.cur = P.d.kids[0].id;
    P.save();
    return { added, skip };
  }

  /* ---------- 手机扫码迁移 ----------
     电脑「发到手机」出二维码 → 手机打开同一网址 → 老师 → 数据备份 → 扫码接收
     单张 1400 字符，二维码按整数倍模块画在 canvas 上（比缩放图片清晰得多）
  */
  const QR_CHUNK = 1400;
  const QR_MAX_CHUNKS = 20;

  /* 生成后用 jsQR 自检：个别「版本+数据」组合 jsQR 会解不出来（zxing 能解），
     这时把每张切短一点重新分组，直到每一张都能被自己的接收端解码 */
  function qrSelfCheck(str) {
    try {
      const cv = document.createElement('canvas');
      drawQr(cv, str, 480);
      const g = cv.getContext('2d');
      const r = jsQR(g.getImageData(0, 0, cv.width, cv.height).data, cv.width, cv.height);
      return !!(r && r.data === str);
    } catch (e) { return true; }
  }

  function qrChunks() {
    const zip = LZString.compressToEncodedURIComponent(JSON.stringify(P.d));
    for (let k = Math.ceil(zip.length / QR_CHUNK) || 1; k <= QR_MAX_CHUNKS + 4; k++) {
      const l = Math.ceil(zip.length / k);
      const out = [];
      for (let i = 0; i < k; i++) {
        out.push('PZ1|' + (i + 1) + '|' + k + '|' + zip.slice(i * l, (i + 1) * l));
      }
      if (out.every(qrSelfCheck)) return out;
    }
    /* 全部尝试失败：按最小张数返回，接收端还有 BarcodeDetector 兜底 */
    const k0 = Math.ceil(zip.length / QR_CHUNK) || 1, l0 = Math.ceil(zip.length / k0), out0 = [];
    for (let i = 0; i < k0; i++) out0.push('PZ1|' + (i + 1) + '|' + k0 + '|' + zip.slice(i * l0, (i + 1) * l0));
    return out0;
  }

  /* 按整数倍模块绘制：每个黑块都落在整像素上，摄像头解码更稳 */
  function drawQr(cv, str, maxCss) {
    const qr = qrcode(0, 'L');
    qr.addData(str, 'Byte');
    qr.make();
    const n = qr.getModuleCount();
    const quiet = 4, total = n + quiet * 2;
    const view = Math.min(window.innerWidth || 360, 560);
    const css = Math.min(maxCss || 320, Math.floor(view * 0.82));
    const dpr = Math.min(window.devicePixelRatio || 1, 2);
    const scale = Math.max(2, Math.floor((css * dpr) / total));
    const px = total * scale;
    cv.width = px; cv.height = px;
    cv.style.width = Math.min(css, px) + 'px';
    cv.style.height = 'auto';
    const g = cv.getContext('2d');
    g.fillStyle = '#fff'; g.fillRect(0, 0, px, px);
    g.fillStyle = '#101018';
    for (let r = 0; r < n; r++) {
      for (let c = 0; c < n; c++) {
        if (qr.isDark(r, c)) g.fillRect((c + quiet) * scale, (r + quiet) * scale, scale, scale);
      }
    }
  }

  function collectChunks(text, store) {
    /* 非贪婪 + 前瞻：多张文本连在一起粘贴时，下一段的 "PZ1|" 不会被上一段吞掉 */
    const re = /PZ1\|(\d+)\|(\d+)\|([A-Za-z0-9+\-$\_]+?)(?=PZ1\||\s|$)/g;
    let mm, total = 0;
    while ((mm = re.exec(String(text)))) {
      total = +mm[2];
      store[+mm[1] - 1] = mm[3];
    }
    return total;
  }
  function tryFinish(store, total, cb) {
    if (!total) return false;
    for (let i = 0; i < total; i++) if (!store[i]) return false;
    try {
      const d = JSON.parse(LZString.decompressFromEncodedURIComponent(store.join('')));
      if (!d || !Array.isArray(d.kids)) throw 0;
      cb(d);
    } catch (e) { toast('数据解析失败，请重试'); }
    return true;
  }

  /* 导入的数据统一转成「多班结构」并给当前班打时间戳：
     否则本地没有 classes，云同步一拉取就把刚导入的数据盖回去 */
  function adoptImported(d) {
    if (!d || typeof d !== 'object') return d;
    if (!Array.isArray(d.classes)) d.classes = [];
    if (!d.classes.length && Array.isArray(d.kids) && d.kids.length) {
      const cid = 'c' + Date.now().toString(36);
      d.classes.push({
        id: cid,
        name: (d.cls && d.cls.name) || (d.cls && d.cls.on ? '我的班级' : '家庭'),
        kids: d.kids,
        groups: (d.cls && Array.isArray(d.cls.groups) && d.cls.groups.length) ? d.cls.groups.slice() : GROUPS_DEFAULT.slice(),
        period: (d.cls && d.cls.period) || 'today',
        rnd: (d.cls && d.cls.rnd) || { pool: [], round: 0 },
        since: (d.cls && d.cls.since) || Date.now()
      });
      d.clsId = cid;
    }
    if (!d.clsId && d.classes.length) d.clsId = d.classes[0].id;
    const e = d.classes.filter((c) => c.id === d.clsId)[0];
    if (e) e._ts = Date.now();
    return d;
  }

  function confirmQrImport(d) {
    const n = (d.kids || []).length;
    const clsName = (d.cls && d.cls.name) || (d.classes && d.classes[0] && d.classes[0].name) || '';
    openSheet(
      '<div class="sheet-h">发现迁移数据</div>' +
      '<div class="card" style="margin-top:10px"><div style="text-align:center;font-size:30px">📦</div>' +
      '<div style="text-align:center;font-weight:750;font-size:16px;margin-top:4px">' + esc(clsName || '班级数据') + '</div>' +
      '<div class="tiny" style="text-align:center;margin-top:4px">' + n + ' 名' + (d.cls && d.cls.on ? '学生' : '孩子') + ' · 积分与幻兽原样搬过来</div></div>' +
      '<div class="warn" style="margin-top:10px">导入会<b>覆盖</b>本机现有数据。系统会先把本机这一份存进「恢复历史版本」，误操作还能找回。</div>' +
      '<div style="margin-top:12px"><button class="btn" id="qiGo">确认导入</button></div>',
      (m, close) => {
        m.querySelector('#qiGo').onclick = () => {
          try { if (window.BEAST_SYNC && window.BEAST_SYNC.backup) window.BEAST_SYNC.backup(); } catch (e) {}
          P.d = adoptImported(d);
          P.save(); close();
          toast('已导入，正在刷新…');
          setTimeout(() => location.reload(), 400);
        };
      });
  }

  /* 打开全屏扫码/发码页前先清掉所有弹层遮罩：
     老师面板 → 数据备份 是两层弹层，残留的遮罩会盖住扫码页（表现为「点开闪一下就没反应」） */
  function clearSheets() {
    document.querySelectorAll('.sheet-mask').forEach((m) => m.remove());
  }

  function qrExportSheet() {
    let chunks = [], idx = 0, timer = null;
    clearSheets();
    openSheet(
      '<div class="sheet-h">发到手机</div>' +
      '<div class="tiny" style="margin-top:6px">手机打开<b>同一个网址</b> → 右上角「老师」→ 数据备份 → <b>扫码接收</b>，对准屏幕上的码即可。多张请逐张扫，扫齐自动合并。</div>' +
      '<div id="qrBox" style="text-align:center;margin-top:14px;min-height:240px"></div>' +
      '<div id="qrCnt" style="text-align:center;font-weight:750;font-size:14px;margin-top:8px"></div>' +
      '<div class="btn-row" style="margin-top:10px"><button class="btn ghost" id="qrPrev">‹ 上一张</button><button class="btn ghost" id="qrNext">下一张 ›</button></div>' +
      '<div style="margin-top:9px"><button class="btn ghost" id="qrAuto">▶ 自动翻页</button></div>' +
      '<div class="tiny" style="margin-top:8px;color:var(--text-3)">点二维码可放大，便于远距离扫描；电脑上也可用 ← → 键翻页。</div>',
      (m, close) => {
        try { chunks = qrChunks(); } catch (e) { return close(); }
        if (chunks.length > QR_MAX_CHUNKS) {
          close();
          return toast('数据太多（' + chunks.length + ' 张码），建议改用「导出 JSON」再拷贝文件');
        }
        const box = m.querySelector('#qrBox');
        const cv = document.createElement('canvas');
        cv.className = 'qr-canvas';
        box.appendChild(cv);
        const paint = () => {
          drawQr(cv, chunks[idx], 320);
          m.querySelector('#qrCnt').textContent = chunks.length > 1
            ? '第 ' + (idx + 1) + ' / ' + chunks.length + ' 张 · 全部扫完才生效'
            : '一张就够，扫完自动导入';
        };
        const go = (d) => { idx = (idx + d + chunks.length) % chunks.length; paint(); };
        paint();
        m.querySelector('#qrPrev').onclick = () => go(-1);
        m.querySelector('#qrNext').onclick = () => go(1);
        m.querySelector('#qrAuto').onclick = (e) => {
          const b = e.currentTarget;
          if (timer) { clearInterval(timer); timer = null; b.textContent = '▶ 自动翻页'; return; }
          b.textContent = '⏸ 暂停自动翻页';
          timer = setInterval(() => {
            if (!document.body.contains(m)) { clearInterval(timer); timer = null; return; }
            go(1);
          }, 6000);
        };
        cv.onclick = () => cv.classList.toggle('big');
        const key = (e) => {
          if (e.key === 'ArrowLeft') go(-1);
          else if (e.key === 'ArrowRight') go(1);
        };
        document.addEventListener('keydown', key);
        m.addEventListener('click', (e) => { if (e.target === m) document.removeEventListener('keydown', key); });
      });
  }

  function qrImportSheet(fromWelcome) {
    let stream = null, store = [], total = 0, done = false, lastHit = '', torchOn = false;
    clearSheets();
    const el = document.createElement('div');
    el.className = 'qr-scan';
    el.innerHTML =
      '<div class="qs-box">' +
      '<div class="qs-h">扫码接收</div>' +
      '<div class="qs-v" id="qsVWrap">' +
      '<video id="qsV" playsinline muted autoplay></video>' +
      '<div class="qs-frame"></div>' +
      '<div class="qs-load" id="qsLoad">正在打开摄像头…</div>' +
      '<button class="qs-torch" id="qsTorch" style="display:none">💡 补光</button>' +
      '</div>' +
      '<div class="qs-fail" id="qsFail" style="display:none">' +
      '<div class="qf-ico">📷</div>' +
      '<div class="qf-t" id="qsFailT">摄像头打不开</div>' +
      '<div class="qf-d" id="qsFailD"></div>' +
      '<div class="qf-row"><button class="btn ghost mini" id="qsCopy">复制网址</button><button class="btn ghost mini" id="qsRetry">重试摄像头</button></div>' +
      '</div>' +
      '<div class="qs-bar"><i id="qsBar"></i></div>' +
      '<div class="qs-tip" id="qsTip">把手机对准另一台设备上的二维码<span id="qsP">等待识别…</span></div>' +
      '<div class="btn-row"><button class="btn ghost" id="qsPaste">粘贴导入</button><button class="btn ghost" id="qsStop">取消</button></div>' +
      '<div id="qsBox" style="display:none;margin-top:10px">' +
      '<textarea id="qsTxt" rows="5" placeholder="把二维码下方的文本粘贴进来（可一次粘贴多张）" style="width:100%;padding:11px;border-radius:12px;border:1.5px solid var(--line);font-family:monospace;font-size:12px;line-height:1.6;resize:vertical"></textarea>' +
      '<div style="margin-top:9px"><button class="btn" id="qsGo">解析并导入</button></div></div>' +
      '</div>';
    document.body.appendChild(el);
    const q = (s) => el.querySelector(s);
    const isWx = /MicroMessenger/i.test(navigator.userAgent);
    const stop = () => {
      done = true;
      if (stream) { stream.getTracks().forEach((t) => { try { t.stop(); } catch (e) {} }); stream = null; }
    };
    const paint = () => {
      const got = store.filter(Boolean).length;
      q('#qsP').textContent = total ? ('已收到 ' + got + ' / ' + total + ' 张') : '等待识别…';
      q('#qsBar').style.width = (total ? Math.round(got / total * 100) : 0) + '%';
    };
    const finish = (d) => {
      stop(); el.remove();
      confirmQrImport(d);
    };
    const showFail = (title, desc) => {
      q('#qsVWrap').style.display = 'none';
      q('#qsFail').style.display = 'block';
      q('#qsFailT').textContent = title;
      q('#qsFailD').innerHTML = desc;
      q('#qsBox').style.display = 'block';   /* 摄像头不可用时直接露出粘贴框 */
      q('#qsBar').style.display = 'none';
      q('#qsTip').style.display = 'none';
    };

    q('#qsStop').onclick = () => { stop(); el.remove(); if (fromWelcome) welcome(); };
    q('#qsPaste').onclick = () => {
      const b = q('#qsBox');
      b.style.display = b.style.display === 'none' ? 'block' : 'none';
    };
    q('#qsCopy').onclick = () => {
      const url = location.href.split('#')[0];
      const done2 = () => toast('网址已复制，粘贴到浏览器打开即可');
      if (navigator.clipboard && navigator.clipboard.writeText) {
        navigator.clipboard.writeText(url).then(done2).catch(() => {});
      } else {
        const ta = document.createElement('textarea');
        ta.value = url; document.body.appendChild(ta); ta.select();
        try { document.execCommand('copy'); done2(); } catch (e) {}
        ta.remove();
      }
    };
    q('#qsGo').onclick = () => {
      const t = collectChunks(q('#qsTxt').value, store);
      if (!t) { toast('没有识别到迁移数据'); return; }
      total = t; paint();
      if (!tryFinish(store, total, finish)) toast('还差 ' + (total - store.filter(Boolean).length) + ' 张，请把其余文本也粘贴进来');
    };

    /* 手机 Chrome / 新版 Safari 内置条码引擎（BarcodeDetector），识别率比 jsQR 高；
       不支持时自动回退 jsQR */
    let detector = null;
    try {
      if ('BarcodeDetector' in window) detector = new BarcodeDetector({ formats: ['qr_code'] });
    } catch (e) { detector = null; }

    const handle = (data) => {
      const n = collectChunks(data, store);
      if (!n) return;
      lastHit = data;
      total = n; paint();
      if (navigator.vibrate) { try { navigator.vibrate(35); } catch (e) {} }
      tryFinish(store, total, finish);
    };

    const tick = () => {
      if (done || !stream) return;
      const v = q('#qsV');
      if (v && v.readyState >= 2 && v.videoWidth) {
        if (detector) {
          detector.detect(v).then((codes) => {
            if (done || !stream) return;
            for (const c of codes) {
              if (c.rawValue && c.rawValue !== lastHit) { handle(c.rawValue); break; }
            }
          }).catch(() => {}).finally(() => { if (!done) setTimeout(tick, 140); });
          return;
        }
        const c = document.createElement('canvas');
        c.width = v.videoWidth; c.height = v.videoHeight;
        const g = c.getContext('2d');
        g.drawImage(v, 0, 0);
        let code = null;
        try { code = jsQR(g.getImageData(0, 0, c.width, c.height).data, c.width, c.height); } catch (e) {}
        if (code && code.data && code.data !== lastHit) handle(code.data);
      }
      if (!done) setTimeout(tick, 140);
    };

    let camTimer = null, failShown = false;
    const startCam = () => {
      clearTimeout(camTimer);
      failShown = false;
      q('#qsFail').style.display = 'none';
      q('#qsVWrap').style.display = '';
      q('#qsBar').style.display = '';
      q('#qsTip').style.display = '';
      q('#qsLoad').style.display = 'grid';
      q('#qsLoad').textContent = '正在打开摄像头…';
      if (!(navigator.mediaDevices && navigator.mediaDevices.getUserMedia)) {
        showFail('这个浏览器不支持摄像头',
          isWx ? '微信里不能直接调摄像头。<br>点右上角 <b>「···」→「在浏览器打开」</b>，再回到「老师 → 数据备份 → 扫码接收」。'
               : '请换用手机自带浏览器（Chrome / Safari）打开本页。');
        return;
      }
      /* 微信 WebView 里 getUserMedia 有时既不成功也不报错，卡在这句；
         3.5 秒还没画面就直接给提示，别让老师干等 */
      camTimer = setTimeout(() => {
        if (!stream && !done && !failShown) {
          try { if (stream) stream.getTracks().forEach((t) => t.stop()); } catch (e) {}
          showFail('摄像头没有响应',
            isWx ? '微信里不能直接调摄像头。<br>点右上角 <b>「···」→「在浏览器打开」</b>，再回到「老师 → 数据备份 → 扫码接收」。'
                 : '可能没给摄像头权限。可以点「重试摄像头」，或直接在下面<b>粘贴</b>二维码文本。');
        }
      }, 3500);
      const openCam = (c) => navigator.mediaDevices.getUserMedia(c).then((st) => {
        clearTimeout(camTimer);
        stream = st;
        const v = q('#qsV');
        v.srcObject = st;
        const p = v.play();
        if (p && p.catch) p.catch(() => {});
        q('#qsLoad').style.display = 'none';
        /* 安卓 Chrome 一般支持手电筒，苹果 Safari 不支持，自动隐藏 */
        try {
          const tk = st.getVideoTracks()[0];
          const cap = tk && tk.getCapabilities ? tk.getCapabilities() : {};
          if (cap && cap.torch) {
            const btn = q('#qsTorch');
            btn.style.display = 'block';
            btn.onclick = () => {
              torchOn = !torchOn;
              btn.classList.toggle('on', torchOn);
              try { tk.applyConstraints({ advanced: [{ torch: torchOn }] }); } catch (e) {}
            };
          }
        } catch (e) {}
        tick();
      });
      const camFail = (err) => {
        clearTimeout(camTimer);
        failShown = true;
        const nm = (err && err.name) || '';
        /* 诊断：显示浏览器记录的“本网站”摄像头权限状态，区分系统权限与网站权限 */
        const showDiag = (state) => {
          const map = { granted: '已允许 ✓', denied: '已拒绝 ✗（问题就在这，按上面步骤改成允许）', prompt: '还没询问过' };
          const el = q('#qsFailD');
          if (el) el.innerHTML += '<div class="qf-diag">🔎 浏览器对本网站的摄像头权限：' + (map[state] || state) +
            '　·　错误码：' + (nm || '未知') + '</div>';
        };
        try {
          if (navigator.permissions && navigator.permissions.query) {
            navigator.permissions.query({ name: 'camera' })
              .then((pst) => showDiag(pst.state))
              .catch(() => showDiag(''));
          } else { setTimeout(() => showDiag(''), 0); }
        } catch (e) { setTimeout(() => showDiag(''), 0); }
        if (nm === 'NotAllowedError' || nm === 'SecurityError') {
          /* 点过一次「拒绝」后浏览器会记住，重试也不会再弹窗 —— 给手动开权限的路径 */
          showFail('摄像头权限被拒绝了',
            '刚才弹权限框时点过「拒绝」，浏览器会记住。<br>' +
            '<b>恢复方法（Chrome / 多数安卓浏览器）：</b><br>' +
            '① 点地址栏最左边的 🔒 或 ⓘ 图标<br>' +
            '② 找到「摄像头 / 相机」→ 改成<b>允许</b><br>' +
            '③ 回这里点「重试摄像头」<br>' +
            '找不到就走系统设置：<b>手机设置 → 应用 → 浏览器 → 权限 → 相机 → 允许</b>，然后重开本页。');
        } else if (nm === 'NotFoundError') {
          showFail('没找到可用的摄像头',
            '这台设备可能没有摄像头（或都被禁用了）。<br>可以直接在下面<b>粘贴</b>二维码文本导入。');
        } else if (nm === 'NotReadableError' || nm === 'TrackStartError') {
          showFail('摄像头被别的应用占用了',
            '可能微信 / 视频通话正在使用摄像头，关掉后再点「重试摄像头」。<br>也可以直接在下面<b>粘贴</b>二维码文本导入。');
        } else {
          showFail('摄像头没打开',
            isWx ? '微信里不能直接调摄像头。<br>点右上角 <b>「···」→「在浏览器打开」</b>，再回到「老师 → 数据备份 → 扫码接收」。'
                 : '也可能手机没给浏览器 App 相机权限：<b>手机设置 → 应用 → 浏览器 → 权限 → 相机 → 允许</b>。<br>也可以直接在下面<b>粘贴</b>二维码文本导入。');
        }
      };
      openCam({
        video: { facingMode: { ideal: 'environment' }, width: { ideal: 1280 }, height: { ideal: 720 } },
        audio: false
      }).catch((err) => {
        const nm = (err && err.name) || '';
        /* 个别浏览器不支持后置/分辨率参数，会报 OverconstrainedError —— 去掉参数降级重试 */
        if (nm === 'OverconstrainedError') {
          openCam({ video: true, audio: false }).catch(camFail);
          return;
        }
        camFail(err);
      });
    };

    q('#qsRetry').onclick = startCam;
    startCam();
  }
  /* ---------- 成长卡 ---------- */
  function growthCard(k) {
    const W = 750, H = 1080;
    const cv = document.createElement('canvas');
    cv.width = W; cv.height = H;
    const g = cv.getContext('2d');
    const grd = g.createLinearGradient(0, 0, W, H);
    grd.addColorStop(0, '#4c2fa8'); grd.addColorStop(.55, '#7c3aed'); grd.addColorStop(1, '#c084fc');
    g.fillStyle = grd; g.fillRect(0, 0, W, H);
    for (let i = 0; i < 60; i++) {
      g.fillStyle = 'rgba(255,255,255,' + (0.15 + Math.random() * 0.5) + ')';
      const r = Math.random() * 2.4;
      g.beginPath(); g.arc(Math.random() * W, Math.random() * H * .8, r, 0, 7); g.fill();
    }
    const img = new Image();
    img.onload = () => {
      g.save();
      g.beginPath(); g.arc(W / 2, 300, 150, 0, 7); g.closePath();
      g.shadowColor = 'rgba(255,215,110,.7)'; g.shadowBlur = 60;
      g.clip();
      g.drawImage(img, W / 2 - 150, 150, 300, 300);
      g.restore();
      g.strokeStyle = 'rgba(255,215,110,.85)'; g.lineWidth = 7;
      g.beginPath(); g.arc(W / 2, 300, 152, 0, 7); g.stroke();

      g.textAlign = 'center';
      g.fillStyle = '#fff';
      g.font = '800 62px -apple-system,PingFang SC,sans-serif';
      g.fillText(k.name, W / 2, 540);
      g.font = '500 28px -apple-system,PingFang SC,sans-serif';
      g.fillStyle = 'rgba(255,255,255,.82)';
      g.fillText((k.group ? k.group + ' · ' : '') + (k.skin ? petMeta(k.skin).name : k.pet.name) + ' · ' + stageOf(k.pet.lv).name, W / 2, 592);

      const stats = [['积分', k.points], ['等级', 'Lv.' + k.pet.lv], ['班级排名', '第 ' + rankOf(k.id, 'total') + ' 名']];
      stats.forEach((s, i) => {
        const w = 190, x = W / 2 - (w * 3 + 24 * 2) / 2 + i * (w + 24);
        g.fillStyle = 'rgba(255,255,255,.16)';
        roundRect(g, x, 650, w, 130, 26); g.fill();
        g.fillStyle = '#ffd76e'; g.font = '800 44px -apple-system,sans-serif';
        g.fillText(String(s[1]), x + w / 2, 712);
        g.fillStyle = 'rgba(255,255,255,.8)'; g.font = '500 22px -apple-system,sans-serif';
        g.fillText(s[0], x + w / 2, 750);
      });

      const recent = P.d.log.filter((l) => l.kid === k.id && l.d > 0).slice(0, 3);
      g.textAlign = 'left';
      g.fillStyle = '#fff'; g.font = '700 30px -apple-system,sans-serif';
      g.fillText('最近表现', 80, 856);
      g.font = '500 26px -apple-system,sans-serif'; g.fillStyle = 'rgba(255,255,255,.85)';
      if (!recent.length) g.fillText('还没有记录，快去完成第一个任务吧', 80, 906);
      recent.forEach((l, i) => {
        g.fillText('· ' + (l.text.length > 14 ? l.text.slice(0, 14) + '…' : l.text) + '  +' + l.d, 80, 906 + i * 44);
      });

      g.textAlign = 'center';
      g.fillStyle = 'rgba(255,255,255,.55)'; g.font = '500 22px -apple-system,sans-serif';
      g.fillText((P.d.cls.name || '伴学宠物') + ' · ' + new Date().toLocaleDateString('zh-CN'), W / 2, 1010);
      g.fillStyle = 'rgba(255,255,255,.75)'; g.font = '600 24px -apple-system,sans-serif';
      g.fillText('今天也要和幻兽一起变强 ✨', W / 2, 1044);

      const a = document.createElement('a');
      a.download = k.name + '-成长卡.png';
      a.href = cv.toDataURL('image/png');
      a.click();
      toast('成长卡已生成，可在相册/下载里找到');
    };
    img.onerror = () => toast('图片加载失败');
    img.src = petImg(k);
  }
  function roundRect(g, x, y, w, h, r) {
    g.beginPath();
    g.moveTo(x + r, y); g.arcTo(x + w, y, x + w, y + h, r);
    g.arcTo(x + w, y + h, x, y + h, r); g.arcTo(x, y + h, x, y, r);
    g.arcTo(x, y, x + w, y, r); g.closePath();
  }

  /* ================= 路由 ================= */
  const ICONS = {
    home: '<path d="M3 10.5 12 3l9 7.5"/><path d="M5 9.5V21h14V9.5"/>',
    dex: '<path d="M4 4.5A2.5 2.5 0 0 1 6.5 2H20v18H6.5A2.5 2.5 0 0 0 4 22z"/><path d="M9 7h7M9 11h5"/>',
    tasks: '<rect x="4" y="3" width="16" height="18" rx="3"/><path d="M8.5 9l2.4 2.4L15.5 7"/><path d="M8.5 15.5h7"/>',
    shop: '<path d="M4 8h16l-1.5 12.2a2 2 0 0 1-2 1.8H7.5a2 2 0 0 1-2-1.8L4 8z"/><path d="M9 10V6a3 3 0 0 1 6 0v4"/>',
    log: '<circle cx="12" cy="12" r="9"/><path d="M12 7v5.5l3.5 2"/>',
    cls: '<rect x="3" y="4" width="7" height="7" rx="2"/><rect x="14" y="4" width="7" height="7" rx="2"/><rect x="3" y="14" width="7" height="7" rx="2"/><rect x="14" y="14" width="7" height="7" rx="2"/>',
    board: '<path d="M7 21h10"/><path d="M12 17v4"/><path d="M6 4h12v4a6 6 0 0 1-12 0z"/><path d="M6 6H3v2a3 3 0 0 0 3 3"/><path d="M18 6h3v2a3 3 0 0 1-3 3"/>'
  };
  const TABS_FAMILY = [['home', '幻兽', 'home'], ['dex', '图鉴', 'dex'], ['tasks', '任务', 'tasks'], ['shop', '商店', 'shop'], ['log', '记录', 'log']];
  const TABS_CLASS = [['home', '我的', 'home'], ['class', '全班', 'cls'], ['board', '光荣榜', 'board'], ['shop', '商店', 'shop'], ['log', '记录', 'log']];

  function renderTabs(active) {
    const set = isClass() ? TABS_CLASS : TABS_FAMILY;
    const nav = document.getElementById('tabbar');
    nav.style.gridTemplateColumns = 'repeat(' + set.length + ',1fr)';
    nav.innerHTML = set.map(([k, t, ic]) =>
      '<a href="#/' + k + '" data-tab="' + k + '" class="' + (k === active ? 'on' : '') + '">' +
      '<svg viewBox="0 0 24 24">' + ICONS[ic] + '</svg><span>' + t + '</span></a>').join('');
  }

  const routes = { home: viewHome, dex: viewDex, tasks: viewTasks, shop: viewShop, log: viewLog, class: viewClass, board: viewBoard, compare: viewCompare, lucky: viewLucky };
  const ROUTES_ALL = ['home', 'dex', 'tasks', 'shop', 'log', 'class', 'board', 'compare', 'lucky'];
  function render() {
    if (!P.d) { P.d = P.fresh(); }
    document.getElementById('classBtn').style.visibility = isClass() ? 'visible' : 'hidden';
    document.getElementById('parentBtn').textContent = isClass() ? '老师' : '家长';
    const empty = !P.d.kids || !P.d.kids.length;
    if (empty && !isClass()) {
      $view.innerHTML = '';
      document.getElementById('tabbar').innerHTML = '';
      if (!document.querySelector('.welcome')) welcome();
      return;
    }
    let h = (location.hash || '#/home').replace('#/', '').split('?')[0];
    if (empty) h = 'class';
    if (!ROUTES_ALL.includes(h)) h = 'home';
    if (!empty && (P.d.cur == null || !P.d.kids.some((k) => k.id === P.d.cur))) P.d.cur = P.d.kids[0].id;
    (routes[h] || viewHome)();
    let tab = h;
    if (isClass() && (h === 'dex' || h === 'tasks')) tab = 'home';
    if (h === 'compare') tab = 'class';
    if (h === 'lucky') tab = 'shop';
    renderTabs(tab);
    document.getElementById('tbTitle').textContent = isClass() ? (P.d.cls.name || '伴学宠物') : '伴学宠物 · 家庭';
    bindKidsRow();
  }

  /* ================= 旧网址提示（v3.20） ================= */
  function legacyNotice() {
    const NEW_URL = 'https://hongguang-pang.github.io/beast-class/';
    const hitParam = /[?&]sharecode=/i.test(location.search);
    const hitRef = /workbuddy\.host/i.test(document.referrer || '');
    if (!hitParam && !hitRef) return;
    if (localStorage.getItem('beast.legacyTip') === 'off') return;

    const bar = document.createElement('div');
    bar.id = 'legacyTip';
    bar.innerHTML =
      '<div class="lg-t">📌 你用的是旧链接</div>' +
      '<div class="lg-d">新地址已固定，旧参数可以丢掉。换成新地址后数据照常同步。</div>' +
      '<div class="lg-row"><button class="lg-go" id="lgGo">改用新地址</button>' +
      '<button class="lg-x" id="lgX">以后再说</button></div>';
    document.body.appendChild(bar);
    requestAnimationFrame(() => bar.classList.add('on'));

    bar.querySelector('#lgGo').onclick = () => {
      try { history.replaceState(null, '', location.pathname + location.hash); } catch (e) {}
      location.href = NEW_URL;
    };
    bar.querySelector('#lgX').onclick = () => {
      localStorage.setItem('beast.legacyTip', 'off');
      bar.classList.remove('on');
      setTimeout(() => bar.remove(), 260);
    };
  }

  /* ================= 启动 ================= */
  function boot() {
    P.load();
    if (!P.d) { P.d = P.fresh(); }
    P.save();   // 迁移结果立即落盘
    if (!location.hash) location.replace('#/home');
    window.addEventListener('hashchange', render);
    document.getElementById('parentBtn').onclick = () => {
      if (P.d.admin) parentPanel(); else parentEntry();
    };
    document.getElementById('classBtn').onclick = () => { location.hash = '#/class'; };
    render();
    legacyNotice();
    if ('serviceWorker' in navigator) {
      navigator.serviceWorker.register('sw.js?v=3204', { updateViaCache: 'none' }).catch(() => {});
      let rld = false;
      navigator.serviceWorker.addEventListener('controllerchange', () => {
        if (rld) return; rld = true;
        if (!sessionStorage.getItem('swRld')) { sessionStorage.setItem('swRld', '1'); location.reload(); }
      });
    }
  }
  boot();
})();
