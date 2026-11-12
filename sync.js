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
  var API = 'https://api.github.com';

  function readCfg() {
    try { return JSON.parse(localStorage.getItem(CFGKEY) || 'null') || {}; } catch (e) { return {}; }
  }
  function writeCfg(c) { localStorage.setItem(CFGKEY, JSON.stringify(c)); }
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

  function api(path, opt) {
    var c = readCfg();
    var o = opt || {};
    return fetch(API + '/repos/' + c.repo + '/contents/' + (c.file || 'data.json') + (path || ''), {
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
    /* 当前班的内容回填到 kids/cls 镜像（以合并后的班级为准） */
    var cur = out.clsId ? map[out.clsId] : null;
    if (cur) {
      out.kids = cur.kids || [];
      out.cls = out.cls || {};
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
    var d = '设备-' + Math.random().toString(36).slice(2, 5);
    c.device = d; writeCfg(c);
    return d;
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
        rawSet(CFGKEY, JSON.stringify(Object.assign(readCfg(), { lastAt: Date.now(), lastErr: '' })));
        if (!silent) toastSoft('已同步到云端');
        return true;
      });
    }).catch(function (err) {
      var c = readCfg(); c.lastErr = String(err.message || err); writeCfg(c);
      if (!silent) toastSoft('同步失败：' + c.lastErr);
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

  /* ---------- 启动：首次进入先拉一次 ---------- */
  (function boot() {
    if (!cfgOn()) return;
    var guard = 'beast.sync.loaded';
    if (sessionStorage.getItem(guard)) return;
    sessionStorage.setItem(guard, '1');
    pullAndApply(false).then(function (applied) {
      if (applied) location.reload();
    });
  })();

  /* 切回窗口时同步（避免课堂操作中途被打断） */
  document.addEventListener('visibilitychange', function () {
    if (document.visibilityState !== 'visible' || !cfgOn()) return;
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
  function sheetOpen(html, mount) {
    var m = document.createElement('div');
    m.className = 'sheet-mask';
    m.innerHTML = '<div class="sheet"><div class="sheet-bar"></div>' + html + '</div>';
    document.body.appendChild(m);
    requestAnimationFrame(function () { m.classList.add('in'); });
    var close = function () { m.classList.remove('in'); setTimeout(function () { m.remove(); }, 280); };
    m.addEventListener('click', function (e) { if (e.target === m) close(); });
    if (mount) mount(m, close);
    return close;
  }

  function openUI() {
    var c = readCfg();
    var html =
      '<div class="sheet-h">☁️ 云同步（多设备互通）</div>' +
      '<div class="tiny" style="margin-top:6px">用你自己的 GitHub 私有仓库当数据库，4 台电脑填同一套配置即可互通。数据只在你的仓库里，别人看不到。</div>' +
      '<div class="field" style="margin-top:14px"><label>仓库（用户名/仓库名）</label>' +
      '<input id="syRepo" placeholder="例如 hongguang-pang/beast-class-data" value="' + (c.repo || '') + '"></div>' +
      '<div class="field"><label>访问令牌（fine-grained，仅此仓库 Contents 读写）</label>' +
      '<input id="syToken" type="password" placeholder="github_pat_..." value="' + (c.token || '') + '"></div>' +
      '<div class="field"><label>设备名（自己起个名，方便看是谁改的）</label>' +
      '<input id="syDev" placeholder="例如 一班电脑" value="' + (c.device || '') + '"></div>' +
      '<label class="ck-line" style="margin-top:10px"><input type="checkbox" id="syOn"' + (c.on ? ' checked' : '') + '><span>开启自动同步（保存后自动上传，打开页面自动拉取）</span></label>' +
      '<div class="tiny" id="syStat" style="margin-top:10px">' + (c.lastAt ? '上次同步：' + new Date(c.lastAt).toLocaleString() : '尚未同步') + (c.lastErr ? '｜最近错误：' + c.lastErr : '') + '</div>' +
      '<div class="btn-row" style="margin-top:14px"><button class="btn" id="sySave">保存</button>' +
      '<button class="btn ghost" id="syTest">测试</button></div>' +
      '<div class="btn-row" style="margin-top:10px"><button class="btn ghost" id="syUp">↑ 立即上传</button>' +
      '<button class="btn ghost" id="syDown">↓ 立即下载</button></div>' +
      '<div class="btn-row" style="margin-top:10px"><button class="btn ghost" id="syClose">关闭</button></div>';
    sheetOpen(html, function (m, close) {
      var stat = m.querySelector('#syStat');
      var collect = function () {
        var c2 = readCfg();
        c2.repo = m.querySelector('#syRepo').value.trim().replace(/^https?:\/\/github\.com\//, '').replace(/\/$/, '');
        c2.token = m.querySelector('#syToken').value.trim();
        c2.device = m.querySelector('#syDev').value.trim() || c2.device || deviceName();
        c2.on = m.querySelector('#syOn').checked;
        c2.file = c2.file || 'data.json';
        return c2;
      };
      m.querySelector('#sySave').onclick = function () {
        var c2 = collect();
        if (!c2.repo || c2.repo.indexOf('/') < 0) return toastSoft('仓库填成 用户名/仓库名 的形式');
        if (!c2.token) return toastSoft('请填访问令牌');
        writeCfg(c2);
        stat.textContent = '配置已保存，正在测试连接…';
        BEAST_SYNC.test().then(function (r) {
          stat.textContent = r === 'empty' ? '连接正常，云端还没有数据（点「立即上传」建立初始数据）' : '连接正常，云端已有数据（点「立即下载」合并）';
        }).catch(function (err) {
          stat.textContent = '连接失败：' + (err.message || err) + '（检查仓库名和令牌权限）';
        });
      };
      m.querySelector('#syTest').onclick = function () {
        writeCfg(collect());
        stat.textContent = '测试中…';
        BEAST_SYNC.test().then(function (r) {
          stat.textContent = r === 'empty' ? '连接正常，云端暂无数据' : '连接正常，云端已有数据';
        }).catch(function (err) { stat.textContent = '连接失败：' + (err.message || err); });
      };
      m.querySelector('#syUp').onclick = function () {
        writeCfg(collect());
        stat.textContent = '上传中…';
        BEAST_SYNC.pushNow().then(function (ok) {
          stat.textContent = ok ? '已上传（合并了云端数据）' : '上传失败，看下方错误';
        });
      };
      m.querySelector('#syDown').onclick = function () {
        writeCfg(collect());
        stat.textContent = '下载中…';
        BEAST_SYNC.pullNow(true).then(function (ok) {
          if (ok) { stat.textContent = '已应用云端数据，正在刷新…'; setTimeout(function () { location.reload(); }, 600); }
          else stat.textContent = '云端暂无数据或已是最新';
        });
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
    enabled: cfgOn
  };
})();
