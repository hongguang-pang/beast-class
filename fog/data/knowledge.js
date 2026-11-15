/* ============================================================
 * 《知识大陆 · 雾灯》知识数据（纯数据，可整表替换）
 * 10 座碑 = 10 个知识点，面向 8-12 岁，覆盖数学/语文/科学/常识。
 * 字段说明：
 *   seg     所属段 1-3
 *   layout  碑型：step 阶（竖排 4 槽）/ pair 对（题面+影子槽）/ fill 补（句子缺字）
 *   slots[] 槽：id / hint(槽位提示字或题面) / shape(凹槽形状) / accept(正确片 id)
 *   chips[] 片：id / label(显字) / shape / correct
 *   stem    补型碑的句子，「＿＿」按顺序对应 3 个槽
 *   step    补型的槽内序号字（1/2/3）
 * 判定：槽满且每个槽里的片都在它的 accept 里 → 碑亮。
 * 形状不合的片放不进槽（先筛形状，再在槽满时判义）。
 * ============================================================ */
window.KNOWLEDGE = [
  /* ---------- 段 1 · 石板路：三座阶型 ---------- */
  {
    id: 'm1', seg: 1, layout: 'step', title: '万以内数的大小比较', subj: '数学',
    slots: [
      { id: 's1', hint: '小', shape: 'sq', accept: ['c4999'] },
      { id: 's2', hint: '',   shape: 'ci', accept: ['c5000'] },
      { id: 's3', hint: '',   shape: 'ro', accept: ['c5008'] },
      { id: 's4', hint: '大', shape: 'tr', accept: ['c5080'] }
    ],
    chips: [
      { id: 'c4999', label: '4999', shape: 'sq', correct: true },
      { id: 'c5000', label: '5000', shape: 'ci', correct: true },
      { id: 'c5008', label: '5008', shape: 'ro', correct: true },
      { id: 'c5080', label: '5080', shape: 'tr', correct: true },
      { id: 'c5800', label: '5800', shape: 'sq', correct: false }
    ]
  },
  {
    id: 'm2', seg: 1, layout: 'step', title: '汉字笔画比多少', subj: '语文',
    /* 形状全同：只能靠读字 */
    slots: [
      { id: 's1', hint: '2画', shape: 'ro', accept: ['cren'] },
      { id: 's2', hint: '3画', shape: 'ro', accept: ['ckou'] },
      { id: 's3', hint: '4画', shape: 'ro', accept: ['cmu'] },
      { id: 's4', hint: '9画', shape: 'ro', accept: ['cxing'] }
    ],
    chips: [
      { id: 'cren',  label: '人', shape: 'ro', correct: true },
      { id: 'ckou',  label: '口', shape: 'ro', correct: true },
      { id: 'cmu',   label: '木', shape: 'ro', correct: true },
      { id: 'cxing', label: '星', shape: 'ro', correct: true },
      { id: 'ctian', label: '田', shape: 'ro', correct: false }
    ]
  },
  {
    id: 'm3', seg: 1, layout: 'step', title: '一天的时间顺序', subj: '常识',
    slots: [
      { id: 's1', hint: '最早', shape: 'sq', accept: ['cmorning'] },
      { id: 's2', hint: '',    shape: 'ci', accept: ['cnoon'] },
      { id: 's3', hint: '',    shape: 'ro', accept: ['cdusk'] },
      { id: 's4', hint: '最晚', shape: 'tr', accept: ['cnight'] }
    ],
    chips: [
      { id: 'cmorning', label: '清晨', shape: 'sq', correct: true },
      { id: 'cnoon',    label: '中午', shape: 'ci', correct: true },
      { id: 'cdusk',    label: '黄昏', shape: 'ro', correct: true },
      { id: 'cnight',   label: '深夜', shape: 'tr', correct: true },
      { id: 'cevening', label: '傍晚', shape: 'ro', correct: false }
    ]
  },

  /* ---------- 段 2 · 雾林：三座对型 + 一座阶型 ---------- */
  {
    id: 'p1', seg: 2, layout: 'pair', title: '部首找朋友', subj: '语文',
    /* 形状全同：左眼是部首，右槽收带这个部首的字 */
    slots: [
      { id: 's1', hint: '氵', shape: 'sq', accept: ['che'] },
      { id: 's2', hint: '心', shape: 'sq', accept: ['cxiang'] },
      { id: 's3', hint: '日', shape: 'sq', accept: ['cxing2'] }
    ],
    chips: [
      { id: 'che',    label: '河', shape: 'sq', correct: true },
      { id: 'cxiang', label: '想', shape: 'sq', correct: true },
      { id: 'cxing2', label: '星', shape: 'sq', correct: true },
      { id: 'ccun',   label: '村', shape: 'sq', correct: false },
      { id: 'cbing',  label: '冰', shape: 'sq', correct: false }
    ]
  },
  {
    id: 'p2', seg: 2, layout: 'pair', title: '它们爱吃什么', subj: '科学',
    slots: [
      { id: 's1', hint: '兔子', shape: 'ci', accept: ['cluobo'] },
      { id: 's2', hint: '猫',   shape: 'ro', accept: ['cyu'] },
      { id: 's3', hint: '熊猫', shape: 'sq', accept: ['czhu'] }
    ],
    chips: [
      { id: 'cluobo', label: '萝卜', shape: 'ci', correct: true },
      { id: 'cyu',    label: '小鱼', shape: 'ro', correct: true },
      { id: 'czhu',   label: '竹子', shape: 'sq', correct: true },
      { id: 'cgutou', label: '骨头', shape: 'ci', correct: false },
      { id: 'cshuye', label: '树叶', shape: 'ro', correct: false }
    ]
  },
  {
    id: 'p3', seg: 2, layout: 'pair', title: '填上合适的单位', subj: '数学',
    /* 形状全同：左眼是句子，右槽收单位 */
    slots: [
      { id: 's1', hint: '跑50米约12＿',   shape: 'ci', accept: ['cmiao'] },
      { id: 's2', hint: '一杯水约300＿',  shape: 'ci', accept: ['chesheng'] },
      { id: 's3', hint: '身高约130＿',    shape: 'ci', accept: ['cli'] }
    ],
    chips: [
      { id: 'cmiao',    label: '秒',   shape: 'ci', correct: true },
      { id: 'chesheng', label: '毫升', shape: 'ci', correct: true },
      { id: 'cli',      label: '厘米', shape: 'ci', correct: true },
      { id: 'cke',      label: '千克', shape: 'ci', correct: false },
      { id: 'cfen',     label: '分钟', shape: 'ci', correct: false }
    ]
  },
  {
    id: 's4', seg: 2, layout: 'step', title: '分数的大小比较', subj: '数学',
    slots: [
      { id: 's1', hint: '小', shape: 'sq', accept: ['c14'] },
      { id: 's2', hint: '',   shape: 'ci', accept: ['c12'] },
      { id: 's3', hint: '',   shape: 'ro', accept: ['c23'] },
      { id: 's4', hint: '大', shape: 'tr', accept: ['c56'] }
    ],
    chips: [
      { id: 'c14', label: '1/4', shape: 'sq', correct: true },
      { id: 'c12', label: '1/2', shape: 'ci', correct: true },
      { id: 'c23', label: '2/3', shape: 'ro', correct: true },
      { id: 'c56', label: '5/6', shape: 'tr', correct: true },
      { id: 'c35', label: '3/5', shape: 'ci', correct: false }
    ]
  },

  /* ---------- 段 3 · 问答桥：两座补型 + 一座阶型 ---------- */
  {
    id: 'f1', seg: 3, layout: 'fill', title: '水的三态变化', subj: '科学',
    stem: '冰融化成＿＿，水烧开变成＿＿，水蒸气遇冷又凝成＿＿。',
    step: ['一', '二', '三'],
    slots: [
      { id: 's1', hint: '①', shape: 'tr', accept: ['cshui'] },
      { id: 's2', hint: '②', shape: 'sq', accept: ['czhengqi'] },
      { id: 's3', hint: '③', shape: 'ro', accept: ['cdi'] }
    ],
    chips: [
      { id: 'cshui',    label: '水',     shape: 'tr', correct: true },
      { id: 'czhengqi', label: '水蒸气', shape: 'sq', correct: true },
      { id: 'cdi',      label: '小水滴', shape: 'ro', correct: true },
      { id: 'cbaiyun',  label: '白云',   shape: 'sq', correct: false },
      { id: 'cbingkuai',label: '冰块',   shape: 'ro', correct: false }
    ]
  },
  {
    id: 'f2', seg: 3, layout: 'fill', title: '四季的小歌', subj: '语文',
    stem: '＿＿里芽儿发，＿＿里萤火飞，＿＿里枫叶红。',
    step: ['一', '二', '三'],
    slots: [
      { id: 's1', hint: '①', shape: 'sq', accept: ['cchun'] },
      { id: 's2', hint: '②', shape: 'tr', accept: ['cxia'] },
      { id: 's3', hint: '③', shape: 'ro', accept: ['cqiu'] }
    ],
    chips: [
      { id: 'cchun', label: '春', shape: 'sq', correct: true },
      { id: 'cxia',  label: '夏', shape: 'tr', correct: true },
      { id: 'cqiu',  label: '秋', shape: 'ro', correct: true },
      { id: 'cdong', label: '冬', shape: 'tr', correct: false }
    ]
  },
  {
    id: 's5', seg: 3, layout: 'step', title: '找规律：每次翻倍', subj: '数学',
    /* 形状全同：只能靠读数 */
    slots: [
      { id: 's1', hint: '起', shape: 'sq', accept: ['c3'] },
      { id: 's2', hint: '',   shape: 'sq', accept: ['c6'] },
      { id: 's3', hint: '',   shape: 'sq', accept: ['c12'] },
      { id: 's4', hint: '倍', shape: 'sq', accept: ['c24'] }
    ],
    chips: [
      { id: 'c3',  label: '3',  shape: 'sq', correct: true },
      { id: 'c6',  label: '6',  shape: 'sq', correct: true },
      { id: 'c12', label: '12', shape: 'sq', correct: true },
      { id: 'c24', label: '24', shape: 'sq', correct: true },
      { id: 'c9',  label: '9',  shape: 'sq', correct: false }
    ]
  }
];
