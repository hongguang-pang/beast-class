/* ============================================================
   伴学宠物 v3.23 · 答题游戏包
   游戏一：🎯 每日打卡答题（每天随机 5 种题型，参考闯关原型）
   游戏二：🗺️ 知识冒险闯关（家庭模式：易到难地图 + 复习营地
           + 单元 Boss + 年级最终 Boss + 收集 + 错题校验）
   依赖 app.js 暴露的 window.BP 桥接对象
   ============================================================ */
(function () {
  const BP = window.BP;
  if (!BP) return;
  const { P, esc, toast, openSheet, addExp, grantPoints, addLog, kid, todayStr, isClass,
    petImg, petMeta, imgFor, stageIdxOf, render } = BP;

  /* ================= 题型定义 ================= */
  const QTYPES = {
    letter: { icon: '🔠', name: '字母闯关' },
    pic:    { icon: '🖼️', name: '看图猜词' },
    e2c:    { icon: '🔤', name: '英译中' },
    c2e:    { icon: '💬', name: '中译英' },
    fill:   { icon: '✏️', name: '补全句子' },
    odd:    { icon: '🧩', name: '找不同类' },
    sit:    { icon: '🎭', name: '情景对话' },
    gra:    { icon: '🎩', name: '语法魔法' }
  };

  /* ================= 题库（按年级 · 5 个单元，由易到难） =================
     words: [英文, 中文, emoji]  sents: [英文模板{w}, 中文模板{cn}]  */
  const DB = {
    g1: { name: '一年级', units: [
      { t: '字母 A-E · 开学啦', em: '🔤', letters: 'ABCDE',
        words: [['apple', '苹果', '🍎'], ['ant', '蚂蚁', '🐜'], ['bag', '书包', '🎒'], ['cat', '猫', '🐱'], ['dog', '狗', '🐶'], ['egg', '鸡蛋', '🥚']],
        sents: [['I have a {w}.', '我有一个{cn}。'], ['This is a {w}.', '这是一个{cn}。']] },
      { t: '字母 F-J · 彩色世界', em: '🎨', letters: 'FGHIJ',
        words: [['fish', '鱼', '🐟'], ['fox', '狐狸', '🦊'], ['grape', '葡萄', '🍇'], ['hat', '帽子', '🎩'], ['ice', '冰', '🧊'], ['jet', '喷气机', '✈️']],
        sents: [['I see a {w}.', '我看见{cn}。'], ['The {w} is fun.', '{cn}很有趣。']] },
      { t: '字母 K-O · 动物朋友', em: '🦁', letters: 'KLMNO',
        words: [['kite', '风筝', '🪁'], ['lion', '狮子', '🦁'], ['monkey', '猴子', '🐵'], ['nest', '鸟巢', '🪹'], ['orange', '橙子', '🍊'], ['ox', '公牛', '🐂']],
        sents: [['Look at the {w}!', '看这只{cn}！'], ['I like the {w}.', '我喜欢{cn}。']] },
      { t: '字母 P-T · 农场时光', em: '🚜', letters: 'PQRST',
        words: [['pig', '猪', '🐷'], ['pen', '钢笔', '🖊️'], ['queen', '女王', '👑'], ['sun', '太阳', '☀️'], ['tiger', '老虎', '🐯'], ['train', '小火车', '🚂']],
        sents: [['The {w} is big.', '{cn}很大。'], ['Point to the {w}.', '指向{cn}。']] },
      { t: '字母 U-Z · 说你好', em: '🌈', letters: 'UVWXYZ',
        words: [['umbrella', '雨伞', '☂️'], ['vest', '背心', '🎽'], ['water', '水', '💧'], ['box', '盒子', '📦'], ['yak', '牦牛', '🐃'], ['zoo', '动物园', '🦓']],
        sents: [['Give me the {w}.', '给我{cn}。'], ['Where is the {w}?', '{cn}在哪里？']] }
    ],
      sit: [
        ['早上见到老师，应该说：', ['Good morning!', 'Good night!', 'Goodbye!'], 0],
        ['别人帮了你，要说：', ['Thank you!', 'Sorry!', 'Go away!'], 0],
        ['想说“这是我的书包”，应该说：', ['This is my bag.', 'I am a bag.', 'See you!'], 0],
        ['放学和同学说再见：', ['Goodbye!', 'Good morning!', 'Thank you!'], 0],
        ['想说“我五岁”，应该说：', ['I am five.', 'I have five.', 'Five cats!'], 0]
      ],
      gra: [
        ['字母 Bb 的大写是：', ['B', 'D', 'P'], 0],
        ['下面哪一组大小写配对正确？', ['Aa', 'Ab', 'Bc'], 0],
        ['“cat”的第一个字母是：', ['c', 'b', 'd'], 0],
        ['下面哪个是元音字母？', ['E', 'B', 'T'], 0],
        ['“cat”一共有几个字母？', ['3 个', '4 个', '5 个'], 0]
      ] },
    g2: { name: '二年级', units: [
      { t: '动物园里', em: '🐼',
        words: [['panda', '熊猫', '🐼'], ['bird', '小鸟', '🐦'], ['rabbit', '兔子', '🐰'], ['duck', '鸭子', '🦆'], ['bear', '熊', '🐻'], ['tiger', '老虎', '🐯']],
        sents: [['The {w} is cute.', '{cn}很可爱。'], ['I like the {w}.', '我喜欢{cn}。']] },
      { t: '美味食物', em: '🍰',
        words: [['rice', '米饭', '🍚'], ['noodles', '面条', '🍜'], ['juice', '果汁', '🧃'], ['milk', '牛奶', '🥛'], ['bread', '面包', '🍞'], ['cake', '蛋糕', '🍰']],
        sents: [['I want some {w}.', '我想要一些{cn}。'], ['The {w} is yummy.', '{cn}很好吃。']] },
      { t: '数字一二三', em: '🔢',
        words: [['one', '一', '1️⃣'], ['two', '二', '2️⃣'], ['three', '三', '3️⃣'], ['four', '四', '4️⃣'], ['five', '五', '5️⃣'], ['six', '六', '6️⃣']],
        sents: [['I have {w} books.', '我有{cn}本书。'], ['Number {w}, please!', '请给我{cn}号！']] },
      { t: '我的身体', em: '👂',
        words: [['head', '头', '🧑'], ['eye', '眼睛', '👁️'], ['ear', '耳朵', '👂'], ['nose', '鼻子', '👃'], ['mouth', '嘴巴', '👄'], ['hand', '手', '✋']],
        sents: [['Touch your {w}.', '摸摸你的{cn}。'], ['Clap your {w}!', '拍拍你的{cn}！']] },
      { t: '我的家庭', em: '👨‍👩‍👧',
        words: [['dad', '爸爸', '👨'], ['mum', '妈妈', '👩'], ['grandpa', '爷爷', '👴'], ['grandma', '奶奶', '👵'], ['brother', '哥哥', '👦'], ['sister', '姐姐', '👧']],
        sents: [['This is my {w}.', '这是我的{cn}。'], ['I love my {w}.', '我爱我的{cn}。']] }
    ],
      sit: [
        ['想问“你想要什么”，应该说：', ['What do you want?', 'Who are you?', 'Where is it?'], 0],
        ['别人说 Thank you! 你应该回应：', ['You are welcome.', 'I am fine, thanks.', 'No, I am not.'], 0],
        ['想问“你喜欢熊猫吗”：', ['Do you like pandas?', 'Are you a panda?', 'Where is the panda?'], 0],
        ['想请别人吃蛋糕，说：', ['Have some cake, please.', 'Give me your cake!', 'Cake is bad.'], 0],
        ['想说自己七岁：', ['I am seven years old.', 'I have seven old.', 'Seven am I.'], 0]
      ],
      gra: [
        ['I ___ a pupil.（选词填空）', ['am', 'is', 'are'], 0],
        ['___ you like milk?', ['Do', 'Is', 'Are'], 0],
        ['一只 duck，两只 ___', ['ducks', 'duckes', 'duck'], 0],
        ['How many ___? （两只兔子）', ['rabbits', 'rabbit', 'rabbitz'], 0],
        ['“三个苹果”是：', ['three apples', 'apples three', 'three apple'], 0]
      ] },
    g3: { name: '三年级', units: [
      { t: '我的书包', em: '🎒',
        words: [['book', '书', '📖'], ['pencil', '铅笔', '✏️'], ['ruler', '尺子', '📏'], ['eraser', '橡皮', '🧽'], ['pen', '钢笔', '🖊️'], ['schoolbag', '书包', '🎒']],
        sents: [['This is my {w}.', '这是我的{cn}。'], ['May I borrow your {w}?', '我可以借你的{cn}吗？']] },
      { t: '缤纷颜色', em: '🌈',
        words: [['red', '红色', '🔴'], ['blue', '蓝色', '🔵'], ['yellow', '黄色', '🟡'], ['green', '绿色', '🟢'], ['black', '黑色', '⚫'], ['white', '白色', '⚪']],
        sents: [['The sky is {w}.', '天空是{cn}的。'], ['I like the {w} one.', '我喜欢{cn}的那个。']] },
      { t: '水果乐园', em: '🍉',
        words: [['banana', '香蕉', '🍌'], ['apple', '苹果', '🍎'], ['pear', '梨', '🍐'], ['grape', '葡萄', '🍇'], ['watermelon', '西瓜', '🍉'], ['peach', '桃子', '🍑']],
        sents: [['The {w} is sweet.', '{cn}很甜。'], ['Can I have a {w}?', '我能吃一个{cn}吗？']] },
      { t: '玩具总动员', em: '🤖',
        words: [['ball', '球', '⚽'], ['doll', '娃娃', '🎎'], ['kite', '风筝', '🪁'], ['robot', '机器人', '🤖'], ['car', '小汽车', '🚗'], ['puzzle', '拼图', '🧩']],
        sents: [['Let us play with the {w}.', '我们一起玩{cn}吧。'], ['My {w} is new.', '我的{cn}是新的。']] },
      { t: '天气变变变', em: '☁️',
        words: [['sunny', '晴天', '☀️'], ['rainy', '雨天', '🌧️'], ['windy', '刮风', '🌬️'], ['cloudy', '多云', '☁️'], ['snowy', '雪天', '❄️'], ['hot', '炎热', '🥵']],
        sents: [['It is {w} today.', '今天是{cn}。'], ['On a {w} day, I stay home.', '{cn}的日子里我待在家。']] }
    ],
      sit: [
        ['想借同学的尺子，说：', ['May I use your ruler?', 'Give me ruler now!', 'Ruler, go!'], 0],
        ['别人问 How are you? 回答：', ['I am fine, thank you.', 'I am nine.', 'How do you do it?'], 0],
        ['想问“这是什么？”：', ['What is this?', 'Who is this?', 'How is this?'], 0],
        ['同学帮了你，说：', ['Thank you very much!', 'You are wrong.', 'Me too!'], 0],
        ['想说“该吃午饭了”：', ['It is time for lunch.', 'Lunch is me.', 'I lunch now.'], 0]
      ],
      gra: [
        ['I ___ a student.', ['am', 'is', 'are'], 0],
        ['She ___ my teacher.', ['is', 'am', 'are'], 0],
        ['They ___ my friends.', ['are', 'is', 'am'], 0],
        ['___ is your name? — Lily.', ['What', 'Who', 'Where'], 0],
        ['How many ___ can you see?', ['birds', 'bird', 'a bird'], 0],
        ['This is ___ apple.', ['an', 'a', 'two'], 0]
      ] },
    g4: { name: '四年级', units: [
      { t: '学校课程', em: '📚',
        words: [['Chinese', '语文', '🀄'], ['maths', '数学', '➗'], ['English', '英语', '🔤'], ['music', '音乐', '🎵'], ['art', '美术', '🎨'], ['PE', '体育', '⚽']],
        sents: [['We have {w} today.', '我们今天有{cn}课。'], ['{w} is my favourite.', '{cn}是我最喜欢的。']] },
      { t: '一天时间', em: '⏰',
        words: [['morning', '早晨', '🌅'], ['afternoon', '下午', '🌞'], ['evening', '傍晚', '🌆'], ['night', '夜晚', '🌙'], ['breakfast', '早餐', '🍳'], ['bedtime', '睡觉时间', '🛏️']],
        sents: [['I get up in the {w}.', '我在{cn}起床。'], ['It is {w} now.', '现在是{cn}。']] },
      { t: '我的衣柜', em: '👕',
        words: [['shirt', '衬衫', '👔'], ['skirt', '短裙', '👗'], ['dress', '连衣裙', '👚'], ['pants', '裤子', '👖'], ['shoes', '鞋子', '👟'], ['coat', '外套', '🧥']],
        sents: [['I am wearing a {w}.', '我穿着{cn}。'], ['The {w} is cool.', '这件{cn}很酷。']] },
      { t: '快乐运动', em: '🏃',
        words: [['swim', '游泳', '🏊'], ['jump', '跳跃', '🤸'], ['run', '跑步', '🏃'], ['dance', '跳舞', '💃'], ['sing', '唱歌', '🎤'], ['draw', '画画', '🖍️']],
        sents: [['I can {w} very well.', '我{cn}很棒。'], ['Let us {w} together.', '我们一起{cn}吧。']] },
      { t: '城市地点', em: '🏙️',
        words: [['park', '公园', '🌳'], ['zoo', '动物园', '🦁'], ['hospital', '医院', '🏥'], ['cinema', '电影院', '🎬'], ['library', '图书馆', '📚'], ['shop', '商店', '🏪']],
        sents: [['Let us go to the {w}.', '我们去{cn}吧。'], ['The {w} is near my home.', '{cn}在我家附近。']] }
    ],
      sit: [
        ['想问“现在几点了？”：', ['What time is it?', 'How is the time?', 'Where is the clock?'], 0],
        ['别人说 Let us swim! 你同意就说：', ['Great! Let us go!', 'I am full.', 'It is a book.'], 0],
        ['想问“你最喜欢哪一科？”：', ['What is your favourite subject?', 'What is your name?', 'Do you like me?'], 0],
        ['朋友要去考试，你祝他：', ['Good luck!', 'Bad day!', 'Go away!'], 0],
        ['想问去公园的路：', ['How can I get to the park?', 'Park is good.', 'I am in the park.'], 0]
      ],
      gra: [
        ['There ___ a book on the desk.', ['is', 'are', 'am'], 0],
        ['There ___ two cats here.', ['are', 'is', 'be'], 0],
        ['Can you swim? — Yes, I ___.', ['can', 'am', 'do'], 0],
        ['She ___ to school at seven.', ['goes', 'go', 'going'], 0],
        ['We have English ___ Monday.', ['on', 'in', 'at'], 0],
        ['Is this ___ ruler? — Yes, it is.', ['your', 'you', 'yours'], 0]
      ] },
    g5: { name: '五年级', units: [
      { t: '一天日常', em: '🌅',
        words: [['get up', '起床', '⏰'], ['do homework', '做作业', '📝'], ['watch TV', '看电视', '📺'], ['go to bed', '上床睡觉', '🛏️'], ['brush teeth', '刷牙', '🦷'], ['have class', '上课', '🏫']],
        sents: [['I {w} at six.', '我六点{cn}。'], ['After school, I {w}.', '放学后我{cn}。']] },
      { t: '季节与天气', em: '🍂',
        words: [['spring', '春天', '🌸'], ['summer', '夏天', '☀️'], ['autumn', '秋天', '🍁'], ['winter', '冬天', '❄️'], ['warm', '温暖', '🌤️'], ['cold', '寒冷', '🥶']],
        sents: [['It is warm in {w}.', '{cn}很温暖。'], ['I like {w} best.', '我最喜欢{cn}。']] },
      { t: '兴趣爱好', em: '🎨',
        words: [['reading', '阅读', '📖'], ['painting', '绘画', '🖼️'], ['skating', '滑冰', '⛸️'], ['cycling', '骑行', '🚴'], ['camping', '露营', '⛺'], ['fishing', '钓鱼', '🎣']],
        sents: [['I like {w} very much.', '我非常喜欢{cn}。'], ['{w} makes me happy.', '{cn}让我开心。']] },
      { t: '方位问路', em: '🧭',
        words: [['left', '左边', '⬅️'], ['right', '右边', '➡️'], ['straight', '直走', '⬆️'], ['near', '在附近', '📍'], ['behind', '在后面', '🔙'], ['next to', '在旁边', '↔️']],
        sents: [['Walk {w} for two minutes.', '向{cn}走两分钟。'], ['The bus stop is {w} the school.', '公交站{cn}学校。']] },
      { t: '大展身手', em: '🎯',
        words: [['cook', '做饭', '🍳'], ['play the piano', '弹钢琴', '🎹'], ['do kung fu', '练功夫', '🥋'], ['play basketball', '打篮球', '🏀'], ['play football', '踢足球', '⚽'], ['play the violin', '拉小提琴', '🎻']],
        sents: [['I can {w}.', '我会{cn}。'], ['Can you {w}?', '你会{cn}吗？']] }
    ],
      sit: [
        ['别人给你指路后，应说：', ['Thank you for your help.', 'Never mind.', 'It does not matter.'], 0],
        ['想邀朋友周末骑车：', ['Let us go cycling this weekend!', 'You must ride now!', 'Bike is red.'], 0],
        ['别人夸你钢琴弹得好，说：', ['Thank you!', 'So what?', 'I do not care.'], 0],
        ['想问别人的爱好：', ['What is your hobby?', 'How old are you?', 'Where are you from?'], 0],
        ['想表达“我擅长做饭”：', ['I am good at cooking.', 'I cook good at.', 'Cooking is me.'], 0]
      ],
      gra: [
        ['She ___ TV every day.', ['watches', 'watch', 'watchs'], 0],
        ['He ___ football on Sundays.', ['plays', 'play', 'playing'], 0],
        ['I am good at ___.', ['swimming', 'swim', 'swims'], 0],
        ['Would you like ___ apple?', ['an', 'a', 'some'], 0],
        ['Turn left ___ the corner.', ['at', 'on', 'of'], 0],
        ['There are ___ months in a year.', ['twelve', 'seven', 'ten'], 0]
      ] },
    g6: { name: '六年级', units: [
      { t: '比一比 · 比较级', em: '📏',
        words: [['taller', '更高', '🆙'], ['shorter', '更矮', '⬇️'], ['stronger', '更壮', '💪'], ['faster', '更快', '⚡'], ['older', '更年长', '🎂'], ['bigger', '更大', '🔺']],
        sents: [['I am {w} than you.', '我比你{cn}。'], ['A cheetah runs {w} than a dog.', '猎豹跑得比狗{cn}。']] },
      { t: '昨天的事 · 过去式', em: '📜',
        words: [['went', '去了（go 的过去式）', '🚶'], ['ate', '吃了（eat 的过去式）', '🍽️'], ['saw', '看见了（see 的过去式）', '👀'], ['played', '玩了', '🎮'], ['watched', '看了', '📺'], ['had', '有了（have 的过去式）', '🤲']],
        sents: [['Yesterday I {w} to the park.', '昨天我{cn}公园。'], ['We {w} a film last night.', '我们昨晚{cn}电影。']] },
      { t: '假日活动', em: '🎉',
        words: [['trip', '旅行', '🧳'], ['picnic', '野餐', '🧺'], ['camp', '露营', '🏕️'], ['party', '派对', '🎉'], ['concert', '音乐会', '🎻'], ['hiking', '徒步', '🥾']],
        sents: [['I will join the {w}.', '我将参加{cn}。'], ['The {w} is on Sunday.', '{cn}在周日。']] },
      { t: '节日欢乐', em: '🎊',
        words: [['Spring Festival', '春节', '🧨'], ['Christmas', '圣诞节', '🎄'], ['Mid-Autumn Day', '中秋节', '🥮'], ['Halloween', '万圣节', '🎃'], ["Children's Day", '儿童节', '🎈'], ['birthday', '生日', '🎂']],
        sents: [['{w} is coming!', '{cn}快到了！'], ['I love {w}.', '我爱{cn}。']] },
      { t: '旅行途中', em: '🚄',
        words: [['train', '火车', '🚄'], ['plane', '飞机', '✈️'], ['hotel', '宾馆', '🏨'], ['ticket', '票', '🎫'], ['map', '地图', '🗺️'], ['camera', '相机', '📷']],
        sents: [['The {w} is fast.', '{cn}很快。'], ['Do not forget the {w}.', '别忘记{cn}。']] }
    ],
      sit: [
        ['想说说周末计划，说：', ['I am going to have a picnic.', 'I picnic yesterday.', 'Picnic am I.'], 0],
        ['想说“他比我高”：', ['He is taller than me.', 'He is tall than me.', 'He is tallest me.'], 0],
        ['想说“昨天我去了动物园”：', ['I went to the zoo yesterday.', 'I go to the zoo yesterday.', 'I goed to the zoo.'], 0],
        ['春节的时候会说：', ['Happy New Year!', 'Merry Christmas!', 'Trick or treat!'], 0],
        ['万圣节要糖时说：', ['Trick or treat!', 'Happy birthday!', 'Good morning!'], 0]
      ],
      gra: [
        ['I am ___ than my brother.', ['older', 'old', 'oldest'], 0],
        ['Yesterday she ___ a cake.', ['made', 'makes', 'make'], 0],
        ['Last week we ___ to Beijing.', ['went', 'go', 'goes'], 0],
        ['Did you ___ the film?', ['see', 'saw', 'sawed'], 0],
        ['I ___ go to the library tomorrow.', ['will', 'was', 'did'], 0],
        ['An elephant is ___ than a horse.', ['bigger', 'big', 'biggest'], 0]
      ] }
  };
  const GRADES = Object.keys(DB);

  /* 怪物与 Boss */
  const ENEMIES = ['👾 数据粘怪', '🦇 吵吵蝙蝠', '🐙 墨墨章鱼', '🐺 嚎叫小狼', '🦂 沙沙毒蝎'];
  const BOSSES = ['🍄 蘑菇国王', '🦖 玩具霸王龙', '⛈️ 风暴魔王', '🌋 熔岩巨兽', '🧊 冰霜女皇'];
  const FINAL = '👑 知识魔王';
  const NODE_META = {
    battle: { icon: '⚔️', name: '知识战斗' },
    review: { icon: '🛡️', name: '复习营地' },
    boss:   { icon: '👑', name: '单元 Boss' },
    treasure: { icon: '🎁', name: '宝箱' },
    final:  { icon: '🏰', name: '年级最终 Boss' }
  };

  /* ================= 工具 ================= */
  const rnd = (n) => Math.floor(Math.random() * n);
  const pick = (a) => a[rnd(a.length)];
  function shuffle(a) { const b = a.slice(); for (let i = b.length - 1; i > 0; i--) { const j = rnd(i + 1); [b[i], b[j]] = [b[j], b[i]]; } return b; }
  const gradeOf = (k) => (DB[k.grade] ? k.grade : 'g3');
  const gradeName = (g) => DB[g] ? DB[g].name : '三年级';

  /* ================= 出题器 =================
     返回 {q, opts:[..], a:正确下标, type, u:单元号} */
  function genQ(type, g, u) {
    const G = DB[g], unit = G.units[u];
    const mk = (q, right, wrongs) => {
      const opts = shuffle([right].concat(wrongs));
      return { q, opts, a: opts.indexOf(right), type, u };
    };
    const otherWords = (notU) => {
      const pool = [];
      G.units.forEach((un, i) => { if (i !== notU) un.words.forEach((w) => pool.push(w)); });
      return pool;
    };
    if (type === 'letter' && unit.letters) {
      const v = rnd(3), L = unit.letters;
      if (v === 0) {
        const right = L[rnd(L.length)];
        return mk('哪个是字母 ' + right + ' ？', right, shuffle('ABCDEFGHIJKLMNOPQRSTUVWXYZ'.split('').filter((c) => c !== right && !L.includes(c))).slice(0, 2));
      }
      if (v === 1) {
        const right = L[rnd(L.length)].toLowerCase();
        return mk('字母 ' + right + ' 的大写是：', right.toUpperCase(), shuffle('ABCDEFGHIJKLMNOPQRSTUVWXYZ'.split('').filter((c) => c.toLowerCase() !== right && !L.includes(c))).slice(0, 2));
      }
      const w = pick(unit.words);
      const first = w[0][0].toUpperCase();
      return mk('“' + w[2] + ' ' + w[0] + '”的第一个字母是：', first, shuffle('ABCDEFGHIJKLMNOPQRSTUVWXYZ'.split('').filter((c) => c !== first && !L.includes(c))).slice(0, 2));
    }
    if (type === 'pic') {
      const w = pick(unit.words);
      const ws = shuffle(otherWords(u).map((x) => x[0]).concat(unit.words.map((x) => x[0])).filter((x) => x !== w[0]));
      return mk(w[2] + ' 用英语说是：', w[0], ws.slice(0, 3));
    }
    if (type === 'e2c') {
      const w = pick(unit.words);
      const ws = shuffle(otherWords(u).map((x) => x[1]).concat(unit.words.map((x) => x[1])).filter((x) => x !== w[1]));
      return mk('“' + w[0] + '”的意思是：', w[1], ws.slice(0, 3));
    }
    if (type === 'c2e') {
      const w = pick(unit.words);
      const ws = shuffle(otherWords(u).map((x) => x[0]).concat(unit.words.map((x) => x[0])).filter((x) => x !== w[0]));
      return mk('“' + w[1] + '”的英文是：', w[0], ws.slice(0, 3));
    }
    if (type === 'fill') {
      const s = pick(unit.sents), w = pick(unit.words);
      const en = s[0].replace('{w}', '____');
      const cn = s[1].replace('{cn}', w[1]);
      const ws = shuffle(otherWords(u).map((x) => x[0]).filter((x) => x !== w[0]));
      return mk('补全句子：' + en + '（' + cn + '）', w[0], ws.slice(0, 3));
    }
    if (type === 'odd') {
      const w = pick(unit.words);
      const out = pick(otherWords(u));
      const same = shuffle(unit.words.filter((x) => x[0] !== w[0])).slice(0, 2);
      const opts = shuffle([out[1], same[0][1], same[1][1]]);
      return { q: '找不同类：' + same.concat([out]).map((x) => x[2]).join(' '), opts, a: opts.indexOf(out[1]), type, u };
    }
    if (type === 'sit' || type === 'gra') {
      const pool = G[type];
      const s = pick(pool);
      const right = s[1][s[2]];
      const opts = shuffle(s[1]);
      return { q: s[0], opts, a: opts.indexOf(right), type, u };
    }
    return genQ('e2c', g, u);
  }
  function genSet(type, g, u, n) {
    const out = [], seen = {};
    let guard = 0;
    while (out.length < n && guard++ < 80) {
      const q = genQ(type, g, u);
      const key = q.q + '|' + q.opts[q.a];
      if (seen[key]) continue;
      seen[key] = 1; out.push(q);
    }
    while (out.length < n) out.push(genQ(type, g, u));
    return out;
  }
  /* 地图节点出题：战斗/复习按节点类型 */
  function genNodeQs(node, g) {
    const G = DB[g];
    if (node.t === 'review') {
      const pool = [];
      for (let i = 0; i < node.u; i++) pool.push(i);
      const types = Object.keys(QTYPES).filter((t) => t !== 'letter' || g === 'g1');
      const out = [];
      for (let i = 0; i < 3; i++) out.push(genQ(pick(types), g, pick(pool)));
      return out;
    }
    if (node.t === 'boss') return genSet(pick(Object.keys(QTYPES).filter((t) => t !== 'letter' || g === 'g1')), g, node.u, 5);
    if (node.t === 'final') {
      const types = Object.keys(QTYPES).filter((t) => t !== 'letter' || g === 'g1');
      const out = [];
      for (let i = 0; i < 8; i++) out.push(genQ(pick(types), g, i % G.units.length));
      return out;
    }
    return genSet(pick(Object.keys(QTYPES).filter((t) => t !== 'letter' || g === 'g1')), g, node.u, 3);
  }

  /* ================= 地图生成 ================= */
  function buildMap(g) {
    const G = DB[g], nodes = [];
    G.units.forEach((un, i) => {
      nodes.push({ t: 'battle', u: i });
      if (i > 0) nodes.push({ t: 'review', u: i });
      if (i === 0) nodes.push({ t: 'battle', u: i });
      nodes.push({ t: 'boss', u: i });
      if (i < G.units.length - 1) nodes.push({ t: 'treasure', u: i });
    });
    nodes.push({ t: 'final', u: G.units.length - 1 });
    return nodes.map((n, i) => Object.assign(n, { i, done: false, stars: 0 }));
  }
  function questState(k) {
    const g = gradeOf(k);
    if (!k.quest || k.quest.grade !== g || !Array.isArray(k.quest.nodes)) {
      k.quest = { grade: g, nodes: buildMap(g), cards: [], badges: [], trophy: false, built: todayStr() };
    }
    return k.quest;
  }
  const curIdx = (q) => { for (let i = 0; i < q.nodes.length; i++) if (!q.nodes[i].done) return i; return -1; };
  const wrongOpen = (k) => k.wrongBook.filter((w) => !w.ok);

  /* ================= 答题引擎（全屏覆盖层） =================
     cfg: {qs, enemy:{em,name,hp}, mode:'battle'|'single'|'drill',
           onEnd(result {win, stars, right, total, wrongQs}) } */
  function quizRun(cfg) {
    const k = kid();
    let idx = 0, petHp = 3, eHp = cfg.enemy ? cfg.enemy.hp : 0;
    const wrongQs = [];
    const el = document.createElement('div');
    el.className = 'qz-mask';
    document.body.appendChild(el);
    const petSrc = petImg(k);
    const petName = BP.displayName(k);

    function headHTML() {
      return '<div class="qz-top"><button class="qz-x" id="qzX">✕</button>' +
        '<div class="qz-prog">' + cfg.qs.map((_, i) => '<i class="' + (i < idx ? 'ok' : i === idx ? 'now' : '') + '"></i>').join('') + '</div>' +
        '<div class="qz-hp">' + (cfg.enemy ? '❤️'.repeat(Math.max(0, petHp)) : '') + '</div></div>';
    }
    function render() {
      if (idx >= cfg.qs.length) return finish();
      const q = cfg.qs[idx];
      el.innerHTML =
        '<div class="qz">' + headHTML() +
        (cfg.enemy ?
          '<div class="qz-foe"><div class="foe-card" id="foeCard"><span class="foe-em">' + cfg.enemy.em + '</span>' +
          '<div class="foe-nm">' + esc(cfg.enemy.name) + '</div>' +
          '<div class="foe-hp"><i style="width:' + Math.max(0, eHp / cfg.enemy.hp * 100) + '%"></i></div></div></div>' +
          '<div class="qz-vs"><img class="qz-pet ' + (cfg.mode === 'drill' ? '' : '') + '" id="qzPet" src="' + petSrc + '" alt=""></div>'
          : '<div class="qz-solo"><img class="qz-pet" id="qzPet" src="' + petSrc + '" alt=""><div class="qz-petnm">' + esc(petName) + '</div></div>') +
        '<div class="qz-card"><div class="qz-no">第 ' + (idx + 1) + ' / ' + cfg.qs.length + ' 题</div>' +
        '<div class="qz-qq">' + esc(q.q) + '</div>' +
        '<div class="qz-opts">' + q.opts.map((o, i) => '<button class="qz-opt" data-i="' + i + '">' + esc(o) + '</button>').join('') + '</div>' +
        '<div class="qz-fb" id="qzFb"></div></div>' +
        '</div>';
      el.querySelector('#qzX').onclick = () => { if (confirm('中途退出本题不记录成绩，确定退出？')) { el.remove(); } };
      el.querySelectorAll('.qz-opt').forEach((b) => (b.onclick = () => answer(+b.dataset.i, b)));
    }
    function answer(i, btn) {
      const q = cfg.qs[idx];
      const right = i === q.a;
      el.querySelectorAll('.qz-opt').forEach((b) => (b.disabled = true));
      btn.classList.add(right ? 'good' : 'bad');
      if (!right) {
        el.querySelectorAll('.qz-opt')[q.a].classList.add('good');
        wrongQs.push(q);
        petHp--;
        const pet = el.querySelector('#qzPet');
        if (pet) { pet.classList.add('hurt'); setTimeout(() => pet.classList.remove('hurt'), 500); }
        const fb = el.querySelector('#qzFb');
        fb.innerHTML = '😵 答错了，正确答案是 <b>' + esc(q.opts[q.a]) + '</b>';
        fb.className = 'qz-fb no';
      } else {
        eHp--;
        const pet = el.querySelector('#qzPet');
        if (pet) { pet.classList.add('atk'); setTimeout(() => pet.classList.remove('atk'), 500); }
        const foe = el.querySelector('#foeCard');
        if (foe) { foe.classList.add('hit'); setTimeout(() => foe.classList.remove('hit'), 400); }
        const fb = el.querySelector('#qzFb');
        fb.innerHTML = pick(['🎉 太棒了！', '✨ 答对啦！', '🔥 厉害！', '💫 知识就是力量！']);
        fb.className = 'qz-fb yes';
      }
      el.querySelector('.qz-hp').innerHTML = cfg.enemy ? '❤️'.repeat(Math.max(0, petHp)) : '';
      if (cfg.enemy) {
        const bar = el.querySelector('.foe-hp i');
        if (bar) bar.style.width = Math.max(0, eHp / cfg.enemy.hp * 100) + '%';
      }
      setTimeout(() => {
        if (cfg.enemy && eHp <= 0) return finish();
        if (cfg.enemy && petHp <= 0) return finish();
        idx++; render();
      }, 900);
    }
    function finish() {
      const win = cfg.enemy ? eHp <= 0 : (cfg.mode === 'drill' ? wrongQs.length === 0 : true);
      const total = cfg.qs.length;
      const right = total - wrongQs.length;
      let stars = 0;
      if (win) stars = Math.max(1, 3 - (total - right));
      el.innerHTML = '<div class="qz">' +
        '<div class="qz-end ' + (win ? 'win' : 'lose') + '">' +
        '<div class="qe-em">' + (win ? '🏆' : '💪') + '</div>' +
        '<h2>' + (win ? '战斗胜利！' : '被击退了…') + '</h2>' +
        (win ? '<div class="qe-stars">' + '⭐'.repeat(stars) + '☆'.repeat(3 - stars) + '</div>' : '<p>宠物还需要补给，再来一次一定行！</p>') +
        '<p class="qe-sc">答对 ' + right + ' / ' + total + ' 题</p>' +
        '<div class="qe-btns">' +
        (win ? '<button class="btn" id="qeOk">领取奖励</button>'
             : '<button class="btn" id="qeRe">再战一次</button><button class="btn ghost" id="qeGo">返回</button>') +
        '</div></div></div>';
      const ok = el.querySelector('#qeOk'), re = el.querySelector('#qeRe'), go = el.querySelector('#qeGo');
      if (ok) ok.onclick = () => el.remove();
      if (go) go.onclick = () => el.remove();
      if (re) re.onclick = () => { el.remove(); quizRun(cfg); };
      if (cfg.onEnd) cfg.onEnd({ win, stars, right, total, wrongQs });
    }
    render();
    return el;
  }

  /* ================= 奖励发放 ================= */
  function reward(k, pts, exp, text, em) {
    if (pts) grantPoints(k, pts, text);
    if (exp) addExp(k, exp);
    addLog(k, em || '🎯', text, pts || 0);
  }

  /* ================= 游戏一：每日打卡答题 ================= */
  function dailyState(k) {
    const t = todayStr();
    let d = k.dailyGame;
    if (!d || d.date !== t || d.grade !== k.grade) {
      const old = d || {};
      const pool = Object.keys(QTYPES).filter((x) => x !== 'letter' || k.grade === 'g1');
      const types = shuffle(pool).slice(0, 5);
      d = k.dailyGame = { date: t, grade: k.grade, tasks: types.map((ty) => ({ ty, done: false, stars: 0 })),
        chest: false, streak: old.streak || 0, last: old.last };
    }
    return d;
  }
  function viewDaily() {
    const k = kid(); if (!k) return;
    const d = dailyState(k);
    const doneN = d.tasks.filter((t) => t.done).length;
    const g = gradeOf(k);
    const all = doneN === 5;
    BP.$view.innerHTML = '<div class="page daily-page">' +
      '<div class="daily-hero">' +
      '<img class="dh-pet" src="' + petImg(k) + '" alt="">' +
      '<div class="dh-t"><b>每日打卡答题</b><small>' + gradeName(g) + ' · 连续打卡 <i class="streak">' + (d.streak || 0) + '</i> 天 🔥</small></div>' +
      '<button class="grade-chip" id="dgBtn">🎓 ' + gradeName(g) + '</button></div>' +
      '<div class="daily-bar"><i style="width:' + (doneN / 5 * 100) + '%"></i><span>' + doneN + ' / 5</span></div>' +
      '<div class="daily-tasks">' +
      d.tasks.map((t, i) => {
        const ty = QTYPES[t.ty];
        return '<button class="d-task ' + (t.done ? 'done' : '') + '" data-i="' + i + '">' +
          '<span class="dt-em">' + ty.icon + '</span>' +
          '<div class="dt-t"><b>' + ty.name + '</b><small>' + (t.done ? '已完成 · ' + '⭐'.repeat(t.stars) : '3 道题 · +2 积分 +10 经验') + '</small></div>' +
          '<span class="dt-go">' + (t.done ? '✓' : 'GO') + '</span></button>';
      }).join('') +
      '</div>' +
      (all ? '<button class="chest ' + (d.chest ? 'open' : '') + '" id="chestBtn"><span>🎁</span><div><b>' + (d.chest ? '今日宝箱已领取' : '今日宝箱已就绪！') + '</b><small>' + (d.chest ? '明天再来打卡吧' : '全部完成 · 点击领取 +5 积分 +15 经验') + '</small></div></button>' : '') +
      '<div class="tiny" style="margin-top:14px;text-align:center">题型每天随机刷新 · 完成任务给宠物喂经验</div>' +
      '</div>';

    document.getElementById('dgBtn').onclick = () => pickGradeSheet((g) => {
      if (g === k.grade) return;
      k.grade = g; P.save(); render(); toast('已切换到 ' + gradeName(g));
    });
    document.querySelectorAll('.d-task').forEach((b) => (b.onclick = () => {
      const i = +b.dataset.i, t = d.tasks[i];
      const qs = genSet(t.ty, gradeOf(k), rnd(5), 3);
      quizRun({
        qs, enemy: null,
        onEnd: (r) => {
          if (r.win) {
            t.done = true; t.stars = r.stars;
            reward(k, 2, 10, '完成每日答题「' + QTYPES[t.ty].name + '」', QTYPES[t.ty].icon);
            P.save(); toast('任务完成 +2 积分');
          }
          render();
        }
      });
    }));
    const cb = document.getElementById('chestBtn');
    if (cb && !d.chest) cb.onclick = () => {
      d.chest = true;
      const yst = new Date(Date.now() - 86400000);
      const y = yst.getFullYear() + '-' + String(yst.getMonth() + 1).padStart(2, '0') + '-' + String(yst.getDate()).padStart(2, '0');
      d.streak = (d.last === y || (d.streak || 0) === 0) ? (d.streak || 0) + 1 : 1;
      d.last = d.date;
      reward(k, 5, 15, '完成全部每日答题，打开打卡宝箱', '🎁');
      P.save();
      chestFX('+5 积分 · +15 经验 · 连续打卡 ' + d.streak + ' 天', () => render());
    };
  }
  function chestFX(text, cb) {
    const m = document.createElement('div');
    m.className = 'evo-mask';
    m.innerHTML = '<div class="evo-box"><div class="big img" style="font-size:80px;line-height:1.4">🎁</div>' +
      '<h2>打卡宝箱！</h2><p>' + esc(text) + '</p>' +
      '<button class="btn sm" style="margin-top:14px;background:#ffd76e;color:#5b3a00" id="chOk">收下啦</button></div>';
    for (let i = 0; i < 14; i++) {
      const s = document.createElement('i');
      s.className = 'sparkle';
      s.style.left = (30 + Math.random() * 40) + '%';
      s.style.top = (30 + Math.random() * 30) + '%';
      s.style.animationDelay = (Math.random() * .5) + 's';
      m.querySelector('.evo-box').appendChild(s);
    }
    document.body.appendChild(m);
    requestAnimationFrame(() => m.classList.add('in'));
    const close = () => { m.classList.remove('in'); setTimeout(() => { m.remove(); if (cb) cb(); }, 320); };
    m.querySelector('#chOk').onclick = close;
    m.onclick = (e) => { if (e.target === m) close(); };
  }

  /* ================= 年级选择 ================= */
  function pickGradeSheet(onPick) {
    openSheet('<div class="sheet-h">选择年级</div><div class="tiny">题目和地图会按年级难度生成</div>' +
      '<div class="grade-grid">' + GRADES.map((g) =>
        '<button class="grade-it' + (g === kid().grade ? ' on' : '') + '" data-g="' + g + '">' + DB[g].name + '</button>').join('') + '</div>',
      (m, close) => {
        m.querySelectorAll('.grade-it').forEach((b) => (b.onclick = () => { close(); onPick(b.dataset.g); }));
      });
  }

  /* ================= 游戏二：知识冒险闯关 ================= */
  function viewQuest() {
    const k = kid(); if (!k) return;
    const q = questState(k);
    const g = gradeOf(k);
    const ci = curIdx(q);
    const finalLocked = wrongOpen(k).length > 0;
    BP.$view.innerHTML = '<div class="page quest-page">' +
      '<div class="quest-hero">' +
      '<img class="qh-pet" src="' + petImg(k) + '" alt="">' +
      '<div class="qh-t"><b>' + gradeName(g) + ' · 知识冒险</b><small>' +
      (q.trophy ? '🏆 已通关！可以重刷拿满星' : '进度 ' + q.nodes.filter((n) => n.done).length + '/' + q.nodes.length) + '</small></div>' +
      '<div class="qh-btns"><button id="qColl">🧸 收集</button><button id="qWrong">📕 错题本' + (wrongOpen(k).length ? ' <b class="wr-n">' + wrongOpen(k).length + '</b>' : '') + '</button><button id="qGrade">🎓</button></div></div>' +
      '<div class="qmap">' +
      q.nodes.map((n, i) => {
        const meta = NODE_META[n.t];
        const locked = i > ci || (n.t === 'final' && finalLocked);
        const cur = i === ci && !(n.t === 'final' && finalLocked);
        const G = DB[g];
        const title = n.t === 'final' ? FINAL : n.t === 'boss' ? BOSSES[n.u] : n.t === 'treasure' ? '神秘宝箱' :
          n.t === 'review' ? '复习营地 · ' + G.units[n.u - 1].t : G.units[n.u].t + ' · ' + (n.t === 'battle' ? '战斗' : '');
        let sub = meta.name;
        if (n.t === 'final' && finalLocked && i === ci + 1) sub = '🔒 先去错题本订正错题';
        else if (n.t === 'final' && i === ci + 1) sub = '🎓 挑战年级最强';
        return '<div class="qnode ' + n.t + ' ' + (n.done ? 'done' : '') + (cur ? ' cur' : '') + (locked ? ' lock' : '') + '" data-i="' + i + '">' +
          '<div class="qn-line"></div>' +
          '<div class="qn-ic">' + (n.done ? (n.t === 'treasure' ? '📦' : '✅') : locked ? '🔒' : meta.icon) + '</div>' +
          '<div class="qn-b"><b>' + esc(title) + '</b>' +
          '<small>' + (n.done ? '⭐'.repeat(n.stars) + '☆'.repeat(3 - n.stars) + ' · 已通关' : esc(sub)) + '</small></div>' +
          (cur ? '<span class="qn-go">GO</span>' : '') + '</div>';
      }).join('') +
      '</div></div>';

    document.getElementById('qGrade').onclick = () => pickGradeSheet((gg) => {
      if (gg === k.grade) return;
      const q2 = questState(k);
      const hasProgress = q2.nodes.some((n) => n.done);
      if (hasProgress && !confirm('切换到' + gradeName(gg) + '会重置当前冒险进度（收集保留），确定？')) return;
      k.grade = gg;
      k.quest = { grade: gg, nodes: buildMap(gg), cards: q2.cards, badges: [], trophy: false, built: todayStr() };
      P.save(); render(); toast('新的冒险：' + gradeName(gg));
    });
    document.getElementById('qColl').onclick = () => collSheet(k, q);
    document.getElementById('qWrong').onclick = () => wrongSheet(k, () => render());
    document.querySelectorAll('.qnode').forEach((el) => (el.onclick = () => {
      const i = +el.dataset.i, n = q.nodes[i];
      const myCi = curIdx(q);
      const locked = i > myCi || (n.t === 'final' && wrongOpen(k).length > 0);
      if (locked) {
        if (n.t === 'final' && myCi === -1 && wrongOpen(k).length) return toast('错题本还有 ' + wrongOpen(k).length + ' 道题没订正，先把知识补牢！');
        return;
      }
      if (!curIdxOk(i, q)) return;
      tapNode(k, q, n, () => render());
    }));
  }
  function curIdxOk(i, q) { return i === curIdx(q); }

  function tapNode(k, q, n, refresh) {
    const g = gradeOf(k);
    if (n.t === 'treasure') return openTreasure(k, q, n, refresh);
    const qs = genNodeQs(n, g);
    const enemy = n.t === 'battle' ? (function (s) { return { em: s.split(' ')[0], name: s.split(' ')[1], hp: 3 }; })(ENEMIES[n.u % ENEMIES.length])
      : n.t === 'review' ? { em: '🛡️', name: '复习木桩', hp: 3 }
      : n.t === 'boss' ? (function (s) { return { em: s.split(' ')[0], name: s.split(' ')[1], hp: 5 }; })(BOSSES[n.u])
      : { em: '👑', name: '知识魔王', hp: 8 };
    quizRun({
      qs, enemy,
      onEnd: (r) => {
        if (!r.win) { refresh(); return; }
        n.done = true; n.stars = r.stars;
        /* 错题入本 */
        r.wrongQs.forEach((w) => {
          if (k.wrongBook.length > 40) k.wrongBook.shift();
          k.wrongBook.push({ q: w, g, u: n.u, ok: false, t: Date.now() });
        });
        if (n.t === 'battle') { reward(k, 2, 12, '冒险战斗获胜 · ' + DB[g].units[n.u].t, '⚔️'); }
        if (n.t === 'review') { reward(k, 1, 6, '完成复习营地', '🛡️'); }
        if (n.t === 'boss') {
          if (!q.badges.includes(n.u)) q.badges.push(n.u);
          reward(k, 5, 25, '击败单元 Boss · 获得「' + DB[g].units[n.u].em + '」徽章', '👑');
        }
        if (n.t === 'final') {
          q.trophy = true;
          reward(k, 20, 60, '🏆 击败知识魔王，通关' + gradeName(g) + '冒险！', '🏆');
        }
        P.save(); refresh();
        if (n.t === 'boss' || n.t === 'final') victoryFX(n.t === 'final' ? '🏆 通关啦！' : '👑 Boss 击败！',
          n.t === 'boss' ? '获得「' + DB[g].units[n.u].em + '」单元徽章' : gradeName(g) + '全部知识掌握！',
          () => { if (n.t !== 'final') openTreasure(k, q, { t: 'treasure', u: n.u, done: false, stars: 0, i: -1 }, refresh); });
        else toast('战斗胜利 +' + (n.t === 'review' ? 1 : 2) + ' 积分');
      }
    });
  }

  function openTreasure(k, q, n, refresh) {
    if (n.done) { toast('宝箱已经开过啦'); if (n.i >= 0) { n.done = true; P.save(); refresh(); } return; }
    const owned = q.cards || (q.cards = []);
    const pool = Object.keys(BP.PETS).filter((t) => !owned.includes(t));
    const card = pool.length ? pick(pool) : pick(Object.keys(BP.PETS));
    owned.push(card);
    if (n.i >= 0) { n.done = true; n.stars = 3; }
    P.save();
    const meta = BP.PETS[card];
    const m = document.createElement('div');
    m.className = 'evo-mask';
    m.innerHTML = '<div class="evo-box"><div class="big img"><img src="images/gif/' + card + '-baby.gif" alt=""></div>' +
      '<h2>🧸 收集到宠物卡！</h2><p>' + meta.emoji + ' <b>' + meta.name + '</b><br>已收集 ' + owned.length + ' 张，继续冒险集齐图鉴！</p>' +
      '<button class="btn sm" style="margin-top:14px;background:#ffd76e;color:#5b3a00" id="tcOk">放进图鉴</button></div>';
    for (let i = 0; i < 12; i++) {
      const s = document.createElement('i');
      s.className = 'sparkle';
      s.style.left = (40 + Math.random() * 20) + '%';
      s.style.top = (35 + Math.random() * 25) + '%';
      s.style.animationDelay = (Math.random() * .5) + 's';
      m.querySelector('.evo-box').appendChild(s);
    }
    document.body.appendChild(m);
    requestAnimationFrame(() => m.classList.add('in'));
    const close = () => { m.classList.remove('in'); setTimeout(() => { m.remove(); refresh(); }, 320); };
    m.querySelector('#tcOk').onclick = close;
    m.onclick = (e) => { if (e.target === m) close(); };
  }
  function victoryFX(title, sub, cb) {
    const m = document.createElement('div');
    m.className = 'evo-mask';
    m.innerHTML = '<div class="evo-box"><div class="big img" style="font-size:76px;line-height:1.5">🎉</div>' +
      '<h2>' + esc(title) + '</h2><p>' + esc(sub) + '</p>' +
      '<button class="btn sm" style="margin-top:14px;background:#ffd76e;color:#5b3a00" id="vcOk">继续冒险</button></div>';
    for (let i = 0; i < 14; i++) {
      const s = document.createElement('i');
      s.className = 'sparkle';
      s.style.left = (30 + Math.random() * 40) + '%';
      s.style.top = (30 + Math.random() * 30) + '%';
      s.style.animationDelay = (Math.random() * .5) + 's';
      m.querySelector('.evo-box').appendChild(s);
    }
    document.body.appendChild(m);
    requestAnimationFrame(() => m.classList.add('in'));
    const close = () => { m.classList.remove('in'); setTimeout(() => { m.remove(); if (cb) cb(); }, 320); };
    m.querySelector('#vcOk').onclick = close;
    m.onclick = (e) => { if (e.target === m) close(); };
  }

  /* ================= 错题本 ================= */
  function wrongSheet(k, refresh) {
    const list = wrongOpen(k);
    const doneN = k.wrongBook.length - list.length;
    openSheet('<div class="sheet-h">📕 错题本</div>' +
      '<div class="tiny">答错会自动收进来 · 答对一次即完成订正' + (list.length ? '' : '（已全部订正 🎉）') + '</div>' +
      '<div class="wr-list">' +
      (list.length ? list.slice(0, 20).map((w, i) =>
        '<button class="wr-it" data-i="' + i + '"><span class="wr-em">' + (QTYPES[w.q.type] ? QTYPES[w.q.type].icon : '❓') + '</span>' +
        '<div class="wr-t">' + esc(w.q.q) + '<small>' + esc(w.q.opts[w.q.a]) + '</small></div><span class="wr-go">订正</span></button>').join('')
        : '<div class="card empty" style="margin-top:10px">' + (k.wrongBook.length ? '太棒了，' + doneN + ' 道错题全部订正完成！' : '还没有错题，继续保持！') + '</div>') +
      '</div>',
      (m, close) => {
        m.querySelectorAll('.wr-it').forEach((b) => (b.onclick = () => {
          const w = wrongOpen(k)[+b.dataset.i];
          close();
          quizRun({
            qs: [w.q], enemy: null, mode: 'drill',
            onEnd: (r) => {
              if (r.win) {
                w.ok = true;
                reward(k, 1, 4, '错题订正成功', '📕');
                P.save(); toast('订正成功！+1 积分');
              }
              if (refresh) refresh();
            }
          });
        }));
      });
  }

  /* ================= 收集图鉴 ================= */
  function collSheet(k, q) {
    const g = gradeOf(k), G = DB[g];
    openSheet('<div class="sheet-h">🧸 我的收集</div>' +
      '<div class="tiny">击败单元 Boss 得徽章 · 打开宝箱得宠物卡</div>' +
      '<div class="coll-h">🎖️ 单元徽章（' + (q.badges || []).length + '/' + G.units.length + '）</div>' +
      '<div class="badge-row">' + G.units.map((u, i) =>
        '<div class="badge-it' + ((q.badges || []).includes(i) ? ' on' : '') + '"><span>' + ((q.badges || []).includes(i) ? u.em : '❔') + '</span><small>' + esc(u.t.split(' ')[0].slice(0, 4)) + '</small></div>').join('') +
      (q.trophy ? '<div class="badge-it on big"><span>🏆</span><small>通关</small></div>' : '') + '</div>' +
      '<div class="coll-h">🧸 宠物卡（' + (q.cards || []).length + ' 张）</div>' +
      '<div class="card-grid">' +
      (q.cards || []).map((c) => '<div class="card-it"><img src="images/gif/' + c + '-baby.gif" alt=""><small>' + esc(BP.PETS[c] ? BP.PETS[c].name : c) + '</small></div>').join('') +
      '<div class="card-it unknown"><span>❓</span></div>' +
      '</div>',
      () => {});
  }

  /* ================= 注册路由 ================= */
  const hook = window.BPHook;
  if (hook) {
    hook.routes.daily = viewDaily;
    hook.routes.quest = viewQuest;
    hook.ROUTES_ALL.push('daily', 'quest');
    /* 若打开时 hash 已指向游戏页（首渲染早于本文件注册），补一次渲染 */
    const h = (location.hash || '').replace('#/', '').split('?')[0];
    if (h === 'daily' || h === 'quest') BP.render();
  }
})();
