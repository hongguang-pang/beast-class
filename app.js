/* 伴学宠物 · 班级积分乐园 */
(function () {
  'use strict';

  /* ================= 宠物定义 ================= */
  /* v3.22: 100 只全新 AI 宠物（四形态动图, images/gif/），主色自动提取 */
  const PETS = {
    P001: { name: '焰爪犬', emoji: '🔥', hue: 18, glow: 'rgba(255,174,140,.55)' },
    P002: { name: '火尾猫', emoji: '🔥', hue: 14, glow: 'rgba(255,167,140,.55)' },
    P003: { name: '熔岩龙', emoji: '🔥', hue: 22, glow: 'rgba(255,182,140,.55)' },
    P004: { name: '炎羽隼', emoji: '🔥', hue: 12, glow: 'rgba(255,163,140,.55)' },
    P005: { name: '焰蝶', emoji: '🔥', hue: 16, glow: 'rgba(255,170,140,.55)' },
    P006: { name: '温泉鲤', emoji: '🔥', hue: 11, glow: 'rgba(255,161,140,.55)' },
    P007: { name: '火团子', emoji: '🔥', hue: 19, glow: 'rgba(255,176,140,.55)' },
    P008: { name: '焰炉骑士', emoji: '🔥', hue: 23, glow: 'rgba(255,184,140,.55)' },
    P009: { name: '锅炉机', emoji: '🔥', hue: 25, glow: 'rgba(255,187,140,.55)' },
    P010: { name: '焰背熊', emoji: '🔥', hue: 9, glow: 'rgba(255,158,140,.55)' },
    P011: { name: '潮汐猫', emoji: '💧', hue: 196, glow: 'rgba(140,224,255,.55)' },
    P012: { name: '珊瑚龙', emoji: '🔥', hue: 13, glow: 'rgba(255,165,140,.55)' },
    P013: { name: '浪羽鸥', emoji: '💧', hue: 182, glow: 'rgba(140,251,255,.55)' },
    P014: { name: '螺壳虫', emoji: '💧', hue: 181, glow: 'rgba(140,253,255,.55)' },
    P015: { name: '波波鲸', emoji: '💧', hue: 206, glow: 'rgba(140,205,255,.55)' },
    P016: { name: '水泡团', emoji: '💧', hue: 184, glow: 'rgba(140,247,255,.55)' },
    P017: { name: '潜水骑士', emoji: '⚡', hue: 49, glow: 'rgba(255,233,140,.55)' },
    P018: { name: '声呐机', emoji: '💧', hue: 167, glow: 'rgba(140,255,231,.55)' },
    P019: { name: '海龟霸', emoji: '⚡', hue: 33, glow: 'rgba(255,203,140,.55)' },
    P020: { name: '浪尾犬', emoji: '⚡', hue: 34, glow: 'rgba(255,206,140,.55)' },
    P021: { name: '羽叶雀', emoji: '⚡', hue: 68, glow: 'rgba(240,255,140,.55)' },
    P022: { name: '叶甲虫', emoji: '⚡', hue: 66, glow: 'rgba(243,255,140,.55)' },
    P023: { name: '荷塘蛙', emoji: '💧', hue: 172, glow: 'rgba(140,255,239,.55)' },
    P024: { name: '苔球团', emoji: '🌿', hue: 75, glow: 'rgba(227,255,140,.55)' },
    P025: { name: '树灵童子', emoji: '🔥', hue: 23, glow: 'rgba(255,185,140,.55)' },
    P026: { name: '木纹机', emoji: '🔥', hue: 28, glow: 'rgba(255,193,140,.55)' },
    P027: { name: '森角鹿', emoji: '🔥', hue: 25, glow: 'rgba(255,187,140,.55)' },
    P028: { name: '藤尾犬', emoji: '⚡', hue: 35, glow: 'rgba(255,208,140,.55)' },
    P029: { name: '花斑猫', emoji: '🔥', hue: 11, glow: 'rgba(255,162,140,.55)' },
    P030: { name: '巨木龙', emoji: '🔥', hue: 25, glow: 'rgba(255,187,140,.55)' },
    P031: { name: '电光蛾', emoji: '⚡', hue: 47, glow: 'rgba(255,230,140,.55)' },
    P032: { name: '雷鳗', emoji: '💧', hue: 205, glow: 'rgba(140,208,255,.55)' },
    P033: { name: '静电球', emoji: '⚡', hue: 47, glow: 'rgba(255,230,140,.55)' },
    P034: { name: '引雷术士', emoji: '💧', hue: 263, glow: 'rgba(184,140,255,.55)' },
    P035: { name: '特斯拉机', emoji: '⚡', hue: 43, glow: 'rgba(255,222,140,.55)' },
    P036: { name: '雷纹犀', emoji: '⚡', hue: 38, glow: 'rgba(255,212,140,.55)' },
    P037: { name: '闪电犬', emoji: '⚡', hue: 42, glow: 'rgba(255,221,140,.55)' },
    P038: { name: '噼啪猫', emoji: '⚡', hue: 43, glow: 'rgba(255,222,140,.55)' },
    P039: { name: '霆龙', emoji: '💧', hue: 178, glow: 'rgba(140,255,252,.55)' },
    P040: { name: '雷羽鹫', emoji: '⚡', hue: 50, glow: 'rgba(255,236,140,.55)' },
    P041: { name: '冰鳍鱼', emoji: '💧', hue: 203, glow: 'rgba(140,210,255,.55)' },
    P042: { name: '雪球团', emoji: '💧', hue: 189, glow: 'rgba(140,237,255,.55)' },
    P043: { name: '雪原猎人', emoji: '💧', hue: 203, glow: 'rgba(140,210,255,.55)' },
    P044: { name: '冷凝机', emoji: '💧', hue: 189, glow: 'rgba(140,238,255,.55)' },
    P045: { name: '冰甲熊', emoji: '💧', hue: 204, glow: 'rgba(140,209,255,.55)' },
    P046: { name: '霜尾犬', emoji: '💧', hue: 202, glow: 'rgba(140,213,255,.55)' },
    P047: { name: '雪斑猫', emoji: '💧', hue: 202, glow: 'rgba(140,213,255,.55)' },
    P048: { name: '冰晶龙', emoji: '💧', hue: 200, glow: 'rgba(140,217,255,.55)' },
    P049: { name: '霜羽鸮', emoji: '🔥', hue: 29, glow: 'rgba(255,196,140,.55)' },
    P050: { name: '冰甲虫', emoji: '💧', hue: 190, glow: 'rgba(140,235,255,.55)' },
    P051: { name: '云朵团', emoji: '🔥', hue: 11, glow: 'rgba(255,162,140,.55)' },
    P052: { name: '御风少年', emoji: '⚡', hue: 57, glow: 'rgba(255,249,140,.55)' },
    P053: { name: '螺旋桨机', emoji: '💧', hue: 178, glow: 'rgba(140,255,251,.55)' },
    P054: { name: '云羊', emoji: '💧', hue: 172, glow: 'rgba(140,255,239,.55)' },
    P055: { name: '疾风犬', emoji: '💧', hue: 184, glow: 'rgba(140,248,255,.55)' },
    P056: { name: '轻足猫', emoji: '🔥', hue: 7, glow: 'rgba(255,154,140,.55)' },
    P057: { name: '翔龙', emoji: '💧', hue: 175, glow: 'rgba(140,255,246,.55)' },
    P058: { name: '云羽鹰', emoji: '⚡', hue: 44, glow: 'rgba(255,225,140,.55)' },
    P059: { name: '风蜻蜓', emoji: '💧', hue: 170, glow: 'rgba(140,255,235,.55)' },
    P060: { name: '风筝鱼', emoji: '💧', hue: 180, glow: 'rgba(140,255,255,.55)' },
    P061: { name: '石匠学徒', emoji: '🔥', hue: 26, glow: 'rgba(255,190,140,.55)' },
    P062: { name: '钻头机', emoji: '🔥', hue: 25, glow: 'rgba(255,188,140,.55)' },
    P063: { name: '岩背象', emoji: '🔥', hue: 27, glow: 'rgba(255,192,140,.55)' },
    P064: { name: '岩犬', emoji: '🔥', hue: 15, glow: 'rgba(255,169,140,.55)' },
    P065: { name: '砾石猫', emoji: '⚡', hue: 39, glow: 'rgba(255,214,140,.55)' },
    P066: { name: '晶簇龙', emoji: '🌙', hue: 273, glow: 'rgba(203,140,255,.55)' },
    P067: { name: '沙羽鹰', emoji: '🔥', hue: 28, glow: 'rgba(255,193,140,.55)' },
    P068: { name: '甲壳虫', emoji: '🔥', hue: 25, glow: 'rgba(255,188,140,.55)' },
    P069: { name: '泥沼龟', emoji: '⚡', hue: 50, glow: 'rgba(255,235,140,.55)' },
    P070: { name: '沙团子', emoji: '🔥', hue: 26, glow: 'rgba(255,189,140,.55)' },
    P071: { name: '卫星机', emoji: '💧', hue: 218, glow: 'rgba(140,182,255,.55)' },
    P072: { name: '星角兽', emoji: '💧', hue: 212, glow: 'rgba(140,194,255,.55)' },
    P073: { name: '流星犬', emoji: '💧', hue: 184, glow: 'rgba(140,247,255,.55)' },
    P074: { name: '月牙猫', emoji: '⚡', hue: 41, glow: 'rgba(255,219,140,.55)' },
    P075: { name: '银河龙', emoji: '💧', hue: 264, glow: 'rgba(186,140,255,.55)' },
    P076: { name: '星鸦', emoji: '💧', hue: 225, glow: 'rgba(140,169,255,.55)' },
    P077: { name: '星尘蝶', emoji: '🌙', hue: 274, glow: 'rgba(206,140,255,.55)' },
    P078: { name: '深空鲸', emoji: '💧', hue: 228, glow: 'rgba(140,163,255,.55)' },
    P079: { name: '星核团', emoji: '💧', hue: 207, glow: 'rgba(140,204,255,.55)' },
    P080: { name: '观星者', emoji: '💧', hue: 225, glow: 'rgba(140,169,255,.55)' },
    P081: { name: '钢甲熊', emoji: '⚡', hue: 32, glow: 'rgba(255,201,140,.55)' },
    P082: { name: '齿轮犬', emoji: '🔥', hue: 25, glow: 'rgba(255,187,140,.55)' },
    P083: { name: '伺服猫', emoji: '💧', hue: 172, glow: 'rgba(140,255,239,.55)' },
    P084: { name: '液压龙', emoji: '🔥', hue: 26, glow: 'rgba(255,189,140,.55)' },
    P085: { name: '无人机隼', emoji: '🌿', hue: 90, glow: 'rgba(198,255,140,.55)' },
    P086: { name: '纳米蛛', emoji: '🌙', hue: 274, glow: 'rgba(205,140,255,.55)' },
    P087: { name: '潜航鲸机', emoji: '💧', hue: 207, glow: 'rgba(140,204,255,.55)' },
    P088: { name: '电池团', emoji: '🌿', hue: 87, glow: 'rgba(204,255,140,.55)' },
    P089: { name: '机甲学员', emoji: '🔥', hue: 19, glow: 'rgba(255,176,140,.55)' },
    P090: { name: '装甲核心', emoji: '🔥', hue: 26, glow: 'rgba(255,190,140,.55)' },
    P091: { name: '鼓点犬', emoji: '🔥', hue: 15, glow: 'rgba(255,169,140,.55)' },
    P092: { name: '提琴猫', emoji: '🔥', hue: 351, glow: 'rgba(255,140,157,.55)' },
    P093: { name: '铜管龙', emoji: '⚡', hue: 36, glow: 'rgba(255,209,140,.55)' },
    P094: { name: '口哨雀', emoji: '⚡', hue: 56, glow: 'rgba(255,247,140,.55)' },
    P095: { name: '节拍蜂', emoji: '⚡', hue: 33, glow: 'rgba(255,204,140,.55)' },
    P096: { name: '回音鱼', emoji: '💧', hue: 176, glow: 'rgba(140,255,247,.55)' },
    P097: { name: '音符团', emoji: '🔥', hue: 333, glow: 'rgba(255,140,191,.55)' },
    P098: { name: '指挥家', emoji: '🔥', hue: 27, glow: 'rgba(255,191,140,.55)' },
    P099: { name: '混音机', emoji: '🌙', hue: 275, glow: 'rgba(208,140,255,.55)' },
    P100: { name: '低音犀', emoji: '🔥', hue: 20, glow: 'rgba(255,179,140,.55)' },
    /* v3.24: 10 只原创流行风传说宠物（SSR 掉落池，形象原创避免版权问题） */
    S101: { name: '光之巨人·耀', emoji: '🦸', hue: 8, glow: 'rgba(255,150,150,.6)' },
    S102: { name: '奶萌龙·团团', emoji: '🐲', hue: 48, glow: 'rgba(255,225,140,.6)' },
    S103: { name: '钢甲暴龙·雷克斯', emoji: '🤖', hue: 210, glow: 'rgba(140,190,255,.6)' },
    S104: { name: '蜜罐憨熊·壮壮', emoji: '🐻', hue: 28, glow: 'rgba(255,190,140,.6)' },
    S105: { name: '云跑跑羊·咩咩', emoji: '🐑', hue: 95, glow: 'rgba(200,255,160,.6)' },
    S106: { name: '搜救先锋·阿勇', emoji: '🐕', hue: 205, glow: 'rgba(150,210,255,.6)' },
    S107: { name: '奇妙探险猫·妙妙', emoji: '🐱', hue: 330, glow: 'rgba(255,150,210,.6)' },
    S108: { name: '闪电飞侠·速递', emoji: '🚀', hue: 5, glow: 'rgba(255,160,140,.6)' },
    S109: { name: '泡泡粉猪·琪琪', emoji: '🐷', hue: 340, glow: 'rgba(255,160,190,.6)' },
    S110: { name: '雪绒精灵·冰冰', emoji: '❄️', hue: 190, glow: 'rgba(150,235,255,.6)' },
    /* v3.32: 数码兽图鉴拆图入库 · rar 显式稀有度（按效果强度定档），jpg 四阶段立绘 */
    D201: { name: '星羽兽', emoji: '🦅', hue: 210, glow: 'rgba(160,215,255,.6)', rar: 'SSR', jpg: 1 },
    D202: { name: '岩甲兽', emoji: '🪨', hue: 30, glow: 'rgba(230,190,140,.55)', rar: 'SR', jpg: 1 },
    D203: { name: '焰鳞兽', emoji: '🐉', hue: 8, glow: 'rgba(255,160,140,.6)', rar: 'SSR', jpg: 1 },
    D204: { name: '潮鳞兽', emoji: '🐬', hue: 195, glow: 'rgba(140,220,255,.55)', rar: 'SR', jpg: 1 },
    D205: { name: '森晶兽', emoji: '🌿', hue: 95, glow: 'rgba(190,255,160,.55)', rar: 'R', jpg: 1 },
    D206: { name: '雷纹兽', emoji: '⚡', hue: 50, glow: 'rgba(255,230,140,.55)', rar: 'R', jpg: 1 },
    D207: { name: '月影兽', emoji: '🌙', hue: 265, glow: 'rgba(200,150,255,.6)', rar: 'SSR', jpg: 1 },
    D208: { name: '风翼兽', emoji: '🪽', hue: 190, glow: 'rgba(150,240,255,.55)', rar: 'SR', jpg: 1 },
    D209: { name: '钢核兽', emoji: '🤖', hue: 215, glow: 'rgba(150,190,255,.55)', rar: 'SR', jpg: 1 },
    D210: { name: '时砂兽', emoji: '⏳', hue: 45, glow: 'rgba(255,220,140,.55)', rar: 'R', jpg: 1 },
    D211: { name: '星芽兽', emoji: '🌱', hue: 100, glow: 'rgba(200,255,160,.55)', rar: 'R', jpg: 1 },
    D212: { name: '岩晶兽', emoji: '💎', hue: 205, glow: 'rgba(150,205,255,.55)', rar: 'SR', jpg: 1 },
    D213: { name: '雾羽兽', emoji: '☁️', hue: 200, glow: 'rgba(170,220,255,.55)', rar: 'R', jpg: 1 },
    D214: { name: '焰芯兽', emoji: '🔥', hue: 20, glow: 'rgba(255,175,140,.6)', rar: 'SSR', jpg: 1 },
    D215: { name: '潮鳍兽', emoji: '💧', hue: 195, glow: 'rgba(140,225,255,.55)', rar: 'SR', jpg: 1 },
    D216: { name: '风载兽', emoji: '🌀', hue: 210, glow: 'rgba(160,225,255,.55)', rar: 'R', jpg: 1 },
    D217: { name: '疾风兽', emoji: '🌪️', hue: 55, glow: 'rgba(255,235,150,.55)', rar: 'R', jpg: 1 },
    D218: { name: '林菇兽', emoji: '🍄', hue: 0, glow: 'rgba(255,160,160,.55)', rar: 'R', jpg: 1 },
    D219: { name: '雷印兽', emoji: '🌩️', hue: 270, glow: 'rgba(205,160,255,.55)', rar: 'SR', jpg: 1 },
    D220: { name: '月烛兽', emoji: '🕯️', hue: 225, glow: 'rgba(160,190,255,.55)', rar: 'SR', jpg: 1 },
    /* v3.32: 机甲英雄/机械龙单图宠物（SSR 掉落池扩充） */
    M301: { name: '烈焰机甲·英雄', emoji: '🦸', hue: 10, glow: 'rgba(255,160,150,.6)', rar: 'SR', single: 1 },
    M302: { name: '苍蓝机甲·英雄', emoji: '🦸', hue: 215, glow: 'rgba(150,195,255,.6)', rar: 'R', single: 1 },
    M303: { name: '翠光机甲·英雄', emoji: '🦸', hue: 150, glow: 'rgba(150,255,205,.6)', rar: 'R', single: 1 },
    M304: { name: '圣金机甲·英雄', emoji: '🦸', hue: 45, glow: 'rgba(255,225,150,.65)', rar: 'SSR', single: 1 },
    M305: { name: '星紫机甲·英雄', emoji: '🦸', hue: 275, glow: 'rgba(210,160,255,.6)', rar: 'SR', single: 1 },
    M306: { name: '赤焰机械龙', emoji: '🐲', hue: 5, glow: 'rgba(255,155,145,.65)', rar: 'SSR', single: 1 },
    M307: { name: '苍海机械龙', emoji: '🐲', hue: 195, glow: 'rgba(145,225,255,.6)', rar: 'SR', single: 1 },
    M308: { name: '丛林机械龙', emoji: '🐲', hue: 120, glow: 'rgba(160,255,170,.6)', rar: 'R', single: 1 },
    M309: { name: '樱雪机械龙', emoji: '🐲', hue: 330, glow: 'rgba(255,160,205,.6)', rar: 'R', single: 1 },
    M310: { name: '暗影机械龙', emoji: '🐲', hue: 280, glow: 'rgba(215,150,255,.6)', rar: 'SR', single: 1 }
  };

  const CREATURES = Object.keys(PETS).map((id) =>
    ({ id, name: PETS[id].name, emoji: PETS[id].emoji, hue: PETS[id].hue, classic: true, glow: PETS[id].glow })
  );

  const petMeta = (id) => {
    for (const c of CREATURES) if (c.id === id) return c;
    return { id, name: '神秘宠物', emoji: '🥚', hue: 260, classic: false, glow: 'hsla(260,85%,62%,.55)' };
  };
  /* v3.22 迁移: 旧宠物 ID -> 新 100 只体系（形象+名字全换新, 积分/等级/记录保留） */
  const PET_MIGRATE = { fire: 'P001', water: 'P002', grass: 'P003', thunder: 'P004', light: 'P005', c1: 'P006', c2: 'P007', c3: 'P008', c4: 'P009', c5: 'P010', c6: 'P011', c7: 'P012', c8: 'P013', c9: 'P014', c10: 'P015', c11: 'P016', c12: 'P017', c13: 'P018', c14: 'P019', c15: 'P020', c16: 'P021', c17: 'P022', c18: 'P023', c19: 'P024', c20: 'P025', c21: 'P026', c22: 'P027', c23: 'P028', c24: 'P029', c25: 'P030', c26: 'P031', c27: 'P032', c28: 'P033', c29: 'P034', c30: 'P035', c31: 'P036', c32: 'P037', c33: 'P038', c34: 'P039', c35: 'P040', c36: 'P041', c37: 'P042', c38: 'P043', c39: 'P044', c40: 'P045', c41: 'P046', c42: 'P047', c43: 'P048', c44: 'P049', c45: 'P050' };
  const migratePetType = (t) => PET_MIGRATE[t] || t;
  function migratePetsData(d) {
    if (!d || d.petsV22) return;
    const conv = (k) => {
      if (!k || !k.pet) return;
      k.pet.type = migratePetType(k.pet.type);
      if (k.pet.name !== undefined) k.pet.name = petMeta(k.pet.type).name;
      if (k.skin) k.skin = migratePetType(k.skin);
      if (Array.isArray(k.companions)) k.companions.forEach((c) => { c.type = migratePetType(c.type); });
      if (k.dex) {
        const nd = {};
        Object.keys(k.dex).forEach((key) => {
          const i = key.indexOf('-');
          if (i > 0) { const t = migratePetType(key.slice(0, i)); nd[t + key.slice(i)] = true; }
          else nd[key] = k.dex[key];
        });
        k.dex = nd;
      }
    };
    (Array.isArray(d.kids) ? d.kids : []).forEach(conv);
    (Array.isArray(d.classes) ? d.classes : []).forEach((c) => { if (c && Array.isArray(c.kids)) c.kids.forEach(conv); });
    d.petsV22 = true;
  }
  const creatureCache = {};
  /* 老电脑可能没有彩色 emoji 字体（canvas 上画出来是空白），
     提前检测：emoji 画不出彩色像素时，改画名字首字，保证每只宠物都有形象 */
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
      /* 兜底：用名字首字 + 白色描边，不同宠物仍有区分（底色 hue 本就不同） */
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
  /* 班内不重复抽取：优先未被占用的宠物，50 种全用完才允许重复 */
  function pickType() {
    const used = {};
    (P.d && P.d.kids ? P.d.kids : []).forEach((k) => { if (k.pet && k.pet.type) used[k.pet.type] = true; });
    const pool = CREATURES.filter((c) => !used[c.id]);
    const src = pool.length ? pool : CREATURES;
    return src[Math.floor(Math.random() * src.length)].id;
  }
  const STAGES = [
    { min: 1, name: '宠物蛋', suffix: 'egg', cls: 'egg' },
    { min: 3, name: '幼年期', suffix: 'baby', cls: '' },
    { min: 6, name: '成长期', suffix: 'growth', cls: '' },
    { min: 9, name: '成年期', suffix: 'adult', cls: '' },
    { min: 12, name: '究极体', suffix: 'ultimate', cls: '' }
  ];
  const MILESTONES = [5, 10, 15, 20];   // 这些等级解锁神秘伙伴
  const expNeed = (lv) => 20 + (lv - 1) * 12;
  const stageIdxOf = (lv) => { let i = 0; STAGES.forEach((s, j) => { if (lv >= s.min) i = j; }); return i; };
  /* 全部 50 只宠物都有图片立绘（经典五系为原立绘，c 系为 AI 立绘 + 四阶段合成图） */
  /* v3.32: jpg 单图 / 四阶段 jpg 宠物 → images/m/；老宠物仍走 gif */
  const imgFor = (el, si) => {
    if (si === 0 && !(PETS[el] && PETS[el].single)) return 'images/egg.jpg';
    const p = PETS[el];
    if (p && p.single) return 'images/m/' + el + '.gif';
    if (p && p.jpg) return 'images/m/' + el + '-' + STAGES[si].suffix + '.gif';
    return 'images/gif/' + el + '-' + STAGES[si].suffix + '.gif';
  };
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
    { id: 'r6', name: '经验药水', cost: 16, icon: '🧪', kind: 'exp', exp: 30, desc: '宠物 +30 经验', on: true },
    { id: 'r7', name: '成长果实', cost: 30, icon: '🍎', kind: 'exp', exp: 60, desc: '宠物 +60 经验', on: true },
    { id: 'r3', name: '周末多玩 30 分钟', cost: 15, icon: '🎮', desc: '', on: true },
    { id: 'r4', name: '小礼物', cost: 30, icon: '🎁', desc: '老师准备的小奖品', on: true },
    { id: 'r5', name: '愿望卡（一个心愿）', cost: 50, icon: '⭐', desc: '', on: true }
  ];

  /* ================= 存储 ================= */
  /* v3.27 角色化数据隔离：学生/家庭/班级各自独立存储，互不相通 */
  const ROLE_GET = () => { try { return localStorage.getItem('beast.role') || 'family'; } catch (e) { return 'family'; } };
  const getKEY = () => 'beast.v1.' + ROLE_GET();
  const GROUPS_DEFAULT = ['第一组', '第二组', '第三组', '第四组'];
  /* 班内宠物去重：同一班出现重复宠物形象时，自动给重复的学生换一只没人用的。
     只换形象（type/name/skin），积分、等级、经验、记录都不动。
     用于修复导入旧数据、早期版本导致的“全班宠物都一样”。 */
  function dedupePets(kids) {
    if (!Array.isArray(kids) || kids.length < 2) return 0;
    const used = {};
    let fixed = 0;
    kids.forEach((k) => {
      if (!k || !k.pet || !k.pet.type) return;
      if (!used[k.pet.type]) { used[k.pet.type] = 1; return; }
      const free = CREATURES.filter((c) => !used[c.id]);
      const pool = free.length ? free : CREATURES;
      const pick = pool[Math.floor(Math.random() * pool.length)];
      used[pick.id] = 1;
      const lv = k.pet.lv || 3;
      k.pet.type = pick.id;
      k.pet.name = pick.name;
      k.skin = null;
      k.dex = { egg: true };
      STAGES.forEach((s) => { if (lv >= s.min && s.suffix !== 'egg') k.dex[pick.id + '-' + s.suffix] = true; });
      fixed++;
    });
    return fixed;
  }

  const P = {
    d: null,
    load() {
      try { this.d = JSON.parse(localStorage.getItem(getKEY())); } catch (e) { this.d = null; }
      /* 旧版单存储数据自动迁移到家庭存储（仅一次） */
      if (!this.d && ROLE_GET() === 'family') {
        try { this.d = JSON.parse(localStorage.getItem('beast.v1')); } catch (e) { this.d = null; }
        if (this.d) this.d.mode = 'family';
      }
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
        migratePetsData(this.d);
        this.d.kids.forEach((k) => {
          if (!k.dex) k.dex = {};
          if (!k.companions) k.companions = [];
          if (!k.milestones) k.milestones = [];
          if (!k.daily) k.daily = {};
          /* 旧数据 / 迁移中丢了宠物的学生：自动补一只，避免头像空白 */
          if (!k.pet || !k.pet.type) {
            const t = (k.pet && k.pet.type) || pickType();
            k.pet = { name: petMeta(t).name, type: t, exp: 0, lv: (k.pet && k.pet.lv) || 3 };
          }
          if (k.skin === undefined) k.skin = null;
          if (k.group === undefined) k.group = '';
          /* v3.23 游戏数据：年级 / 每日打卡 / 冒险闯关 / 错题本 */
          if (!k.grade) k.grade = 'g3';
          if (!k.dailyGame) k.dailyGame = {};
          if (!k.quest || typeof k.quest !== 'object') k.quest = {};
          if (!Array.isArray(k.wrongBook)) k.wrongBook = [];
          /* v3.21.5 修正：Lv.1~2 是全班共用的「宠物蛋」形象，看起来都一样；
             零进度的宠物直接提到幼年期（Lv.3），每人恢复各自的形象，已有进度不受影响 */
          if (k.pet.lv < 3 && !k.pet.exp) k.pet.lv = 3;
          if (!k.dex) k.dex = {};
          if (!k.dex.egg) k.dex.egg = true;
          STAGES.forEach((s) => { if (k.pet.lv >= s.min && s.suffix !== 'egg') k.dex[k.pet.type + '-' + s.suffix] = true; });
        });
        /* 无感修复：班内宠物重复（导入后最常见）自动重新分配，老师什么都不用点 */
        try {
          dedupePets(this.d.kids);
          (this.d.classes || []).forEach((c) => { if (c && Array.isArray(c.kids) && c.kids !== this.d.kids) dedupePets(c.kids); });
        } catch (e) {}
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
    save() { this.sync(); try { localStorage.setItem(getKEY(), JSON.stringify(this.d)); } catch (e) { toast('存储空间不足，请在「数据」里导出后清理'); } },
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
    m.innerHTML = '<div class="evo-box"><div class="big img"><img src="images/gif/' + type + '-baby.gif" alt=""></div>' +
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
  function grantPoints(k, n, reason, subj) {
    k.points += n;
    if (!k.daily) k.daily = {};
    if (n > 0) { const t = todayStr(); k.daily[t] = (k.daily[t] || 0) + n; }
    addLog(k, n >= 0 ? '✨' : '🧾', reason, n);
    if (n > 0) {
      addExp(k, n);
      /* v3.31 同一笔加分同时喂对应的学科宠物；未指定学科时按当前老师身份 */
      const sk = subj === undefined ? mySubjScope() : subj;
      addSubjExp(k, sk, n);
    }
    /* 老师在电脑上给分 → 推到云端，学生手机下次同步能看到 */
    if (n !== 0 && P.d.mode !== 'student' && k.sid) {
      const c0 = (P.d.classes || []).find((c) => c.id === P.d.clsId);
      if (c0 && c0.teacherKey && c0.code) cloudPushBonus([k.sid], n, reason || '老师奖励', subj === undefined ? mySubjScope() : subj);
    }
    P.save();
  }
  function addLog(k, em, text, delta, kind) {
    if (!Array.isArray(P.d.log)) P.d.log = [];
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
    /* v3.42 本机身份已是学生但还没有学生档案（老师点了「学生界面」/ 学生链接进来）：
       直接进学生入学，不要再让人先选一遍身份；入口链接里的班级码继续带着 */
    if (ROLE_GET() === 'student') {
      const pc = window.__entryCode || '';
      window.__entryCode = '';
      return stepStudent(el, pc);
    }
    stepRole(el);
  }

  /* 本机已有哪些角色的档案（用于入口页快速切回，不丢数据） */
  function roleProfiles() {
    const out = [];
    [['class', '老师'], ['family', '家长'], ['student', '学生']].forEach(function (pr) {
      try {
        const d = JSON.parse(localStorage.getItem('beast.v1.' + pr[0]) || 'null');
        if (d && d.kids && d.kids.length) {
          out.push({ r: pr[0], n: pr[1], cnt: d.kids.length, cls: (d.cls && d.cls.name) || '' });
        }
      } catch (e) {}
    });
    return out;
  }

  function stepRole(el) {
    /* v3.33 专属入口链接：?role=student&code=XXXXXX 直接进对应入口 */
    const en = window.__entry;
    if (en && (en.role === 'student' || en.role === 'family' || en.role === 'class')) {
      window.__entry = null;
      try { localStorage.setItem('beast.role', en.role); } catch (e) {}
      if (en.role === 'student') return stepStudent(el, en.code);
      if (en.role === 'class') return stepClass(el);
      return stepFamily(el);
    }
    const profs = roleProfiles();
    el.innerHTML =
      '<div class="big"><img src="images/egg.jpg" alt="" style="width:110px;height:110px;border-radius:26px;box-shadow:0 10px 40px rgba(255,215,110,.45)"></div>' +
      '<h2>伴学宠物</h2>' +
      '<p>选一个入口进入，各入口数据相互独立</p>' +
      (profs.length ? '<div class="w-backin">本机已有档案，直接继续：' +
        profs.map((p) => '<button data-back="' + p.r + '">↩️ 继续以' + p.n + '身份进入' +
          '<span>' + (p.cls ? p.cls + ' · ' : '') + p.cnt + ' 人</span></button>').join('') + '</div>' : '') +
      '<div class="w-role">' +
      '<button data-r="student"><b>🎒 我是学生 · 来闯关</b><span>每日答题、知识冒险、加入班级</span></button>' +
      '<button data-r="family"><b>🏠 我是家长 · 陪孩子</b><span>1-3 个孩子的积分与学情分析</span></button>' +
      '<button data-r="class"><b>👩‍🏫 我是老师 · 带一个班</b><span>全班名单、学情分析、光荣榜</span></button>' +
      '</div>' +
      '<div class="w-ver">版本 v3.39 · 全宠物动图 · 稀有度边框 · 随时看说明<br>' +
      '<span style="font-size:11px">建档时设置密码，换设备凭「名字+密码」找回全部进度</span><br>' +
      '<a class="w-help" href="help.html">📖 使用说明（新手必看）</a></div>' +
      '<button class="btn ghost w-mig" id="wMig">📲 已有数据？扫码迁移过来</button>';
    el.querySelectorAll('.w-role button').forEach((b) => (b.onclick = () => {
      localStorage.setItem('beast.role', b.dataset.r);
      if (b.dataset.r === 'class') stepClass(el);
      else if (b.dataset.r === 'student') stepStudent(el);
      else stepFamily(el);
    }));
    el.querySelectorAll('[data-back]').forEach((b) => (b.onclick = () => {
      try { localStorage.setItem('beast.role', b.dataset.back); } catch (e) {}
      location.reload();
    }));
    el.querySelector('#wMig').onclick = () => qrImportSheet(true);
  }

  /* 学生入口：建档 → 摸底掉宠；可选加入班级 */
  function stepStudent(el, preCode) {
    el.innerHTML =
      '<h2 style="margin-top:0">学生入学</h2>' +
      '<p>先做个摸底测试，成绩越好，降临的宠物伙伴越稀有！<br>有班级码的话可以填上，加入后跟着班级走。</p>' +
      '<div class="field"><label>你的名字 / 昵称</label><input id="wsName" maxlength="8" placeholder="比如：小明"></div>' +
      '<div class="field"><label>设置密码（4-12 位字母或数字）</label><input id="wsPwd" maxlength="12" placeholder="换设备凭「名字+密码」找回档案"></div>' +
      '<div class="field"><label>班级码' + (preCode ? '（老师入口已自动填好）' : '（没有可留空）') + '</label>' +
      '<input id="wsCode" maxlength="8" placeholder="问老师要 6 位班级码" value="' + esc(preCode || '') + '"></div>' +
      '<button class="btn" id="wsGo" style="margin-top:14px">开始摸底 📚</button>' +
      '<button class="w-back" id="wsBack">‹ 返回</button>';
    el.querySelector('#wsBack').onclick = () => stepRole(el);
    el.querySelector('#wsGo').onclick = () => {
      const name = el.querySelector('#wsName').value.trim() || '同学';
      const code = el.querySelector('#wsCode').value.trim().toUpperCase();
      const pwd = el.querySelector('#wsPwd').value.trim();
      if (!window.BeastAuth || !BeastAuth.pwdOk(pwd)) { toast('先设置 4-12 位密码（字母/数字），换设备才能找回档案'); return; }
      const ex = BeastAuth.find('student', name);
      if (ex && ex.pwd !== BeastAuth.hashPwd(pwd, ex.salt)) { toast('「' + name + '」已有账号但密码不对：换个名字，或输入原密码'); return; }
      el.remove();
      const afterPlacement = (r) => {
        const k = { id: uid(), name, points: 0, daily: {}, grade: r.grade, pet: { name: PETS[r.type].name, type: r.type, exp: 0, lv: 1 }, dex: { egg: true, [r.type + '-baby']: true }, companions: [], milestones: [], skin: null, wrongBook: [], frags: {}, aid: [], inter: null, mastery: {}, mode: 'student' };
        P.d.mode = 'student';
        P.d.cls = { name: '', groups: [], on: false };
        P.d.classes = [];
        P.d.kids = [k];
        P.d.cur = k.id;
        P.d.log = [];
        /* 建档即注册：本机账号 + 云端备份（离线时自动入队补传） */
        if (window.BeastAuth) {
          const ar = BeastAuth.register({ role: 'student', name, pwd, kidId: k.id, grade: r.grade, classCode: code || '' });
          toast(ar.existed ? '👋 欢迎回来，' + name + '（已登录原账号）' : '✅ 账号已创建：' + name);
        }
        if (code) joinClassByCode(k, code);
        P.save();
        render();
        toast('🎓 ' + PETS[r.type].name + ' 降临！每天来答题闯关吧');
      };
      placement(name, afterPlacement);
    };
  }

  /* 学生按班级码加入班级：优先连云端（老师电脑上的班，跨设备唯一可行路径）
     云端不可用时退回「本机同设备」的演示逻辑，保证离线也能开学 */
  function joinClassByCode(k, code, cb) {
    const C = CL();
    if (C) {
      C.join(code, {
        name: k.name,
        points: k.points || 0,
        petName: (k.pet && k.pet.name) || '',
        petType: (k.pet && k.pet.type) || '',
        petLv: (k.pet && k.pet.lv) || 1,
        grade: k.grade || '',
        mastery: k.mastery || {},
        sid: k.cloudSid,
        token: k.cloudToken
      }).then((j) => {
        k.classCode = code;
        k.className = (j.cls && j.cls.name) || '班级';
        k.cloudSid = j.sid;
        k.cloudToken = j.token;
        k.classTeacher = (j.cls && j.cls.teacher) || '';
        k.bonusApplied = (j.me && j.me.bonus) || 0;
        if (j.cls && j.cls.grade) { k.grade = j.cls.grade; k.quest = null; }
        P.save(); render();
        toast('🏫 已加入「' + k.className + '」· 年级随班级');
        if (cb) cb(true);
        cloudReport(k);
      }).catch((e) => {
        console.warn('[cloud join]', e && e.message);
        const ok = joinClassLocal(k, code);
        if (!ok) toast('班级码 ' + code + ' 没找到（可能网络不通，问问老师）');
        if (cb) cb(ok);
      });
      return true;
    }
    const ok = joinClassLocal(k, code);
    if (cb) cb(ok);
    return ok;
  }

  /* 同设备演示用：直接读写本机班级存储 */
  function joinClassLocal(k, code) {
    let cd = null;
    try { cd = JSON.parse(localStorage.getItem('beast.v1.class')); } catch (e) {}
    const cls = cd && (cd.classes || []).find((c) => c.code === code);
    if (!cls) return false;
    k.classCode = code;
    k.className = cls.name;
    if (cls.grade) k.grade = cls.grade;
    let stu = cls.kids.find((x) => x.name === k.name) || cls.kids.find((x) => x.sid === k.id);
    if (!stu) { stu = { name: k.name, points: 0, daily: {}, pet: { name: k.pet.name, type: k.pet.type, exp: 0, lv: 1 }, dex: { egg: true }, companions: [], milestones: [], skin: null, wrongBook: [], frags: {}, aid: [], mastery: {}, sid: k.id }; cls.kids.push(stu); }
    stu.sid = k.id;
    stu.joined = true;
    try { localStorage.setItem('beast.v1.class', JSON.stringify(cd)); } catch (e) {}
    toast('🏫 已加入 ' + cls.name + '（本机）');
    return true;
  }

  function stepClass(el) {
    el.innerHTML =
      '<h2 style="margin-top:0">建一个班</h2>' +
      '<p>先填班名，再把学生名单粘进来（可以不填，之后随时导入）</p>' +
      '<div class="field"><label>老师姓名（作为账号）</label><input id="wcTn" maxlength="12" placeholder="比如：王老师"></div>' +
      '<div class="field"><label>设置密码（4-12 位字母或数字）</label><input id="wcPwd" maxlength="12" placeholder="换设备凭「姓名+密码」接管班级"></div>' +
      '<div class="field"><label>班级名称</label><input id="wcName" maxlength="14" placeholder="比如：三年二班" value="三年二班"></div>' +
      '<div class="field"><label>我的科目（必选 · 班主任管全科，学科老师只加本科分）</label>' + subjPickHTML() + '</div>' +
      '<div class="field"><label>学生名单（一行一个，可选分组）</label>' +
      '<textarea id="wcList" rows="5" placeholder="张小明 第一组&#10;李小红 第一组&#10;王小刚 第二组"></textarea></div>' +
      '<div class="w-tip">提示：40 人以内粘贴进来最方便，重名会自动跳过</div>' +
      '<button class="btn" id="wcGo">开启班级模式 🎉</button>' +
      '<button class="btn ghost" id="wcTake" style="margin-top:8px">☁️ 已有班级 · 用班级码接管</button>' +
      '<button class="w-back" id="wcBack">‹ 返回</button>';
    el.querySelector('#wcBack').onclick = () => stepRole(el);
    el.querySelector('#wcTake').onclick = () => { el.remove(); cloudTakeOverSheet(); };
    let mySubj = null;
    bindSubjPick(el, (s) => (mySubj = s));
    el.querySelector('#wcGo').onclick = () => {
      if (!mySubj) { toast('请先选择你的科目：班主任或其中一学科'); return; }
      const name = el.querySelector('#wcName').value.trim() || '我的班级';
      const tName = el.querySelector('#wcTn').value.trim();
      const pwd = el.querySelector('#wcPwd').value.trim();
      if (tName && window.BeastAuth && !BeastAuth.pwdOk(pwd)) { toast('密码需要 4-12 位字母或数字'); return; }
      if (tName && window.BeastAuth) {
        const ex = BeastAuth.find('class', tName);
        if (ex && ex.pwd !== BeastAuth.hashPwd(pwd, ex.salt)) { toast('「' + tName + '」已有账号但密码不对：换个名字或输入原密码'); return; }
      }
      const txt = el.querySelector('#wcList').value;
      const r = createClass(name, txt);
      if (!P.d.kids.length) { P.d.kids = [newStu('小明', '')]; P.d.cur = P.d.kids[0].id; P.save(); }
      P.d.admin = true;
      P.d.mode = 'class';
      /* 科目必选：落到班级（班主任写 head / 学科写 subs），并设为当前身份 */
      const c0 = (P.d.classes && P.d.classes[P.d.classes.length - 1]) || P.d.cls;
      applyTeacherSubj(mySubj, tName, c0, false);
      /* 老师账号：绑定刚建的班 */
      if (tName && window.BeastAuth) {
        const ar = BeastAuth.register({ role: 'class', name: tName, pwd, clsId: (c0 && c0.id) || '', classCode: (c0 && c0.code) || '', grade: (c0 && c0.grade) || '' });
        toast(ar.existed ? '👋 欢迎回来，' + tName : '✅ 老师账号已创建：' + tName);
      }
      P.save();
      el.remove();
      location.hash = '#/class';
      render();
      toast('班级已创建' + (r.added ? '，导入 ' + r.added + ' 人' : '') + '，可在「老师」里加更多班');
    };
  }

  /* ================= v3.26 入学摸底（家庭模式添加孩子第一步） =================
     选年级 → 动态出 10 题（难度递进）→ 按成绩掉落初始宠物，成绩越好 SSR 概率越高 */
  function placement(name, onDone) {
    const m = document.createElement('div');
    m.className = 'evo-mask plc-mask';
    let step = 0, right = 0, qs = [];
    const showGrade = () => {
      m.innerHTML = '<div class="evo-box plc-box"><h2>📚 入学摸底</h2>' +
        '<p>欢迎 <b>' + esc(name) + '</b>！<br>选一个年级，答 10 道题测一测：<br>成绩越好，降临的宠物伙伴越稀有（最高传说 SSR）！</p>' +
        '<div class="plc-grades">' + [1, 2, 3, 4, 5, 6].map((n) => '<button data-g="g' + n + '">' + n + '年级</button>').join('') + '</div></div>';
      m.querySelectorAll('[data-g]').forEach((b) => (b.onclick = () => {
        qs = (window.BPGames && BPGames.genPlacement) ? BPGames.genPlacement(b.dataset.g) : [];
        m.dataset.grade = b.dataset.g;
        showQ();
      }));
    };
    const showQ = () => {
      if (step >= qs.length) return finish();
      const q = qs[step];
      m.innerHTML = '<div class="evo-box plc-box"><div class="plc-top">📖 摸底测试 ' + (step + 1) + '/' + qs.length + ' · 难度 ' + '●'.repeat(Math.floor(step / 2) + 1) + '</div>' +
        '<div class="plc-prog">' + qs.map((_, i) => '<i class="' + (i <= step ? 'on' : '') + '"></i>').join('') + '</div>' +
        '<div class="plc-q">' + esc(q.q) + '</div>' +
        '<div class="plc-opts">' + q.opts.map((o, i) => '<button data-i="' + i + '">' + esc(o) + '</button>').join('') + '</div></div>';
      m.querySelectorAll('.plc-opts button').forEach((b) => (b.onclick = () => {
        const i = +b.dataset.i, all = m.querySelectorAll('.plc-opts button');
        all.forEach((x) => (x.disabled = true));
        if (i === q.a) { b.classList.add('ok'); right++; }
        else { b.classList.add('no'); all[q.a].classList.add('ok'); }
        setTimeout(() => { step++; showQ(); }, 750);
      }));
    };
    const finish = () => {
      const r = (window.BPGames && BPGames.rollPlacementPet) ? BPGames.rollPlacementPet(right, qs.length)
        : { type: Object.keys(PETS)[0], rar: 'N', right, total: qs.length };
      const RL = { SSR: '传说 🌟🌟🌟', SR: '史诗 🌟🌟', R: '稀有 🌟', N: '普通 ⭐' };
      m.innerHTML = '<div class="evo-box plc-box"><div class="big img"><img src="images/gif/' + r.type + '-baby.gif" alt=""></div>' +
        '<h2>神秘伙伴降临！</h2><p>摸底答对 <b>' + right + '/' + qs.length + '</b> · 评级 <b style="color:#ff9800">' + RL[r.rar] + '</b><br>' +
        PETS[r.type].emoji + ' 恭喜解锁 <b>' + PETS[r.type].name + '</b>！</p>' +
        '<button class="btn sm" style="margin-top:14px;background:#ffd76e;color:#5b3a00" id="plcOk">开始冒险</button></div>';
      m.querySelector('#plcOk').onclick = () => {
        m.classList.remove('in'); setTimeout(() => m.remove(), 320);
        r.grade = m.dataset.grade || 'g3';
        onDone(r);
      };
    };
    document.body.appendChild(m);
    requestAnimationFrame(() => m.classList.add('in'));
    showGrade();
  }

  function stepFamily(el) {
    const FIRST_PET = Object.keys(PETS)[0];
    let type = FIRST_PET;
    el.innerHTML =
      '<h2 style="margin-top:0">开始养成</h2>' +
      '<p>孩子做任务赚积分，宠物跟着升级进化；积分还能在商店兑换奖励。</p>' +
      '<div class="field"><label>孩子的名字 / 称呼</label><input id="wName" placeholder="比如：小明、姐姐、哥哥" maxlength="8"></div>' +
      '<div class="field"><label>家长账号名（管理多个孩子用）</label><input id="wFam" maxlength="12" placeholder="比如：李爸爸 / 王妈妈"></div>' +
      '<div class="field"><label>设置密码（4-12 位字母或数字）</label><input id="wPwd" maxlength="12" placeholder="换设备凭「账号名+密码」找回全部分析数据"></div>' +
      '<div class="tiny" style="margin-top:10px">点「开始摸底」先做 10 道入学题，成绩越好，降临的宠物伙伴越稀有！</div>' +
      '<button class="btn" id="wGo" style="margin-top:14px">开始摸底 📚</button>' +
      '<button class="w-back" id="wcBack">‹ 返回</button>';
    el.querySelector('#wcBack').onclick = () => stepRole(el);
    el.querySelector('#wGo').onclick = () => {
      const name = el.querySelector('#wName').value.trim() || '宝贝';
      const fam = el.querySelector('#wFam').value.trim();
      const pwd = el.querySelector('#wPwd').value.trim();
      if (fam && window.BeastAuth && !BeastAuth.pwdOk(pwd)) { toast('密码需要 4-12 位字母或数字'); return; }
      if (fam && window.BeastAuth) {
        const ex = BeastAuth.find('family', fam);
        if (ex && ex.pwd !== BeastAuth.hashPwd(pwd, ex.salt)) { toast('「' + fam + '」已有账号但密码不对：换个名字或输入原密码'); return; }
      }
      el.remove();
      placement(name, (r) => {
        const k = { id: uid(), name, points: 0, daily: {}, grade: r.grade, pet: { name: PETS[r.type].name, type: r.type, exp: 0, lv: 1 }, dex: { egg: true, [r.type + '-baby']: true }, companions: [], milestones: [], skin: null, wrongBook: [], frags: {}, aid: [], inter: null };
        P.d.mode = 'family';
        if (fam && window.BeastAuth) {
          const ar = BeastAuth.register({ role: 'family', name: fam, pwd, kidId: k.id, grade: r.grade });
          toast(ar.existed ? '👋 欢迎回来，' + fam : '✅ 家长账号已创建：' + fam);
        }
        P.d.kids.push(k);
        P.d.cur = k.id;
        P.d.log.unshift({ ts: Date.now(), kid: k.id, kidName: name, em: '🥚', text: name + ' 摸底答对 ' + r.right + '/' + r.total + '，' + PETS[r.type].name + ' 降临！', d: 0 });
        P.save();
        render();
        toast('🎓 ' + PETS[r.type].name + ' 加入冒险！做任务、闯关卡快快成长吧');
      });
    };
  }

  /* ================= 页面：宠物（首页） ================= */
  /* ================= v3.27 学生端 ================= */
  function mastIconsHTML(k) {
    const M = window.BPGames;
    if (!M || !M.SUBJ) return '';
    const stats = M.mastStats(k);
    return '<div class="mast-icons">' +
      Object.keys(M.SUBJ).map((s) => {
        const st = stats[s] || { r: 0, w: 0 };
        const tot = st.r + st.w;
        const pct = tot ? Math.round(st.r / tot * 100) : -1;
        const cls = pct < 0 ? 'm-none' : pct >= 80 ? 'm-good' : pct >= 60 ? 'm-mid' : 'm-weak';
        return '<div class="mast-ic ' + cls + '" title="' + M.SUBJ[s].name + '">' +
          '<span class="mi-em">' + M.SUBJ[s].icon + '</span>' +
          '<small>' + M.SUBJ[s].name + '</small>' +
          '<b>' + (pct < 0 ? '—' : pct + '%') + '</b></div>';
      }).join('') + '</div>' +
      '<div class="tiny" style="text-align:center;margin-top:4px">我的知识掌握度（答题自动更新）</div>';
  }
  /* 五科宠物条：学生首页一眼看到每科宠物与经验 */
  function subjPetsHTML(k) {
    ensurePetSys(k);
    return '<div class="subj-pets"><div class="sp-head"><b>🎒 我的五科宠物</b>' +
      '<button class="sp-dress" id="spDress">🎀 装扮</button></div>' +
      '<div class="sp-row">' + SUBJ_LIST.map((s) => {
        const p = k.subjPets[s.k];
        if (!p) {
          const bank = (k.subjBank && k.subjBank[s.k]) || 0;
          const ready = bank >= SUBJ_GET_NEED;
          return '<button class="sp-card sp-empty' + (ready ? ' sp-ready' : '') + '" data-subj="' + s.k + '" style="--c:' + s.c + '">' +
            '<span class="spc-av">' + (ready ? '🎁' : '➕') + '</span>' +
            '<span class="spc-t"><b>' + s.ic + ' ' + s.n + '</b><small>' + (ready ? '可领取！' : '待获得') + (bank ? ' · ' + bank + '/' + SUBJ_GET_NEED : '') + '</small>' +
            '<span class="spc-bar"><i style="width:' + Math.min(100, Math.round(bank / SUBJ_GET_NEED * 100)) + '%"></i></span></span></button>';
        }
        const need = expNeed(p.lv);
        const pc = Math.min(100, Math.round(p.exp / need * 100));
        const rc = RARC[rarOf(p.type)];
        return '<button class="sp-card" data-subj="' + s.k + '" style="--c:' + s.c + ';border-color:' + rc + ';border-width:2px">' +
          rarChip(rarOf(p.type)) +
          '<span class="spc-av">' + subjPetAv(k, s.k, 44) + '</span>' +
          '<span class="spc-t"><b>' + s.ic + ' ' + s.n + '</b><small>Lv.' + p.lv + ' · ' + pc + '%</small>' +
          '<span class="spc-bar"><i style="width:' + pc + '%"></i></span></span></button>';
      }).join('') + '</div>' +
      '<div class="tiny sp-note">开局一只初始宠物 · 其他四科靠获得：老师加分攒经验 / 每日答题全勤 / Boss 掉落（点空槽看详情）</div></div>';
  }

  function studentHomeHTML(k) {
    const today = todayStr();
    const doneToday = k.dailyQuizDate === today;
    const gname = { g1: '一年级', g2: '二年级', g3: '三年级', g4: '四年级', g5: '五年级', g6: '六年级' }[k.grade] || '三年级';
    return '<div class="games-grid">' +
      '<a class="game-card gc-daily" id="stDaily"><span class="gc-em">' + (doneToday ? '✅' : '📖') + '</span><div><b>每日答题</b><small>' +
      (doneToday ? '今天已完成，明天再来' : '10 道题 · 语数英科全科') + '</small></div><i class="gc-go">GO</i></a>' +
      '<a class="game-card gc-quest" href="#/quest"><span class="gc-em">🗺️</span><div><b>知识冒险闯关</b><small>' +
      (k.className ? esc(k.className) + ' · ' : '') + gname + (k.classCode ? ' · 年级随班级' : '') + '</small></div><i class="gc-go">GO</i></a>' +
      '<a class="game-card gc-novel" href="#/novel"><span class="gc-em">📖</span><div><b>冒险小说</b><small>' +
      esc((window.BPGames && window.BPGames.novelBrief) ? window.BPGames.novelBrief(k) : '每个年级一本书 · 主角就是你') + '</small></div><i class="gc-go">GO</i></a>' +
      '</div>' +
      subjPetsHTML(k) +
      mastIconsHTML(k) +
      '<div class="inter-row">' +
      '<button class="inter-btn" data-a="pat">🫶 摸摸头</button>' +
      '<button class="inter-btn" data-a="feed">🍖 喂食</button>' +
      '<button class="inter-btn" data-a="play">🎾 玩耍</button>' +
      '</div>' +
      '<div class="tiny" id="interHint" style="text-align:center;margin-top:6px">和宠物互动 · 每天第一次有经验奖励</div>' +
      (k.classCode ? '<div class="stu-sync" id="stSync"><i class="cc-dot ' + (cloudState().online ? 'on' : '') + '"></i>' +
        esc(k.className || '我的班级') + ' · ' + (cloudState().online ? '已连接老师，答题数据自动同步' : '离线中，答题记录会联网后补发') + '</div>' : '') +
      '<div class="stu-links">' +
      '<button id="stJoin">🏫 ' + (k.classCode ? '我的班级：' + esc(k.className) : '加入班级（有班级码？）') + '</button>' +
      '<button id="stSwitch">🔄 切换身份</button>' +
      '</div>';
  }

  /* ================= v3.27 学情分析（家长/老师可见，学生不可见） ================= */
  function mastBarHTML(label, r, w) {
    const tot = r + w;
    const pct = tot ? Math.round(r / tot * 100) : -1;
    const cls = pct < 0 ? '' : pct >= 80 ? 'good' : pct >= 60 ? 'mid' : 'weak';
    return '<div class="mast-row ' + cls + '"><span class="mr-l">' + label + '</span>' +
      '<div class="mr-bar"><i style="width:' + (pct < 0 ? 0 : pct) + '%"></i></div>' +
      '<span class="mr-v">' + (pct < 0 ? '暂无' : pct + '%') + '</span><span class="mr-n">' + (tot ? tot + '题' : '') + '</span></div>';
  }
  function mastSheet(k) {
    const M = window.BPGames;
    if (!M || !M.SUBJ) return;
    const stats = M.mastStats(k);
    let body = '<div class="mast-block">' +
      Object.keys(M.SUBJ).map((s) => {
        const st = stats[s] || { r: 0, w: 0 };
        return mastBarHTML(M.SUBJ[s].icon + ' ' + M.SUBJ[s].name, st.r, st.w);
      }).join('') + '</div>';
    /* 薄弱知识点 top5：答题量>=2 且正确率最低 */
    const rows = Object.entries(k.mastery || {})
      .map(([key, m]) => { const p = key.split('|'); return { g: p[0], subj: p[1], kn: p[2], r: m.r, w: m.w, tot: m.r + m.w }; })
      .filter((x) => x.tot >= 2)
      .sort((a, b) => (a.r / a.tot) - (b.r / b.tot));
    const weak = rows.filter((x) => x.r / x.tot < 0.8).slice(0, 5);
    body += '<div class="mast-weak"><b>🔍 需要加强的知识点</b>' +
      (weak.length ? weak.map((x) => '<div class="mw-it"><span>' + (M.SUBJ[x.subj] ? M.SUBJ[x.subj].icon : '📘') + ' ' + esc(x.kn || x.subj) + '</span><b style="color:' + (x.r / x.tot < 0.5 ? '#e5484d' : '#ff8a00') + '">' + Math.round(x.r / x.tot * 100) + '%</b></div>').join('')
        : '<div class="tiny" style="margin-top:6px">暂无明显薄弱点，继续保持！</div>') + '</div>';
    body += '<div class="tiny" style="margin-top:10px">掌握度来自每日答题与冒险闯关的自动记录 · 答错自动进入错题本</div>';
    openSheet('<div class="sheet-h">📊 ' + esc(k.name) + ' · 知识点掌握分析</div>' + body);
  }
  function viewAnalysis() {
    if (isStudent()) { location.hash = '#/home'; return; }
    if (isClass()) {
      $view.innerHTML = '<div class="page">' +
        '<div class="section-h"><h2>📊 学情分析</h2><span class="sub">点学生查看知识点掌握</span></div>' +
        (P.d.kids.length ? '<div class="ana-grid">' + P.d.kids.map((k) =>
          '<button class="ana-it" data-k="' + k.id + '"><span class="av"><img src="' + petImg(k) + '" alt=""></span>' +
          '<b>' + esc(k.name) + '</b><small>' + (k.joined ? '🟢 班级学员' : '名单') + '</small></button>').join('') + '</div>'
          : '<div class="card empty">班里还没有学生，先去「全班」添加名单</div>') +
        '</div>';
      document.querySelectorAll('.ana-it').forEach((b) => (b.onclick = () => {
        const k = P.d.kids.find((x) => x.id === b.dataset.k);
        if (k) mastSheet(k);
      }));
      return;
    }
    /* 家庭模式：每个孩子一张掌握卡 */
    $view.innerHTML = '<div class="page">' +
      '<div class="section-h"><h2>📊 学情分析</h2><span class="sub">点孩子查看知识点掌握详情</span></div>' +
      P.d.kids.map((k) =>
        '<div class="card ana-card" data-k="' + k.id + '"><div class="ana-h"><span class="av"><img src="' + petImg(k) + '" alt=""></span>' +
        '<b>' + esc(k.name) + '</b><i>详情 ›</i></div>' +
        (function () {
          const M = window.BPGames;
          if (!M || !M.SUBJ) return '';
          const stats = M.mastStats(k);
          return Object.keys(M.SUBJ).map((s) => {
            const st = stats[s] || { r: 0, w: 0 };
            return mastBarHTML(M.SUBJ[s].icon + ' ' + M.SUBJ[s].name, st.r, st.w);
          }).join('');
        })() + '</div>').join('') +
      '</div>';
    document.querySelectorAll('.ana-card').forEach((c) => (c.onclick = () => {
      const k = P.d.kids.find((x) => x.id === c.dataset.k);
      if (k) mastSheet(k);
    }));
  }

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
      '<div class="pet-zone"><div class="aura"><div class="pet ' + st.cls + '" id="petTap">' + petBand(k.pet, 130, wardOf(k, 'main')) + '</div></div></div>' +
      '<div class="pet-name">' + esc(displayName(k)) + '</div>' +
      '<div class="pet-stage">' + st.name + ' · ' + petMeta(k.skin || k.pet.type).name + '</div>' +
      '<div class="exp-row"><div class="exp-bar"><i style="width:' + pct + '%"></i></div>' +
      '<div class="exp-num">' + k.pet.exp + '/' + need + ' EXP</div></div>' +
      '<div class="stats"><div><b>' + k.points + '</b><span>积分</span></div>' +
      '<div><b>' + weekPts + '</b><span>本周获得</span></div>' +
      '<div><b>' + third + '</b><span>' + thirdLbl + '</span></div></div>' +
      '</div>' +
      (isClass() ? '<div class="quick-links tl-links">' +
        '<a href="#/class">👥 全班</a><a href="#/analysis">📊 学情分析</a><a href="#/board">🏆 光荣榜</a><a href="#/log">📒 记录</a>' +
        '</div>' +
        '<button class="stu-entry-btn" id="stuEntry">🔗 学生界面入口 · 链接和班级码发给学生</button>' +
        '<div class="tiny tl-note">老师端只做管理与统计，不设答题闯关。学生用自己的手机打开上面的链接作答，成绩自动汇总到这里。</div>'
        : isStudent() ? studentHomeHTML(k) :
        '<div class="games-grid">' +
          '<a class="game-card gc-daily" href="#/daily"><span class="gc-em">🎯</span><div><b>每日打卡答题</b><small>每天 5 种题型 · 连续打卡</small></div><i class="gc-go">GO</i></a>' +
          '<a class="game-card gc-quest" href="#/quest"><span class="gc-em">🗺️</span><div><b>知识冒险闯关</b><small>打 Boss · 收集 · 错题本</small></div><i class="gc-go">GO</i></a>' +
          '</div>' +
        '<div class="fam-links"><button id="famAnalysis">📊 学情分析 · 知识点掌握</button></div>' +
        '<div class="inter-row">' +
          '<button class="inter-btn" data-a="pat">🫶 摸摸头</button>' +
          '<button class="inter-btn" data-a="feed">🍖 喂食</button>' +
          '<button class="inter-btn" data-a="play">🎾 玩耍</button>' +
        '</div>' +
        '<div class="tiny" id="interHint" style="text-align:center;margin-top:6px">和宠物互动 · 每天第一次有经验奖励</div>') +
      (!isStudent() ? '<div class="section-h"><h2>最近动态</h2><a class="more" href="#/log">全部记录</a></div>' +
      '<div id="recentLogs">' + recentLogsHTML(k) + '</div>' : '') +
      '</div>';

    const cta = document.getElementById('homeClsCta');
    if (cta) cta.onclick = () => newClassSheet();

    /* 学生端绑定 */
    if (isStudent()) {
      const d = document.getElementById('stDaily');
      if (d) d.onclick = () => { if (window.BPGames) BPGames.studentDaily(k); };
      const j = document.getElementById('stJoin');
      if (j) j.onclick = () => {
        if (k.classCode) studentClassSheet(k);
        else if (window.BPGames) BPGames.joinClassSheet(k, render);
      };
      const sy = document.getElementById('stSync');
      if (sy) sy.onclick = () => studentClassSheet(k);
      const sw = document.getElementById('stSwitch');
      if (sw) sw.onclick = () => { if (confirm('切换身份会回到入口选择页，学生数据保留')) { localStorage.removeItem('beast.role'); location.reload(); } };
      const mg = document.getElementById('stMast');
      if (mg) mg.onclick = () => mastSheet(k);
      document.querySelectorAll('.sp-card').forEach((b) => (b.onclick = () => {
        ensurePetSys(k);
        if (!k.subjPets[b.dataset.subj]) return subjGetSheet(k, b.dataset.subj);
        subjPetSheet(k, b.dataset.subj);
      }));
      const sd = document.getElementById('spDress');
      if (sd) sd.onclick = () => dressSheet(k);
    }
    /* 家庭/班级端学情分析入口 */
    const fa = document.getElementById('famAnalysis');
    if (fa) fa.onclick = () => { location.hash = '#/analysis'; };
    const se = document.getElementById('stuEntry');
    if (se) se.onclick = () => studentEntrySheet();
    document.querySelectorAll('.inter-btn').forEach((b) => (b.onclick = () => {
      if (window.BPGames) window.BPGames.petInteract(k, b.dataset.a);
    }));
    /* 助战栏位提示 */
    const aidN = (k.aid || []).filter(Boolean).length;
    const slots = k.pet.lv >= 12 ? 3 : k.pet.lv >= 9 ? 2 : k.pet.lv >= 6 ? 1 : 0;
    const hint = document.getElementById('interHint');
    if (hint && slots > 0) hint.innerHTML = '🤝 助战 ' + aidN + '/' + slots + '（Lv.6/9/12 逐个解锁 · 在冒险的收集页设置） · 每天第一次互动有经验';
    document.getElementById('petTap').onclick = () => {
      const p = document.querySelector('.pet');
      p.style.transform = 'scale(1.15)';
      setTimeout(() => (p.style.transform = ''), 220);
      toast(k.pet.name + ' 很开心 ✨');
    };
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
    if (!items.length) return '<div class="card empty">' + (isClass() ? '还没有记录 · 学生答题或你加分后会显示在这里' : '还没有记录，去做个任务吧') + '</div>';
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
      '<div class="sheet-h">添加' + (isClass() ? '学生' : '孩子') + '</div><div class="tiny">每' + (isClass() ? '名学生' : '个孩子') + '有独立的积分、宠物和记录</div>' +
      '<div class="field"><label>名字 / 称呼</label><input id="nkName" maxlength="8" placeholder="比如：妹妹"></div>' +
      (isClass() && gs.length ? '<div class="field"><label>小组（可选）</label><select id="nkGroup"><option value="">不分组</option>' +
        gs.map((g) => '<option value="' + esc(g) + '">' + esc(g) + '</option>').join('') + '</select></div>' : '') +
      '<div style="margin-top:14px"><button class="btn" id="nkGo">创建</button></div>',
      (m, close) => {
        m.querySelector('#nkGo').onclick = () => {
          const name = m.querySelector('#nkName').value.trim();
          if (!name) return toast('先填个名字吧');
          const gsel = m.querySelector('#nkGroup');
          const group = gsel ? gsel.value : '';
          close();
          if (!isClass() && window.BPGames && BPGames.genPlacement) {
            /* 家庭模式：先摸底，按成绩掉落初始宠物 */
            placement(name, (r) => {
              const k = newStu(name, group, 1);
              k.grade = r.grade;
              k.pet = { name: PETS[r.type].name, type: r.type, exp: 0, lv: 1 };
              if (!k.dex) k.dex = {};
              k.dex[r.type + '-baby'] = true;
              P.d.kids.push(k);
              P.d.cur = k.id;
              P.save(); render();
              toast('🎓 ' + name + ' 摸底答对 ' + r.right + '/' + r.total + '，' + PETS[r.type].name + ' 降临！');
            });
          } else {
            const k = newStu(name, group, 1);
            P.d.kids.push(k);
            P.d.cur = k.id;
            P.save(); render();
            toast(name + ' 加入了，抽到了 ' + petMeta(k.pet.type).name + ' ' + petMeta(k.pet.type).emoji);
          }
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
      '<div class="lh-l"><b>幸运大转盘</b><small>' + (price ? '抽一次 ' + price + ' 积分 · 抽实物或宠物经验' : '奖池还没上架礼品') + '</small></div>' +
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
        '。抽中实物礼品会进「待确认」找老师领取；<b>抽中经验道具直接加给宠物</b>，无需确认。' +
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
      /* 经验道具：抽到即生效，直接喂给宠物，不进待确认 */
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
    const card = (key, img, name, sub, unlocked, extra, rar) =>
      '<div class="dex-card' + (unlocked ? '' : ' locked') + '"' + (rar ? ' style="border:2px solid ' + RARC[rar] + '"' : '') + (extra ? ' ' + extra : '') + '>' +
      (rar ? rarChip(rar) : '') +
      '<div class="dx-img">' + (unlocked ? '<img src="' + img + '" alt="" loading="lazy">' : '<span class="lk">🔒</span>') + '</div>' +
      '<div class="dx-nm">' + (unlocked ? name : '？？？') + '</div>' +
      '<div class="dx-sub">' + sub + '</div></div>';

    let html = '<div class="page">' + kidsRow() +
      '<div class="section-h"><h2>宠物图鉴</h2><span class="sub">' + got + '/' + total + ' · ' + pct + '%</span></div>' +
      '<div class="exp-bar dark" style="border-radius:99px"><i style="width:' + pct + '%"></i></div>' +
      '<div class="dex-grid" style="margin-top:12px">' +
      card('egg', 'images/egg.jpg', '神秘宠物蛋', '旅程起点', !!k.dex.egg) +
      els.map((el) => STAGES.slice(1).map((s) => {
        const key = el + '-' + s.suffix;
        const un = !!k.dex[key];
        const companion = k.companions.some((c) => c.type === el) && s.suffix === 'baby';
        const extra = un && companion ? 'data-skin="' + el + '" data-tip="tap"' : '';
        return card(key, imgFor(el, STAGES.indexOf(s)), PETS[el].name, s.name + (companion ? ' · 伙伴' : ''), un, extra, rarOf(el));
      }).join('')).join('') +
      '</div>' +
      '<div class="tiny" style="margin:4px 2px">解锁条件：宠物进化填充本系形态；达到 Lv.5/10/15/20 会降临神秘伙伴，点伙伴卡片可让牠出战。</div>' +
      '</div>';
    $view.innerHTML = html;
    bindKidsRow();
    document.querySelectorAll('.dex-card[data-skin]').forEach((c) => (c.onclick = () => {
      if (isClass()) { toast('👩‍🏫 出战宠物由学生自己选，老师端仅查看图鉴'); return; }
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
      (isClass() ? '<button class="me-chip" id="ppMe">🙋 我的身份：' + myRoleLabel() + '<i>切换 ›</i></button>' : '') +
      (isClass() ? '<div class="teacher-tools"' + (P.d.classes.length > 1 ? ' style="grid-template-columns:repeat(5,1fr)"' : ' style="grid-template-columns:repeat(4,1fr)"') + '>' +
        '<button id="ttGroup"><b>⚡</b>加减分</button>' +
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
        '<div class="btn-row" style="margin-top:9px"><button class="btn ghost" id="mgTeam">👩‍🏫 教师团队</button><button class="btn ghost" id="mgMe">🙋 我的身份</button></div>' +
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
        tt('ttGroup', () => { close(); groupAwardPick(); });
        tt('ttRnd', () => { close(); randomPick(); });
        tt('mgRnd', () => { close(); randomPick(); });
        tt('mgRedeem', () => { close(); redeemBoardSheet(); });
        tt('ttRos', () => { close(); rosterSheet(); });
        tt('ttBrd', () => { close(); location.hash = '#/board'; render(); });
        tt('mgHelp', () => { location.href = 'help.html'; });
        tt('mgAmt', () => { close(); amtSetupSheet(); });
        tt('mgCls', () => { close(); classSetupSheet(); });
        tt('mgRoster', () => { close(); rosterSheet(); });
        tt('mgPin', () => { close(); setPinSheet(); });
        tt('ppCls', () => { close(); classListSheet(); });
        tt('ttCmp', () => { close(); location.hash = '#/compare'; render(); });
        tt('mgToClass', () => { close(); newClassSheet(); });
        tt('mgTeam', () => { close(); teacherTeamSheet(); });
        tt('mgMe', () => { close(); teacherRoleSheet(); });
        tt('ppMe', () => { close(); teacherRoleSheet(); });
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
          openSheet('<div class="sheet-h">删除 ' + esc(k.name) + '？</div><div class="tiny" style="margin-top:6px">该孩子的积分、宠物和记录都会一并删除，不可恢复。</div>' +
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
      '<div class="tiny">学生用积分兑换，兑换申请会进老师面板的「待确认」；<b>上架的礼品同时就是抽奖奖池</b>，抽奖票价按这些礼品的定价自动计算。经验道具不用确认，抽到/兑换后立刻加给宠物。</div>' +
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
      '<div class="tiny">实物礼品兑换后由老师发放；经验道具在抽到/兑换后<b>立刻加给宠物</b>，不用确认</div>' +
      '<div class="seg" id="gKind" style="grid-template-columns:repeat(2,1fr)">' +
      '<button data-k="gift">🎁 实物礼品</button><button data-k="exp">🧪 经验道具</button></div>' +
      '<div class="field"><label>选个图标</label><div class="icon-grid" id="gIcons">' +
      GIFT_ICONS.map((e) => '<button data-e="' + e + '"' + (e === icon ? ' class="on"' : '') + '>' + e + '</button>').join('') + '</div></div>' +
      '<div class="field"><label id="gNameLb">礼品名称</label><input id="gName" maxlength="16" placeholder="比如：换座位一次" value="' + (editing ? esc(editing.name) : '') + '"></div>' +
      '<div class="field" id="gExpWrap" style="display:none"><label>增加经验</label><input id="gExp" type="number" min="1" inputmode="numeric" value="' + (editing && editing.exp ? editing.exp : 30) + '"><div class="tiny" style="margin-top:6px">抽到或兑换后，宠物直接获得这个数量的经验</div></div>' +
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
          close();
          cloudSheet();
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
              /* 导入覆盖前先留一份底（与扫码导入同等待遇），误操作可去「云同步 → 恢复历史版本」找回 */
              try { localSnapshot(); } catch (e) {}
              /* 归一化成多班结构并打时间戳，避免刚导入就被云端旧数据盖回 */
              P.d = adoptImported(d); P.save(); close(); render(); toast('导入成功');
            } catch (e) { toast('文件格式不对'); }
          };
          rd.readAsText(f);
        };
        m.querySelector('#resetBtn').onclick = () => {
          openSheet('<div class="sheet-h">清空全部数据？</div><div class="tiny" style="margin-top:6px">积分、宠物、记录将全部删除，且不可恢复。</div>' +
            '<div class="btn-row" style="margin-top:16px"><button class="btn ghost" id="rsNo">取消</button><button class="btn" id="rsYes" style="background:var(--bad)">全部清空</button></div>',
            (mm, cc) => {
              mm.querySelector('#rsNo').onclick = cc;
              mm.querySelector('#rsYes').onclick = () => {
                P.d = P.fresh(); localStorage.removeItem(getKEY()); P.save();
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
  const isClass = () => !(sessionStorage.getItem('bpForceFamily') === '1') && !!(P.d && P.d.cls && P.d.cls.on);
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
  /* 完整空档案（云端拉回来的学生用，字段齐全避免后续崩） */
  function newKidShell(name) {
    const type = pickType();
    return {
      id: uid(), name, group: '', points: 0, daily: {},
      pet: { name: petMeta(type).name, type, exp: 0, lv: 1 },
      dex: { egg: true }, companions: [], milestones: [], skin: null,
      wrongBook: [], frags: {}, aid: [], inter: null, mastery: {},
      sid: '', joined: false, bonus: 0, stuPoints: 0
    };
  }

  /* ---------- 多班级 ---------- */
  /* 当前班（权威对象在 classes 里；P.d.cls 只是视图副本） */
  function curCls() {
    return (P.d.classes || []).find((c) => c.id === P.d.clsId) || null;
  }
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
    P.d.classes.push({ id, name, kids: [], groups: GROUPS_DEFAULT.slice(), period: 'today', rnd: { pool: [], round: 0 }, since: Date.now(), code: clsCodeOf(), grade: '', head: '', subs: {} });
    P.d.cls.on = true;
    loadClass(id);
    const r = importRoster(listText || '', true);
    if (!P.d.cur && P.d.kids.length) P.d.cur = P.d.kids[0].id;
    P.save();
    /* 建班上云：云端分配正式班级码（本地码只作离线兜底） */
    const created = P.d.classes.find((c) => c.id === id);
    setTimeout(() => cloudInitClass(created), 80);
    return r;
  }
  /* v3.27 班级码：6 位大写字母数字，学生端凭码加入 */
  function clsCodeOf() {
    if (P.d.cls && P.d.cls.code) return P.d.cls.code;
    const cs = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789';
    let c = '';
    for (let i = 0; i < 6; i++) c += cs[Math.floor(Math.random() * cs.length)];
    if (P.d.cls) { P.d.cls.code = c; P.save(); }
    return c;
  }
  function deleteClass(id) {
    if (P.d.classes.length <= 1) { toast('至少要保留一个班'); return; }
    P.d.classes = P.d.classes.filter((c) => c.id !== id);
    if (P.d.clsId === id) { loadClass(P.d.classes[0].id); }
    P.save(); render();
  }

  /* 导入/重置前留一份本机快照（原来靠旧云同步模块，现改为本地历史） */
  function localSnapshot() {
    try {
      const his = JSON.parse(localStorage.getItem('beast.his') || '[]');
      his.unshift({ ts: Date.now(), key: getKEY(), data: P.d });
      /* 只留最近 2 份，防止撑爆 localStorage */
      localStorage.setItem('beast.his', JSON.stringify(his.slice(0, 2)));
    } catch (e) {}
  }

  /* ================= v3.28 云端同步（老师电脑 ↔ 学生手机） =================
     分工：老师端权威（班名/年级/名单/加分），学生端权威（掌握度/进度/宠物/自己赚的分）
     断网不阻塞：写操作失败进离线队列，恢复可见时自动补发 */
  const CL = () => window.BEAST_CLOUD || null;
  /* 本次会话已尝试过上云的班级（不落盘，失败下次打开还会重试） */
  const cloudTried = new Set();
  function cloudState() { const C = CL(); return C ? C.state() : { base: '', online: false, pending: 0 }; }

  /* 把当前班级的云端绑定切到这个班（多班场景每个班各带自己的班级码与密钥） */
  function cloudUseClass(cls) {
    const C = CL(); if (!C || !cls || !cls.code) return;
    C.bind(cls.code, { role: 'teacher', teacherKey: cls.teacherKey || '' });
  }

  /* 老师：建班后上云，班级码以云端为准 */
  function cloudInitClass(cls, cb) {
    const C = CL();
    if (!C || !cls) { if (cb) cb(false); return; }
    const names = (cls.kids || []).map((x) => x.name).filter(Boolean);
    C.createClass(cls.name, cls.grade || '', '', names)
      .then((j) => {
        cls.code = j.code;
        cls.teacherKey = j.teacherKey;
        cls.cloudOn = true;
        cls.cloudAt = Date.now();
        P.save();
        toast('☁️ 班级已上云 · 班级码 ' + j.code);
        /* 建班时选的科目（班主任/学科老师）此时才补推云端 meta（班级刚注册好），
           并把此前因 404 入队的 meta 补发掉 */
        if (cls.code && window.BEAST_CLOUD) {
          if (cls.head || (cls.subs && Object.keys(cls.subs).length)) {
            window.BEAST_CLOUD.setMeta(cls.code, { head: cls.head || '', subs: cls.subs || {} }).catch(() => {});
          }
          C.flush().catch(() => {});
        }
        if (cb) cb(true);
        if (location.hash === '#/class' || location.hash === '#/home') render();
      })
      .catch(() => {
        cls.cloudOn = false;
        toast('云端连接失败，本地照常使用（网络恢复后自动重试）');
        if (cb) cb(false);
      });
  }

  /* 老师端：把云端名单/学情合并进本机班级（不覆盖老师自己的积分账本） */
  function cloudMergeRoster(cls, students) {
    if (!cls || !Array.isArray(students)) return 0;
    let n = 0;
    students.forEach((st) => {
      if (!st || !st.name) return;
      let k = (cls.kids || []).find((x) => x.sid && x.sid === st.sid) ||
        (cls.kids || []).find((x) => x.name === st.name);
      if (!k) {
        k = newKidShell(st.name);
        cls.kids.push(k);
      }
      k.sid = st.sid;
      k.joined = !!st.snap;              /* 有快照 = 学生已在自己手机上激活 */
      k.cloudAt = st.lastSeen || 0;
      k.cloudOn = !!st.active;
      k.bonus = st.bonus || 0;
      if (st.snap) {
        k.mastery = st.snap.mastery || {};
        k.wrongN = st.snap.wrongN || 0;
        k.questDone = st.snap.questDone || 0;
        k.questTotal = st.snap.questTotal || 0;
        k.stuPoints = st.snap.points || 0;   /* 学生自己赚的 */
        k.streak = st.snap.streak || 0;
        k.dailyDone = !!st.snap.dailyDone;
        if (st.snap.petName) { k.pet = k.pet || {}; k.pet.name = st.snap.petName; if (st.snap.petType) k.pet.type = st.snap.petType; k.pet.lv = st.snap.petLv || k.pet.lv || 1; }
        /* 总分以云端为准 = 学生自己赚的 + 老师给的；云端值变了才覆盖，
           避免老师刚加分（离线未确认）被旧值冲掉 */
        const cloudTotal = (st.snap.points || 0) + (st.bonus || 0);
        if (k.cloudTotal == null || cloudTotal !== k.cloudTotal) {
          k.points = cloudTotal;
          k.cloudTotal = cloudTotal;
        }
      }
      n++;
    });
    return n;
  }

  /* 老师端：拉云端全班 */
  function cloudPullRoster(silent) {
    const C = CL();
    const cls = curCls();
    if (!C || !cls || !cls.code || P.d.mode === 'student') return Promise.resolve(false);
    if (!cls.teacherKey) return Promise.resolve(false);
    cloudUseClass(cls);
    return C.roster(cls.code).then((j) => {
      cloudMergeRoster(cls, j.students);
      if (j.cls) {
        if (P.d.cls) { P.d.cls.name = j.cls.name || P.d.cls.name; P.d.cls.grade = j.cls.grade || P.d.cls.grade; }
        if (j.cls.name) cls.name = j.cls.name;
        if (j.cls.grade) cls.grade = j.cls.grade;
      }
      P.save();
      if (!silent) { render(); toast('☁️ 已同步：' + (j.students || []).length + ' 名学生'); }
      return true;
    }).catch((e) => {
      if (!silent) toast(e && e.message === 'bad_key' ? '教师密钥无效，请在设置里重新接管班级' : '同步失败，请检查网络');
      return false;
    });
  }

  /* 老师端进入班级页自动同步（20 秒节流，避免 render → pull → render 循环） */
  let cloudRosterAt = 0;
  let classPollTimer = null;
  function cloudAutoPull(force) {
    if (!force && Date.now() - cloudRosterAt < 20000) return;
    const cls = curCls();
    if (!cls || !cls.code || !cls.teacherKey) return;
    cloudRosterAt = Date.now();
    cloudPullRoster(true).then((ok) => {
      if (ok && /^#\/class/.test(location.hash || '')) render();
    });
  }
  /* 停在班级页时每 20 秒自动收一次学生数据（学生随时可能在手机上答题） */
  function startClassPolling() {
    clearInterval(classPollTimer);
    classPollTimer = setInterval(() => {
      if (!/^#\/class/.test(location.hash || '')) { clearInterval(classPollTimer); classPollTimer = null; return; }
      cloudRosterAt = 0;
      cloudAutoPull(true);
    }, 20000);
  }

  /* 学生端：上报自己的学习快照 */
  function cloudReport(kidObj, cb) {
    const C = CL();
    if (!C || !kidObj || !kidObj.classCode) { if (cb) cb(false); return Promise.resolve(false); }
    /* 2 秒节流：一次答题会连续写多处，避免抖成几十个请求 */
    const tnow = Date.now();
    if (kidObj._repAt && tnow - kidObj._repAt < 2000) { if (cb) cb(true); return Promise.resolve(true); }
    kidObj._repAt = tnow;
    const own = Math.max(0, (kidObj.points || 0) - (kidObj.bonusApplied || 0));
    const snap = {
      points: own,
      petName: (kidObj.pet && kidObj.pet.name) || '',
      petType: (kidObj.pet && kidObj.pet.type) || '',
      petLv: (kidObj.pet && kidObj.pet.lv) || 1,
      wrongN: (kidObj.wrongBook || []).filter((w) => !w.ok).length,
      questDone: kidObj.quest && kidObj.quest.nodes ? kidObj.quest.nodes.filter((n) => n.done).length : 0,
      questTotal: kidObj.quest && kidObj.quest.nodes ? kidObj.quest.nodes.length : 0,
      grade: kidObj.grade || '',
      dailyDone: kidObj.dailyQuizDate === todayStr(),
      streak: kidObj.streak || 0,
      mastery: kidObj.mastery || {}
    };
    return C.report(kidObj.classCode, kidObj.cloudSid, kidObj.cloudToken, snap)
      .then(() => { if (cb) cb(true); return true; })
      .catch(() => { if (cb) cb(false); return false; });
  }

  /* 学生端：拉班级变动（年级/班名）+ 老师给自己的加分 */
  let cloudPullAt = 0;
  function cloudStudentPull(silent) {
    const C = CL();
    if (!C || P.d.mode !== 'student') return Promise.resolve(false);
    const k = kid();
    if (!k || !k.classCode || !k.cloudSid) return Promise.resolve(false);
    if (silent && Date.now() - cloudPullAt < 60000) return Promise.resolve(false);
    cloudPullAt = Date.now();
    return C.pull(k.classCode, k.cloudSid, k.cloudToken).then((j) => {
      let changed = false;
      /* 年级以班级为准 */
      if (j.cls && j.cls.grade && j.cls.grade !== k.grade) {
        k.grade = j.cls.grade;
        k.quest = null;
        changed = true;
        toast('🎓 班级年级已更新为 ' + ({ g1: '一', g2: '二', g3: '三', g4: '四', g5: '五', g6: '六' }[k.grade] || '') + '年级');
      }
      if (j.cls && j.cls.name) k.className = j.cls.name;
      /* 老师加分并入（只补差额，避免与上报来回打架） */
      const bonus = (j.me && j.me.bonus) || 0;
      if (bonus !== (k.bonusApplied || 0)) {
        const delta = bonus - (k.bonusApplied || 0);
        k.points = Math.max(0, (k.points || 0) + delta);
        k.bonusApplied = bonus;
        changed = true;
        if (delta > 0) {
          addExp(k, delta);
          /* v3.31 按学科喂对应宠物：数学老师的分只进数学宠物 */
          const by = (j.me && j.me.bonusBy) || {};
          const prev = k.bonusByApplied || {};
          Object.keys(by).forEach((sk) => {
            const d = (by[sk] || 0) - (prev[sk] || 0);
            if (d > 0) addSubjExp(k, sk, d);
            prev[sk] = by[sk] || 0;
          });
          k.bonusByApplied = prev;
          const who = Object.keys(by).filter((sk) => sk !== 'all').map((sk) => SUBJ_NAME[sk]).filter(Boolean);
          toast('🌟 老师给你加了 ' + delta + ' 分！' + (who.length ? '（' + who.join('/') + '宠物也长经验了）' : ''));
        }
      }
      if (changed) { P.save(); render(); }
      return true;
    }).catch(() => false);
  }

  /* 给 games.js 用的窄接口（两边在不同闭包里） */
  window.BeastCloud = {
    report: function (k) { return cloudReport(k); },
    pull: function () { return cloudStudentPull(false); },
    state: cloudState,
    pullRoster: function () { cloudRosterAt = 0; return cloudPullRoster(false); },
    sheet: function () { return cloudSheet(); },
    reportNow: function (k) { return cloudReport(k); }
  };

  /* 老师加分后推给云端（学生下次联网就能看到） */
  function cloudPushBonus(sids, delta, reason, subj) {
    const C = CL();
    const cls = curCls();
    if (!C || !cls || !cls.code || !cls.teacherKey) return;
    cloudUseClass(cls);
    C.bonus(cls.code, sids, delta, reason, subj || 'all').catch(() => {});
  }

  /* ================= v3.33 学生专属网络入口（老师生成链接/二维码发给学生） ================= */
  function studentEntryLink() {
    const c = curCls();
    const code = (c && c.code) ? c.code : '';
    return location.origin + location.pathname + '?role=student' + (code ? '&code=' + encodeURIComponent(code) : '');
  }
  /* 复制：成功后按钮变「✅ 已复制」+ 震动 + 提示；浏览器拦截时弹出可长按的内容框，
     绝不让用户猜到底复制成功没有 */
  function copyText(txt, okTip, btn) {
    const success = () => {
      toast(okTip || '✅ 已复制');
      if (btn) {
        if (!btn.dataset.oldTxt) btn.dataset.oldTxt = btn.textContent;
        btn.textContent = '✅ 已复制';
        btn.classList.add('copied');
        clearTimeout(btn._cpT);
        btn._cpT = setTimeout(() => {
          btn.textContent = btn.dataset.oldTxt;
          btn.classList.remove('copied');
        }, 1600);
      }
      try { if (navigator.vibrate) navigator.vibrate(18); } catch (e) {}
    };
    const manual = () => {
      toast('浏览器不允许自动复制，长按下面的内容手动复制');
      openSheet('<div class="sheet-h">📋 长按复制</div>' +
        '<div class="tiny">自动复制被浏览器拦下了。长按下面框里的内容 → 全选 → 复制即可。</div>' +
        '<textarea class="se-copybox" readonly rows="4">' + esc(txt) + '</textarea>',
        (mm) => {
          const ta = mm.querySelector('.se-copybox');
          if (ta) { try { ta.focus(); ta.select(); } catch (e) {} }
        });
    };
    const legacy = () => {
      const ta = document.createElement('textarea');
      ta.value = txt;
      ta.setAttribute('readonly', '');
      ta.style.position = 'fixed'; ta.style.top = '0'; ta.style.left = '0';
      ta.style.width = '1px'; ta.style.height = '1px'; ta.style.opacity = '0';
      document.body.appendChild(ta);
      try { ta.focus(); ta.select(); ta.setSelectionRange(0, txt.length); } catch (e) {}
      let ok = false;
      try { ok = document.execCommand('copy'); } catch (e) {}
      ta.remove();
      if (ok) success(); else manual();
    };
    try {
      if (navigator.clipboard && navigator.clipboard.writeText) {
        navigator.clipboard.writeText(txt).then(success).catch(legacy);
        return;
      }
    } catch (e) {}
    legacy();
  }
  function studentEntrySheet() {
    const c = curCls();
    const code = (c && c.code) ? c.code : '';
    const link = studentEntryLink();
    openSheet(
      '<div class="sheet-h">🔗 学生界面入口</div>' +
      '<div class="tiny se-intro">学生用自己的手机打开这个链接（或扫码）→ 选「我是学生」→ 设置名字和 4 位以上密码 → 自动加入本班。此后每次答题、闯关的成绩都会自动汇总到你的班级里。</div>' +
      '<div class="se-qr"><canvas id="seQr"></canvas><div class="tiny">用微信/相机扫码，直接进入学生界面</div></div>' +
      '<div class="se-link" id="seLink"><span>' + esc(link) + '</span><i>点我复制</i></div>' +
      (code
        ? '<div class="tiny">班级码 <b>' + esc(code) + '</b> 已内置在链接中，学生打开后不用再手输</div>'
        : '<div class="tiny">当前班级还没有班级码：学生打开后需要手动输入。建议先去「☁️ 同步」里生成班级码。</div>') +
      '<div class="btn-row" style="margin-top:12px">' +
      '<button class="btn sm" id="seCopy" style="flex:1">复制链接</button>' +
      '<button class="btn sm ghost" id="seCopyCode" style="flex:1"' + (code ? '' : ' disabled') + '>复制班级码</button></div>' +
      '<button class="btn ghost sm" id="sePreview" style="width:100%;margin-top:8px">📱 在这台设备上预览学生界面</button>' +
      '<div class="tiny se-note">点开后这台设备会临时切到学生界面，老师档案原样保留；点顶栏右上角的 <b>🎒 切换身份</b> 或学生页顶部的黄色提示条，随时切回老师。本机还没有学生档案时，会先走一遍学生入学（班级码已自动填好）。老师端本身不开放答题闯关，避免替学生刷分导致成绩失真。</div>',
      (m) => {
        const cv = m.querySelector('#seQr');
        try { drawQr(cv, link, 230); } catch (e) { if (cv) cv.remove(); }
        const bLink = m.querySelector('#seCopy');
        const bCode = m.querySelector('#seCopyCode');
        if (bLink) bLink.onclick = () => copyText(link, '✅ 链接已复制，发给学生即可', bLink);
        if (bCode && code) bCode.onclick = () => copyText(code, '✅ 班级码 ' + code + ' 已复制', bCode);
        const lk = m.querySelector('#seLink');
        if (lk) lk.onclick = () => copyText(link, '✅ 链接已复制，发给学生即可', null);
        const pv = m.querySelector('#sePreview');
        if (pv) pv.onclick = () => switchToStudent(code);
      });
  }

  /* 切到学生界面：学生档案与老师/家长档案分别存储，互不影响，随时可切回
     本机没有学生档案 → 走学生入学（带班级码）；已有 → 直接回到自己的学生主页 */
  function switchToStudent(code) {
    /* 只改身份 + 强制重载；不要让老师账号的会话把人拉回老师界面 */
    try {
      localStorage.removeItem('beast.home');
      const raw = localStorage.getItem('beast.v1.student');
      if (raw) {
        let d = null;
        try { d = JSON.parse(raw); } catch (e) { d = null; }
        if (!d || !d.kids || !d.kids.length) localStorage.removeItem('beast.v1.student');
      }
    } catch (e) {}
    setRole('student');
    hardNav('role=student' + (code ? '&code=' + encodeURIComponent(code) : ''));
  }
  /* 在老师/家长设备上打开学生链接时的切换面板 */
  function studentSwitchSheet(code) {
    const cur = (function () { try { return localStorage.getItem('beast.role') || 'family'; } catch (e) { return 'family'; } })();
    const curName = cur === 'class' ? '老师' : cur === 'student' ? '学生' : '家长';
    openSheet(
      '<div class="sheet-h">🎒 学生界面入口</div>' +
      '<div class="tiny se-intro">这个链接是给学生用的。<b>本机现在是「' + curName + '」界面</b>，所以在电脑上直接打开还是看到' + curName + '页面 —— 学生在自己手机上打开会自动进入学生界面。</div>' +
      '<div class="se-link" style="margin-top:4px"><span>教学演示：把链接发到家长群 / 班级群，学生点开即入学</span></div>' +
      '<button class="btn" id="ssGo" style="width:100%;margin-top:12px">📱 在这台设备上进入学生界面</button>' +
      '<button class="btn ghost" id="ssStay" style="width:100%;margin-top:8px">留在' + curName + '界面</button>' +
      '<div class="tiny se-note">' + curName + '的数据不会丢：进入学生界面后，点顶栏右上角的 <b>🎒 切换身份</b>，或学生页顶部的黄色提示条，随时切回' + curName + '。</div>',
      (m, close) => {
        m.querySelector('#ssGo').onclick = () => { close(); switchToStudent(code); };
        m.querySelector('#ssStay').onclick = () => close();
      });
  }

  /* v3.42 顶栏身份切换：本机已有几个档案就列几个，一键换界面 */
  function roleSwitchSheet() {
    const cur = (function () { try { return localStorage.getItem('beast.role') || ''; } catch (e) { return ''; } })();
    const profs = roleProfiles();
    const IC = { class: '🏫', family: '🏠', student: '🎒' };
    const NM = { class: '老师界面', family: '家长界面', student: '学生界面' };
    const au = window.BeastAuth && BeastAuth.current();
    const rows = profs.map((p) => {
      let d = null;
      try { d = JSON.parse(localStorage.getItem('beast.v1.' + p.r) || 'null'); } catch (e) { d = null; }
      const extra = p.r === 'class'
        ? ((d && d.cls && d.cls.name) || '我的班级') + ' · ' + p.cnt + ' 人'
        : p.r === 'student'
          ? (p.cnt > 1 ? p.cnt + ' 个孩子' : ((d && d.kids && d.kids[0] && d.kids[0].name) || '我的学生页'))
          : p.cnt + ' 个孩子';
      return '<button class="rs-row' + (cur === p.r ? ' on' : '') + '" data-go="' + p.r + '">' +
        '<span class="rs-em">' + IC[p.r] + '</span>' +
        '<span class="rs-t"><b>' + NM[p.r] + '</b><small>' + esc(extra) + '</small></span>' +
        (cur === p.r ? '<i class="rs-cur">当前</i>' : '<i class="rs-go">进入</i>') + '</button>';
    }).join('');
    openSheet('<div class="sheet-h">🔀 切换身份</div>' +
      '<div class="tiny se-intro">这台设备上已有的档案都在下面，点一下换过去。各身份数据分开存放，不会互相覆盖。</div>' +
      (rows || '<div class="tiny" style="margin:8px 0">本机还没有任何档案</div>') +
      (au ? '<div class="tiny" style="margin-top:10px">当前登录账号：<b>' + esc(au.name) + '</b>（' + (BeastAuth.ROLE_NAME[au.role] || '') + '）</div>' : '') +
      '<div class="btn-row" style="margin-top:12px"><button class="btn ghost" id="rsHome" style="flex:1">🏠 回入口页</button>' +
      '<button class="btn ghost" id="rsHelp" style="flex:1">📖 操作说明</button></div>',
      (m, close) => {
        m.querySelectorAll('[data-go]').forEach((b) => (b.onclick = () => {
          const r = b.dataset.go;
          if (r === cur) return close();
          setRole(r); close(); hardNav();
        }));
        m.querySelector('#rsHome').onclick = () => { close(); goHome(); };
        m.querySelector('#rsHelp').onclick = () => { close(); location.href = 'help.html'; };
      });
  }

  /* 云端同步面板：状态 + 班级码 + 教师密钥 + 手动同步 */
  function cloudSheet() {
    const C = CL();
    const k = kid();
    const stu = P.d.mode === 'student';
    const cls = curCls();
    const st = cloudState();
    const code = stu ? (k && k.classCode ? k.classCode : '') : (cls && cls.code ? cls.code : '');
    const key = (cls && cls.teacherKey) || '';
    const dot = st.base ? (st.online ? '🟢' : '🟡') : '⚪';
    const txt = !st.base ? '未连接云端（仅本机可用）' : st.online ? '云端在线' : '网络不通，已排队 ' + (st.pending || 0) + ' 条待补发';
    let body = '<div class="sheet-h">☁️ 云端同步</div>' +
      '<div class="cloud-stat"><b>' + dot + ' ' + txt + '</b>' +
      '<small>' + (st.base ? esc(st.base.replace(/^https?:\/\//, '').replace(/\?.*$/, '')) : '点下面「连接云端」重试') + '</small></div>';
    if (code) {
      body += '<div class="cloud-code"><span>班级码</span><b>' + esc(code) + '</b></div>';
      body += stu
        ? '<div class="tiny" style="margin-top:6px">把这个码给同学就行；你的答题数据会自动同步给老师</div>'
        : '<div class="tiny" style="margin-top:6px">把它写在黑板/群公告里，学生用「我是学生 → 加入班级」输入即可</div>';
    }
    if (!stu) {
      body += '<button class="btn ghost sm" id="csEntry" style="margin-top:8px;width:100%">🔗 学生界面入口 · 链接/二维码</button>';
    }
    if (!stu && key) {
      body += '<div class="cloud-key"><span>教师密钥（换设备接管用）</span><b>' + esc(key.slice(0, 10)) + '…</b>' +
        '<button id="ckShow">显示</button></div>';
    }
    body += '<div style="margin-top:14px;display:flex;gap:8px">' +
      '<button class="btn sm" id="csSync" style="flex:1">立即同步</button>' +
      (stu ? '' : '<button class="btn sm ghost" id="csTake" style="flex:1">接管别的班</button>') +
      '</div>';
    if (!st.base) body += '<button class="btn ghost" id="csConn" style="margin-top:8px">连接云端</button>';
    openSheet(body, (m, close) => {
      const sy = m.querySelector('#csSync');
      if (sy) sy.onclick = () => {
        sy.textContent = '同步中…';
        const job = stu ? cloudStudentPull(false) : cloudPullRoster(false);
        job.then((ok) => { sy.textContent = ok ? '✓ 已同步' : '同步失败'; setTimeout(() => close(), 700); });
      };
      const tk = m.querySelector('#csTake');
      if (tk) tk.onclick = () => { close(); cloudTakeOverSheet(); };
      const en = m.querySelector('#csEntry');
      if (en) en.onclick = () => { close(); studentEntrySheet(); };
      const cn = m.querySelector('#csConn');
      if (cn) cn.onclick = () => {
        cn.textContent = '连接中…';
        C.probe().then((b) => { close(); toast(b ? '已连接云端' : '没连上，检查网络或服务地址'); cloudSheet(); });
      };
      const sh = m.querySelector('#ckShow');
      if (sh) sh.onclick = () => {
        m.querySelector('.cloud-key b').textContent = key;
        if (window.mobileClipboardWrite) {} /* 占位 */
        try { navigator.clipboard.writeText(key); toast('密钥已复制，请妥善保管'); } catch (e) {}
      };
    });
  }

  /* 学生：我的班级卡片（状态 + 立即同步 + 换班 + 退出） */
  function studentClassSheet(k) {
    const st = cloudState();
    const on = !!st.online && !!st.base;
    const GN = { g1: '一', g2: '二', g3: '三', g4: '四', g5: '五', g6: '六' };
    openSheet(
      '<div class="sheet-h">🏫 我的班级</div>' +
      '<div class="cloud-stat"><b>' + esc(k.className || '班级') + '</b>' +
      '<small>班级码 ' + esc(k.classCode || '') + (k.classTeacher ? ' · ' + esc(k.classTeacher) : '') + '</small></div>' +
      '<div class="stu-sync" style="margin-top:10px"><i class="cc-dot ' + (on ? 'on' : '') + '"></i>' +
      (on ? '已连接老师，答题数据会自动同步' : '当前离线，记录先存本机，联网后自动补发' + (st.pending ? '（待补发 ' + st.pending + ' 条）' : '')) + '</div>' +
      '<div class="tiny" style="margin-top:8px">年级随班级：' + (GN[k.grade] || '未设') + '年级（老师统一设置，学生不能自己改）</div>' +
      '<div style="margin-top:14px;display:flex;gap:8px">' +
      '<button class="btn sm" id="scSync" style="flex:1">立即同步</button>' +
      '<button class="btn sm ghost" id="scChange" style="flex:1">换班级</button>' +
      '</div>' +
      '<button class="btn ghost" id="stLeave" style="margin-top:8px;color:#d5483f">退出班级</button>',
      (m, close) => {
        m.querySelector('#scSync').onclick = (e) => {
          const b = e.currentTarget;
          b.textContent = '同步中…';
          cloudReport(k).then(() => cloudStudentPull(false)).then((ok) => {
            b.textContent = ok === false ? '同步失败' : '✓ 已同步';
            setTimeout(() => close(), 700);
          });
        };
        m.querySelector('#scChange').onclick = () => {
          close();
          if (window.BPGames) window.BPGames.joinClassSheet(k, render);
        };
        m.querySelector('#stLeave').onclick = () => {
          if (!confirm('退出后老师将看不到你的答题数据，确定？')) return;
          delete k.classCode; delete k.className; delete k.cloudSid; delete k.cloudToken; delete k.bonusApplied;
          P.save(); close(); render(); toast('已退出班级');
        };
      });
  }

  /* 老师：换设备接管班级 */
  function cloudTakeOverSheet() {
    openSheet('<div class="sheet-h">☁️ 接管已有班级</div>' +
      '<div class="tiny">换电脑或换手机时用：输入班级码 + 教师密钥，把云端班级（名单/积分/学情）拉回本机</div>' +
      '<div class="field"><label>我的科目（必选 · 云端已有的老师姓名不会被覆盖）</label>' + subjPickHTML() + '</div>' +
      '<div class="field"><label>班级码</label><input id="toCode" maxlength="8" placeholder="6 位班级码" style="text-transform:uppercase"></div>' +
      '<div class="field"><label>教师密钥</label><input id="toKey" placeholder="建班时生成的密钥（点显示可复制）"></div>' +
      '<button class="btn" id="toGo" style="margin-top:12px">接管班级</button>', (m, close) => {
      let tkSubj = null;
      bindSubjPick(m, (s) => (tkSubj = s));
      const go = m.querySelector('#toGo');
      go.onclick = () => {
        if (!tkSubj) return toast('请先选择你的科目：班主任或其中一学科');
        const code = m.querySelector('#toCode').value.trim().toUpperCase();
        const key = m.querySelector('#toKey').value.trim();
        if (!code || !key) return toast('班级码和密钥都要填');
        go.textContent = '连接中…';
        CL().takeOver(code, key).then((j) => {
          /* 在本地重建这个班 */
          const id = 'c' + uid();
          const cls = {
            id, name: (j.cls && j.cls.name) || '云端班级', kids: [], groups: GROUPS_DEFAULT.slice(),
            period: 'today', rnd: { pool: [], round: 0 }, since: Date.now(),
            code: code, teacherKey: key, cloudOn: true, grade: (j.cls && j.cls.grade) || '', takenOver: true
          };
          P.d.classes.push(cls);
          P.d.cls.on = true;
          P.d.mode = 'class';
          P.d.admin = true;
          loadClass(id);
          cloudMergeRoster(cls, j.students || []);
          /* 科目必选：声明我在这个班的角色（班主任/某学科），云端已有姓名不覆盖 */
          const me = (window.BeastAuth && BeastAuth.current()) || {};
          applyTeacherSubj(tkSubj, me.name || '', cls, true);
          P.save(); close();
          location.hash = '#/class';
          render();
          toast('☁️ 已接管「' + cls.name + '」，' + (j.students || []).length + ' 名学生');
        }).catch((e) => {
          go.textContent = '接管班级';
          toast(e && e.message === 'bad_key' ? '教师密钥不对' : (e && e.message === 'class_not_found' ? '没有这个班级码' : '连接失败，检查网络'));
        });
      };
    });
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
      '<div class="tiny" style="margin-top:10px">班级之间学生名单、积分、宠物各自独立；任务和奖励规则是全年级通用的。</div>',
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
      '<button id="qaRnd"><span>🎲</span>随机点名</button>' +
      '<button id="clsAna"><span>📊</span>学情分析</button>' +
      (P.d.classes.length > 1 ? '<button id="qaCmp"><span>📊</span>跨班对比</button>' : '') +
      '</div>' +
      (function () {
        const c = curCls() || {};
        const st = cloudState();
        const on = !!st.online && !!st.base;
        const joinedN = (P.d.kids || []).filter((x) => x.joined).length;
        return '<div class="ch-code tiny">🏫 班级码 <b id="clsCodeB">' + esc(c.code || clsCodeOf()) + '</b> · 班级年级 <b id="clsGradeB">' +
          ({ g1: '一', g2: '二', g3: '三', g4: '四', g5: '五', g6: '六' }[c.grade] || '未设') + '</b>（学生加入后年级随班）' +
          ' <button id="clsGradeSet" style="font-size:11px;padding:2px 8px;border-radius:99px;border:1px solid rgba(255,255,255,.5);background:rgba(255,255,255,.15);color:#fff">设置年级</button></div>' +
          '<div class="ch-cloud tiny"><i class="cc-dot ' + (on ? 'on' : '') + '"></i>' +
          (st.base ? (on ? '云端已连接 · ' + joinedN + '/' + (P.d.kids || []).length + ' 名学员已在自己手机上激活' + (st.pending ? ' · ' + st.pending + ' 条待补发' : '')
            : '云端暂离线，数据先存本机，联网自动补发')
            : '未连接云端（只能本机使用）') +
          ' <button id="clsCloud">同步</button></div>';
      })() +
      '<div class="cls-tools">' +
      '<input id="clsQ" placeholder="搜索学生" value="' + esc(clsFilter.q) + '">' +
      '<button id="clsRoster">名单</button></div>' +
      (gs.length ? '<div class="chips" id="clsGs">' + ['全部'].concat(gs).map((g) =>
        '<button data-g="' + (g === '全部' ? '' : esc(g)) + '" class="' + ((g === '全部' && !clsFilter.g) || g === clsFilter.g ? 'on' : '') + '">' + esc(g) + '</button>').join('') + '</div>' : '') +
      '<div class="stu-grid" id="stuGrid">' +
      (list.length ? list.map((k) => {
        const r = rankMap[k.id];
        return '<div class="stu' + (r <= 3 ? ' top' + r : '') + '" data-k="' + k.id + '" style="--glow:' + petMeta(k.skin || k.pet.type).glow + '">' +
          '<div class="av"><img src="' + petImg(k) + '" alt="" loading="lazy"></div>' +
          '<div class="nm">' + esc(k.name) + '</div>' +
          '<div class="pt">' + k.points + '</div>' +
          (r <= 3 ? '<i class="rk">' + ['🥇', '🥈', '🥉'][r - 1] + '</i>' : '') +
          (k.joined ? '<i class="jl" title="已在自己手机上激活' + (k.cloudOn ? ' · 在线' : '') + '">' + (k.cloudOn ? '🟢' : '📱') + '</i>' : '') +
          '</div>';
      }).join('') : '<div class="card empty" style="grid-column:1/-1">' + (P.d.kids.length ? '没有匹配的学生' : '还没有学生，点右上「名单」导入') + '</div>') +
      '</div></div>';

    const q = document.getElementById('clsQ');
    q.oninput = () => { clsFilter.q = q.value.trim(); const p = q.selectionStart; viewClass(); const n = document.getElementById('clsQ'); n.focus(); n.setSelectionRange(p, p); };
    document.getElementById('chSwitch').onclick = classListSheet;
    document.getElementById('clsSet').onclick = classSetupSheet;
    document.getElementById('clsRoster').onclick = rosterSheet;
    const cloudBtn = document.getElementById('clsCloud');
    if (cloudBtn) cloudBtn.onclick = () => {
      const c0 = curCls();
      /* 老班级（v3.27 及以前建的）还没有云端身份，这里补一次上云 */
      if (c0 && !c0.teacherKey) {
        cloudBtn.textContent = '上云中…';
        cloudInitClass(c0, (ok) => { if (ok) cloudPullRoster(false); });
        return;
      }
      cloudBtn.textContent = '同步中…';
      cloudPullRoster(false);
    };
    setTimeout(() => cloudAutoPull(false), 400);
    startClassPolling();
    const anaBtn = document.getElementById('clsAna');
    if (anaBtn) anaBtn.onclick = () => { location.hash = '#/analysis'; };
    const gradeBtn = document.getElementById('clsGradeSet');
    if (gradeBtn) gradeBtn.onclick = () => {
      openSheet('<div class="sheet-h">班级年级</div><div class="tiny">设置后学生加入班级会自动跟随，且不能自己改年级</div>' +
        '<div class="grade-grid">' + ['g1', 'g2', 'g3', 'g4', 'g5', 'g6'].map((g) =>
          '<button class="grade-it' + (g === P.d.cls.grade ? ' on' : '') + '" data-g="' + g + '">' + { g1: '一年级', g2: '二年级', g3: '三年级', g4: '四年级', g5: '五年级', g6: '六年级' }[g] + '</button>').join('') + '</div>',
        (m2, close2) => {
          m2.querySelectorAll('.grade-it').forEach((b) => (b.onclick = () => {
            P.d.cls.grade = b.dataset.g;
            /* 同步回班级列表（学生端按 classes[].code 读取） */
            const cur = (P.d.classes || []).find((c) => c.id === P.d.clsId);
            if (cur) cur.grade = b.dataset.g;
            P.d.kids.forEach((k) => (k.grade = b.dataset.g));
            /* 推到云端：学生手机下次同步自动跟随新年级 */
            const CC = CL();
            if (CC && cur && cur.code && cur.teacherKey) {
              cloudUseClass(cur);
              CC.setMeta(cur.code, { grade: b.dataset.g }).catch(() => {});
            }
            P.save(); close2(); render();
            toast('班级年级已设为' + { g1: '一', g2: '二', g3: '三', g4: '四', g5: '五', g6: '六' }[b.dataset.g] + '年级，全班同步');
          }));
        });
    };
    document.getElementById('qaAll').onclick = () => quickAward(P.d.kids.map((k) => k.id));
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
      '<div class="sh-subjs">' + SUBJ_LIST.map((s) => {
        const p = subjPetOf(k, s.k);
        return '<button class="sh-sp" data-ss="' + s.k + '">' + subjPetAv(k, s.k, 40) +
          '<b>' + s.ic + '</b><small>Lv.' + p.lv + '</small></button>';
      }).join('') + '</div>' +
      '<div class="tiny" style="margin:2px 2px 8px">加分学科（只喂对应宠物）</div>' +
      subjChipsHTML(mySubjScope()) +
      amtsHTML() +
      '<div class="chips" id="shWhy">' + WHY_POS.concat(WHY_NEG).map((w, i) =>
        '<button data-w="' + esc(w) + '"' + (i === 0 ? ' class="on"' : '') + '>' + esc(w) + '</button>').join('') + '</div>' +
      '<div class="field"><input id="shCustom" maxlength="20" placeholder="或自己写个理由（可选）"></div>' +
      '<div style="margin-top:12px"><button class="btn" id="shGo">确认加分</button></div>' +
      '<div class="btn-row" style="margin-top:9px"><button class="btn ghost sm" id="shOpen" style="flex:1">看宠物主页</button>' +
      '<button class="btn ghost sm" id="shCard" style="flex:1">生成成长卡</button></div>',
      (m, close) => {
        const st = { amt: amts().pos[0] || 1 };
        let why = WHY_POS[0];
        let subjSel = mySubjScope();
        m.querySelectorAll('#shSubj button').forEach((b) => (b.onclick = () => {
          m.querySelectorAll('#shSubj button').forEach((x) => x.classList.remove('on'));
          b.classList.add('on'); subjSel = b.dataset.sub;
        }));
        m.querySelectorAll('[data-ss]').forEach((b) => (b.onclick = () => {
          close();
          ensurePetSys(k);
          if (!k.subjPets[b.dataset.ss]) return subjGetSheet(k, b.dataset.ss);
          subjPetSheet(k, b.dataset.ss);
        }));
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
          grantPoints(k, amt, cus || why, subjSel);
          toast(k.name + ' ' + (amt > 0 ? '+' : '') + amt + ' 分' + (amt > 0 && subjSel !== 'all' ? ' · 已喂' + SUBJ_NAME[subjSel] + '宠物' : ''));
          close(); render();
        };
        m.querySelector('#shOpen').onclick = () => { P.d.cur = k.id; P.save(); close(); location.hash = '#/home'; render(); };
        m.querySelector('#shCard').onclick = () => { close(); growthCard(k); };
      });
  }

  /* ---------- 批量 / 全班加分 ---------- */
  function quickAward(preset, title) {
    let sel = new Set(preset || []);
    const gs = groupsOf();
    openSheet(
      '<div class="sheet-h" id="qaTitle">' + esc(title || (preset && preset.length === P.d.kids.length && P.d.kids.length ? '全班加分' : '批量加减分')) + '</div>' +
      '<div class="tiny" id="qaSub">点学生选中，可多选；底部选分值和理由后一次提交</div>' +
      '<div class="chips" id="qaTools" style="margin-top:10px"><button data-all="1">全选</button><button data-all="0">清空</button>' +
      (gs.length ? gs.map((g) => '<button data-g="' + esc(g) + '">' + esc(g) + '</button>').join('') : '') + '</div>' +
      '<div class="stu-grid sm" id="qaGrid">' + P.d.kids.map((k) =>
        '<div class="stu' + (sel.has(k.id) ? ' sel' : '') + '" data-k="' + k.id + '">' +
        '<div class="av"><img src="' + petImg(k) + '" alt="" loading="lazy"></div>' +
        '<div class="nm">' + esc(k.name) + '</div><i class="ck">✓</i></div>').join('') + '</div>' +
      '<div class="qa-bar">' +
      '<div class="tiny" style="margin:2px 2px 6px">加分学科（只喂对应宠物）</div>' +
      subjChipsHTML(mySubjScope(), 'qaSubj') +
      amtsHTML(true) +
      '<div class="chips" id="qaWhy">' + WHY_POS.concat(WHY_NEG).map((w, i) =>
        '<button data-w="' + esc(w) + '"' + (i === 0 ? ' class="on"' : '') + '>' + esc(w) + '</button>').join('') + '</div>' +
      '<button class="btn" id="qaGo" style="margin-top:10px">给 0 人加分</button></div>',
      (m, close) => {
        const st = { amt: amts().pos[0] || 1 };
        let why = WHY_POS[0];
        let subjSel = mySubjScope();
        m.querySelectorAll('#qaSubj button').forEach((b) => (b.onclick = () => {
          m.querySelectorAll('#qaSubj button').forEach((x) => x.classList.remove('on'));
          b.classList.add('on'); subjSel = b.dataset.sub;
        }));
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
          sel.forEach((id) => { const k = P.d.kids.find((x) => x.id === id); if (k) { grantPoints(k, st.amt, why, subjSel); n++; } });
          close(); render();
          toast('已给 ' + n + ' 人 ' + (st.amt > 0 ? '+' : '') + st.amt + ' 分' + (st.amt > 0 && subjSel !== 'all' ? ' · 只喂' + SUBJ_NAME[subjSel] + '宠物' : ''));
        };
      });
  }

  /* ---------- 加减分：选范围（全班 / 各小组）后进入批量加减分 ---------- */
  function groupAwardPick() {
    const gs = groupsOf();
    const oneBtn = (label, sub, fn) =>
      '<button class="btn ghost" ' + fn + ' style="width:100%;display:flex;justify-content:space-between;align-items:center">' + label + '<small style="opacity:.65">' + sub + '</small></button>';
    openSheet(
      '<div class="sheet-h">加减分 · 选范围</div>' +
      '<div class="tiny">选全班或某个小组，进入后已自动勾选对应学生，可再手动增减</div>' +
      '<div style="margin-top:12px;display:grid;gap:9px" id="gpPick">' +
      oneBtn('👥 全部学生', P.d.kids.length + ' 人 ›', '') +
      gs.map((g) => oneBtn('🏷️ ' + esc(g), P.d.kids.filter((k) => k.group === g).length + ' 人 ›', '')).join('') +
      '</div>',
      (m, close) => {
        m.querySelectorAll('#gpPick button').forEach((b, i) => (b.onclick = () => {
          close();
          if (i === 0) { quickAward(P.d.kids.map((k) => k.id), '全班加分'); return; }
          const g = gs[i - 1];
          const ids = P.d.kids.filter((k) => k.group === g).map((k) => k.id);
          if (!ids.length) { toast('「' + g + '」还没有学生'); return; }
          quickAward(ids, '小组加分 · ' + g);
        }));
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
    const subj = P.d.boardSubj || 'all';
    const S = SUBJ_LIST.find((x) => x.k === subj) || null;
    const label = { today: '今日', week: '本周', total: '总榜' };
    const pv = (k) => { ensurePetSys(k); const sp = k.subjPets[subj]; return sp ? sp.lv * 10000 + sp.exp : 0; };
    const rows = (subj === 'all' ? rankBy(p)
      : P.d.kids.map((k) => ({ k, v: pv(k) })).sort((x, y) => y.v - x.v).map((r, i) => Object.assign(r, { rank: i + 1 })));
    const rest = rows.slice(3);
    const top = rows.slice(0, 3);
    const avOf = (k, size) => (subj === 'all' ? petAv(k, size) : subjPetAv(k, subj, size));
    const valOf = (r) => (subj === 'all' ? r.v : 'Lv.' + (r.k.subjPets[subj] ? r.k.subjPets[subj].lv : 1));
    const podium = (r, idx) => r ? '<div class="pd-' + (idx + 1) + '" data-k="' + r.k.id + '"><div class="pd-av">' + avOf(r.k, 74) + '</div>' +
      '<div class="pd-nm">' + esc(r.k.name) + '</div><div class="pd-v">' + valOf(r) + '</div>' +
      '<div class="pd-base">' + (idx + 1) + '</div></div>' : '';
    const gs = groupsOf();
    const gStat = gs.map((g) => {
      const ms = P.d.kids.filter((k) => k.group === g);
      const sum = ms.reduce((s2, k) => s2 + (p === 'total' ? k.points : ptsSince(k, p === 'today' ? dayStart() : weekStart())), 0);
      return { g, sum, avg: ms.length ? sum / ms.length : 0, n: ms.length };
    }).sort((a2, b2) => b2.avg - a2.avg);
    const maxAvg = Math.max(1, ...gStat.map((x) => x.avg));

    $view.innerHTML = '<div class="page board-page">' +
      '<div class="bd-subj" id="bdSubj">' +
      '<button data-s="all"' + (subj === 'all' ? ' class="on"' : '') + '>🏆 全部</button>' +
      SUBJ_LIST.map((x) => '<button data-s="' + x.k + '"' + (subj === x.k ? ' class="on"' : '') + '>' + x.ic + ' ' + x.n + '</button>').join('') +
      '</div>' +
      (subj === 'all' ? '<div class="seg" id="bdSeg" style="grid-template-columns:repeat(3,1fr)">' +
        ['today', 'week', 'total'].map((x) => '<button data-p="' + x + '"' + (p === x ? ' class="on"' : '') + '>' + label[x] + '</button>').join('') + '</div>' : '') +
      (rows.length ? '<div class="podium">' + podium(top[1], 1) + podium(top[0], 0) + podium(top[2], 2) + '</div>' : '') +
      '<div class="section-h"><h2>' + (subj === 'all' ? label[p] + '排行' : (S ? S.ic + ' ' + S.n + '宠物墙' : '排行')) + '</h2>' +
      '<span class="sub">' + (subj === 'all' ? '全班共 +' + rows.reduce((s2, r) => s2 + r.v, 0) + ' 分' : '按本科宠物等级排序 · 共 ' + rows.length + ' 只') + '</span></div>' +
      '<div class="board">' + (rest.length ? rest.map((r) =>
        '<div class="bd-row" data-k="' + r.k.id + '"><span class="bd-rk">' + r.rank + '</span>' +
        '<span class="bd-av">' + avOf(r.k, 34) + '</span>' +
        '<span class="bd-nm">' + esc(r.k.name) + (r.k.group ? '<i>' + esc(r.k.group) + '</i>' : '') +
        (subj !== 'all' ? '<em class="bd-sub">' + (r.k.subjPets[subj] ? PETS[r.k.subjPets[subj].type].name : '') + '</em>' : '') + '</span>' +
        '<span class="bd-v">' + valOf(r) + '</span></div>').join('') : (rows.length ? '<div class="card empty">只有 3 名学生上榜</div>' : '<div class="card empty">还没有学生</div>')) + '</div>' +
      (subj === 'all' && gStat.length > 1 ? '<div class="section-h"><h2>小组 PK</h2><span class="sub">按人均分</span></div>' +
        '<div class="card">' + gStat.map((x) => '<div class="gpk"><div class="gp-h"><b>' + esc(x.g) + '</b><span>' + x.n + ' 人 · 人均 ' + x.avg.toFixed(1) + '</span></div>' +
          '<div class="gp-bar"><i style="width:' + Math.max(4, (x.avg / maxAvg) * 100) + '%"></i></div></div>').join('') + '</div>' : '') +
      (subj !== 'all' ? '<div class="tiny" style="margin-top:10px;text-align:center">这面墙上的宠物只吃「' + (S ? S.n : '') + '」的经验 · 学生换宠物后自动同步</div>' : '') +
      '</div>';
    document.querySelectorAll('#bdSubj button').forEach((b) => (b.onclick = () => { P.d.boardSubj = b.dataset.s; P.save(); render(); }));
    const sg = document.getElementById('bdSeg');
    if (sg) sg.querySelectorAll('button').forEach((b) => (b.onclick = () => { P.d.cls.period = b.dataset.p; P.save(); render(); }));
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
      '<div class="tiny" style="text-align:center;margin-top:4px">点班级卡片可以切换过去；点 TOP10 里的学生可以查看他的宠物</div>' +
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
      '<div class="section-h" style="margin-top:16px"><h2>云端同步</h2></div>' +
      '<div class="tiny" style="margin:2px 2px 8px">学生在自己手机上答题，数据通过云端汇总到这台设备</div>' +
      '<div class="btn-row"><button class="btn ghost" id="csCloud">☁️ 同步状态 / 班级码</button>' +
      '<button class="btn ghost" id="csTake">接管已有班级</button></div>' +
      '<div class="section-h" style="margin-top:16px"><h2>班级</h2></div>' +
      '<div class="tiny" style="margin:2px 2px 8px">共 ' + P.d.classes.length + ' 个班，每个班的名单和积分互相独立</div>' +
      '<div class="btn-row"><button class="btn ghost" id="csSwitch">切换班级</button><button class="btn ghost" id="csNew">＋ 新建班级</button></div>' +
      '<div class="btn-row" style="margin-top:9px"><button class="btn ghost" id="csDel" style="color:var(--bad)">删除当前班级</button></div>' +
      '<div class="section-h" style="margin-top:18px"><h2>名单</h2></div>' +
      '<div class="btn-row" style="margin-top:8px"><button class="btn ghost" id="csRoster">导入 / 管理名单</button></div>' +
      '<div class="section-h" style="margin-top:18px"><h2>学期重置</h2></div>' +
      '<div class="btn-row" style="margin-top:8px"><button class="btn ghost" id="csResetPts">只清空积分</button><button class="btn ghost" id="csResetAll">全新开始</button></div>' +
      '<div class="tiny" style="margin-top:8px">「只清空积分」保留宠物等级和图鉴；「全新开始」所有宠物回到宠物蛋。</div>' +
      '<div class="section-h" style="margin-top:18px"><h2>模式</h2></div>' +
      '<div class="btn-row" style="margin-top:8px"><button class="btn ghost" id="csExit">关闭班级模式（回到家庭版）</button></div>',
      (m, close) => {
        m.querySelector('#cnName').onchange = (e) => {
          P.d.cls.name = e.target.value.trim();
          const c0 = curCls();
          if (c0) {
            c0.name = P.d.cls.name;
            if (c0.teacherKey && c0.code) { cloudUseClass(c0); CL().setMeta(c0.code, { name: c0.name }).catch(() => {}); }
          }
          P.save(); render();
        };
        m.querySelectorAll('#cnPeriod button').forEach((b) => (b.onclick = () => {
          m.querySelectorAll('#cnPeriod button').forEach((x) => x.classList.remove('on'));
          b.classList.add('on'); P.d.cls.period = b.dataset.v; P.save();
        }));
        m.querySelector('#csAmt').onclick = () => { close(); amtSetupSheet(); };
        m.querySelector('#csCloud').onclick = () => { close(); cloudSheet(); };
        m.querySelector('#csTake').onclick = () => { close(); cloudTakeOverSheet(); };
        m.querySelector('#csRoster').onclick = () => { close(); rosterSheet(); };
        m.querySelector('#csSwitch').onclick = () => { close(); classListSheet(); };
        m.querySelector('#csNew').onclick = () => { close(); newClassSheet(); };
        m.querySelector('#csDel').onclick = () => {
          const cur = P.d.classes.find((c) => c.id === P.d.clsId);
          if (!cur) return;
          if (P.d.classes.length <= 1) return toast('至少要保留一个班');
          if (!confirm('删除「' + cur.name + '」？该班 ' + (cur.kids || []).length + ' 名学生的积分和宠物都会删除，不可恢复。')) return;
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
      '<div class="tiny" style="margin-top:6px">' + (all ? '全部学生的积分、宠物等级、图鉴、记录都会清空。' : '积分和记录清零，宠物等级与图鉴保留。') + '名单不会删除。</div>' +
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
      '<div class="btn-row" style="margin-top:8px"><button class="btn ghost" id="rsGroup" style="flex:1">🏷️ 分组管理</button><button class="btn ghost" id="rsPets" style="flex:1">🎲 重新分配宠物</button></div>' +
      '<div style="margin-top:14px;max-height:46vh;overflow:auto" id="rsList">' + rosterRows() + '</div>',
      (m, close) => {
        const repaint = () => { m.querySelector('#rsList').innerHTML = rosterRows(); bindRows(); render(); };
        const bindRows = () => {
          m.querySelectorAll('[data-del]').forEach((b) => (b.onclick = () => {
            const k = P.d.kids.find((x) => x.id === b.dataset.del);
            if (!k) return;
            if (!confirm('删除 ' + k.name + ' 的积分和宠物记录？')) return;
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
        m.querySelector('#rsGroup').onclick = () => { close(); groupSheet(); };
        m.querySelector('#rsPets').onclick = () => { close(); reassignPetsSheet(); };
      });
  }
  /* 分组管理：新建 / 重命名 / 删除分组，并给每个学生指定分组 */
  function groupSheet() {
    const groupsArr = () => (Array.isArray(P.d.cls.groups) && P.d.cls.groups.length) ? P.d.cls.groups : GROUPS_DEFAULT.slice();
    const gCount = (g) => P.d.kids.filter((k) => k.group === g).length;
    const paint = (m) => {
      const gs = groupsArr();
      m.querySelector('#gpList').innerHTML = gs.map((g) =>
        '<div class="pend-item"><div class="body"><div class="pn">🏷️ ' + esc(g) +
        '<span class="tiny" style="margin-left:8px">' + gCount(g) + ' 人</span></div></div>' +
        '<div class="ops"><button class="ok" data-gren="' + esc(g) + '">✏️</button><button class="no" data-gdel="' + esc(g) + '">🗑</button></div></div>').join('') || '<div class="empty">还没有分组</div>';
      m.querySelector('#gpAssign').innerHTML = P.d.kids.map((k) => {
        const opts = ['<option value="">未分组</option>'].concat(gs.map((g) => '<option' + (k.group === g ? ' selected' : '') + ' value="' + esc(g) + '">' + esc(g) + '</option>'));
        return '<div class="pend-item"><div class="body"><div class="pn">' + esc(k.name) + '</div></div>' +
          '<div class="ops"><select data-kid="' + k.id + '" style="padding:6px 10px;border-radius:10px;border:1.5px solid var(--line);background:var(--card);color:var(--ink);font-size:13px">' + opts.join('') + '</select></div></div>';
      }).join('') || '<div class="empty">还没有学生</div>';
      m.querySelectorAll('[data-gren]').forEach((b) => (b.onclick = () => {
        const old = b.dataset.gren;
        const v = prompt('分组改成什么名字？', old);
        if (!v || !v.trim() || v.trim() === old) return;
        const nm = v.trim();
        if (groupsArr().includes(nm)) return toast('已有同名分组');
        P.d.cls.groups = groupsArr().map((g) => (g === old ? nm : g));
        P.d.kids.forEach((k) => { if (k.group === old) k.group = nm; });
        P.save(); paint(m); render();
      }));
      m.querySelectorAll('[data-gdel]').forEach((b) => (b.onclick = () => {
        const g = b.dataset.gdel;
        if (!confirm('删除分组「' + g + '」？组内 ' + gCount(g) + ' 名学生会变成「未分组」（名单和积分不受影响）。')) return;
        P.d.cls.groups = groupsArr().filter((x) => x !== g);
        P.d.kids.forEach((k) => { if (k.group === g) k.group = ''; });
        P.save(); paint(m); render();
      }));
      m.querySelectorAll('[data-kid]').forEach((sel) => (sel.onchange = () => {
        const k = P.d.kids.find((x) => x.id === sel.dataset.kid);
        if (!k) return;
        k.group = sel.value; P.save(); render();
        const lb = m.querySelector('#gpGroups');
        if (lb) lb.textContent = groupsArr().map((g) => g + ' ' + gCount(g) + '人').join(' · ') || '暂无分组';
      }));
    };
    openSheet(
      '<div class="sheet-h">分组管理</div>' +
      '<div class="tiny" id="gpGroups" style="margin-top:4px"></div>' +
      '<div class="btn-row" style="margin-top:10px"><button class="btn ghost" id="gpAdd" style="flex:1">＋ 新建分组</button></div>' +
      '<div id="gpList" style="margin-top:10px"></div>' +
      '<div class="section-h" style="margin-top:14px"><h2 style="font-size:14px">给学生分组</h2></div>' +
      '<div style="max-height:38vh;overflow:auto" id="gpAssign"></div>',
      (m, close) => {
        paint(m);
        m.querySelector('#gpAdd').onclick = () => {
          const v = prompt('新分组名称（如：第五组）');
          if (!v || !v.trim()) return;
          const nm = v.trim();
          if (groupsArr().includes(nm)) return toast('已有同名分组');
          P.d.cls.groups = groupsArr().concat([nm]);
          P.save(); paint(m); render(); toast('已添加「' + nm + '」');
        };
      });
  }
  function rosterRows() {
    if (!P.d.kids.length) return '<div class="empty">还没有学生</div>';
    return P.d.kids.map((k, i) => '<div class="pend-item"><div class="body"><div class="pn">' + (i + 1) + '. ' + esc(k.name) +
      '<span class="tiny" style="margin-left:8px">' + (k.group ? esc(k.group) : '未分组') + ' · ' + k.points + ' 分 · Lv.' + k.pet.lv + '</span></div></div>' +
      '<div class="ops"><button class="ok" data-ren="' + k.id + '">✏️</button><button class="no" data-del="' + k.id + '">🗑</button></div></div>').join('');
  }
  /* 手动全班重抽：一次性打乱 50 只池，按顺序分给全班，班内绝不重复 */
  function reassignPetsSheet() {
    const n = P.d.kids.length;
    if (!n) { toast('还没有学生'); return; }
    openSheet(
      '<div class="sheet-h">重新分配宠物</div>' +
      '<div class="tiny">给全班 ' + n + ' 名学生重新随机分配形象，<b>班内不重复</b>；积分、等级、记录都不变。</div>' +
      '<div class="warn" style="margin-top:10px">图鉴会按新宠物重建，之前解锁的旧宠物图鉴会清掉。</div>' +
      '<div style="margin-top:12px"><button class="btn" id="rpGo">开始重新分配</button></div>',
      (m, close) => {
        m.querySelector('#rpGo').onclick = () => {
          const pool = CREATURES.slice();
          for (let i = pool.length - 1; i > 0; i--) { const j = Math.floor(Math.random() * (i + 1)); const t = pool[i]; pool[i] = pool[j]; pool[j] = t; }
          P.d.kids.forEach((k, i) => {
            const pick = pool[i % pool.length];
            const lv = (k.pet && k.pet.lv) || 3;
            const exp = (k.pet && k.pet.exp) || 0;
            k.pet = { name: pick.name, type: pick.id, exp, lv };
            k.skin = null;
            k.dex = { egg: true };
            STAGES.forEach((s) => { if (lv >= s.min && s.suffix !== 'egg') k.dex[pick.id + '-' + s.suffix] = true; });
          });
          P.save(); close(); render();
          toast('已重新分配 ' + n + ' 人的宠物');
        };
      });
  }
  function importSheet() {
    openSheet(
      '<div class="sheet-h">导入名单</div>' +
      '<div class="tiny" style="margin-top:6px">一行一个学生。想分组就写成「小明 第一组」，用空格或逗号隔开。</div>' +
      '<div class="field"><textarea id="imTx" rows="9" placeholder="张小明&#10;李小红 第一组&#10;王小刚,第二组" style="width:100%;padding:12px;border-radius:13px;border:1.5px solid var(--line);font-family:inherit;font-size:14px;line-height:1.7;resize:vertical"></textarea></div>' +
      '<label class="ck-line"><input type="checkbox" id="imRep"> 覆盖原名单（⚠️ 勾选后名单重建，<b>积分全部清零</b>；要连积分一起迁移请用「数据备份 → 导入 JSON」）</label>' +
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
    /* 名单有变动就同步到云端：学生用名字认领，云端没名字会被当成新同学 */
    if (added) {
      const c0 = (P.d.classes || []).find((c) => c.id === P.d.clsId);
      if (c0 && c0.teacherKey && c0.code) {
        cloudUseClass(c0);
        CL().pushRoster(c0.code, P.d.kids.map((x) => x.name)).catch(() => {});
      }
    }
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
      '<div class="tiny" style="text-align:center;margin-top:4px">' + n + ' 名' + (d.cls && d.cls.on ? '学生' : '孩子') + ' · 积分与宠物原样搬过来</div></div>' +
      '<div class="warn" style="margin-top:10px">导入会<b>覆盖</b>本机现有数据。系统会先把本机这一份存进「恢复历史版本」，误操作还能找回。</div>' +
      '<div style="margin-top:12px"><button class="btn" id="qiGo">确认导入</button></div>',
      (m, close) => {
        m.querySelector('#qiGo').onclick = () => {
          try { localSnapshot(); } catch (e) {}
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
      '<div style="margin-top:9px"><button class="btn ghost" id="qsClip" style="margin-bottom:8px">📋 从剪贴板粘贴</button><button class="btn" id="qsGo">解析并导入</button></div></div>' +
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
    const clipBtn = q('#qsClip');
    if (clipBtn) clipBtn.onclick = async () => {
      try {
        const txt = await navigator.clipboard.readText();
        if (!txt || !txt.trim()) { toast('剪贴板是空的，先复制二维码下方的文本'); return; }
        const box = q('#qsTxt');
        box.value = (box.value ? box.value + '\n' : '') + txt.trim();
        toast('已粘贴，点「解析并导入」');
      } catch (e) {
        toast('这个浏览器不让自动读剪贴板，请长按输入框手动粘贴');
      }
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
        /* 环境自检：https / 打开方式 / 浏览器 —— 逐层判断摄像头到底卡在哪一层 */
        const envInfo = () => {
          const ua = navigator.userAgent;
          const secure = window.isSecureContext !== false && location.protocol === 'https:';
          let inFrame = false;
          try { inFrame = window.self !== window.top; } catch (e) { inFrame = true; }
          let standalone = false;
          try { standalone = (window.matchMedia && matchMedia('(display-mode: standalone)').matches) || navigator.standalone === true; } catch (e) {}
          let br = '未知浏览器';
          if (/MicroMessenger/i.test(ua)) br = '微信内置浏览器';
          else if (/AlipayClient/i.test(ua)) br = '支付宝内置浏览器';
          else if (/DingTalk/i.test(ua)) br = '钉钉内置浏览器';
          else if (/Weibo/i.test(ua)) br = '微博内置浏览器';
          else if (/Quark/i.test(ua)) br = '夸克浏览器';
          else if (/UCBrowser/i.test(ua)) br = 'UC 浏览器';
          else if (/HuaweiBrowser/i.test(ua)) br = '华为浏览器';
          else if (/MiuiBrowser/i.test(ua)) br = '小米浏览器';
          else if (/SamsungBrowser/i.test(ua)) br = '三星浏览器';
          else if (/EdgA|EdgiOS/i.test(ua)) br = 'Edge';
          else if (/CriOS/i.test(ua)) br = 'Chrome (iOS)';
          else if (/Chrome\//i.test(ua)) br = 'Chrome';
          else if (/Firefox\//i.test(ua)) br = 'Firefox';
          else if (/Safari\//i.test(ua)) br = 'Safari';
          const webview = !/MicroMessenger|AlipayClient|DingTalk|Weibo|Quark|UCBrowser|HuaweiBrowser|MiuiBrowser|SamsungBrowser|EdgA|CriOS|Chrome\/|Firefox\/|Safari\//i.test(ua) || /; wv\)/i.test(ua);
          const ver = (ua.match(/(?:Chrome|CriOS|Firefox|Version)\/(\d+)/) || [])[1] || '';
          return { secure, inFrame, standalone, br: br + (ver ? ' ' + ver : ''), webview, isWx: /MicroMessenger/i.test(ua) };
        };
        const envLines = (state) => {
          const e = envInfo();
          let rows = '';
          rows += '<div class="qf-diag">🌐 网址：' + (e.secure ? 'https ✓ 安全连接' : location.protocol.replace(':', '') + ' ✗ 不是 https，浏览器一律禁止调用摄像头') + '</div>';
          rows += '<div class="qf-diag">📱 浏览器：' + esc(e.br) + (e.inFrame ? ' · 被嵌在别的网页里' : e.standalone ? ' · 桌面图标打开（独立窗口）' : ' · 独立页面打开') + '</div>';
          rows += '<div class="qf-diag">🔐 网站摄像头权限：' + ({ granted: '已允许 ✓', denied: '已拒绝 ✗', prompt: '还没询问过' }[state] || '查不到（这个浏览器不支持查询）') + '　·　错误码：' + (nm || '未知') + '</div>';
          let concl;
          const silentDeny = (state === 'prompt' || !state) && (nm === 'NotAllowedError' || nm === 'SecurityError');
          if (!e.secure) concl = '问题在<b>网址</b>：请用 https:// 开头的地址打开（当前是 ' + location.protocol.replace(':', '') + '）。';
          else if (e.inFrame) concl = '问题在<b>页面被嵌套</b>：请点「复制网址」后在浏览器新标签页里直接打开。';
          else if (e.isWx) concl = '问题在<b>微信内置浏览器</b>：它调不起摄像头。点右上角 ··· → 在浏览器打开。';
          else if (e.standalone) concl = '问题在<b>桌面图标方式</b>：安装到手机桌面的网页窗口拿不到相机授权。点「复制网址」后，回到浏览器粘贴打开同一个网址，就能正常扫码。';
          else if (silentDeny) concl = '没弹授权框就被拒 —— 多半是从<b>手机桌面的图标</b>打开的：这种独立窗口拿不到相机授权（微信和浏览器里都正常）。点「复制网址」，回到浏览器粘贴打开同一个网址，或者点「重试摄像头」再试一次让它弹授权框。';
          else if (state === 'prompt') concl = '浏览器在等你的授权：弹出「使用相机」说明时点<b>允许</b>（有「始终允许」就选它），然后点「重试摄像头」。';
          else if (e.webview) concl = '问题在<b>App 内嵌网页</b>：宿主 App 没给网页摄像头授权。请用系统 Chrome 打开这个网址。';
          else concl = '浏览器把摄像头拦下了：地址栏 🔒 / ⓘ → 摄像头 → 允许，然后点「重试摄像头」。';
          rows += '<div class="qf-diag" style="margin-top:6px">👉 结论：' + concl + '</div>';
          return rows;
        };
        /* 诊断：显示浏览器记录的“本网站”摄像头权限状态，区分系统权限与网站权限 */
        const showDiag = (state) => {
          const el = q('#qsFailD');
          if (!el) return;
          el.innerHTML += envLines(state);
        };
        try {
          if (navigator.permissions && navigator.permissions.query) {
            navigator.permissions.query({ name: 'camera' })
              .then((pst) => showDiag(pst.state))
              .catch(() => showDiag(''));
          } else { setTimeout(() => showDiag(''), 0); }
        } catch (e) { setTimeout(() => showDiag(''), 0); }
        if (nm === 'NotAllowedError' || nm === 'SecurityError') {
          showFail('摄像头被拦住了',
            '手机系统里给浏览器的相机权限已经开着，微信里打开、浏览器里直接打开也都能调起摄像头。<br>' +
            '像现在这样<b>没弹授权框就直接失败</b>，几乎都是从<b>手机桌面的图标</b>进入的 —— 那种独立窗口拿不到相机授权。<br>' +
            '<b>解决：</b>点下方「复制网址」→ 回到浏览器粘贴打开 → 再进「老师 → 数据备份 → 扫码接收」。<br>' +
            '如果这次弹出了「使用相机」授权框：点<b>允许</b>（有「始终允许」就选它），再点「重试摄像头」。');
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
        /* 微信 / 嵌框 / 桌面图标 / 非 https 环境里「重试」基本无效，按钮直接换成「复制网址」 */
        const e2 = envInfo();
        if (!e2.secure || e2.isWx || e2.inFrame || e2.standalone) {
          const rb = q('#qsRetry');
          if (rb) { rb.textContent = '复制网址去浏览器'; rb.onclick = () => q('#qsCopy').click(); }
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
      g.fillText('今天也要和宠物一起变强 ✨', W / 2, 1044);

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
  const TABS_FAMILY = [['home', '宠物', 'home'], ['dex', '图鉴', 'dex'], ['tasks', '任务', 'tasks'], ['shop', '商店', 'shop'], ['log', '记录', 'log']];
  const TABS_CLASS = [['home', '我的', 'home'], ['class', '全班', 'cls'], ['board', '光荣榜', 'board'], ['shop', '商店', 'shop'], ['log', '记录', 'log']];
  /* 学生端极简 Tab：宠物 / 图鉴 / 记录（答题与冒险从首页进） */
  const TABS_STUDENT = [['home', '宠物', 'home'], ['dex', '图鉴', 'dex'], ['log', '记录', 'log']];
  const isStudent = () => !!(P.d && P.d.mode === 'student');

  function renderTabs(active) {
    const set = isClass() ? TABS_CLASS : isStudent() ? TABS_STUDENT : TABS_FAMILY;
    const nav = document.getElementById('tabbar');
    nav.style.gridTemplateColumns = 'repeat(' + set.length + ',1fr)';
    nav.innerHTML = set.map(([k, t, ic]) =>
      '<a href="#/' + k + '" data-tab="' + k + '" class="' + (k === active ? 'on' : '') + '">' +
      '<svg viewBox="0 0 24 24">' + ICONS[ic] + '</svg><span>' + t + '</span></a>').join('');
  }

  const routes = { home: viewHome, dex: viewDex, tasks: viewTasks, shop: viewShop, log: viewLog, class: viewClass, board: viewBoard, compare: viewCompare, lucky: viewLucky, analysis: viewAnalysis };
  const ROUTES_ALL = ['home', 'dex', 'tasks', 'shop', 'log', 'class', 'board', 'compare', 'lucky', 'analysis'];
  function render() {
    if (!P.d) { P.d = P.fresh(); }
    /* 家庭/学生模式极简：不显示班级切换和教师/家长管理入口 */
    document.getElementById('classBtn').style.visibility = isClass() ? 'visible' : 'hidden';
    document.getElementById('parentBtn').style.visibility = isClass() ? 'visible' : 'hidden';
    document.getElementById('parentBtn').textContent = isClass() ? '老师' : '家长';
    /* v3.42 顶栏身份按钮：入口页隐藏，其余按当前身份显示 */
    const _rb = document.getElementById('roleBtn');
    if (_rb) {
      const _rr = ROLE_GET();
      _rb.style.display = (P.d && P.d.kids && P.d.kids.length) ? '' : 'none';
      _rb.textContent = _rr === 'student' ? '🎒' : _rr === 'class' ? '🏫' : '🏠';
      _rb.classList.toggle('on-stu', _rr === 'student');
    }
    /* 学生端只允许 宠物/图鉴/记录/每日答题/冒险，老师家长页面一概不可见 */
    if (isStudent() && ['class', 'board', 'compare', 'tasks', 'shop', 'lucky'].includes((location.hash || '').replace('#/', '').split('?')[0])) {
      location.hash = '#/home';
    }
    /* 老师端不参与学生玩法：答题/闯关/任务/抽奖一律拦回首页（避免老师替学生刷分） */
    const _hk = (location.hash || '').replace('#/', '').split('?')[0];
    if (isClass() && ['daily', 'quest', 'tasks', 'lucky', 'novel'].includes(_hk)) {
      try { history.replaceState(null, '', '#/home'); } catch (e) { location.hash = '#/home'; }
      toast('👩‍🏫 老师端不参与答题闯关 · 请把「学生界面入口」链接发给学生');
    }
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
    if (isStudent() && h === 'analysis') tab = 'home';
    if (h === 'compare') tab = 'class';
    if (h === 'lucky') tab = 'shop';
    renderTabs(tab);
    document.getElementById('tbTitle').textContent = isClass() ? (P.d.cls.name || '伴学宠物') : isStudent() ? '伴学宠物 · 学生' : '伴学宠物 · 家庭';
    const acctBtnEl = document.getElementById('acctBtn');
    if (acctBtnEl && window.BeastAuth) {
      const au = BeastAuth.current();
      acctBtnEl.textContent = au ? au.name.slice(0, 3) : '👤';
    }
    bindKidsRow();
    /* v3.42 学生界面里的回退提示：本机还留着老师档案、且登录的是老师账号时给一键返回 */
    if (isStudent()) {
      try {
        const cd = JSON.parse(localStorage.getItem('beast.v1.class') || 'null');
        const au = window.BeastAuth && BeastAuth.current();
        if (cd && cd.kids && cd.kids.length && (!au || au.role !== 'student')) {
          const tip = document.createElement('div');
          tip.className = 'role-tip';
          tip.innerHTML = '<span>👩‍🏫 当前是<b>学生界面</b> · 老师档案（' +
            esc((cd.cls && cd.cls.name) || '我的班级') + '）已保留</span><button id="rtBack">回老师界面</button>';
          const v = document.getElementById('view');
          v.insertBefore(tip, v.firstChild);
          tip.querySelector('#rtBack').onclick = () => { setRole('class'); hardNav(); };
        }
      } catch (e) {}
    }
    /* 学生端：进页面顺手拉一次班级变动（年级/老师加分），60 秒节流 */
    if (isStudent() && P.d.kids && P.d.kids.length) setTimeout(() => cloudStudentPull(true), 700);
    /* 老师端：老班级首次进入时自动补上云（只做一次，失败不打扰） */
    if (!isStudent() && isClass() && P.d.kids && P.d.kids.length) {
      const c0 = curCls();
      if (c0 && !c0.teacherKey && !cloudTried.has(c0.id)) { cloudTried.add(c0.id); setTimeout(() => cloudInitClass(c0), 900); }
    }
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

  /* v3.23 游戏桥接：games.js 通过它注册路由并复用核心逻辑 */
  /* ================= v3.31 学科宠物 · 饰品系统 ================= */
  /* 五科宠物：只吃本学科的经验，由本学科老师加分喂养
     v3.34 名称/图标/颜色一律以知识图谱（games.js SUBJ）为唯一来源，本表只定顺序与兜底 */
  const SUBJ_FALLBACK = [
    { k: 'math', n: '数学', ic: '➗', c: '#7ecb5f' },
    { k: 'cn',   n: '语文', ic: '🀄', c: '#ff8a65' },
    { k: 'en',   n: '英语', ic: '🔤', c: '#4da3ff' },
    { k: 'sci',  n: '科学', ic: '🔬', c: '#9b7bff' },
    { k: 'eth',  n: '道德与法治', ic: '🌱', c: '#4db6ac' }
  ];
  let SUBJ_LIST = SUBJ_FALLBACK.map((f) => {
    const s = (window.BPGames && BPGames.SUBJ && BPGames.SUBJ[f.k]) || {};
    return { k: f.k, n: s.name || f.n, ic: s.icon || f.ic, c: s.c || f.c };
  });
  const SUBJ_NAME = { mix: '综合' };
  SUBJ_LIST.forEach((s) => (SUBJ_NAME[s.k] = s.n));
  /* 知识图谱（games.js）加载完成后，以图谱 SUBJ 为准刷新学科名称/图标/颜色 */
  function refreshSubjList() {
    if (!(window.BPGames && BPGames.SUBJ)) return;
    SUBJ_FALLBACK.forEach((f, i) => {
      const s = BPGames.SUBJ[f.k] || {};
      SUBJ_LIST[i] = { k: f.k, n: s.name || f.n, ic: s.icon || f.ic, c: s.c || f.c };
      SUBJ_NAME[f.k] = SUBJ_LIST[i].n;
    });
  }
  /* 饰品：slot 决定叠在哪个部位；top/left 是相对宠物框的百分比 */
  const ACCS = {
    crown:  { n: '黄金王冠', slot: 'head', e: '👑', f: 30, top: 4,  l: 50, price: 60, rar: 'SSR' },
    cap:    { n: '棒球帽',   slot: 'head', e: '🧢', f: 28, top: 6,  l: 50, price: 40, rar: 'SR' },
    bow:    { n: '蝴蝶结',   slot: 'head', e: '🎀', f: 20, top: 10, l: 64, price: 30, rar: 'R' },
    star:   { n: '星星光环', slot: 'head', e: '⭐', f: 18, top: -2, l: 36, price: 45, rar: 'SR' },
    flower: { n: '小雏菊',   slot: 'head', e: '🌸', f: 18, top: 8,  l: 68, price: 22, rar: 'N' },
    glasses:{ n: '学霸眼镜', slot: 'face', e: '🕶️', f: 20, top: 30, l: 50, price: 50, rar: 'SR' },
    mask:   { n: '小口罩',   slot: 'face', e: '😷', f: 17, top: 34, l: 50, price: 25, rar: 'N' },
    scarf:  { n: '暖围巾',   slot: 'neck', e: '🧣', f: 22, top: 50, l: 50, price: 35, rar: 'R' },
    bell:   { n: '铃铛项圈', slot: 'neck', e: '🔔', f: 15, top: 52, l: 50, price: 28, rar: 'N' },
    wings:  { n: '天使翅膀', slot: 'back', e: '🪽', f: 34, top: 40, l: 24, price: 80, rar: 'SSR' },
    cape:   { n: '英雄披风', slot: 'back', e: '🧥', f: 30, top: 42, l: 74, price: 70, rar: 'SR' },
    mic:    { n: '小话筒',   slot: 'back', e: '🎤', f: 22, top: 48, l: 76, price: 36, rar: 'R' }
  };
  const ACC_SLOTS = [{ k: 'head', n: '头部' }, { k: 'face', n: '脸部' }, { k: 'neck', n: '颈部' }, { k: 'back', n: '背部' }, { k: 'hand', n: '武器' }];

  /* v3.32: 武器库（Boss/决战掉落，装备到「武器」槽位，战斗协力 & 经验加成） */
  const WEAPONS = {
    w1:  { n: '圣剑·曙光',   e: '⚔️', rar: 'SSR', fx: { hit: .15 }, top: 52, l: 70, f: 32, d: '圣光加持，助战协力概率 +15%' },
    w2:  { n: '晨曦神弓',    e: '🏹', rar: 'SSR', fx: { hit: .10 }, top: 50, l: 72, f: 30, d: '百步穿杨，助战协力概率 +10%' },
    w3:  { n: '秘银长枪',    e: '🔱', rar: 'SR',  fx: { hit: .08 }, top: 54, l: 72, f: 30, d: '助战协力概率 +8%' },
    w4:  { n: '学者法杖',    e: '🪄', rar: 'SR',  fx: { exp: .10 }, top: 52, l: 72, f: 30, d: '智慧涌动，经验获取 +10%' },
    w5:  { n: '雷霆战锤',    e: '🔨', rar: 'SR',  fx: { hit: .06 }, top: 54, l: 70, f: 30, d: '助战协力概率 +6%' },
    w6:  { n: '疾风双刃',    e: '🗡️', rar: 'SR',  fx: { hit: .05 }, top: 54, l: 74, f: 28, d: '助战协力概率 +5%' },
    w7:  { n: '铁木短剑',    e: '🔪', rar: 'R',   fx: { hit: .03 }, top: 56, l: 74, f: 26, d: '助战协力概率 +3%' },
    w8:  { n: '猎风轻弓',    e: '🏹', rar: 'R',   fx: { hit: .03 }, top: 54, l: 74, f: 26, d: '助战协力概率 +3%' },
    w9:  { n: '学徒魔杖',    e: '✨', rar: 'R',   fx: { exp: .04 }, top: 54, l: 76, f: 26, d: '经验获取 +4%' },
    w10: { n: '青铜小盾',    e: '🛡️', rar: 'R',   fx: { hit: .02 }, top: 56, l: 72, f: 28, d: '助战协力概率 +2%' }
  };

  /* v3.32: 稀有度即效果 —— SSR 效果最强，按稀有度给全科经验与战斗协力加成 */
  const RARFX = {
    SSR: { exp: .15, hit: .08, label: '✨ 经验 +15% · 战斗协力 +8%' },
    SR:  { exp: .08, hit: .05, label: '✨ 经验 +8% · 战斗协力 +5%' },
    R:   { exp: .04, hit: .03, label: '✨ 经验 +4% · 战斗协力 +3%' },
    N:   { exp: 0,   hit: 0,   label: '' }
  };
  /* v3.39 稀有度：显式字段优先，老宠按编号推断（与知识图谱 rarOf 同规则） */
  const RARC = { SSR: '#f5b301', SR: '#a855f7', R: '#3b82f6', N: '#9aa3b2' };
  const rarOf = (t) => {
    const c = PETS[t];
    if (c && c.rar) return c.rar;
    const n = parseInt(String(t).replace(/\D/g, ''), 10) || 0;
    if (/^S/.test(t) && n >= 101) return 'SSR';
    if (n >= 81) return 'SR';
    if (n >= 41) return 'R';
    return 'N';
  };
  const rarFx = (t) => RARFX[rarOf(t)] || RARFX.N;
  const rarChip = (r) => '<i class="rar-tag"' + (r === 'SSR' ? ' data-r="SSR"' : '') + ' style="background:' + RARC[r] + '">' + r + '</i>';

  /* ================= v3.32 音效 & 休闲治愈 BGM（Web Audio 实时合成，零音频文件） ================= */
  const SND = {
    ctx: null, master: null, on: true, bgmTimer: null, bar: 0, nextBar: 0,
    CH: [[261.6, 329.6, 392.0], [220.0, 261.6, 329.6], [174.6, 220.0, 261.6], [196.0, 246.9, 293.7]], /* C Am F G */
    PENT: [523.3, 587.3, 659.3, 784.0, 880.0, 1046.5],
    ready() {
      if (!this.ctx) {
        const C = window.AudioContext || window.webkitAudioContext;
        if (!C) return null;
        try { this.ctx = new C(); } catch (e) { return null; }
        this.master = this.ctx.createGain();
        this.master.gain.value = 1;
        this.master.connect(this.ctx.destination);
      }
      if (this.ctx.state === 'suspended') this.ctx.resume();
      return this.ctx;
    },
    tone(f, t, d, type, v, f2) {
      const c = this.ctx; if (!c) return;
      const o = c.createOscillator(), g = c.createGain();
      o.type = type || 'sine';
      o.frequency.setValueAtTime(Math.max(30, f), t);
      if (f2) o.frequency.exponentialRampToValueAtTime(Math.max(30, f2), t + d);
      g.gain.setValueAtTime(0.0001, t);
      g.gain.exponentialRampToValueAtTime(v || 0.1, t + 0.02);
      g.gain.exponentialRampToValueAtTime(0.0001, t + d);
      o.connect(g); g.connect(this.master);
      o.start(t); o.stop(t + d + 0.05);
    },
    noise(t, d, v) {
      const c = this.ctx; if (!c) return;
      const n = Math.floor(c.sampleRate * d);
      const buf = c.createBuffer(1, n, c.sampleRate);
      const ch = buf.getChannelData(0);
      for (let i = 0; i < n; i++) ch[i] = (Math.random() * 2 - 1) * (1 - i / n);
      const src = c.createBufferSource(); src.buffer = buf;
      const g = c.createGain(); g.gain.value = v || 0.06;
      const f = c.createBiquadFilter(); f.type = 'lowpass'; f.frequency.value = 1200;
      src.connect(f); f.connect(g); g.connect(this.master);
      src.start(t);
    },
    play(name) {
      if (!this.on) return;
      const c = this.ready(); if (!c) return;
      const t = c.currentTime + 0.01, S = (a) => this.tone(a[0], t + (a[4] || 0) * 0.001 + (a[5] || 0), a[2], a[3], a[1]);
      switch (name) {
        /* v3.40 音效全面柔和卡通化：sine/triangle 泡泡音，短促软糯不刺耳 */
        case 'right': this.tone(587.3, t, .1, 'sine', .09); this.tone(880, t + .07, .14, 'sine', .07, 932); if (arguments[1]) { this.tone(392, t + .02, .1, 'triangle', .05, 660); } break;
        case 'wrong': this.tone(311, t, .22, 'sine', .07, 233); break;
        case 'hurt': this.tone(440, t, .18, 'sine', .05, 294); this.tone(220, t + .08, .14, 'sine', .03, 180); break;
        case 'boing': this.tone(196, t, .16, 'sine', .06, 392); this.tone(392, t + .1, .12, 'sine', .04, 294); break;
        case 'frag': this.tone(1046.5, t, .09, 'sine', .06); this.tone(1318.5, t + .06, .12, 'sine', .05); break;
        case 'page': this.noise(t, .09, .022); this.tone(760, t + .02, .07, 'sine', .028, 980); break;
        case 'victory': [523.3, 659.3, 784.0, 1046.5].forEach((f, i) => this.tone(f, t + i * .12, .22, 'sine', .11)); this.tone(1318.5, t + .5, .5, 'sine', .09); break;
        case 'lose': [392, 329.6, 261.6].forEach((f, i) => this.tone(f, t + i * .16, .3, 'triangle', .06)); break;
        case 'chest': this.tone(180, t, .1, 'square', .06, 320); this.tone(1046.5, t + .12, .3, 'sine', .1); this.tone(1318.5, t + .2, .35, 'sine', .08); break;
        case 'levelup': [523.3, 587.3, 659.3, 784, 880, 1046.5].forEach((f, i) => this.tone(f, t + i * .06, .15, 'sine', .08)); break;
        case 'drop': [659.3, 830.6, 987.8, 1318.5].forEach((f, i) => this.tone(f, t + i * .07, .2, 'sine', .1)); break;
        case 'dropSSR': [523.3, 659.3, 784, 1046.5, 1318.5, 1568].forEach((f, i) => this.tone(f, t + i * .09, .3, 'sine', .11));
          [2093, 2637].forEach((f, i) => this.tone(f, t + .7 + i * .12, .4, 'sine', .06)); break;
        case 'tap': this.tone(880, t, .05, 'sine', .05); break;
      }
    },
    /* ---- v3.38 BGM：独立总线 + 固定旋律循环，流畅不卡顿 ---- */
    bgmBus() {
      if (this.bgmOut) return this.bgmOut;
      const c = this.ctx;
      const g = c.createGain(); g.gain.value = 1;
      const lp = c.createBiquadFilter(); lp.type = 'lowpass'; lp.frequency.value = 2600; lp.Q.value = .4;
      g.connect(lp); lp.connect(this.master);
      this.bgmOut = g;
      return g;
    },
    pad(f, t, d, v) {
      const c = this.ctx, o = c.createOscillator(), g = c.createGain();
      o.type = 'triangle'; o.frequency.value = f;
      o.detune.value = (Math.random() * 6 - 3);
      g.gain.setValueAtTime(0.0001, t);
      g.gain.linearRampToValueAtTime(v, t + 0.9);
      g.gain.setValueAtTime(v, t + d - 1.1);
      g.gain.linearRampToValueAtTime(0.0001, t + d);
      o.connect(g); g.connect(this.bgmBus());
      o.start(t); o.stop(t + d + 0.1);
    },
    mel(f, t, d, v) {
      const c = this.ctx, o = c.createOscillator(), g = c.createGain();
      o.type = 'sine'; o.frequency.value = f;
      g.gain.setValueAtTime(0.0001, t);
      g.gain.linearRampToValueAtTime(v, t + 0.04);
      g.gain.exponentialRampToValueAtTime(Math.max(0.0002, v * 0.5), t + d * 0.6);
      g.gain.exponentialRampToValueAtTime(0.0001, t + d);
      o.connect(g); g.connect(this.bgmBus());
      o.start(t); o.stop(t + d + 0.1);
    },
    /* C 大调五声（C5 D5 E5 G5 A5 C6），8 小节旋律循环，-1 = 空拍 */
    MEL: [
      [2, -1, 3, -1, 4, -1, 3, -1],
      [2, -1, 1, -1, 2, 3, -1, -1],
      [1, -1, 2, -1, 3, 2, -1, -1],
      [0, -1, 1, 2, 1, -1, 0, -1],
      [5, -1, 4, -1, 3, -1, 4, -1],
      [4, 3, 2, -1, 1, -1, 2, -1],
      [1, 2, 3, -1, 4, -1, 3, 2],
      [2, -1, 1, -1, 0, -1, -1, -1]
    ],
    /* v3.40 战斗旋律：音符更密一点，节奏感强一点，但依旧治愈不紧张 */
    MEL_B: [
      [0, 2, 3, -1, 4, 3, 2, -1],
      [3, 4, 5, -1, 4, -1, 3, 2],
      [2, 3, 4, 3, 2, -1, 1, -1],
      [1, 2, 3, -1, 2, 1, 0, -1],
      [4, -1, 5, 4, 3, -1, 4, -1],
      [3, 4, 3, 2, 1, 2, 3, -1],
      [2, 3, 4, -1, 5, 4, 3, 2],
      [1, 2, 1, -1, 0, -1, -1, -1]
    ],
    SCALE: [523.25, 587.33, 659.25, 783.99, 880.0, 1046.5],
    bgmBar(t) {
      const bar = this.bar % 8;
      const ch = this.CH[bar % 4];
      const battle = this.bgmKind === 'battle';
      /* 柔和铺底和弦（三角波，慢起慢收） */
      ch.forEach((f) => this.pad(f, t, 4.0, battle ? 0.024 : 0.020));
      /* 低音根音：两下，稳住节奏 */
      this.mel(ch[0] / 2, t, 1.7, 0.05);
      this.mel(ch[0] / 2, t + 2.0, 1.7, 0.04);
      /* 旋律：固定乐句，八分音符网格，连贯不跳 */
      const line = (battle ? this.MEL_B : this.MEL)[bar];
      line.forEach((ni, i) => {
        if (ni < 0) return;
        this.mel(this.SCALE[ni], t + i * 0.5, battle ? 0.8 : 0.92, battle ? 0.056 : 0.052);
      });
      /* v3.40 战斗模式：轻柔沙锤点缀（每拍一下，很轻），有冒险感但不吵 */
      if (battle) for (let i = 0; i < 4; i++) this.noise(t + i * 1.0 + 0.5, .07, 0.018);
      this.bar++;
    },
    /* v3.40 BGM 只在战斗中播放：quizRun 开打时 bgmStart('battle')，结束/退出即停 */
    bgmStart(kind) {
      if (!this.on) return;
      const c = this.ready(); if (!c) return;
      this.bgmKind = kind || 'scene';
      if (this.bgmTimer) return;
      this.bar = 0; this.nextBar = c.currentTime + 0.2;
      /* 700ms 轮询 + 每次提前 4.5s 排期，避免定时器抖动造成断音 */
      this.bgmTimer = setInterval(() => {
        if (!this.on) return this.bgmStop();
        if (c.state === 'suspended') return;
        while (this.nextBar < c.currentTime + 4.5) { this.bgmBar(this.nextBar); this.nextBar += 4; }
      }, 700);
    },
    bgmStop() { if (this.bgmTimer) { clearInterval(this.bgmTimer); this.bgmTimer = null; this.bgmKind = null; } },
    toggle() {
      this.on = !this.on;
      try { localStorage.setItem('beast.snd', this.on ? '1' : '0'); } catch (e) {}
      if (!this.on) this.bgmStop();
      return this.on;
    }
  };
  try { SND.on = localStorage.getItem('beast.snd') !== '0'; } catch (e) {}
  /* v3.40 BGM 移除全局常驻：平时安静，进入战斗才开播（quizRun 内控制）。
     首次交互只负责解锁音频上下文（浏览器自动播放策略） */
  (function () {
    const kick = () => { if (SND.ctx) SND.ready(); document.removeEventListener('pointerdown', kick); };
    document.addEventListener('pointerdown', kick, { once: true });
  })();

  /* v3.40 空闲预加载：把宠物立绘悄悄拉进缓存，Boss/宠物掉落弹窗秒开不白屏 */
  (function () {
    const run = () => {
      const keys = Object.keys(PETS);
      let i = 0;
      const step = () => {
        if (i >= keys.length) return;
        /* 每次取 2 张：优先掉落弹窗用的成年期立绘，再补幼年期 */
        for (let n = 0; n < 2 && i < keys.length; n++, i++) {
          const t = keys[i];
          const s2 = new Image(); s2.src = imgFor(t, 2);
          if (n === 0 && i < keys.length) { const s1 = new Image(); s1.src = imgFor(t, 1); }
        }
        setTimeout(step, 350);
      };
      step();
    };
    if (document.readyState === 'complete') setTimeout(run, 2500);
    else window.addEventListener('load', () => setTimeout(run, 2500));
  })();

  /* 补齐字段：老档案也能直接用（学科宠物默认继承主宠物的种类） */
  function ensurePetSys(k) {
    if (!k || !k.pet) return;
    if (!k.subjPets || typeof k.subjPets !== 'object') k.subjPets = {};
    if (!k.subjBank || typeof k.subjBank !== 'object') k.subjBank = {};
    const all = Object.keys(PETS);
    const base = Math.max(0, all.indexOf(k.pet.type));
    /* v3.38: 开局只保留初始一只宠物（数学槽），其余四科靠获得；
       老数据里从未喂养过的赠送宠（Lv.3 且 0 经验）自动回收，养过的保留 */
    SUBJ_LIST.forEach((s, i) => {
      const p = k.subjPets[s.k];
      if (i === 0) {
        if (!p || !p.type || !PETS[p.type]) k.subjPets.math = { type: k.pet.type, exp: 0, lv: 3 };
        return;
      }
      if (p && (!p.type || !PETS[p.type])) { delete k.subjPets[s.k]; return; }
      if (p && p.lv <= 3 && !p.exp) delete k.subjPets[s.k];
    });
    /* v3.40 每科宠物独立装扮：k.wardrobes = { main, en, cn, math, sci, eth } 各一套槽位；
       库存（owned/weapons）仍然全宠物共享。老数据 wardrobe 自动迁移为「主宠物」的一套 */
    if (!k.wardrobe || typeof k.wardrobe !== 'object') k.wardrobe = {};
    if (!k.wardrobes || typeof k.wardrobes !== 'object') k.wardrobes = {};
    if (!k.wardrobes.main || typeof k.wardrobes.main !== 'object') k.wardrobes.main = k.wardrobe;
    k.wardrobe = k.wardrobes.main; /* main 恒与 wardrobe 同一对象，老代码无需改动 */
    if (!Array.isArray(k.owned)) k.owned = ['bow'];
    if (!Array.isArray(k.weapons)) k.weapons = [];
  }
  /* v3.40 取某只宠物的装扮槽位：'main' 或学科 key */
  function wardOf(k, key) {
    ensurePetSys(k);
    if (!key || key === 'main' || !k.wardrobes) return k.wardrobe;
    if (!k.wardrobes[key] || typeof k.wardrobes[key] !== 'object') k.wardrobes[key] = {};
    return k.wardrobes[key];
  }
  function subjPetOf(k, subj) { ensurePetSys(k); return (k.subjPets && k.subjPets[subj]) || null; }

  /* 学科经验：只喂对应学科的宠物；subj 为空 = 全科（班主任综合加分）
     v3.38: 该科还没有宠物时，经验存进「经验银行」，获得宠物时一次性补进 */
  function addSubjExp(k, subj, n) {
    if (!k || !n || n <= 0) return [];
    ensurePetSys(k);
    const list = (subj && subj !== 'mix' && k.subjPets[subj]) ? [subj] : SUBJ_LIST.map((x) => x.k);
    const ups = [];
    list.forEach((sk) => {
      const p = k.subjPets[sk];
      if (!p) {
        if (!k.subjBank) k.subjBank = {};
        k.subjBank[sk] = (k.subjBank[sk] || 0) + Math.round(n);
        return;
      }
      const before = p.lv;
      /* v3.32: 宠物稀有度即效果 —— 稀有度越高，经验获取越快 */
      p.exp += Math.round(n * (1 + (rarFx(p.type).exp || 0)));
      while (p.exp >= expNeed(p.lv) && p.lv < 60) { p.exp -= expNeed(p.lv); p.lv += 1; }
      if (p.lv > before) ups.push({ subj: sk, lv: p.lv });
    });
    P.save();
    return ups;
  }
  /* v3.38 获得学科宠物：随机降临一只，经验银行里的积累一次性注入 */
  const SUBJ_GET_NEED = 30;
  function grantSubjPet(k, subj, cb) {
    ensurePetSys(k);
    if (!SUBJ_LIST.some((x) => x.k === subj) || k.subjPets[subj]) { if (cb) cb(null); return null; }
    const t = (window.BPGames && BPGames.pickPet) ? BPGames.pickPet() : Object.keys(PETS)[Math.floor(Math.random() * Object.keys(PETS).length)];
    const bank = k.subjBank ? (k.subjBank[subj] || 0) : 0;
    const p = k.subjPets[subj] = { type: t, exp: 20 + bank, lv: 3 };
    if (k.subjBank) k.subjBank[subj] = 0;
    while (p.exp >= expNeed(p.lv) && p.lv < 60) { p.exp -= expNeed(p.lv); p.lv += 1; }
    P.save();
    if (cb) cb(p);
    return p;
  }
  /* 空槽位面板：怎么获得这一科的宠物 */
  function subjGetSheet(k, subj) {
    ensurePetSys(k);
    const s = SUBJ_LIST.find((x) => x.k === subj) || SUBJ_LIST[0];
    const bank = (k.subjBank && k.subjBank[s.k]) || 0;
    const canGet = bank >= SUBJ_GET_NEED;
    const body =
      '<div class="sp-hero" style="--c:' + s.c + '"><div class="sp-av sp-av-empty">➕</div>' +
      '<div class="sp-t"><b>还没有' + s.n + '宠物</b><small>完成下面的任意一种方式即可获得</small>' +
      (bank ? '<span class="sp-fx">经验银行已存 ' + bank + ' 点' + s.n + '经验</span>' : '') + '</div></div>' +
      '<div class="sg-ways">' +
      '<div class="sg-way"><i>1️⃣</i><div><b>老师加分</b><small>' + s.n + '老师（或班主任）给你加 ' + s.n + '相关积分，攒满 <b>' + SUBJ_GET_NEED + '</b> 点经验即可直接领取</small></div></div>' +
      '<div class="sg-way"><i>2️⃣</i><div><b>每日答题全勤</b><small>每天 5 个任务全部完成开宝箱时，若还有学科没宠物，必掉一只</small></div></div>' +
      '<div class="sg-way"><i>3️⃣</i><div><b>知识冒险 Boss</b><small>击败章节 Boss / 决战知识魔王，有概率掉落</small></div></div>' +
      '</div>' +
      '<button class="btn' + (canGet ? '' : ' ghost disabled') + '" id="sgGo" style="margin-top:14px;width:100%"' + (canGet ? '' : ' disabled') + '>' +
      (canGet ? '🎉 领取' + s.n + '宠物（' + bank + ' 经验已就绪）' : '还差 ' + (SUBJ_GET_NEED - bank) + ' 点经验可领取') + '</button>';
    openSheet('<div class="sheet-h">' + s.ic + ' 如何获得' + s.n + '宠物</div>' + body, (m, close) => {
      const go = m.querySelector('#sgGo');
      if (go && canGet) go.onclick = () => {
        /* v3.40 修复：领取后立刻关掉面板并刷新，经验银行余额马上归零可见 */
        close();
        grantSubjPet(k, s.k, (p) => {
          if (p) petDropFXShow(p.type, s);
          else { render(); toast('已经有' + s.n + '宠物啦'); }
        });
      };
    });
  }
  function petDropFXShow(type, s) {
    const m = document.createElement('div');
    m.className = 'evo-mask';
    m.innerHTML = '<div class="evo-box drop-box"><i class="drop-rays" style="--rc:#ffb300"></i>' +
      '<div class="big img"><img src="' + imgFor(type, 2) + '" alt=""></div>' +
      '<h2>🎉 ' + (s ? s.n : '') + '宠物降临！</h2>' +
      '<p>' + PETS[type].emoji + ' <b>' + esc(PETS[type].name) + '</b><br>银行里的经验已一次性喂给它</p>' +
      '<button class="btn sm" style="margin-top:14px;background:#ffd76e;color:#5b3a00" id="pdOk">收下啦</button></div>';
    document.body.appendChild(m);
    requestAnimationFrame(() => m.classList.add('in'));
    const close = () => { m.classList.remove('in'); setTimeout(() => { m.remove(); render(); }, 320); };
    m.querySelector('#pdOk').onclick = close;
    m.onclick = (e) => { if (e.target === m) close(); };
  }
  /* 学科宠物平均等级：老师端一眼看出这个孩子哪科宠物养得好 */
  function subjAvgLv(k) {
    ensurePetSys(k);
    const arr = SUBJ_LIST.map((s) => (k.subjPets[s.k] ? k.subjPets[s.k].lv : 0));
    return Math.round(arr.reduce((a, b) => a + b, 0) / arr.length);
  }

  /* 带饰品的宠物形象：opts.size 像素，opts.noAcc 不戴饰品 */
  function petBand(pet, size, wardrobe, noAcc) {
    const w = size || 88;
    if (!pet || !pet.type) return '<span class="pav" style="width:' + w + 'px;height:' + w + 'px"></span>';
    const src = imgFor(pet.type, stageIdxOf(pet.lv || 1));
    let layer = '';
    if (!noAcc && wardrobe) {
      Object.keys(wardrobe).forEach((slot) => {
        const a = ACCS[wardrobe[slot]] || WEAPONS[wardrobe[slot]];
        if (!a) return;
        const sl = a.slot || 'hand';
        layer += '<i class="pav-acc ' + sl + '" style="left:' + a.l + '%;top:' + a.top + '%;font-size:' + Math.max(10, Math.round(w * a.f / 100)) + 'px">' + a.e + '</i>';
      });
    }
    return '<span class="pav" style="width:' + w + 'px;height:' + w + 'px"><img src="' + src + '" alt="">' + layer + '</span>';
  }
  function petAv(k, size) {
    ensurePetSys(k);
    return petBand(k.pet, size, wardOf(k, 'main'));
  }
  function subjPetAv(k, subj, size) {
    const p = subjPetOf(k, subj);
    return petBand(p, size, wardOf(k, subj));
  }

  /* 装扮面板：四个槽位 + 已拥有/可购买
     v3.40 每科宠物独立装扮：顶部可切换给哪只宠物穿，库存全宠物共享 */
  function dressSheet(k, who) {
    ensurePetSys(k);
    let cur = who || 'main';
    openSheet('<div class="sheet-h">🎀 宠物装扮</div><div class="dress-body"></div>', (m) => {
    const petOf = (key) => (key === 'main' ? k.pet : subjPetOf(k, key));
    const render_ = () => {
      const body = m.querySelector('.dress-body');
      const wd = wardOf(k, cur);
      const itemOf = (id) => ACCS[id] || WEAPONS[id];
      const curPet = petOf(cur);
      const sMeta = SUBJ_LIST.find((x) => x.k === cur);
      /* 宠物切换条：主宠物 + 已获得的五科宠物 */
      const whoBtns = ['main'].concat(SUBJ_LIST.map((s) => s.k)).filter((key) => key === 'main' || petOf(key))
        .map((key) => {
          const p = petOf(key);
          const on = key === cur;
          const nm = key === 'main' ? '🏠 主宠物' : (sMeta && sMeta.k === key ? sMeta.ic + ' ' + sMeta.n : key);
          return '<button class="ds-who' + (on ? ' on' : '') + '" data-who="' + key + '">' +
            '<span class="ds-who-av">' + petBand(p, 34, null, true) + '</span><small>' + nm + '</small></button>';
        }).join('');
      const slotHTML = ACC_SLOTS.map((sl) => {
        const c = wd[sl.k] ? itemOf(wd[sl.k]) : null;
        return '<div class="ds-slot"><span class="ds-l">' + sl.n + '</span>' +
          '<span class="ds-v">' + (c ? c.e + ' ' + c.n + '<button class="ds-x" data-off="' + sl.k + '">取下</button>' : '未装扮') + '</span></div>';
      }).join('');
      const owned = k.owned.filter((id) => ACCS[id]);
      const wpns = (k.weapons || []).filter((id) => WEAPONS[id]);
      const shop = Object.keys(ACCS).filter((id) => !k.owned.includes(id));
      body.innerHTML =
        '<div class="ds-who-row">' + whoBtns + '</div>' +
        '<div class="ds-preview">' + petBand(curPet, 120, wd) + '<div class="ds-pt"><b>' +
        (cur === 'main' ? esc(k.pet.name) : (sMeta ? sMeta.ic + ' ' + sMeta.n + '宠物 · ' : '') + esc(curPet ? PETS[curPet.type].name : '')) + '</b>' +
        '<small>' + (cur === 'main' ? 'Lv.' + k.pet.lv + ' · ' : '') + '装扮只属于这一只 · 库存共享</small></div></div>' +
        (cur === 'main' ? '<div class="tiny" style="margin:4px 2px">⚔️ 武器装在主宠物身上才会提供战斗协力加成，其他科宠物穿武器只有外观效果</div>' : '') +
        slotHTML +
        '<div class="section-h" style="margin-top:12px"><h2>我的饰品</h2><span class="sub">' + owned.length + ' 件</span></div>' +
        '<div class="ds-grid">' + (owned.length ? owned.map((id) => {
          const a = ACCS[id];
          const on = wd[a.slot] === id;
          return '<button class="ds-it' + (on ? ' on' : '') + '" data-wear="' + id + '">' +
            '<span class="ds-e">' + a.e + '</span><b>' + a.n + '</b><small>' + (on ? '已穿戴' : '点我戴上') + '</small></button>';
        }).join('') : '<div class="tiny">还没有饰品，去商店看看</div>') + '</div>' +
        '<div class="section-h" style="margin-top:14px"><h2>⚔️ 我的武器</h2><span class="sub">' + wpns.length + ' 件 · Boss 掉落</span></div>' +
        '<div class="ds-grid">' + (wpns.length ? wpns.map((id) => {
          const w = WEAPONS[id];
          const on = wd.hand === id;
          return '<button class="ds-it' + (on ? ' on' : '') + '" data-wp="' + id + '">' +
            '<span class="ds-e">' + w.e + '</span><b>' + w.n + '</b><small>' + (on ? '已装备' : w.d) + '</small></button>';
        }).join('') : '<div class="tiny">还没有武器 · 挑战 Boss 有概率掉落</div>') + '</div>' +
        (shop.length ? '<div class="section-h" style="margin-top:14px"><h2>饰品商店</h2><span class="sub">积分兑换 · 余额 ' + k.points + '</span></div>' +
          '<div class="ds-grid">' + shop.map((id) => {
            const a = ACCS[id];
            return '<button class="ds-it buy" data-buy="' + id + '"><span class="ds-e">' + a.e + '</span><b>' + a.n + '</b>' +
              '<small>' + (k.points >= a.price ? '💰 ' + a.price + ' 分' : '🔒 需要 ' + a.price + ' 分') + '</small></button>';
          }).join('') + '</div>' : '');
      body.querySelectorAll('[data-who]').forEach((b) => (b.onclick = () => { cur = b.dataset.who; SND.play('tap'); render_(); }));
      body.querySelectorAll('[data-wear]').forEach((b) => (b.onclick = () => {
        const id = b.dataset.wear, a = ACCS[id];
        wd[a.slot] = wd[a.slot] === id ? null : id;
        if (!wd[a.slot]) delete wd[a.slot];
        P.save(); render_();
        toast(a.slot === 'head' ? '戴上啦，这只宠物的形象已同步' : '已装扮 · 形象已同步');
        if (typeof render === 'function') render();
      }));
      body.querySelectorAll('[data-wp]').forEach((b) => (b.onclick = () => {
        const id = b.dataset.wp, w = WEAPONS[id];
        wd.hand = wd.hand === id ? null : id;
        if (!wd.hand) delete wd.hand;
        P.save(); render_();
        toast(cur === 'main' && wd.hand ? '⚔️ 已装备「' + w.n + '」，战斗协力更强' : '已收起武器');
        if (typeof render === 'function') render();
      }));
      body.querySelectorAll('[data-off]').forEach((b) => (b.onclick = () => {
        delete wd[b.dataset.off]; P.save(); render_(); render();
      }));
      body.querySelectorAll('[data-buy]').forEach((b) => (b.onclick = () => {
        const id = b.dataset.buy, a = ACCS[id];
        if (k.points < a.price) return toast('积分不够，还差 ' + (a.price - k.points) + ' 分');
        if (!confirm('用 ' + a.price + ' 积分兑换「' + a.n + '」？')) return;
        k.points -= a.price; k.owned.push(id); wd[a.slot] = id;
        addLog(k, '🛍️', '兑换饰品「' + a.n + '」', -a.price);
        P.save(); render_(); render(); toast('🎉 已拥有「' + a.n + '」，自动给当前宠物戴上');
      }));
    };
    render_();
    });
  }

  /* 学科宠物面板：看经验 / 换一只 / 说明来源 */
  function subjPetSheet(k, subj) {
    ensurePetSys(k);
    const s = SUBJ_LIST.find((x) => x.k === subj) || SUBJ_LIST[0];
    const p = k.subjPets[s.k];
    if (!p) return subjGetSheet(k, s.k);
    const need = expNeed(p.lv);
    const own = Object.keys(PETS).filter((t) => k.dex && (k.dex[t + '-baby'] || k.dex[t + '-growth'] || k.dex[t + '-adult'] || k.dex[t + '-ultimate']));
    const pool = own.length ? own : [p.type];
    const body =
      '<div class="sp-hero" style="--c:' + s.c + '"><div class="sp-av">' + subjPetAv(k, s.k, 96) + '</div>' +
      '<div class="sp-t"><b>' + PETS[p.type].name + '</b><small>' + s.ic + ' ' + s.n + '专属宠物 · Lv.' + p.lv + '</small>' +
      '<div class="sp-bar"><i style="width:' + Math.round(p.exp / need * 100) + '%"></i></div>' +
      '<span class="sp-exp">' + p.exp + ' / ' + need + ' 经验</span>' +
      (rarFx(p.type).label ? '<span class="sp-fx">' + rarFx(p.type).label + (PETS[p.type].rar ? ' · ' + PETS[p.type].rar : '') + '</span>' : '') + '</div></div>' +
      '<button class="btn ghost" id="spDressThis" style="margin:10px 0 0;width:100%">🎀 给这只宠物装扮</button>' +
      '<div class="tiny" style="margin:8px 2px">这只宠物只吃<b>' + s.n + '</b>的经验：' + s.n + '老师加分、' + s.n + '知识点通关、每日答题里的' + s.n + '题都会喂它。其他学科的经验不会分给它。</div>' +
      '<div class="section-h" style="margin-top:12px"><h2>换一只' + s.n + '宠物</h2><span class="sub">从已解锁图鉴里选</span></div>' +
      '<div class="sp-grid">' + pool.slice(0, 60).map((t) => {
        const on = t === p.type;
        const lv = Math.max(3, Math.min(12, p.lv));
        return '<button class="sp-it' + (on ? ' on' : '') + '" data-t="' + t + '" style="border-color:' + RARC[rarOf(t)] + '">' + rarChip(rarOf(t)) + petBand({ type: t, lv }, 56, null, true) +
          '<b>' + PETS[t].name + '</b>' + (on ? '<small>当前</small>' : '') + '</button>';
      }).join('') + '</div>';
    openSheet('<div class="sheet-h">' + s.ic + ' ' + s.n + '宠物</div>' + body, (m) => {
      const dr = m.querySelector('#spDressThis');
      if (dr) dr.onclick = () => dressSheet(k, subj);
      m.querySelectorAll('[data-t]').forEach((b) => (b.onclick = () => {
        p.type = b.dataset.t; P.save();
        toast('已换成 ' + PETS[p.type].name + '（等级和经验保留）');
        subjPetSheet(k, subj); render();
      }));
    });
  }

  /* 教师团队：班主任 1 名 + 每科 1 名（班主任可兼某科） */
  /* ================= v3.34 老师科目必选 =================
     建班 / 接管班级时必须选择科目（班主任或某一学科）；
     老数据没填科目的老师不受影响，默认可以看全部学科 */
  function subjPickHTML() {
    return '<div class="subj-chips wc-subj" id="wcSubj">' +
      '<button data-s="head">👩‍🏫 班主任</button>' +
      SUBJ_LIST.map((s) => '<button data-s="' + s.k + '">' + s.ic + ' ' + s.n + '</button>').join('') + '</div>';
  }
  function bindSubjPick(root, cb) {
    root.querySelectorAll('#wcSubj button').forEach((b) => (b.onclick = () => {
      root.querySelectorAll('#wcSubj button').forEach((x) => x.classList.remove('on'));
      b.classList.add('on'); cb(b.dataset.s);
    }));
  }
  /* 把科目落到班级：班主任写 head，学科写 subs；并同步到云端 meta
     keepExisting = 接管场景，云端已有的老师姓名不覆盖 */
  function applyTeacherSubj(subj, tName, cls, keepExisting) {
    if (!cls || !subj) return;
    if (subj === 'head') {
      if (!keepExisting || !cls.head) cls.head = tName || '班主任';
    } else {
      if (!cls.subs || typeof cls.subs !== 'object') cls.subs = {};
      if (!keepExisting || !cls.subs[subj]) cls.subs[subj] = tName || '老师';
    }
    P.d.teacher = { role: subj };
    if (cls.code && window.BEAST_CLOUD && window.BEAST_CLOUD.setMeta) {
      window.BEAST_CLOUD.setMeta(cls.code, { head: cls.head, subs: cls.subs }).catch(() => {});
    }
  }

  function teacherTeamSheet() {
    const c = curCls();
    if (!c) return toast('先建班');
    if (!c.head) c.head = '';
    if (!c.subs || typeof c.subs !== 'object') c.subs = {};
    const roles = [{ k: 'head', n: '班主任' }].concat(SUBJ_LIST.map((s) => ({ k: s.k, n: s.n + '老师' })));
    const body = '<div class="tiny">一个年级一个班只有 1 名班主任；每个学科只有 1 名老师。班主任可以同时兼任某科老师。</div>' +
      '<div class="tt-list">' + roles.map((r) => {
        const val = r.k === 'head' ? (c.head || '') : (c.subs[r.k] || '');
        return '<div class="tt-row"><span class="tt-r">' + r.n + '</span>' +
          '<input class="tt-in" data-r="' + r.k + '" value="' + esc(val) + '" maxlength="10" placeholder="未设置">' +
          '<button class="tt-save" data-save="' + r.k + '">保存</button></div>';
      }).join('') + '</div>' +
      '<div class="tiny" style="margin-top:8px">设置后，用「我的身份」切换到对应身份，加分只会加到该学科的宠物，别的科目老师改不了。</div>';
    openSheet('<div class="sheet-h">👩‍🏫 教师团队</div>' + body, (m) => {
      m.querySelectorAll('[data-save]').forEach((b) => (b.onclick = () => {
        const rk = b.dataset.save;
        const inp = m.querySelector('.tt-in[data-r="' + rk + '"]');
        const v = inp.value.trim();
        if (rk === 'head') c.head = v;
        else {
          /* 同一人不能同时占两个学科（班主任兼任除外） */
          const dup = Object.keys(c.subs).find((x) => x !== rk && c.subs[x] === v && v);
          if (dup) return toast('「' + v + '」已经是' + SUBJ_NAME[dup] + '老师，每科只能有 1 位老师');
          c.subs[rk] = v;
        }
        P.save(); toast('已保存');
        if (c.code && window.BEAST_CLOUD && window.BEAST_CLOUD.setMeta) {
          window.BEAST_CLOUD.setMeta(c.code, { head: c.head, subs: c.subs }).catch(() => {});
        }
      }));
    });
  }

  /* 我的身份：班主任 / 某科老师 */
  function teacherRoleSheet() {
    const c = curCls();
    if (!c) return;
    if (!c.head && !c.subs) { teacherTeamSheet(); return; }
    const cur = P.d.teacher || {};
    const opts = [];
    if (c.head) opts.push({ k: 'head', n: '班主任 · ' + c.head });
    SUBJ_LIST.forEach((s) => { if (c.subs[s.k]) opts.push({ k: s.k, n: s.n + '老师 · ' + c.subs[s.k] }); });
    const body = '<div class="tiny">选择你现在的身份。学科老师的加分只进入该学科宠物，班主任可加全科。</div>' +
      '<div class="tr-list">' + opts.map((o) => {
        const on = (cur.role || 'head') === o.k;
        return '<button class="tr-it' + (on ? ' on' : '') + '" data-r="' + o.k + '">' + o.n + (on ? '<i>当前</i>' : '') + '</button>';
      }).join('') + '</div>' +
      '<div class="btn-row" style="margin-top:12px"><button class="btn ghost" id="trTeam">👩‍🏫 管理教师团队</button></div>';
    openSheet('<div class="sheet-h">🙋 我的身份</div>' + body, (m) => {
      m.querySelectorAll('[data-r]').forEach((b) => (b.onclick = () => {
        P.d.teacher = { role: b.dataset.r };
        P.save();
        toast('身份已切换：' + (b.dataset.r === 'head' ? '班主任' : SUBJ_NAME[b.dataset.r] + '老师'));
        teacherRoleSheet(); render();
      }));
      m.querySelector('#trTeam').onclick = () => teacherTeamSheet();
    });
  }
  /* 当前身份文字 */
  function myRoleLabel() {
    const t = P.d.teacher || {};
    if (!isClass()) return '家长';
    if (!t.role || t.role === 'head') return '班主任';
    return (SUBJ_NAME[t.role] || '学科') + '老师';
  }
  /* 加分学科选择条：班主任可选全科/单科，学科老师锁定本科 */
  function subjChipsHTML(sel, id) {
    const scope = mySubjScope();
    const pool = scope === 'all' ? [{ k: 'all', n: '全科', ic: '🌈' }].concat(SUBJ_LIST) : SUBJ_LIST.filter((s) => s.k === scope);
    return '<div class="subj-chips" id="' + (id || 'shSubj') + '">' + pool.map((x) =>
      '<button data-sub="' + x.k + '"' + (x.k === sel ? ' class="on"' : '') + '>' + (x.ic || '📘') + ' ' + x.n + '</button>').join('') + '</div>';
  }

  /* 当前老师可加分的学科：班主任 = 全科；学科老师 = 本科 */
  function mySubjScope() {
    const t = P.d.teacher || {};
    if (!P.d.classes || !isClass()) return 'all';
    if (!t.role || t.role === 'head') return 'all';
    return SUBJ_LIST.some((s) => s.k === t.role) ? t.role : 'all';
  }

  window.BP = { P, esc, toast, openSheet, $view, render, addExp, grantPoints, addLog,
    kid, todayStr, isClass, petImg, petMeta, imgFor, stageIdxOf, stageOf, expNeed, evoFX, PETS, displayName,
    SUBJ_LIST, SUBJ_NAME, ACCS, ACC_SLOTS, WEAPONS, RARFX, rarFx, rarOf, rarChip, RARC, SND, ensurePetSys, addSubjExp, subjPetOf, petBand, petAv, subjPetAv, wardOf,
    grantSubjPet, petDropFXShow, SUBJ_GET_NEED, subjGetSheet,
    dressSheet, subjPetSheet, subjAvgLv, mySubjScope, teacherTeamSheet, teacherRoleSheet, curCls, isStudent, refreshSubjList };
  window.BPHook = { routes, ROUTES_ALL };

  /* ================= v3.29 账号中心 ================= */
  let lastSnapAt = 0;
  function maybeSnapshot(force) {
    const A = window.BeastAuth;
    if (!A || !A.current()) return;
    if (!force && Date.now() - lastSnapAt < 90000) return;
    lastSnapAt = Date.now();
    A.snapshot().catch(() => {});
  }
  /* 账号面板：账号信息 / 云同步状态 / 切换 / 退出 / 改密 / 删除 */
  function acctSheet() {
    const A = window.BeastAuth;
    if (!A) return;
    const me = A.current();
    const cs = cloudState();
    const rn = (r) => A.ROLE_NAME[r] || r;
    const accRows = A.list().map((u) => {
      const isMe = me && u.id === me.id;
      return '<div class="acc-it' + (isMe ? ' me' : '') + '" data-id="' + u.id + '">' +
        '<span class="acc-av">' + rn(u.role).slice(0, 1) + '</span>' +
        '<div class="acc-nm"><b>' + esc(u.name) + '</b><small>' + rn(u.role) +
        (u.classCode ? ' · 班级 ' + esc(u.classCode) : '') + '</small></div>' +
        (isMe ? '<span class="acc-cur">当前</span>' : '<button class="acc-sw" data-id="' + u.id + '">切换</button>') +
        '</div>';
    }).join('');
    const body =
      (me ?
        '<div class="acc-me"><span class="acc-av big">' + rn(me.role).slice(0, 1) + '</span>' +
        '<div><b>' + esc(me.name) + '</b><small>' + rn(me.role) + '账号 · 创建于 ' + new Date(me.createdAt).toLocaleDateString() +
        (me.classCode ? ' · 班级 ' + esc(me.classCode) : '') + '</small></div></div>' : '') +
      '<div class="acc-sync"><i class="cc-dot ' + (cs.online ? 'on' : '') + '"></i>' +
      (cs.online ? '已连接云端 · 数据自动回传' : '当前离线 · 数据先存本机，联网后自动补传') +
      (cs.pending ? ' · <b style="color:#ff8a00">待回传 ' + cs.pending + ' 条</b>' : '') + '</div>' +
      '<div class="btn-row"><button class="btn ghost" id="accSync">🔄 立即同步</button>' +
      '<button class="btn ghost" id="accPwd">🔑 改密码</button></div>' +
      '<div class="btn-row" style="margin-top:8px"><button class="btn ghost" id="accHelp">📖 操作说明</button>' +
      '<button class="btn ghost" id="accHome">🏠 退出到首页</button></div>' +
      '<div class="section-h"><h2>本机账号</h2><span class="sub">同一台设备可保存多个账号</span></div>' +
      (accRows || '<div class="tiny">暂无其他账号</div>') +
      '<div class="btn-row" style="margin-top:12px">' +
      (me ? '<button class="btn ghost" id="accOut">🚪 退出登录</button>' : '<button class="btn" id="accIn">🔑 登录已有账号</button>') +
      '</div>' +
      (me ? '<button class="w-back" id="accDel" style="margin-top:10px">🗑 删除当前账号（仅本机记录）</button>' : '');
    openSheet('<div class="sheet-h">👤 账号中心</div>' + body, (m, close) => {
      const A2 = window.BeastAuth;
      m.querySelector('#accSync') && (m.querySelector('#accSync').onclick = () => {
        const b = m.querySelector('#accSync');
        b.textContent = '同步中…';
        maybeSnapshot(true);
        const C = window.BEAST_CLOUD;
        (C ? C.flush() : Promise.resolve(0)).then((n) => {
          b.textContent = '🔄 立即同步';
          toast('同步完成' + (n ? '，补发 ' + n + ' 条' : '') + (cloudState().online ? '' : '（仍离线，稍后自动补传）'));
        }).catch(() => { b.textContent = '🔄 立即同步'; toast('云端暂不可达，已存入离线队列'); });
      });
      m.querySelector('#accPwd') && (m.querySelector('#accPwd').onclick = () => {
        if (!me) return toast('先登录账号');
        openSheet('<div class="sheet-h">🔑 修改密码</div>' +
          '<div class="field"><label>当前密码</label><input id="op0" type="password" maxlength="12"></div>' +
          '<div class="field"><label>新密码（4-12 位字母/数字）</label><input id="op1" type="password" maxlength="12"></div>' +
          '<button class="btn" id="opGo" style="margin-top:10px">确认修改</button>', (m2, close2) => {
          m2.querySelector('#opGo').onclick = () => {
            const r = A2.changePwd(me.id, m2.querySelector('#op0').value, m2.querySelector('#op1').value.trim());
            if (r.err === 'bad_pwd') return toast('当前密码不对');
            if (r.err === 'bad_new') return toast('新密码需要 4-12 位字母或数字');
            close2(); close(); toast('✅ 密码已修改');
          };
        });
      });
      m.querySelectorAll('.acc-sw').forEach((b) => (b.onclick = () => {
        if (A2.switchTo(b.dataset.id)) { location.reload(); }
      }));
      m.querySelector('#accHelp') && (m.querySelector('#accHelp').onclick = () => { close(); location.href = 'help.html'; });
      m.querySelector('#accHome') && (m.querySelector('#accHome').onclick = () => {
        if (!confirm('回到入口页重新选身份？本机所有档案与账号都会保留，随时可以再进来。')) return;
        close(); goHome();
      });
      m.querySelector('#accOut') && (m.querySelector('#accOut').onclick = () => {
        if (!confirm('退出后需要「名字+密码」重新登录，本机档案不会删除。确定退出？')) return;
        A2.logout();
        close(); goHome();
      });
      m.querySelector('#accIn') && (m.querySelector('#accIn').onclick = () => { close(); loginSheet(); });
      m.querySelector('#accDel') && (m.querySelector('#accDel').onclick = () => {
        if (!confirm('仅删除本机账号记录，云端备份与班级数据不受影响。确定？')) return;
        A2.remove(me.id);
        location.reload();
      });
    });
  }
  /* 登录已有账号（本机或云端） */
  function loginSheet(prefRole) {
    const A = window.BeastAuth;
    if (!A) return;
    const roles = ['student', 'family', 'class'];
    const savedRole = (() => { try { return localStorage.getItem('beast.role') || 'student'; } catch (e) { return 'student'; } })();
    let role = prefRole || savedRole || 'student';
    const draw = (m) => {
      m.querySelector('.auth-body').innerHTML =
        '<div class="field"><label>身份</label><select id="lgRole">' +
        roles.map((r) => '<option value="' + r + '"' + (r === role ? ' selected' : '') + '>' + A.ROLE_NAME[r] + '</option>').join('') +
        '</select></div>' +
        '<div class="field"><label>名字（注册时用的）</label><input id="lgName" maxlength="12" placeholder="学生昵称 / 家长账号名 / 老师姓名"></div>' +
        '<div class="field"><label>密码</label><input id="lgPwd" type="password" maxlength="12"></div>' +
        '<button class="btn" id="lgGo" style="margin-top:10px">登录</button>' +
        '<div class="tiny" style="margin-top:8px">本机没有这个账号时，会自动连云端找回档案（需要网络）</div>';
      m.querySelector('#lgRole').onchange = (e) => { role = e.target.value; draw(m); };
      m.querySelector('#lgGo').onclick = () => {
        const name = m.querySelector('#lgName').value.trim();
        const pwd = m.querySelector('#lgPwd').value;
        if (!name || !pwd) return;
        const b = m.querySelector('#lgGo');
        b.textContent = '登录中…';
        A.login(role, name, pwd, (r, data, u) => {
          /* 云端找回：用快照重建本机档案 */
          try {
            localStorage.setItem('beast.role', r);
            localStorage.setItem('beast.v1.' + r, JSON.stringify(data));
            if (u && data.kids && data.kids[0]) u.kidId = data.cur || data.kids[0].id;
          } catch (e) {}
        }).then((res) => {
          if (!res.ok) {
            b.textContent = '登录';
            toast(res.err === 'bad_pwd' ? '密码不对' : res.err === 'no_user' ? '没有找到这个账号' : '登录失败，检查网络');
            return;
          }
          location.reload();
        });
      };
    };
    openSheet('<div class="sheet-h">🔑 登录账号</div><div class="auth-body"></div>', (m) => draw(m));
  }

  /* 强制重新加载：只改 hash 的 location.href 不会重载页面（v3.41 退出无反应的根因），
     必须换掉 query 才能真正重新走一遍 boot */
  function hardNav(qs) {
    const url = location.pathname + '?' + (qs ? qs + '&' : '') + '_t=' + Date.now() + '#/home';
    location.replace(url);
  }
  function setRole(r) { try { localStorage.setItem('beast.role', r); } catch (e) {} }
  /* 回入口页：清身份 + 打标记，boot 时不再自动跟随登录账号 */
  function goHome() {
    try { localStorage.setItem('beast.home', '1'); localStorage.removeItem('beast.role'); } catch (e) {}
    hardNav();
  }

  /* 恢复账号会话：把档案绑定到账号（一机多号互不串数据）
     注意：身份以 beast.role 为准。只有还没选身份时才跟随登录账号——
     否则「学生界面预览 / 手动切身份」会被老师账号覆盖回去，永远切不过去 */
  function restoreAccount() {
    const A = window.BeastAuth;
    if (!A || window.__forceHome) return;
    const u = A.current();
    if (!u) return;
    if (!localStorage.getItem('beast.role')) setRole(u.role);
    if (ROLE_GET() !== u.role) return;   /* 临时以另一身份使用这台设备，不做账号绑定 */
    if (u.role === 'student' && P.d && P.d.kids && P.d.kids.length) {
      if (u.kidId && P.d.kids.some((k) => k.id === u.kidId)) P.d.cur = u.kidId;
      else if (P.d.kids[0]) { P.d.cur = P.d.kids[0].id; A.touch({ kidId: P.d.cur }); }
    }
    if (u.role === 'class' && P.d && P.d.classes && P.d.classes.length) {
      if (u.clsId && P.d.classes.some((c) => c.id === u.clsId)) P.d.clsId = u.clsId;
    }
  }

  /* ================= 启动 ================= */
  function boot() {
    /* ① 入口链接先解析：?role=student&code=XXXXXX（老师生成发给学生） */
    try {
      const q = new URLSearchParams(location.search);
      const wr = (q.get('role') || '').toLowerCase();
      if (wr && ['student', 'family', 'class'].indexOf(wr) >= 0) {
        window.__entry = { role: wr, code: (q.get('code') || '').trim().toUpperCase() };
        history.replaceState(null, '', location.pathname + (location.hash || ''));
      }
    } catch (e) {}
    /* ② 「回入口页」标记：清掉身份，且不让登录账号把人自动拉回原界面 */
    try {
      if (localStorage.getItem('beast.home') === '1') {
        localStorage.removeItem('beast.home');
        localStorage.removeItem('beast.role');
        window.__forceHome = true;
      }
    } catch (e) {}
    /* ③ 入口链接优先决定本机当前身份（先定身份，才读得到对应档案） */
    if (window.__entry) {
      window.__entryCode = window.__entry.code || '';
      setRole(window.__entry.role);
    }
    /* ④ 读档案 */
    P.load();
    if (window.__forceHome) P.d = null;
    if (!P.d) { P.d = P.fresh(); }
    restoreAccount();
    if (!window.__forceHome) P.save();   // 迁移结果立即落盘（回入口页时不要写脏数据）
    if (!location.hash) location.replace('#/home');
    window.addEventListener('hashchange', render);
    document.getElementById('parentBtn').onclick = () => {
      if (P.d.admin) parentPanel(); else parentEntry();
    };
    document.getElementById('classBtn').onclick = () => { location.hash = '#/class'; };
    const roleBtn = document.getElementById('roleBtn');
    if (roleBtn) roleBtn.onclick = () => roleSwitchSheet();
    const acctBtn = document.getElementById('acctBtn');
    if (acctBtn) acctBtn.onclick = () => acctSheet();
    /* v3.32 音效/音乐开关 */
    const sndBtn = document.getElementById('sndBtn');
    if (sndBtn) {
      sndBtn.textContent = SND.on ? '🔊' : '🔇';
      sndBtn.onclick = () => { sndBtn.textContent = SND.toggle() ? '🔊' : '🔇'; toast(SND.on ? '🎵 音效已开启（背景音乐会在战斗中响起）' : '🔇 已静音'); };
    }
    /* v3.39 登录后随时可看操作说明 */
    const helpBtn = document.getElementById('helpBtn');
    if (helpBtn) helpBtn.onclick = () => { location.href = 'help.html'; };
    /* 联网后自动回传：网络恢复 / 页面可见 / 每分钟各触发一次 */
    window.addEventListener('online', () => { const C = window.BEAST_CLOUD; if (C) C.flush().catch(() => {}); maybeSnapshot(true); });
    document.addEventListener('visibilitychange', () => { if (!document.hidden) maybeSnapshot(); });
    setInterval(() => { const C = window.BEAST_CLOUD; if (C && C.pending()) C.flush().catch(() => {}); maybeSnapshot(); }, 60000);
    render();
    /* 入口链接已在 ③ 定好身份并渲染完毕（首次则进入学页，班级码已预填），
       这里清掉标记即可，不再弹「是否切换」的框——那个框点了也切不过去 */
    window.__entry = null;
    legacyNotice();
    if ('serviceWorker' in navigator) {
      navigator.serviceWorker.register('sw.js?v=3420', { updateViaCache: 'none' }).catch(() => {});
      let rld = false;
      navigator.serviceWorker.addEventListener('controllerchange', () => {
        if (rld) return; rld = true;
        /* 答题/弹层正在进行时不要打断，只提示，用户打完点一下即可 */
        const busy = document.querySelector('.qz-mask') || document.querySelector('.sheet-mask') || document.querySelector('#quiz');
        if (busy) { if (window.showUpdTip) window.showUpdTip(); return; }
        if (!sessionStorage.getItem('swRld')) { sessionStorage.setItem('swRld', '1'); location.reload(); }
      });
    }
  }
  boot();
})();
