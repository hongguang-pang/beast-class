/* 伴学宠物 · 账号中心 v1（v3.29）
 * ------------------------------------------------------------
 * 目标：把老师 / 家长 / 学生三种身份用「账号」管理起来：
 *   · 本机优先：账号与档案保存在本机浏览器（localStorage），断网照常用；
 *   · 联网回传：注册/登录会同步到云端，答题数据通过原有班级通道上报；
 *     本机档案（含冒险进度、掌握度、宠物）定期整包备份到云端，换设备可凭
 *     「名字 + 密码」找回；
 *   · 一机多号：同一台电脑可以保存多个账号，随时切换、退出。
 *
 * 密码在本地做加盐混淆后保存/上传，不存明文（儿童学习应用，防误看即可，
 * 不是银行级加密）。
 */
(function () {
  'use strict';

  var AST = 'beast.accounts.v1';
  var SST = 'beast.session.v1';

  function read(k, def) {
    try { var v = JSON.parse(localStorage.getItem(k)); return v == null ? def : v; }
    catch (e) { return def; }
  }
  function write(k, v) { try { localStorage.setItem(k, JSON.stringify(v)); } catch (e) {} }

  /* ---------- 密码混淆（同步、无依赖，离线可校验） ---------- */
  function hashPwd(pwd, salt) {
    var s = String(pwd == null ? '' : pwd) + '|' + (salt || 'bp') + '|beast-pet';
    var h1 = 0x811c9dc5, h2 = 0x1b873593;
    for (var r = 0; r < 8; r++) {
      for (var i = 0; i < s.length; i++) {
        h1 = (Math.imul(h1 ^ s.charCodeAt(i), 16777619)) >>> 0;
        h2 = (Math.imul(h2 + s.charCodeAt(s.length - 1 - i), 2654435761)) >>> 0;
      }
      s = h1.toString(36) + '.' + h2.toString(36);
    }
    return h1.toString(36) + '.' + h2.toString(36);
  }
  /* 4-12 位密码校验：字母/数字/常用符号 */
  function pwdOk(p) { return /^[A-Za-z0-9_.@-]{4,12}$/.test(String(p || '')); }

  /* ---------- 账号 CRUD ---------- */
  function list() { return read(AST, { users: [] }).users; }
  function saveList(users) { write(AST, { users: users, updatedAt: Date.now() }); }
  function find(role, name) {
    return list().find(function (u) { return u.role === role && u.name === name; }) || null;
  }
  function byId(id) { return list().find(function (u) { return u.id === id; }) || null; }

  function current() {
    var s = read(SST, null);
    if (!s || !s.uid) return null;
    return byId(s.uid);
  }

  /* 注册（建档即注册）。若同名账号已存在且密码一致 → 直接登录原档案 */
  function register(o) {
    var exist = find(o.role, o.name);
    if (exist) {
      if (exist.pwd === hashPwd(o.pwd, exist.salt)) {
        /* 绑定最新档案 id（孩子/班级可能变化） */
        exist.kidId = o.kidId || exist.kidId;
        exist.clsId = o.clsId || exist.clsId;
        exist.grade = o.grade || exist.grade;
        exist.classCode = o.classCode || exist.classCode;
        if (!exist.cpwd) exist.cpwd = hashPwd(o.pwd, '');
        exist.lastAt = Date.now();
        saveList(list());
        write(SST, { uid: exist.id, at: Date.now() });
        cloudRegister(exist, o.pwd);
        return { ok: true, user: exist, existed: true };
      }
      return { err: 'name_taken' };
    }
    var salt = Math.random().toString(36).slice(2, 8);
    var u = {
      id: 'u' + Date.now().toString(36) + Math.random().toString(36).slice(2, 6),
      role: o.role, name: o.name,
      salt: salt, pwd: hashPwd(o.pwd, salt),
      /* 云端口令：统一空 salt 混淆，换设备云端找回时口径一致 */
      cpwd: hashPwd(o.pwd, ''),
      grade: o.grade || '', classCode: o.classCode || '',
      kidId: o.kidId || '', clsId: o.clsId || '',
      createdAt: Date.now(), lastAt: Date.now()
    };
    var st = read(AST, { users: [] });
    st.users.push(u);
    saveList(st.users);
    write(SST, { uid: u.id, at: Date.now() });
    cloudRegister(u, o.pwd);
    return { ok: true, user: u };
  }

  /* 登录：先本机，本机没有且在线 → 云端找回（用云端快照重建本机档案） */
  function login(role, name, pwd, onRestore) {
    var u = find(role, name);
    if (u) {
      if (u.pwd !== hashPwd(pwd, u.salt)) return Promise.resolve({ err: 'bad_pwd' });
      u.lastAt = Date.now();
      saveList(list());
      write(SST, { uid: u.id, at: Date.now() });
      /* 会话切角色：保证读到的是这个账号自己的存储 */
      try { localStorage.setItem('beast.role', u.role); } catch (e) {}
      return Promise.resolve({ ok: true, user: u, local: true });
    }
    /* 云端找回 */
    var C = window.BEAST_CLOUD;
    if (!C) return Promise.resolve({ err: 'no_user' });
    return C.authLogin(role, name, hashPwd(pwd, '')).then(function (j) {
      if (!j || !j.ok) return { err: (j && j.error) || 'cloud_fail' };
      var nu = {
        id: 'u' + Date.now().toString(36) + Math.random().toString(36).slice(2, 6),
        role: role, name: name,
        salt: j.salt || '', pwd: j.pwd || hashPwd(pwd, j.salt || ''),
        cpwd: hashPwd(pwd, ''),
        grade: (j.snap && j.snap.grade) || '', classCode: (j.snap && j.snap.classCode) || '',
        kidId: '', clsId: '',
        createdAt: Date.now(), lastAt: Date.now(), cloud: true
      };
      var st = read(AST, { users: [] });
      st.users.push(nu);
      saveList(st.users);
      write(SST, { uid: nu.id, at: Date.now() });
      /* 用云端快照重建本机档案 */
      if (j.snap && j.snap.data && onRestore) onRestore(role, j.snap.data, nu);
      return { ok: true, user: nu, restored: true };
    }).catch(function () { return { err: 'no_user' }; });
  }

  function logout() { try { localStorage.removeItem(SST); } catch (e) {} }
  function switchTo(uid) {
    var u = byId(uid);
    if (!u) return false;
    write(SST, { uid: u.id, at: Date.now() });
    try { localStorage.setItem('beast.role', u.role); } catch (e) {}
    u.lastAt = Date.now();
    saveList(list());
    return true;
  }
  function removeUser(uid) {
    var users = list().filter(function (u) { return u.id !== uid; });
    saveList(users);
    var s = read(SST, null);
    if (s && s.uid === uid) logout();
    return true;
  }
  function changePwd(uid, oldP, newP) {
    var u = byId(uid);
    if (!u) return { err: 'no_user' };
    if (u.pwd !== hashPwd(oldP, u.salt)) return { err: 'bad_pwd' };
    if (!pwdOk(newP)) return { err: 'bad_new' };
    u.pwd = hashPwd(newP, u.salt);
    u.cpwd = hashPwd(newP, '');
    u.lastAt = Date.now();
    saveList(list());
    return { ok: true };
  }
  /* 更新账号绑定的档案（孩子升级 / 班级变化时调用） */
  function touch(patch) {
    var u = current();
    if (!u) return null;
    var users = list();
    var me = users.find(function (x) { return x.id === u.id; });
    if (!me) return null;
    Object.keys(patch || {}).forEach(function (k) { me[k] = patch[k]; });
    me.lastAt = Date.now();
    saveList(users);
    return me;
  }

  /* ---------- 云端（可选，服务端不在线时静默跳过） ---------- */
  function cloudRegister(u, pwdPlain) {
    var C = window.BEAST_CLOUD;
    if (!C || !C.authRegister) return;
    /* 离线时不阻塞建档：authRegister 失败会进离线队列补传 */
    C.authRegister(u.role, u.name, hashPwd(pwdPlain, ''), u.salt).catch(function () {});
  }

  /* 整包备份：把当前角色档案推到云端（由 app.js 定时触发） */
  function snapshot() {
    var u = current();
    if (!u) return Promise.resolve({ ok: false, skip: true });
    var C = window.BEAST_CLOUD;
    if (!C || !C.userSync) return Promise.resolve({ ok: false, skip: true });
    var roleKey = 'beast.v1.' + u.role;
    var data = null;
    try { data = JSON.parse(localStorage.getItem(roleKey) || 'null'); } catch (e) {}
    if (!data) return Promise.resolve({ ok: false, skip: true });
    var body = JSON.stringify(data);
    if (body.length > 1200 * 1000) return Promise.resolve({ ok: false, skip: true, tooBig: true });
    return C.userSync(u.role, u.name, u.cpwd || u.pwd, u.salt, {
      grade: u.grade, classCode: u.classCode, data: data
    });
  }

  window.BeastAuth = {
    version: '1.0.0',
    hashPwd: hashPwd,
    pwdOk: pwdOk,
    list: list,
    find: find,
    current: current,
    register: register,
    login: login,
    logout: logout,
    switchTo: switchTo,
    remove: removeUser,
    changePwd: changePwd,
    touch: touch,
    snapshot: snapshot,
    ROLE_NAME: { student: '学生', family: '家长', class: '老师' }
  };
})();
