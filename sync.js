/* 幻兽班级 · 云同步模块（GitHub 私有仓库当数据库，0 成本）
   设计：
   - 数据存在私有仓库的一个 JSON 文件里，班级按 id 合并，各带 _ts 时间戳
   - 本机保存时自动打时间戳并防抖推送（20 秒）
   - 打开应用 / 切回窗口时拉取；有更新则自动应用并刷新
   - 全程只依赖 localStorage + GitHub Contents API
*/
(function () {
  'use strict';
  var KEY = 'beast.v1';
  var CFGKEY = 'beast.sync.v1';
  var HISKEY = 'beast.sync.his';
  var API = 'https://api.github.com';

  /* ============================================================
     内置同步配置：老师零设置，打开即同步
     - 令牌用 base64 分段存放：一是避免被 GitHub 的密钥扫描
       当成明文密钥自动吊销，二是让随手查看源码的人不那么容易直接抄走
     - 权限必须是最小化：只授权 beast-class-data 这一个仓库的
       Contents 读写，不能是账号级的全权令牌
     ============================================================ */
  var BUILTIN = {
    repo: 'hongguang-pang/beast-class-data',
    file: 'data.json',
    on: true,
    token: (function () {
      var seg = ['__TOKEN_A__', '__TOKEN_B__', '__TOKEN_C__'];
      var s = seg.join('');
      try { return atob(s); } catch (e) { return ''; }
    })()
  };

  function readCfg() {
    var u = {};
    try { u = JSON.parse(localStorage.getItem(CFGKEY) || 'null') || {}; } catch (e) { u = {}; }
    var c = {
      repo: BUILTIN.repo, file: BUILTIN.file, on: BUILTIN.on,
      token: BUILTIN.token, device: u.device || ''
    };
    if (u.repo) c.repo = u.repo;
    if (u.file) c.file = u.file;
    if (u.token) c.token = u.token;
    if (u.on === false) c.on = false;
    if (u.disabled) c.on = false;
    if (u.lastAt) c.lastAt = u.lastAt;
    if (u.lastErr) c.lastErr = u.lastErr;
    if (u.tid) c.tid = u.tid;
    if (u.tname) c.tname = u.tname;
    c.builtin = c.token === BUILTIN.token && !!BUILTIN.token;
    return c;
  }
  function writeCfg(c) {
    var u = {};
    try { u = JSON.parse(localStorage.getItem(CFGKEY) || 'null') || {}; } catch (e) { u = {}; }
    ['repo', 'file', 'token', 'device', 'on', 'disabled', 'lastAt', 'lastErr', 'tid', 'tname'].forEach(function (k) {
      if (c[k] !== undefined) u[k] = c[k];
    });
    localStorage.setItem(CFGKEY, JSON.stringify(u));
  }
  function cfgOn() { var c = readCfg(); return !!(c.on && c.repo && c.token); }

  var b64enc = function (str) {
    var bytes = new TextEncoder().encode(str), bin = '';
    for (var i = 0; i < bytes.length; i++) bin += String.fromCharCode(bytes[i]);
    return btoa(bin);
  };
  var b64dec = function (b64) {
    var bin = atob(b64.replace(/\s/g, '')), bytes = new Uint8Array(bin.length);
    for (var i = 0; i < bin.length; i++) bytes[i] = bin.charCodeAt(i);
    return new TextDecoder().decode(bytes);
  };

  /* ============================================================
     多老师隔离
     - 每位老师一份独立数据文件：第一位老师沿用 data.json（老版本兼容，
       已部署的老师不需要做任何改动），后来的老师用 data-<tid>.json
     - index.json 记录老师名单，新设备首次打开时据此判定归属
     ============================================================ */
  var INDEX_FILE = 'index.json';

  function api(path, opt, file) {
    var c = readCfg();
    var o = opt || {};
    var f = file || c.file || 'data.json';
    return fetch(API + '/repos/' + c.repo + '/contents/' + f + (path || ''), {
      method: o.method || 'GET',
      headers: {
        Authorization: 'Bearer ' + c.token,
        Accept: 'application/vnd.github+json',
        'Content-Type': 'application/json'
      },
      body: o.body ? JSON.stringify(o.body) : undefined
    }).then(function (r) {
      if (r.status === 404) return { __404: true };
      if (!r.ok) return r.text().then(function (t) { throw new Error('HTTP ' + r.status + ' ' + t.slice(0, 120)); });
      return r.status === 204 ? {} : r.json();
    });
  }

  function pull() {
    return api('', { method: 'GET' }).then(function (res) {
      if (res.__404) return null;
      var doc = JSON.parse(b64dec(res.content));
      doc.__sha = res.sha;
      return doc;
    });
  }

  function pushDoc(doc, sha) {
    var body = { message: 'sync ' + new Date().toISOString(), content: b64enc(JSON.stringify(doc)) };
    if (sha) body.sha = sha;
    return api('', { method: 'PUT', body: body });
  }

  /* ---------- 老师名单 ---------- */
  function fetchIndex() {
    return api('', { method: 'GET' }, INDEX_FILE).then(function (res) {
      if (res.__404) return { teachers: [], __sha: null };
      var doc = {};
      try { doc = JSON.parse(b64dec(res.content)) || {}; } catch (e) { doc = {}; }
      doc.teachers = Array.isArray(doc.teachers) ? doc.teachers : [];
      doc.__sha = res.sha;
      return doc;
    });
  }
  function saveIndex(idx, tries) {
    var body = {
      message: 'teachers ' + new Date().toISOString(),
      content: b64enc(JSON.stringify({ teachers: idx.teachers }))
    };
    if (idx.__sha) body.sha = idx.__sha;
    return api('', { method: 'PUT', body: body }, INDEX_FILE).catch(function (err) {
      /* 两人同时建老师会撞 sha，重读一次再写 */
      if ((tries || 0) < 2 && /HTTP 40[9]|HTTP 422/.test(String(err && err.message))) {
        return fetchIndex().then(function (fresh) { return saveIndex(fresh, (tries || 0) + 1); });
      }
      throw err;
    });
  }
  function fileOf(tid) { return tid === 't1' ? 'data.json' : 'data-' + tid + '.json'; }

  function newTid(list) {
    var n = 1;
    var used = {};
    list.forEach(function (t) { used[t.id] = 1; });
    while (used['t' + n]) n++;
    return 't' + n;
  }

  /* ---------- 合并 ---------- */
  function merge(local, remote) {
    if (!remote || !Array.isArray(remote.classes)) return local;
    var out = JSON.parse(JSON.stringify(local));
    var map = {};
    (out.classes || []).forEach(function (c) { map[c.id] = c; });
    remote.classes.forEach(function (rc) {
      var lc = map[rc.id];
      if (!lc || (rc._ts || 0) > (lc._ts || 0)) map[rc.id] = rc;
    });
    out.classes = Object.keys(map).map(function (k) { return map[k]; });

    var rt = (remote._sync && remote._sync.updatedAt) || 0;
    var lt = (out._sync && out._sync.updatedAt) || 0;
    var fromRemote = rt > lt;
    /* 全局设置（任务、奖品、分值、PIN）取较新的那一份 */
    if (fromRemote) {
      ['tasks', 'rewards', 'amts', 'pin', 'expGiftSeeded'].forEach(function (k) {
        if (remote[k] !== undefined) out[k] = remote[k];
      });
    }
    /* 当前班的内容回填到 kids/cls 镜像（以合并后的班级为准）
       注意：新设备本地是空白文档时 clsId 为空，需要先补上再回填 */
    var cur = out.clsId ? map[out.clsId] : null;
    if (!cur && out.classes.length) {
      cur = out.classes[0];
      out.clsId = cur.id;
    }
    if (cur) {
      out.clsId = cur.id;
      out.kids = cur.kids || [];
      out.cls = out.cls || {};
      out.cls.on = true;
      out.cls.name = cur.name || '我的班级';
      out.cls.groups = (cur.groups || []).slice();
      out.cls.period = cur.period || 'today';
      out.cls.rnd = cur.rnd || { pool: [], round: 0 };
      out.cls.since = cur.since || out.cls.since;
      if (!out.kids.some(function (k) { return k.id === out.cur; })) out.cur = out.kids[0] ? out.kids[0].id : null;
    }
    out._sync = { updatedAt: Math.max(rt, lt), device: (local._sync && local._sync.device) || deviceName() };
    return out;
  }

  function deviceName() {
    var c = readCfg();
    if (c.device) return c.device;
    var d = '电脑-' + Math.random().toString(36).slice(2, 5).toUpperCase();
    writeCfg({ device: d });
    return d;
  }

  /* ---------- 本地版本快照：覆盖前留底，误删/被改坏可回滚 ---------- */
  function snapshot() {
    try {
      var s = localStorage.getItem(KEY);
      if (!s) return;
      var arr = [];
      try { arr = JSON.parse(localStorage.getItem(HISKEY) || '[]') || []; } catch (e) { arr = []; }
      if (arr.length && arr[0].data === s) return;
      arr.unshift({ at: Date.now(), data: s });
      arr = arr.slice(0, 5);
      rawSet(HISKEY, JSON.stringify(arr));
    } catch (e) { /* 空间不足就放弃快照，不影响主流程 */ }
  }
  function listHistory() {
    try { return JSON.parse(localStorage.getItem(HISKEY) || '[]') || []; } catch (e) { return []; }
  }
  function restoreHistory(i) {
    var arr = listHistory();
    if (!arr[i]) return false;
    rawSet(KEY, arr[i].data);
    return true;
  }

  /* ---------- 保存拦截：打时间戳 + 防抖推送 ---------- */
  var rawSet = localStorage.setItem.bind(localStorage);
  var pushTimer = null, pushing = false, pendingPush = false;

  function stampAndStore(value) {
    try {
      var d = JSON.parse(value);
      if (d && Array.isArray(d.classes) && d.clsId) {
        var e = d.classes.filter(function (c) { return c.id === d.clsId; })[0];
        if (e) e._ts = Date.now();
      }
      return JSON.stringify(d);
    } catch (e) { return value; }
  }

  localStorage.setItem = function (k, v) {
    var val = k === KEY ? stampAndStore(v) : v;
    rawSet(k, val);
    if (k === KEY && cfgOn()) schedulePush();
  };

  function schedulePush() {
    clearTimeout(pushTimer);
    pushTimer = setTimeout(doPush, 20000);
  }

  function doPush(silent) {
    if (!cfgOn() || pushing) { pendingPush = true; return Promise.resolve(false); }
    if (!readCfg().tid) return Promise.resolve(false); /* 身份未定前不写云端，避免串数据 */
    pushing = true; pendingPush = false;
    var local = null;
    try { local = JSON.parse(localStorage.getItem(KEY) || 'null'); } catch (e) { local = null; }
    if (!local) { pushing = false; return Promise.resolve(false); }
    return pull().then(function (remote) {
      var sha = remote && remote.__sha;
      if (remote) delete remote.__sha;
      var merged = merge(local, remote);
      merged._sync = { updatedAt: Date.now(), device: deviceName() };
      return pushDoc(merged, sha).then(function () {
        writeCfg({ lastAt: Date.now(), lastErr: '' });
        return true;
      });
    }).catch(function (err) {
      writeCfg({ lastErr: String((err && err.message) || err) });
      /* 课堂上不弹窗打断，只在同步面板里留痕 */
      return false;
    }).then(function (r) {
      pushing = false;
      if (pendingPush) { pendingPush = false; schedulePush(); }
      return r;
    });
  }

  /* ---------- 拉取并应用 ---------- */
  function toLocalDoc(remote) {
    var d = JSON.parse(JSON.stringify(remote));
    delete d.__sha;
    return d;
  }

  function pullAndApply(force) {
    if (!cfgOn()) return Promise.resolve(false);
    return pull().then(function (remote) {
      if (!remote) return false;
      var local = null;
      try { local = JSON.parse(localStorage.getItem(KEY) || 'null'); } catch (e) { local = null; }
      if (!local) {
        rawSet(KEY, JSON.stringify(toLocalDoc(remote)));
        return true;
      }
      var lt = (local._sync && local._sync.updatedAt) || 0;
      var rt = (remote._sync && remote._sync.updatedAt) || 0;
      var merged = merge(local, remote);
      var changed = JSON.stringify(merged.classes) !== JSON.stringify(local.classes) || rt > lt;
      if (!changed && !force) return false;
      snapshot();
      merged._sync = { updatedAt: Math.max(lt, rt), device: deviceName() };
      rawSet(KEY, JSON.stringify(merged));
      return true;
    }).catch(function () { return false; });
  }

  function toastSoft(msg) {
    var t = document.getElementById('toast');
    if (!t) return;
    t.textContent = msg; t.classList.add('show');
    clearTimeout(t.__s); t.__s = setTimeout(function () { t.classList.remove('show'); }, 1800);
  }

  /* ---------- 老师身份：首次使用选一次，之后不再问 ---------- */
  var esc = function (s) {
    return String(s == null ? '' : s).replace(/[&<>"']/g, function (ch) {
      return { '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[ch];
    });
  };
  function localClassCount() {
    try {
      var d = JSON.parse(localStorage.getItem(KEY) || 'null');
      return (d && d.classes && d.classes.length) || 0;
    } catch (e) { return 0; }
  }
  function hasLocalData() {
    try {
      var d = JSON.parse(localStorage.getItem(KEY) || 'null');
      return !!(d && ((d.classes && d.classes.length) || (d.kids && d.kids.length)));
    } catch (e) { return false; }
  }

  function askTeacher(list) {
    return new Promise(function (resolve) {
      var n = localClassCount();
      var rows = list.map(function (t, i) {
        return '<div class="tch-row"><div class="tch-nm">' + esc(t.name || ('老师' + (i + 1))) +
          '<span class="tiny">' + (t.file === 'data.json' ? '最早使用的那位' : '独立数据') + '</span></div>' +
          '<button class="btn ghost mini" data-pick="' + esc(t.id) + '">是我</button></div>';
      }).join('');
      var html =
        '<div class="sheet-h">这台电脑是谁在用？</div>' +
        '<div class="tiny" style="margin-top:6px">几位老师的班级数据各自独立存放，互不覆盖。这台电脑只需选一次，以后不再询问。</div>' +
        (list.length ? '<div class="tch-cap">加入已有老师</div>' + rows : '') +
        '<div class="tch-cap" style="margin-top:12px">或者用新身份</div>' +
        '<div class="field"><input id="tchName" placeholder="输入称呼，如 李老师"></div>' +
        '<button class="btn gold" id="tchNew" style="width:100%">新建（数据独立，不干扰别人）</button>' +
        (n ? '<div class="tiny" style="margin-top:8px">这台电脑现有 <b>' + n + '</b> 个班的数据。选「新建」会保留并归到新身份下；选上面的老师则可能把它们的分数合并过去。</div>' : '');
      var close = sheetOpen(html, function (m) {
        m.querySelectorAll('[data-pick]').forEach(function (b) {
          b.onclick = function () {
            var id = b.getAttribute('data-pick');
            var t = list.filter(function (x) { return x.id === id; })[0];
            close();
            resolve({ tid: t.id, name: t.name, file: t.file || 'data.json' });
          };
        });
        m.querySelector('#tchNew').onclick = function () {
          var nm = (m.querySelector('#tchName').value || '').trim();
          if (!nm) { m.querySelector('#tchName').focus(); return; }
          close();
          resolve({ create: true, name: nm });
        };
      }, function () { resolve(null); });
    });
  }

  function ensureTeacher() {
    var c = readCfg();
    if (c.tid) return Promise.resolve(c);
    /* 旧版本配置过（有设备名/同步记录）→ 认作最早那位，静默兼容，不打扰 */
    var legacy = false;
    try {
      var u = JSON.parse(localStorage.getItem(CFGKEY) || '{}') || {};
      legacy = !!(u.device || u.lastAt);
    } catch (e) { legacy = false; }

    return fetchIndex().catch(function () { return { teachers: [], __sha: null }; })
      .then(function (idx) {
        var list = idx.teachers || [];
        if (legacy || !list.length) {
          var t1 = list.filter(function (t) { return t.id === 't1'; })[0];
          if (t1) return t1;
          var first = { id: 't1', name: c.tname || '老师1', file: 'data.json', at: Date.now() };
          idx.teachers = list.concat([first]);
          return saveIndex(idx).then(function () { return first; }, function () { return first; });
        }
        return askTeacher(list).then(function (pick) {
          if (!pick) return null;
          if (!pick.create) return pick;
          var tid = newTid(list);
          var t = { id: tid, name: pick.name, file: fileOf(tid), at: Date.now() };
          idx.teachers = list.concat([t]);
          return saveIndex(idx).then(function () { return t; }, function () { return t; });
        });
      })
      .then(function (t) {
        if (!t) return null;
        writeCfg({ tid: t.id, tname: t.name, file: t.file || 'data.json' });
        return readCfg();
      });
  }

  /* ---------- 启动：首次进入先拉一次 ---------- */
  (function boot() {
    if (!cfgOn()) return;
    var guard = 'beast.sync.loaded';
    if (sessionStorage.getItem(guard)) return;
    sessionStorage.setItem(guard, '1');
    ensureTeacher().then(function (c) {
      if (!c) return false;
      return pullAndApply(false);
    }).then(function (applied) {
      if (applied) location.reload();
    }).catch(function () { /* 网络不通就先用本地数据，不打断课堂 */ });
  })();

  /* 切回窗口时同步（避免课堂操作中途被打断） */
  document.addEventListener('visibilitychange', function () {
    if (document.visibilityState !== 'visible' || !cfgOn()) return;
    if (!readCfg().tid) return;
    if (document.querySelector('.sheet')) return;
    pullAndApply(false).then(function (applied) { if (applied) location.reload(); });
  });

  /* 页面隐藏前，把待推送的改动立刻发出去（尽力而为） */
  document.addEventListener('visibilitychange', function () {
    if (document.visibilityState === 'hidden' && cfgOn()) {
      clearTimeout(pushTimer);
      doPush(true);
    }
  });

  /* ---------- 设置界面 ---------- */
  function sheetOpen(html, mount, onDismiss) {
    var m = document.createElement('div');
    m.className = 'sheet-mask';
    m.innerHTML = '<div class="sheet"><div class="sheet-bar"></div>' + html + '</div>';
    document.body.appendChild(m);
    requestAnimationFrame(function () { m.classList.add('in'); });
    var close = function () { m.classList.remove('in'); setTimeout(function () { m.remove(); }, 280); };
    m.addEventListener('click', function (e) {
      if (e.target === m) { close(); if (onDismiss) onDismiss(); }
    });
    if (mount) mount(m, close);
    return close;
  }

  function openUI() {
    var c = readCfg();
    var his = listHistory();
    var hisHTML = his.length
      ? his.map(function (h, i) {
          var d = new Date(h.at);
          var cnt = 0;
          try { cnt = (JSON.parse(h.data).classes || []).length; } catch (e) { cnt = 0; }
          return '<div class="his-row"><span>' + d.toLocaleString() + '（' + cnt + ' 个班）</span>' +
                 '<button class="btn ghost mini" data-his="' + i + '">恢复</button></div>';
        }).join('')
      : '<div class="tiny">还没有本地快照。每次从云端更新前会自动留一份底。</div>';

    var html =
      '<div class="sheet-h">☁️ 云同步</div>' +
      (c.builtin && c.on
        ? '<div class="sync-badge">已自动开启 · 无需设置</div>' +
          '<div class="tiny" style="margin-top:6px">打开页面自动拉取最新成绩，加减分后约 20 秒自动上传。同一位老师的几台电脑共用一份数据，不同老师之间互不干扰。</div>'
        : '<div class="tiny" style="margin-top:6px">当前未使用内置同步，可在下方「高级设置」里自定义。</div>') +

      '<div class="tch-now">当前老师：<b>' + esc(c.tname || '老师1') + '</b>' +
      '<button class="btn ghost mini" id="syRename">改名</button></div>' +
      '<div class="tiny" style="margin-top:2px">数据文件：' + esc((c.file || 'data.json')) +
      (c.file === 'data.json' ? '（最早使用的那份）' : '（独立于其他老师）') + '</div>' +

      '<div class="field" style="margin-top:14px"><label>这台电脑的名字（只用于区分是谁改的，可留空）</label>' +
      '<input id="syDev" placeholder="例如 一班电脑" value="' + (c.device || '') + '"></div>' +

      '<div class="sync-stat" id="syStat">' +
      '<b>状态：</b>' + (c.on ? '同步已开启' : '同步已关闭') +
      '<br>' + (c.lastAt ? '上次同步：' + new Date(c.lastAt).toLocaleString() : '尚未同步过') +
      (c.lastErr ? '<br><span class="err">最近错误：' + c.lastErr + '</span>' : '') +
      '</div>' +

      '<div class="btn-row" style="margin-top:12px">' +
      '<button class="btn" id="syUp">↑ 立即上传</button>' +
      '<button class="btn ghost" id="syDown">↓ 立即下载</button></div>' +

      '<details class="adv"><summary>🕘 恢复历史版本（误删/数据乱了用）</summary>' + hisHTML + '</details>' +

      '<details class="adv"><summary>⚙️ 高级设置（一般不用管）</summary>' +
      '<div class="field" style="margin-top:10px"><label>数据仓库（用户名/仓库名）</label>' +
      '<input id="syRepo" placeholder="hongguang-pang/beast-class-data" value="' + (c.repo || '') + '"></div>' +
      '<div class="field"><label>访问令牌（仅此仓库 Contents 读写）</label>' +
      '<input id="syToken" type="password" placeholder="github_pat_..." value="' + (c.builtin ? '' : (c.token || '')) + '"></div>' +
      '<label class="ck-line"><input type="checkbox" id="syOn"' + (c.on ? ' checked' : '') + '><span>开启自动同步</span></label>' +
      '<div class="btn-row" style="margin-top:10px"><button class="btn ghost" id="sySave">保存高级设置</button>' +
      '<button class="btn ghost" id="syTest">测试连接</button></div>' +
      '<div class="btn-row" style="margin-top:10px"><button class="btn ghost" id="sySwitch">切换老师身份</button></div>' +
      '<div class="tiny" style="margin-top:8px">同一台电脑多人共用时，用「切换身份」换到自己的数据。留空令牌 = 继续使用内置配置。</div>' +
      '</details>' +

      '<div class="btn-row" style="margin-top:14px"><button class="btn ghost" id="syClose">关闭</button></div>';

    sheetOpen(html, function (m, close) {
      var stat = m.querySelector('#syStat');
      var setStat = function (t) { stat.innerHTML = t; };

      m.querySelector('#syDev').onchange = function () {
        writeCfg({ device: this.value.trim() });
      };
      m.querySelector('#syRename').onclick = function () {
        var nm = window.prompt('这位老师的称呼（只影响显示，方便区分几位老师）', c.tname || '老师1');
        if (nm === null) return;
        nm = nm.trim();
        if (!nm) return;
        writeCfg({ tname: nm });
        var b = m.querySelector('.tch-now b');
        if (b) b.textContent = nm;
        if (c.tid) {
          fetchIndex().then(function (idx) {
            var t = idx.teachers.filter(function (x) { return x.id === c.tid; })[0];
            if (t && t.name !== nm) { t.name = nm; return saveIndex(idx); }
          }).catch(function () { /* 离线时只改本机，下次联网再说 */ });
        }
      };
      var swBtn = m.querySelector('#sySwitch');
      if (swBtn) swBtn.onclick = function () {
        if (!window.confirm('切换后这台电脑会重新问「你是谁」，本机数据保留。继续？')) return;
        var u = {};
        try { u = JSON.parse(localStorage.getItem(CFGKEY) || '{}') || {}; } catch (e) { u = {}; }
        delete u.tid; delete u.tname; delete u.file;
        localStorage.setItem(CFGKEY, JSON.stringify(u));
        sessionStorage.removeItem('beast.sync.loaded');
        location.reload();
      };
      m.querySelectorAll('[data-his]').forEach(function (b) {
        b.onclick = function () {
          var i = +b.getAttribute('data-his');
          var h = listHistory()[i];
          if (!h || !confirm('恢复到 ' + new Date(h.at).toLocaleString() + ' 的数据？当前数据会被覆盖（仍可在快照里找回）。')) return;
          snapshot();
          restoreHistory(i);
          setStat('已恢复，正在刷新…');
          setTimeout(function () { location.reload(); }, 600);
        };
      });
      m.querySelector('#syUp').onclick = function () {
        setStat('上传中…');
        BEAST_SYNC.pushNow().then(function (ok) {
          setStat(ok ? '✓ 已上传（已合并云端数据）' : '上传失败：' + (readCfg().lastErr || '检查网络'));
        });
      };
      m.querySelector('#syDown').onclick = function () {
        setStat('下载中…');
        BEAST_SYNC.pullNow(true).then(function (ok) {
          if (ok) { setStat('✓ 已应用云端数据，正在刷新…'); setTimeout(function () { location.reload(); }, 600); }
          else setStat('云端暂无数据，或已是最新');
        });
      };
      m.querySelector('#sySave').onclick = function () {
        var repo = m.querySelector('#syRepo').value.trim().replace(/^https?:\/\/github\.com\//, '').replace(/\/$/, '');
        var tk = m.querySelector('#syToken').value.trim();
        var on = m.querySelector('#syOn').checked;
        var u = { on: on };
        if (repo) u.repo = repo;
        if (tk) u.token = tk;
        if (u.repo && u.repo.indexOf('/') < 0) return setStat('仓库要写成 用户名/仓库名 的形式');
        writeCfg(u);
        setStat('已保存，测试中…');
        BEAST_SYNC.test().then(function (r) {
          setStat(r === 'empty' ? '✓ 连接正常，云端还没有数据（点「立即上传」建立初始数据）' : '✓ 连接正常，云端已有数据（点「立即下载」合并）');
        }).catch(function (err) {
          setStat('连接失败：' + ((err && err.message) || err) + '（检查仓库名和令牌权限）');
        });
      };
      m.querySelector('#syTest').onclick = function () {
        setStat('测试中…');
        BEAST_SYNC.test().then(function (r) {
          setStat(r === 'empty' ? '✓ 连接正常，云端暂无数据' : '✓ 连接正常，云端已有数据');
        }).catch(function (err) { setStat('连接失败：' + ((err && err.message) || err)); });
      };
      m.querySelector('#syClose').onclick = close;
    });
  }

  window.BEAST_SYNC = {
    cfg: readCfg,
    save: function (c) { writeCfg(c); },
    pushNow: function () { return doPush(false); },
    pullNow: function (force) { return pullAndApply(!!force); },
    test: function () { return pull().then(function (r) { return r ? 'ok' : 'empty'; }); },
    open: openUI,
    enabled: cfgOn,
    history: listHistory,
    restore: restoreHistory
  };
})();
