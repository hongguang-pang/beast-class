#!/usr/bin/env python3
# -*- coding: utf-8 -*-
"""
伴学宠物 · 冒险大陆知识数据更新脚本
====================================================
从上游仓库 xiaoyang111222/cn-math-taxonomy 拉取最新知识点/先修边/题库，
转换为本项目 knowledge.js + data/kg/g*.js 分片格式。

用法:
  python3 update_data.py --out /path/to/site/battle   # 拉取并生成到目标站点
  python3 update_data.py --check                      # 仅检查上游是否有更新
  python3 update_data.py --use-local                  # 用已下载的上游 JSON（调试）

设计要点（参考 cn-math-taxonomy 诊断算法）:
  - 先修边只取 strength=hard（软边只影响顺序，不用于推断掌握）
  - 知识点 unit 取自 chapter，uidx 按年级内章节顺序
  - 题库按 topicId 挂到知识点；numeric/fill 题型交给前端 softenFill 软化
  - 版本戳写入 KG_META.updated（上游 commit sha），前端可显示
"""
import argparse, urllib.request, json, base64, time, os, sys, re

REPO = 'xiaoyang111222/cn-math-taxonomy'
BRANCH = 'main'
TOKEN = None
API = 'https://api.github.com'

# 学科目录名 -> 本项目 subject key
SUBJ_FILES = {
    'math': 'math', 'chinese': 'cn', 'english': 'en', 'science': 'sci',
    'morality': 'eth', 'physics': 'phy', 'chemistry': 'chem',
    'biology': 'bio', 'history': 'his', 'geography': 'geo',
    'politics': 'eth',  # 政治并入道德与法治
}
SUBJ_META = {
    "math":{"name":"数学","icon":"🧮"},"cn":{"name":"语文","icon":"📖"},"en":{"name":"英语","icon":"🔤"},
    "sci":{"name":"科学","icon":"🔬"},"eth":{"name":"道德与法治","icon":"⚖️"},"phy":{"name":"物理","icon":"⚛️"},
    "chem":{"name":"化学","icon":"🧪"},"bio":{"name":"生物","icon":"🧬"},"his":{"name":"历史","icon":"🏛️"},
    "geo":{"name":"地理","icon":"🌍"},
}
# 题库 type -> 前端 tp
TP_MAP = {'numeric':'fill', 'choice':'choice', 'fill':'fill', 'short':'short', 'boolean':'choice', 'multiple':'choice'}
DIFF_MAP = {'basic':0, 'intermediate':1, 'advanced':2, 'easy':0, 'medium':1, 'hard':2}
GRADE_NAMES = {1:'1年级',2:'2年级',3:'3年级',4:'4年级',5:'5年级',6:'6年级',
               7:'初一',8:'初二',9:'初三',10:'高一',11:'高二',12:'高三'}


def headers():
    h = {'User-Agent': 'beast-class-data-updater', 'Accept': 'application/vnd.github+json'}
    if TOKEN:
        h['Authorization'] = 'token ' + TOKEN
    return h


def api_get(path, timeout=90):
    req = urllib.request.Request(API + path, headers=headers())
    with urllib.request.urlopen(req, timeout=timeout) as r:
        return json.loads(r.read().decode('utf-8'))


def get_tree():
    return api_get('/repos/%s/git/trees/%s?recursive=1' % (REPO, BRANCH), timeout=120)


def download_blob(sha, tries=6, timeout=120):
    """用 Git Data API 下载 blob（raw.githubusercontent 在部分网络不通）"""
    u = API + '/repos/%s/git/blobs/%s' % (REPO, sha)
    last = None
    for i in range(tries):
        try:
            req = urllib.request.Request(u, headers=headers())
            with urllib.request.urlopen(req, timeout=timeout) as r:
                raw = r.read()
            j = json.loads(raw.decode('utf-8'))
            content = j['content']
            return base64.b64decode(content)
        except Exception as e:
            last = e
            time.sleep(2 + i)
    raise RuntimeError('下载 blob 失败: %s' % last)


def load_json_bytes(b):
    return json.loads(b.decode('utf-8-sig'))


def fetch_all(workdir):
    """下载上游数据到本地 workdir，返回 (topics, deps, questions_by_subj, commit_sha)"""
    os.makedirs(workdir, exist_ok=True)
    tree = get_tree()
    sha = {x['path']: x['sha'] for x in tree['tree'] if x['type'] == 'blob'}
    needed = ['data/topics.json', 'data/dependencies.json']
    for f in SUBJ_FILES:
        needed.append('data/questions/%s.json' % f)
    for p in needed:
        if p not in sha:
            print('  [警告] 上游缺少', p)

    def get_json(path, local):
        data = download_blob(sha[path])
        open(os.path.join(workdir, local), 'wb').write(data)
        print('  下载', path, len(data), 'bytes')
        return load_json_bytes(data)

    topics = get_json('data/topics.json', 'topics.json')
    deps = get_json('data/dependencies.json', 'dependencies.json')
    qmap = {}
    for f, subj in SUBJ_FILES.items():
        p = 'data/questions/%s.json' % f
        if p not in sha:
            continue
        arr = get_json(p, 'q_%s.json' % f)
        for q in arr:
            qmap.setdefault(q.get('topicId'), []).append(q)
    # commit sha 作为版本戳
    ref = api_get('/repos/%s/git/ref/heads/%s' % (REPO, BRANCH), timeout=60)
    return topics, deps, qmap, ref['object']['sha'][:10]


