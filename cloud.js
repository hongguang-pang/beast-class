/* 伴学宠物 · 云端同步 SDK v1（替换旧的 GitHub 仓库同步）
 *
 * 为什么要有它：学生用自己/家长手机，老师用班级电脑，数据不在一个浏览器里，
 * localStorage 天然不可能互通。这里把「班级」放到云端，各端只同步属于自己的那部分：
 *
 *   老师端权威：班名 / 班级年级 / 名单 / 加减分
 *   学生端权威：掌握度 / 错题 / 冒险进度 / 宠物 / 自己赚的积分
 *
 * 网络断了也不影响使用：所有写操作失败进离线队列，恢复后自动补发。
 */
(function () {
  'use strict';

  var CFG = 'beast.cloud.v1';
  var QUEUE = 'beast.cloud.q';
  var BAKED = 'https://aad00512c81ac0050.app.workbuddy.host/?sharecode=GAYVWAY6BU'; /* 同步服务地址 */

  /* 托管网关要求每个请求都带 sharecode，这里统一拼进去 */
  function splitBase(b) {
    b = String(b || '');
    var i = b.indexOf('?');
    if (i < 0) return { origin: b.replace(/\/$/, ''), share: '' };
    var m = /sharecode=([^&]+)/.exec(b.slice(i + 1));
    return { origin: b.slice(0, i).replace(/\/$/, ''), share: m ? m[1] : '' };
  }
  function urlFor(b, path) {
    var s = splitBase(b);
    if (!s.share) return s.origin + path;
    return s.origin + path + (path.indexOf('?') >= 0 ? '&' : '?') + 'sharecode=' + encodeURIComponent(s.share);
  }

  var state = {
    base: '',
    online: false,
    lastOk: 0,
    lastErr: '',
    pending: 0
  };
  var listeners = [];

  function emit() {
    state.pending = queue().length;
    listeners.forEach(function (f) { try { f(state); } catch (e) {} });
  }

  function onStatus(f) {
    listeners.push(f);
    try { f(state); } catch (e) {}
  }

  /* ---------- 配置 ---------- */
  function readCfg() {
    var u = {};
    try { u = JSON.parse(localStorage.getItem(CFG) || 'null') || {}; } catch (e) { u = {}; }
    return u;
  }
  function writeCfg(patch) {
    var c = readCfg();
    Object.keys(patch).forEach(function (k) { c[k] = patch[k]; });
    try { localStorage.setItem(CFG, JSON.stringify(c)); } catch (e) {}
    return c;
  }
  function clearCfg() { try { localStorage.removeItem(CFG); } catch (e) {} }

  /* 班级绑定信息（每个角色各自存一份，互不干扰） */
  function bind(code, extra) {
    var p = { code: code };
    if (extra) Object.keys(extra).forEach(function (k) { p[k] = extra[k]; });
    return writeCfg(p);
  }
  function unlink() {
    var c = readCfg();
    delete c.code; delete c.sid; delete c.token; delete c.teacherKey; delete c.role;
    try { localStorage.setItem(CFG, JSON.stringify(c)); } catch (e) {}
  }
  function bound() { var c = readCfg(); return c.code || ''; }

  /* ---------- 探测服务地址 ---------- */
  function candidates() {
    var out = [];
    if (BAKED) out.push(BAKED);
    if (window.__BEAST_CLOUD_BASE__) out.unshift(window.__BEAST_CLOUD_BASE__);
    try {
      if (location.protocol === 'http:' || location.protocol === 'https:') {
        out.push(location.origin);
      }
    } catch (e) {}
    var c = readCfg();
    if (c.base) out.unshift(c.base);
    return out.filter(function (v, i, a) { return v && a.indexOf(v) === i; });
  }

  var probing = null;
  function probe() {
    if (probing) return probing;
    var list = candidates();
    probing = new Promise(function (resolve) {
      var i = 0;
      function next() {
        if (i >= list.length) { state.base = ''; state.online = false; probing = null; emit(); return resolve(''); }
        var b = list[i++];
        var ctl = window.AbortController ? new AbortController() : null;
        var timer = setTimeout(function () { if (ctl) ctl.abort(); }, 3500);
        fetch(urlFor(b, '/api/health'), { method: 'GET', signal: ctl ? ctl.signal : undefined })
          .then(function (r) { return r.ok ? r.json() : null; })
          .then(function (j) {
            clearTimeout(timer);
            if (j && j.ok) {
              state.base = b.replace(/\/$/, '');
              state.online = true;
              writeCfg({ base: state.base });
              probing = null; emit();
              return resolve(state.base);
            }
            next();
          })
          .catch(function () { clearTimeout(timer); next(); });
      }
      next();
    });
    return probing;
  }

  function api(method, path, body, headers) {
    var run = function (base) {
      var ctl = window.AbortController ? new AbortController() : null;
      var timer = setTimeout(function () { if (ctl) ctl.abort(); }, 9000);
      var h = { 'Content-Type': 'application/json' };
      if (headers) Object.keys(headers).forEach(function (k) { h[k] = headers[k]; });
      return fetch(urlFor(base, path), {
        method: method,
        headers: h,
        body: body ? JSON.stringify(body) : undefined,
        signal: ctl ? ctl.signal : undefined
      }).then(function (r) {
        clearTimeout(timer);
        return r.json().catch(function () { return { ok: false, error: 'bad_response' }; })
          .then(function (j) {
            if (!r.ok || j.ok === false) {
              var e = new Error((j && j.error) || ('HTTP ' + r.status));
              e.status = r.status;
              e.payload = j;
              throw e;
            }
            state.online = true; state.lastOk = Date.now(); state.lastErr = '';
            emit();
            return j;
          });
      }).catch(function (err) {
        clearTimeout(timer);
        state.online = false;
        state.lastErr = (err && err.message) || 'network';
        emit();
        throw err;
      });
    };
    if (state.base) return run(state.base);
    return probe().then(function (b) {
      if (!b) throw new Error('offline');
      return run(b);
    });
  }

  /* ---------- 离线队列 ---------- */
  function queue() {
    try { return JSON.parse(localStorage.getItem(QUEUE) || '[]'); } catch (e) { return []; }
  }
  function saveQueue(q) {
    try { localStorage.setItem(QUEUE, JSON.stringify(q.slice(-60))); } catch (e) {}
  }
  function enqueue(method, path, body, headers) {
    var q = queue();
    q.push({ m: method, p: path, b: body, h: headers, ts: Date.now() });
    saveQueue(q);
    emit();
  }

  var flushing = false;
  function flush() {
    if (flushing) return Promise.resolve(0);
    var q = queue();
    if (!q.length) return Promise.resolve(0);
    flushing = true;
    var done = 0;
    var chain = Promise.resolve();
    q.forEach(function (job) {
      chain = chain.then(function () {
        return api(job.m, job.p, job.b, job.h).then(function () {
          done++;
          var cur = queue();
          saveQueue(cur.filter(function (x) { return x.ts !== job.ts; }));
        }).catch(function (e) {
          if (e && e.status && e.status >= 400 && e.status < 500) {
            /* 4xx 是业务错误，重试无用，丢弃避免堵死队列 */
            var cur = queue();
            saveQueue(cur.filter(function (x) { return x.ts !== job.ts; }));
          }
          throw e;
        });
      });
    });
    return chain.then(function () { flushing = false; emit(); return done; })
      .catch(function () { flushing = false; emit(); return done; });
  }

  /* ---------- 业务封装 ---------- */
  var CLOUD = {
    version: '1.0.0',
    state: function () { return state; },
    onStatus: onStatus,
    probe: probe,
    base: function () { return state.base; },
    cfg: readCfg,
    bind: bind,
    unlink: unlink,
    bound: bound,
    flush: flush,
    pending: function () { return queue().length; },

    /* 老师：建班（名额由云端分配班级码） */
    createClass: function (name, grade, teacher, roster) {
      return api('POST', '/api/class', { name: name, grade: grade, teacher: teacher, roster: roster || [] })
        .then(function (j) {
          bind(j.code, { role: 'teacher', teacherKey: j.teacherKey });
          return j;
        });
    },

    /* 老师：换设备接管（班级码 + 教师密钥） */
    takeOver: function (code, teacherKey) {
      code = String(code || '').trim().toUpperCase();
      teacherKey = String(teacherKey || '').trim();
      return api('POST', '/api/class/' + code + '/verify', { teacherKey: teacherKey })
        .then(function (j) {
          bind(code, { role: 'teacher', teacherKey: teacherKey });
          return api('GET', '/api/class/' + code + '/students', null, { 'X-Teacher-Key': teacherKey })
            .then(function (full) { return { cls: j.cls, students: full.students || [] }; });
        });
    },

    /* 老师：拉全班学情 */
    roster: function (code) {
      var c = readCfg();
      var key = c.teacherKey || '';
      return api('GET', '/api/class/' + code + '/students', null, { 'X-Teacher-Key': key });
    },

    /* 老师：加减分（批量 sids） */
    bonus: function (code, sids, delta, reason, subj) {
      var c = readCfg();
      var key = c.teacherKey || '';
      var path = '/api/class/' + code + '/bonus';
      var body = { sids: sids, delta: delta, reason: reason, subj: subj || 'all' };
      var h = { 'X-Teacher-Key': key };
      return api('POST', path, body, h).catch(function (e) {
        enqueue('POST', path, body, h);
        throw e;
      });
    },

    /* 老师：改班名/年级 */
    setMeta: function (code, patch) {
      var c = readCfg();
      var key = c.teacherKey || '';
      var path = '/api/class/' + code + '/meta';
      var h = { 'X-Teacher-Key': key };
      return api('POST', path, patch, h).catch(function (e) {
        enqueue('POST', path, patch, h);
        throw e;
      });
    },

    /* 老师：导入名单到云端 */
    pushRoster: function (code, names) {
      var c = readCfg();
      var key = c.teacherKey || '';
      var path = '/api/class/' + code + '/roster';
      var h = { 'X-Teacher-Key': key };
      return api('POST', path, { names: names }, h).catch(function (e) {
        enqueue('POST', path, { names: names }, h);
        throw e;
      });
    },

    /* 学生：凭班级码加入（首次或换手机都用它，同名自动接管原档案） */
    join: function (code, info) {
      code = String(code || '').trim().toUpperCase();
      var c = readCfg();
      var body = {
        name: info.name,
        sid: info.sid || c.sid || '',
        token: info.token || c.token || '',
        points: info.points || 0,
        petName: info.petName || '',
        petType: info.petType || '',
        petLv: info.petLv || 1,
        grade: info.grade || '',
        mastery: info.mastery || {}
      };
      return api('POST', '/api/class/' + code + '/join', body).then(function (j) {
        bind(code, { role: 'student', sid: j.sid, token: j.token });
        return j;
      });
    },

    /* 学生：上报快照（可用显式凭据，便于一个设备管多个学生档案） */
    report: function (code, sid, token, snap) {
      var c = readCfg();
      sid = sid || c.sid; token = token || c.token;
      if (!sid || !token) return Promise.reject(new Error('not_bound'));
      var path = '/api/class/' + code + '/report';
      var body = { sid: sid, token: token, snap: snap };
      return api('POST', path, body).catch(function (e) {
        if (!e.status || e.status >= 500) enqueue('POST', path, body);
        throw e;
      });
    },

    /* 学生：拉班级变动 + 自己的加分 */
    pull: function (code, sid, token) {
      var c = readCfg();
      sid = sid || c.sid; token = token || c.token;
      if (!sid || !token) return Promise.reject(new Error('not_bound'));
      return api('GET', '/api/class/' + code + '/pull?sid=' + encodeURIComponent(sid) + '&token=' + encodeURIComponent(token));
    },

    /* 只查班级公开信息（加入前预览班名年级） */
    info: function (code) {
      return api('GET', '/api/class/' + String(code || '').trim().toUpperCase());
    },

    /* ================= v3.29 账号云备份 =================
       pwd 已在客户端加盐混淆过，服务端不再看明文；salt 一并上传，
       换设备时用「名字 + 密码」可从云端找回整包档案。 */
    authRegister: function (role, name, pwd, salt) {
      var path = '/api/auth/register';
      var body = { role: role, name: name, pwd: pwd, salt: salt || '' };
      return api('POST', path, body).catch(function (e) {
        /* 5xx / 断网入队，恢复后补注册（幂等） */
        if (!e.status || e.status >= 500) enqueue('POST', path, body);
        throw e;
      });
    },
    authLogin: function (role, name, pwd) {
      return api('POST', '/api/auth/login', { role: role, name: name, pwd: pwd });
    },
    userSync: function (role, name, pwd, salt, snap) {
      var path = '/api/user/sync';
      var body = { role: role, name: name, pwd: pwd, salt: salt || '', snap: snap };
      return api('POST', path, body).catch(function (e) {
        if (!e.status || e.status >= 500) enqueue('POST', path, body);
        throw e;
      });
    },
    userPull: function (role, name, pwd) {
      return api('GET', '/api/user/pull?role=' + encodeURIComponent(role) +
        '&name=' + encodeURIComponent(name) + '&pwd=' + encodeURIComponent(pwd));
    }
  };

  window.BEAST_CLOUD = CLOUD;

  /* 页面恢复可见 / 联网恢复时自动补发 */
  window.addEventListener('online', function () { flush(); });
  document.addEventListener('visibilitychange', function () {
    if (!document.hidden) { flush(); }
  });
  setTimeout(function () { probe().then(function () { flush(); }); }, 1200);
})();
