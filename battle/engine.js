/* ============================================================
 * 《知识大陆 · 宠物远征》学习引擎 v5
 * 职责：掌握度模型(SRS) · 单元顺序关卡 · 智能混合出题 · 多题型判定
 * 依赖：knowledge.js 提供 window.KG_POINTS / KG_BANK / GRADES / SUBJ_META
 * 零外部库，兼容 Android 微信 X5 / 旧 WebView
 * ============================================================ */
'use strict';

const LEARN = (function () {
  var DAY = 86400000;
  /* 熟练度 s -> 复习间隔(天)：错得越多 s 越低、出现越频繁；s 越高间隔越长 */
  var INTERVALS = [0, 1, 2, 4, 7, 15, 30];
  var KEY = 'battle.mastery.v5';
  var SUBJ_ORDER = ['math', 'cn', 'en', 'sci', 'eth', 'phy', 'chem', 'bio', 'his', 'geo'];

  /* 安全存储 */
  var mem = {};
  function getLS(k) {
    try { var v = window.localStorage.getItem(k); return v === null ? (k in mem ? mem[k] : null) : v; }
    catch (e) { return k in mem ? mem[k] : null; }
  }
  function setLS(k, v) {
    mem[k] = v;
    try { window.localStorage.setItem(k, v); } catch (e) { /* 退化为内存 */ }
  }

  var data = {};
  try { data = JSON.parse(getLS(KEY) || '{}') || {}; } catch (e) { data = {}; }
  function save() { setLS(KEY, JSON.stringify(data)); }

  function blank() { return { s: 0, ok: 0, no: 0, due: 0, seen: 0 }; }
  function get(grade, kid) {
    var g = data[grade] || (data[grade] = {});
    return g[kid] || blank();
  }
  /* 记录一次作答；correct=true 提升熟练度并拉长间隔，false 降低并立刻进复习池 */
  function record(grade, kid, correct) {
    var g = data[grade] || (data[grade] = {});
    var m = g[kid] || (g[kid] = blank());
    m.seen++;
    if (correct) {
      m.ok++;
      m.s = Math.min(6, m.s + 1);
      m.due = Date.now() + INTERVALS[m.s] * DAY;
    } else {
      m.no++;
      m.s = Math.max(0, m.s - 2);
      m.due = Date.now();              // 立刻进复习池
    }
    save();
    return m;
  }
  function resetGrade(grade) { data[grade] = {}; save(); }

  /* 抽题权重：错得越多越高、掌握度越低越高、到期加权 */
  function weight(m) {
    return 1 + (m.no || 0) * 2.2 + (6 - (m.s || 0)) * 1.3 + ((m.due && m.due <= Date.now()) ? 3 : 0);
  }

  /* ---------- 知识点 -> 题目索引（按 kid 预建，避免每次全表扫描） ---------- */
  var qIndex = {};   // qIndex[grade][kid] = [题目...]
  function buildIndex() {
    if (Object.keys(qIndex).length) return;
    var bank = window.KG_BANK || {};
    for (var g in bank) {
      qIndex[g] = qIndex[g] || {};
      for (var s in bank[g]) {
        (bank[g][s] || []).forEach(function (q) {
          (qIndex[g][q.kid] || (qIndex[g][q.kid] = [])).push(q);
        });
      }
    }
  }
  function questionsFor(grade, kid) {
    buildIndex();
    var arr = (qIndex[grade] || {})[kid] || [];
    return arr;
  }
  /* ============================================================
   * v1.3 填空降频：手机上打字填答案费劲，抽到 fill 时尽量改成点选。
   *  - 保留少量填空(约三成)，其余转换；
   *  - 优先改用同知识点的现成 choice 题（题目完全合理）；
   *  - 没有 choice 但答案是数字的（计算题），自动生成 4 个数字选项转成 choice；
   *  - 语文/英语等文字类 fill 无 choice 可换时保留原填空。
   * 所有转换只作用在抽出的题目副本上，不改题库源数据。
   * ============================================================ */
  var FILL_KEEP_RATE = 0.32;   // fill 保留率：题库 fill 约16% × 0.32 ≈ 5%

  /* 生成数字型干扰项；返回 {o:[选项文本...], a:正确下标} 或 null */
  function numericOptions(ans) {
    var s = String(ans == null ? '' : ans).trim();
    if (!s) return null;
    var m, opts = [], right = s;
    function add(v) {
      var t = String(Math.round(v * 1000) / 1000);
      if (opts.indexOf(t) < 0 && t !== right) opts.push(t);
    }
    /* 分数 a/b：同分母改分子 */
    m = s.match(/^(-?\d+)\s*\/\s*(\d+)$/);
    if (m) {
      var n = parseInt(m[1], 10), d = parseInt(m[2], 10);
      if (d > 0) {
        /* 同分母改分子 + 交换分子分母 + 相邻分母，凑够 3 个干扰项 */
        [1, -1, 2, -2, 3].forEach(function (k) { if (n + k >= 0) add((n + k) + '/' + d); });
        if (d !== n) add(d + '/' + n === right ? (d + 1) + '/' + n : d + '/' + n);
        if (d + 1 > 0) add(n + '/' + (d + 1));
        if (opts.length >= 3) return pack(opts, right);
      }
    }
    /* 纯数字（含小数）：按量级生成邻近干扰项，避免出现负数 */
    m = s.match(/^-?\d+(?:\.\d+)?$/);
    if (m) {
      var v = Number(s);
      var dec = (s.split('.')[1] || '').length;
      var step = Math.abs(v) >= 100 ? 10 : (Math.abs(v) >= 10 ? 2 : 1);
      /* 候选：±step、±2step、±1，过滤掉负数与 0 以下、保留小数位 */
      var cands = [step, -step, step * 2, -step * 2, 1, -1];
      for (var k = 0; k < cands.length; k++) {
        var nv = v + cands[k];
        if (nv < 0) continue;                       // 小学题不出现负数选项
        var txt = dec ? nv.toFixed(dec) : String(Math.round(nv));
        if (txt !== right && opts.indexOf(txt) < 0) opts.push(txt);
        if (opts.length >= 3) break;
      }
      if (opts.length >= 3) return pack(opts, right);
    }
    return null;
    function pack(others, rightTxt) {
      var all = others.slice(0, 3).concat([rightTxt]);
      /* Fisher-Yates 打散 */
      for (var i = all.length - 1; i > 0; i--) {
        var j = Math.floor(Math.random() * (i + 1)); var t = all[i]; all[i] = all[j]; all[j] = t;
      }
      return { o: all, a: all.indexOf(rightTxt) };
    }
  }

  /* 把抽到的 fill 题尽量软化成点选题。pool = 该知识点全部题(含已用)。 */
  function softenFill(q, pool) {
    if (!q || q.tp !== 'fill') return q;
    if (Math.random() < FILL_KEEP_RATE) return q;   // 保留少量填空
    /* ① 同知识点现成 choice 题 */
    var choices = (pool || []).filter(function (x) { return x.tp === 'choice'; });
    if (choices.length) return choices[Math.floor(Math.random() * choices.length)];
    /* ② 数字答案 -> 自动生成选项 */
    var numOpt = numericOptions(q.ans);
    if (numOpt) {
      var cq = { id: q.id, q: q.q, tp: 'choice', o: numOpt.o, a: numOpt.a,
                 ans: q.ans, exp: q.exp, f: q.f, kn: q.kn, kid: q.kid,
                 unit: q.unit, uidx: q.uidx, ac: q.ac || [] };
      return cq;
    }
    return q;   // ③ 文字类无 choice 可换，保留填空
  }

  /* 从一个知识点取一道题：优先难度匹配、优先未见过的答案文本，随机打散选项副本 */
  function pickFromKid(grade, kid, usedTexts, wantLv) {
    var arr = questionsFor(grade, kid);
    if (!arr.length) return null;
    var pool = arr.filter(function (q) { return !usedTexts || !usedTexts[q.q]; });
    if (!pool.length) pool = arr;
    var q;
    if (wantLv != null) {
      var near = pool.filter(function (x) { return Math.abs(x.f - wantLv) <= 1; });
      q = (near.length ? near : pool)[Math.floor(Math.random() * (near.length ? near.length : pool.length))];
    } else {
      q = pool[Math.floor(Math.random() * pool.length)];
    }
    if (!q) return null;
    q = softenFill(q, arr);
    return cloneQ(q);
  }
  /* 复制题目，选项顺序打散（choice），保持 a/ans 正确 */
  function cloneQ(q) {
    var o = { id: q.id, q: q.q, tp: q.tp, ans: q.ans, exp: q.exp, f: q.f,
              kn: q.kn, kid: q.kid, unit: q.unit, uidx: q.uidx, ac: q.ac || [] };
    if (q.tp === 'choice') {
      var opts = (q.o || []).map(function (t, i) { return { t: t, right: i === q.a }; });
      for (var i = opts.length - 1; i > 0; i--) {
        var j = Math.floor(Math.random() * (i + 1)); var tmp = opts[i]; opts[i] = opts[j]; opts[j] = tmp;
      }
      o.o = opts.map(function (x) { return x.t; });
      o.a = opts.findIndex(function (x) { return x.right; });
      if (o.a < 0) o.a = 0; // 理论上不会发生
    } else { o.o = []; o.a = -1; }
    return o;
  }

  /* ---------- 关卡：按 学科→单元 顺序展开（单元顺序来自图谱 uidx） ---------- */
  var stageCache = {};
  function stages(grade) {
    if (stageCache[grade]) return stageCache[grade];
    var pts = window.KG_POINTS[grade] || {};
    var out = [];
    SUBJ_ORDER.forEach(function (subj) {
      if (!pts[subj] || !pts[subj].length) return;
      var units = {};
      pts[subj].forEach(function (p) {
        var u = p.unit || '综合练习';
        if (!units[u]) units[u] = { name: u, uidx: p.uidx || 0, kids: [] };
        units[u].kids.push(p.id);
      });
      Object.keys(units).map(function (k) { return units[k]; })
        .sort(function (a, b) { return a.uidx - b.uidx; })
        .forEach(function (u) {
          out.push({
            key: grade + '|' + subj + '|' + u.name,
            subj: subj, unit: u.name, uidx: u.uidx,
            kids: u.kids, name: (window.SUBJ_META[subj] || {}).name || subj + ' · ' + u.name
          });
        });
    });
    stageCache[grade] = out;
    return out;
  }

  /* 复习池：到期 / 掌握度低 / 错误多 的知识点，按权重随机取一个 */
  function reviewPick(grade, excludeKid) {
    var g = data[grade] || {};
    var ids = Object.keys(g).filter(function (k) { return k !== excludeKid; });
    if (!ids.length) return null;
    var total = 0, seen = {};
    ids.forEach(function (k) { seen[k] = weight(g[k]); total += seen[k]; });
    if (total <= 0) return ids[Math.floor(Math.random() * ids.length)];
    var r = Math.random() * total;
    for (var i = 0; i < ids.length; i++) {
      r -= seen[ids[i]];
      if (r <= 0) return ids[i];
    }
    return ids[ids.length - 1];
  }
  /* 「已掌握」显示口径：答对≥2次且熟练度≥2 即算入门掌握，短局也能看到增长。
     调度（weight/reviewPick）仍按完整 s 模型走，二者互不影响。 */
  function masteredCount(grade) {
    var g = data[grade] || {};
    return Object.keys(g).filter(function (k) { return (g[k].s || 0) >= 2 && (g[k].ok || 0) >= 2; }).length;
  }
  function learnedCount(grade) { return Object.keys(data[grade] || {}).length; }
  function solidCount(grade) {
    var g = data[grade] || {};
    return Object.keys(g).filter(function (k) { return (g[k].s || 0) >= 4 && (g[k].ok || 0) >= 2; }).length;
  }
  function stats(grade) {
    var g = data[grade] || {}, ok = 0, no = 0;
    Object.keys(g).forEach(function (k) { ok += g[k].ok || 0; no += g[k].no || 0; });
    return { learned: learnedCount(grade), mastered: masteredCount(grade), solid: solidCount(grade), ok: ok, no: no };
  }

  /* ---------- 多题型判定 ----------
   * choice: input = 选项下标
   * fill/short: input = 用户输入文本
   * 返回 true / false / null(需自评，用于简答文本未精确匹配) */
  function normalize(s) {
    if (s == null) return '';
    s = String(s);
    var trans = {
      '０':'0','１':'1','２':'2','３':'3','４':'4','５':'5','６':'6','７':'7','８':'8','９':'9',
      'Ａ':'A','Ｂ':'B','Ｃ':'C','Ｄ':'D','，':',','．':'.','；':';','：':':','（':'(','）':')',
      '＋':'+','－':'-','＝':'=','＞':'>','＜':'<','。':'.','、':',','“”':'"'
    };
    s = s.replace(/[０-９Ａ-Ｄ，．；：（）＋－＝＞＜。、“”]/g, function (c) { return trans[c] != null ? trans[c] : c; });
    s = s.replace(/\s+/g, '').toLowerCase();
    s = s.replace(/[.。,，;；!！?？]$/g, '');
    return s;
  }
  function numericOf(s) {
    var n = normalize(s).replace(/[^0-9.\-]/g, '');
    if (!n || n === '-' || n === '.') return null;
    var v = Number(n);
    return isFinite(v) ? v : null;
  }
  function judge(q, input) {
    if (q.tp === 'choice') return input === q.a;
    var ans = normalize(q.ans);
    var inp = normalize(input);
    if (!inp) return false;
    if (inp === ans) return true;
    var accepts = (q.ac || []).map(normalize);
    if (accepts.indexOf(inp) >= 0) return true;
    /* 数值题：数值相等即判对（容忍 0.5 vs .5、整数 vs 小数） */
    var an = numericOf(q.ans), inn = numericOf(input);
    if (an != null && inn != null && Math.abs(an - inn) < 1e-6) return true;
    /* 简答题文本未精确匹配 -> 交给自评，避免误判孩子 */
    if (q.tp === 'short') return null;
    return false;
  }

  /* ============================================================
   * v6 诊断内核 DIAG —— 答错追根（参考 cn-math-taxonomy 自适应诊断算法）
   * 思路：
   *  - 同一知识点连对 N 题(默认3)才算掌握，掌握后跳过其所有先修(祖先)
   *  - 答错：先出一道「更简单的确认题」；确认题也错→判「薄弱」并沿 deps 硬边
   *    回溯到最深的未掌握先修(根知识)，定向出根知识题检测
   *  - 确认题答对→判「不稳」，不回溯
   *  - 输出：根因 + 从低年级到当前的学习路径 + 课标
   * 数据：知识点带 deps(先修 id)；跨年级先修按需加载分片
   * ============================================================ */
  var DIAG_KEY = 'battle.diag.v6';
  var dstate = {};
  try { dstate = JSON.parse(getLS(DIAG_KEY) || '{}') || {}; } catch (e) { dstate = {}; }
  var CONFIRM_NEED = 3;          // 连对几题算掌握
  var MAX_DEPTH = 12;            // 回溯最大深度

  function dsave() { setLS(DIAG_KEY, JSON.stringify(dstate)); }
  function dget(kid) {
    return dstate[kid] || (dstate[kid] = { streak: 0, status: 'learning', seen: 0 });
  }
  function isMastered(kid) { return !!(dstate[kid] && dstate[kid].status === 'mastered'); }

  /* 全局知识点索引：跨年级合并。分片未加载时先建已加载部分 */
  var pointIndex = null, bankIndex = null;
  function buildIndexAll(force) {
    if (pointIndex && !force) return;
    pointIndex = {}; bankIndex = {};
    var pts = window.KG_POINTS || {}, bank = window.KG_BANK || {};
    Object.keys(pts).forEach(function (g) {
      Object.keys(pts[g]).forEach(function (s) {
        (pts[g][s] || []).forEach(function (p) {
          pointIndex[p.id] = { id: p.id, n: p.n, unit: p.unit, deps: p.deps || [], grade: g, subj: s, uidx: p.uidx || 0 };
        });
      });
    });
    Object.keys(bank).forEach(function (g) {
      Object.keys(bank[g]).forEach(function (s) {
        (bank[g][s] || []).forEach(function (q) {
          if (!q.kid) return;
          (bankIndex[q.kid] || (bankIndex[q.kid] = [])).push(q);
        });
      });
    });
  }
  /* 需要某先修分片时请求加载（异步），loaded 后回调 */
  function ensureGradeLoaded(grade, cb) {
    if (!grade || (window.KG_LOADED && window.KG_LOADED[grade]) || !window.KG_API) { cb && cb(); return; }
    window.KG_API.load(grade, function () { cb && cb(); });
  }
  /* 直接先修（硬边：把 deps 都当必须先学的硬依赖） */
  function prereqs(kid) {
    buildIndexAll();
    var p = pointIndex[kid];
    return p ? (p.deps || []).slice() : [];
  }
  function pointOf(kid) { buildIndexAll(); return pointIndex[kid] || null; }
  function questionsOf(kid) { buildIndexAll(); return bankIndex[kid] || []; }
  function hasQuestions(kid) { return questionsOf(kid).length > 0; }

  /* 判定掌握：status=mastered 视为已掌握 */
  function mastered(kid) { return isMastered(kid); }

  /* 沿 deps 递归找「最深的、未掌握、且有题可出」的先修 = 根知识。
     返回 {root, path}；path 从根到当前 kid（不含当前），用于学习路径展示。 */
  function findRoot(kid, _depth, _seen) {
    buildIndexAll();
    _depth = _depth || 0; _seen = _seen || {};
    if (_depth >= MAX_DEPTH) return null;
    var deps = prereqs(kid);
    if (!deps.length) return null;
    var best = null;
    deps.forEach(function (d) {
      if (_seen[d]) return;
      _seen[d] = 1;
      /* 只沿「未掌握」的边回溯：已掌握的祖先跳过（等价于文章中连对后跳过祖先） */
      if (mastered(d)) return;
      var sub = findRoot(d, _depth + 1, _seen);
      var cand;
      if (sub && hasQuestions(sub.root)) {
        cand = { root: sub.root, path: sub.path.concat([d]) };
      } else if (hasQuestions(d)) {
        cand = { root: d, path: [d] };
      }
      if (cand && (!best || cand.path.length > best.path.length)) best = cand;
    });
    return best;
  }

  /* 记录一次作答，返回诊断决策。
     opts.confirm === true 表示这道题是「确认题」(更简单、同一知识点)
     opts.isRoot  === true 表示这道题是回溯出的根知识题
     返回：{action:'master'|'confirm'|'weak'|'unstable'|'continue', kid, root, path, confirmKid, ...} */
  function onAnswer(kid, correct, opts) {
    opts = opts || {};
    buildIndexAll();
    var st = dget(kid);
    st.seen++;
    if (correct) {
      st.streak = (st.streak || 0) + 1;
      if (opts.confirm) {
        /* 确认题答对：判「不稳」，不回溯，但连对计数保留推进 */
        st.status = st.streak >= CONFIRM_NEED ? 'mastered' : 'unstable';
        dsave();
        return { action: st.status === 'mastered' ? 'master' : 'unstable', kid: kid, streak: st.streak, confirm: true };
      }
      if (st.streak >= CONFIRM_NEED) {
        st.status = 'mastered';
        dsave();
        /* 掌握后：跳过所有祖先——把直接先修及以上也标记为跳过(不回溯) */
        markAncestorsSkipped(kid);
        return { action: 'master', kid: kid, streak: st.streak };
      }
      st.status = st.status === 'weak' ? 'unstable' : 'learning';
      dsave();
      return { action: 'continue', kid: kid, streak: st.streak };
    }
    /* 答错 */
    st.streak = 0;
    st.status = 'weak';
    dsave();
    /* 已进入追踪阶段（确认题或根知识题）答错：判薄弱，沿先修回溯根知识 */
    if (opts.confirm || opts.isRoot) {
      var deeper = findRoot(kid);
      if (deeper && deeper.root && deeper.root !== kid) {
        return { action: 'weak', kid: kid, root: deeper.root, path: deeper.path, isRoot: true, confirmKid: null };
      }
      return { action: 'weak', kid: kid, root: kid, path: [], isRoot: true, noMore: true };
    }
    /* 首错：出一道更简单的确认题（同知识点） */
    var soft = softerQuestion(kid);
    return { action: 'confirm', kid: kid, confirmKid: kid, confirm: true, softer: !!soft };
  }

  /* 掌握后把祖先标记为 mastered（跳过其先修，不再回溯） */
  function markAncestorsSkipped(kid, _seen) {
    _seen = _seen || {};
    prereqs(kid).forEach(function (d) {
      if (_seen[d]) return; _seen[d] = 1;
      if (dstate[d] && dstate[d].status === 'weak') { dstate[d].status = 'skipped'; dsave(); }
      markAncestorsSkipped(d, _seen);
    });
  }

  /* 取一道更简单的确认题：优先 f（难度）低的、优先 choice 题 */
  function softerQuestion(kid) {
    var arr = questionsOf(kid);
    if (!arr.length) return null;
    var sorted = arr.slice().sort(function (a, b) { return (a.f || 0) - (b.f || 0); });
    var easy = sorted.filter(function (q) { return (q.f || 0) <= 1 && q.tp === 'choice' && q.o && q.o.length; });
    var pool = easy.length ? easy : sorted.filter(function (q) { return q.tp === 'choice' && q.o && q.o.length; });
    return pool[0] || sorted[0] || null;
  }

  /* 学习路径：从根到 kid 的知识点名称数组（按年级从低到高） */
  function learningPath(rootKid, targetKid) {
    buildIndexAll();
    var path = [], cur = targetKid, guard = 0;
    while (cur && cur !== rootKid && guard++ < MAX_DEPTH) {
      var p = pointIndex[cur];
      if (!p) break;
      path.push({ id: p.id, n: p.n, grade: p.grade, unit: p.unit });
      /* 取第一个未掌握先修作为路径上一环 */
      var up = (p.deps || []).filter(function (d) { return !mastered(d); })[0] || (p.deps || [])[0];
      cur = up;
    }
    if (rootKid && pointIndex[rootKid]) {
      var r = pointIndex[rootKid];
      path.push({ id: r.id, n: r.n, grade: r.grade, unit: r.unit });
    }
    path.reverse();
    return path;
  }

  function diagReset() { dstate = {}; dsave(); }
  function diagStats() {
    var all = Object.keys(dstate), weak = 0, unstable = 0, mastered = 0;
    all.forEach(function (k) {
      var s = dstate[k].status;
      if (s === 'weak') weak++; else if (s === 'unstable') unstable++; else if (s === 'mastered') mastered++;
    });
    return { total: all.length, weak: weak, unstable: unstable, mastered: mastered };
  }

  var DIAG = {
    onAnswer: onAnswer, findRoot: findRoot, pointOf: pointOf, questionsOf: questionsOf,
    prereqs: prereqs, softerQuestion: softerQuestion, learningPath: learningPath,
    isMastered: isMastered, ensureGradeLoaded: ensureGradeLoaded,
    buildIndex: function () { return buildIndexAll(true); }, reset: diagReset, stats: diagStats,
    CONFIRM_NEED: CONFIRM_NEED,
    get state() { return dstate; }
  };

  /* ============================================================
   * v7 学习进度（按答题自动推算）
   *  - 学到哪 = 已作答知识点所在的最大单元(stages 下标)
   *  - 可出题范围 = 已学单元 + 1（留「正在学」的下一单元，避免卡死）
   *  - 手动通关进度也纳入，避免老用户数据倒退
   * 目的：不出没学到的知识点；地图/清单/统计口径一致。
   * ============================================================ */
  var _progressCache = {}, _progressKey = {};
  function progressKey(grade) {
    var g = data[grade] || {};
    var s = Object.keys(g).map(function (k) { return k + ':' + (g[k].seen || 0) + ':' + (g[k].s || 0) + ':' + (g[k].ok || 0); }).join('|');
    var mp = '';
    try { mp = getLS('battle.map.progress') || ''; } catch (e) {}
    return s + '#' + mp + '#' + Object.keys(window.KG_LOADED || {}).join(',');
  }
  function progressInfo(grade) {
    var key = progressKey(grade);
    if (_progressCache[grade] && _progressKey[grade] === key) return _progressCache[grade];
    var sts = stages(grade);
    var g = data[grade] || {};
    var learned = {}, mastery = {}, lastUnit = -1;
    sts.forEach(function (st, ui) {
      st.kids.forEach(function (k) {
        var m = g[k];
        if (m && (m.seen || 0) > 0) { learned[k] = 1; if (ui > lastUnit) lastUnit = ui; }
        if (m && (m.s || 0) >= 2 && (m.ok || 0) >= 2) mastery[k] = 1;
      });
    });
    /* 老数据：作答过但不在当前 stages 里的也计入 */
    Object.keys(g).forEach(function (k) {
      if ((g[k].seen || 0) > 0) learned[k] = 1;
      if ((g[k].s || 0) >= 2 && (g[k].ok || 0) >= 2) mastery[k] = 1;
    });
    var manual = 0;
    try { var mp = JSON.parse(getLS('battle.map.progress') || '{}') || {}; manual = parseInt(mp[grade] || 0, 10) || 0; } catch (e) {}
    /* reachUnit：可学到的最远单元。自动推算 lastUnit+1 与手动通关数取大 */
    var reachUnit = Math.min(sts.length - 1, Math.max(lastUnit + 1, manual));
    if (reachUnit < 0) reachUnit = 0;
    var inScope = {};
    for (var u = 0; u <= reachUnit && u < sts.length; u++) {
      sts[u].kids.forEach(function (k) { inScope[k] = 1; });
    }
    var totalCount = 0; sts.forEach(function (st) { totalCount += st.kids.length; });
    var info = {
      grade: grade,
      lastUnit: lastUnit,
      reachUnit: reachUnit,
      manualProgress: manual,
      learned: learned, mastery: mastery, inScope: inScope,
      learnedCount: Object.keys(learned).length,
      masteredCount: Object.keys(mastery).length,
      expectedCount: Object.keys(inScope).length,
      totalCount: totalCount,
      unitName: (sts[reachUnit] || sts[0] || {}).unit || ''
    };
    _progressCache[grade] = info; _progressKey[grade] = key;
    return info;
  }
  function isInScope(grade, kid) {
    if (!kid) return true;
    var sts = stages(grade), known = false;
    for (var i = 0; i < sts.length; i++) {
      if (sts[i].kids.indexOf(kid) >= 0) { known = true; break; }
    }
    if (!known) return true;   // 跨年级先修题放行（补基础本就合理）
    return !!progressInfo(grade).inScope[kid];
  }
  function kidsInScope(grade) { return Object.keys(progressInfo(grade).inScope); }
  var PROGRESS = {
    info: progressInfo, isInScope: isInScope, kidsInScope: kidsInScope,
    invalidate: function () { _progressCache = {}; _progressKey = {}; },
    AHEAD: 1
  };

  return {
    record: record, get: get, resetGrade: resetGrade, weight: weight,
    stages: stages, reviewPick: reviewPick, pickFromKid: pickFromKid, questionsFor: questionsFor,
    judge: judge, normalize: normalize, masteredCount: masteredCount,
    learnedCount: learnedCount, solidCount: solidCount, stats: stats, cloneQ: cloneQ,
    DIAG: DIAG, PROGRESS: PROGRESS,
    get data() { return data; }
  };
})();
if (typeof window !== 'undefined') window.LEARN = LEARN;
if (typeof window !== 'undefined') window.DIAG = LEARN.DIAG;