def use_local(workdir):
    topics = json.load(open(os.path.join(workdir, 'topics.json')))
    deps = json.load(open(os.path.join(workdir, 'dependencies.json')))
    qmap = {}
    for f, subj in SUBJ_FILES.items():
        p = os.path.join(workdir, 'q_%s.json' % f)
        if not os.path.exists(p):
            continue
        for q in json.load(open(p)):
            qmap.setdefault(q.get('topicId'), []).append(q)
    ver = open(os.path.join(workdir, 'version.txt')).read().strip() if os.path.exists(os.path.join(workdir, 'version.txt')) else 'local'
    return topics, deps, qmap, ver


def build(topics, deps, qmap, commit_sha, out_battle):
    # ---- 1. 先修边：只取 hard，建 topicId -> [prereqId] ----
    hard = {}
    for e in deps:
        if e.get('strength') != 'hard':
            continue
        hard.setdefault(e['topicId'], []).append(e['prerequisiteId'])

    # ---- 2. subject 归一：上游 subject 字段或按 id 前缀推断 ----
    def subj_of(t):
        s = t.get('subject')
        if s in SUBJ_META:
            return s
        tid = t.get('id', '')
        if tid.startswith('cnm'): return 'math'
        if tid.startswith('cne'): return 'en'
        if tid.startswith('cnc'): return 'cn'
        # 用题库的学科兜底
        return 'math'

    # ---- 3. 按 (grade, subj) 组织知识点，确定 unit/uidx ----
    # grade 13,14,15,16 收敛到 12（高中后缀）
    def norm_grade(g):
        try: g = int(g)
        except Exception: g = 3
        return min(12, max(1, g))

    gpoints = {}  # grade -> subj -> [point]
    chapter_order = {}  # (grade,subj) -> {chapter: idx}
    for t in topics:
        g = norm_grade(t.get('grade'))
        sj = subj_of(t)
        chapter = t.get('chapter') or t.get('lesson') or '综合练习'
        key = (g, sj)
        chapter_order.setdefault(key, {})
        if chapter not in chapter_order[key]:
            chapter_order[key][chapter] = len(chapter_order[key])
        p = {
            'id': t['id'],
            'n': t.get('name') or t.get('id'),
            'unit': chapter,
            'uidx': chapter_order[key][chapter],
            'deps': hard.get(t['id'], []),
            'h': 10,  # 基础权重（上游无对应热度字段）
            'y': t.get('type') or 'conceptual',
        }
        gpoints.setdefault(g, {}).setdefault(sj, []).append(p)

    # ---- 4. 题库转成前端结构，按知识点挂 ----
    # name 索引
    name_of = {t['id']: (t.get('name') or t.get('id')) for t in topics}
    topic_of = {t['id']: t for t in topics}
    gbank = {}  # grade -> subj -> [question]
    qcount = 0
    for kid, qlist in qmap.items():
        t = topic_of.get(kid)
        if not t:
            continue
        g = norm_grade(t.get('grade'))
        sj = subj_of(t)
        chapter = t.get('chapter') or t.get('lesson') or '综合练习'
        uidx = chapter_order.get((g, sj), {}).get(chapter, 0)
        for q in qlist:
            tp = TP_MAP.get(q.get('type'), 'fill')
            ans = str(q.get('answer', ''))
            item = {
                'id': q.get('id') or (kid + '_q'),
                'q': q.get('prompt') or q.get('question') or '',
                'ans': ans,
                'exp': q.get('explanation') or q.get('explain') or '',
                'f': DIFF_MAP.get(q.get('difficulty'), 1),
                'kn': name_of.get(kid, ''),
                'kid': kid,
                'unit': chapter,
                'uidx': uidx,
                'tp': tp,
            }
            opts = q.get('options') or q.get('choices')
            if tp == 'choice' and opts:
                # 选项可能是 list[str] 或 list[dict]
                texts = []
                for o in opts:
                    texts.append(o.get('text') or o.get('label') or o.get('content') if isinstance(o, dict) else str(o))
                texts = [x for x in texts if x]
                if texts:
                    right = 0
                    for i, x in enumerate(texts):
                        if x.strip() == ans.strip():
                            right = i; break
                    item['o'] = texts
                    item['a'] = right
            elif tp == 'fill' and not item['ans']:
                continue
            if not item['q']:
                continue
            gbank.setdefault(g, {}).setdefault(sj, []).append(item)
            qcount += 1

    # ---- 5. 写出分片 ----
    kgdir = os.path.join(out_battle, 'data', 'kg')
    os.makedirs(kgdir, exist_ok=True)
    shards = {}
    total_points = 0
    for g in range(1, 13):
        pts = gpoints.get(g, {})
        bank = gbank.get(g, {})
        np = sum(len(v) for v in pts.values())
        nq = sum(len(v) for v in bank.values())
        total_points += np
        fpath = 'data/kg/g%d.js' % g
        # 知识点
        pts_js = json.dumps(pts, ensure_ascii=False, separators=(',', ':'))
        bank_js = json.dumps(bank, ensure_ascii=False, separators=(',', ':'))
        names = {sj: [p['n'] for p in arr] for sj, arr in pts.items()}
        names_js = json.dumps(names, ensure_ascii=False, separators=(',', ':'))
        content = ('/* battle knowledge shard g%d · 自动更新 %s */\n' % (g, commit_sha) +
                   'window.KG_POINTS["g%d"]=%s;\n' % (g, pts_js) +
                   'window.KG_BANK["g%d"]=%s;\n' % (g, bank_js) +
                   'window.KG_NAMES["g%d"]=%s;\n' % (g, names_js))
        open(os.path.join(out_battle, fpath), 'w', encoding='utf-8').write(content)
        shards['g%d' % g] = {'p': np, 'q': nq, 'f': fpath}

    # ---- 6. 写 knowledge.js（保留静态配置，更新元数据与分片索引）----
    kpath = os.path.join(out_battle, 'data', 'knowledge.js')
    tmpl = open(kpath, encoding='utf-8').read() if os.path.exists(kpath) else ''
    updated_meta = '"points":%d,"questions":%d,"source":"cn-math-taxonomy CC BY-NC 4.0","updated":"%s"' % (total_points, qcount, commit_sha)
    if tmpl:
        tmpl = re.sub(r'window\.KG_META\s*=\s*\{[^}]*\};', 'window.KG_META = {%s};' % updated_meta, tmpl)
        tmpl = re.sub(r'window\.KG_TOTAL\s*=\s*\d+;', 'window.KG_TOTAL = %d;' % total_points, tmpl)
        tmpl = re.sub(r'window\.KG_BANK_TOTAL\s*=\s*\d+;', 'window.KG_BANK_TOTAL = %d;' % qcount, tmpl)
        tmpl = re.sub(r'window\.KG_SHARDS\s*=\s*\{[^;]*\};', 'window.KG_SHARDS = %s;' % json.dumps(shards, separators=(',', ':')), tmpl)
        # 头部注释加更新时间
        tmpl = tmpl.replace('全量 3383 知识点', '全量 %d 知识点' % total_points)
        open(kpath, 'w', encoding='utf-8').write(tmpl)
    else:
        print('  [错误] 找不到 knowledge.js 模板')

    # ---- 7. 版本戳 ----
    ver = {'commit': commit_sha, 'points': total_points, 'questions': qcount,
           'ts': int(time.time() * 1000)}
    open(os.path.join(out_battle, 'data', 'version.json'), 'w', encoding='utf-8').write(
        json.dumps(ver, ensure_ascii=False, separators=(',', ':')))
    print('生成完成: %d 知识点, %d 题, 版本 %s' % (total_points, qcount, commit_sha))
    return ver


def check_update(workdir):
    tree = get_tree()
    sha = {x['path']: x['sha'] for x in tree['tree'] if x['type'] == 'blob'}
    cur = sha.get('data/topics.json', '')[:10]
    old = ''
    vf = os.path.join(workdir, 'version.txt')
    if os.path.exists(vf):
        old = open(vf).read().strip()
    print('上游 topics sha:', cur, '本地记录:', old or '(无)')
    return cur != old, cur


def main():
    ap = argparse.ArgumentParser()
    ap.add_argument('--out', help='目标 battle 目录')
    ap.add_argument('--check', action='store_true', help='仅检查是否有更新')
    ap.add_argument('--use-local', action='store_true', help='使用本地已下载 JSON')
    ap.add_argument('--workdir', default='/root/.codebuddy/artifact/battlefix/_upstream', help='上游数据缓存目录')
    args = ap.parse_args()

    global TOKEN
    tf = '/root/.codebuddy/artifact/touchfix/.tok'
    if os.path.exists(tf):
        parts = open(tf).read().split('\t')
        if len(parts) > 1:
            TOKEN = parts[1].strip()

    os.makedirs(args.workdir, exist_ok=True)
    if args.check:
        changed, cur = check_update(args.workdir)
        print('HAS_UPDATE' if changed else 'NO_UPDATE', cur)
        open(os.path.join(args.workdir, 'version.txt'), 'w').write(cur)
        return

    if args.use_local:
        topics, deps, qmap, sha = use_local(args.workdir)
    else:
        topics, deps, qmap, sha = fetch_all(args.workdir)
        open(os.path.join(args.workdir, 'version.txt'), 'w').write(sha)
    out = args.out or '/root/.codebuddy/artifact/battlefix'
    build(topics, deps, qmap, sha, out)


if __name__ == '__main__':
    main()
