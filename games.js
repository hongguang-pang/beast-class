/* ============================================================
   伴学宠物 v3.25 · 答题游戏包
   游戏一：🎯 每日打卡答题（每天随机 5 种题型，参考闯关原型）
   游戏二：🗺️ 知识冒险闯关（家庭模式：易到难地图 + 复习营地
           + 单元 Boss + 年级最终 Boss + 收集 + 错题校验）
   依赖 app.js 暴露的 window.BP 桥接对象
   ============================================================ */
(function () {
  const BP = window.BP;
  if (!BP) return;
  const { P, esc, toast, openSheet, addExp, grantPoints, addLog, kid, todayStr, isClass,
    petImg, petMeta, imgFor, stageIdxOf, render, SUBJ_LIST, SUBJ_NAME, ensurePetSys, addSubjExp,
    petBand, petAv, subjPetAv, subjPetOf, dressSheet, subjPetSheet, subjAvgLv, mySubjScope } = BP;

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

  /* ================= v3.25 学科混排 =================
     主课：语文/数学/英语（权重高）  副课：科学/道德与法治（权重低）
     关卡难度 lv0-4 与节点进度挂钩，题目按 lv 出 */
  const SUBJ = {
    en:   { icon: '🔤', name: '英语', c: '#4da3ff', bosses: ['单词巨龙', '句型法师'] },
    cn:   { icon: '🀄', name: '语文', c: '#ff8a65', bosses: ['拼音妖王', '成语守门人'] },
    math: { icon: '➗', name: '数学', c: '#7ecb5f', bosses: ['计算魔王', '算式巨兽'] },
    sci:  { icon: '🔬', name: '科学', c: '#9b7bff', bosses: ['自然谜题兽', '实验怪博士'] },
    eth:  { icon: '🌱', name: '道德与法治', c: '#4db6ac', bosses: ['习惯小卫士', '品德考官'] }
  };
  /* 主课侧重：语数英各 26%，副课合计 22% */
  const SUBJ_W = { en: 26, cn: 26, math: 26, sci: 11, eth: 11 };
  function weightedSubj() {
    let v = Math.random() * 100, acc = 0;
    for (const s in SUBJ_W) { acc += SUBJ_W[s]; if (v < acc) return s; }
    return 'en';
  }
  /* 英语题型难度阶梯：lv 越高解锁越难题型 */
  const EN_TYPS = ['pic', 'e2c', 'c2e', 'fill', 'odd', 'sit', 'gra'];
  function enTypesFor(lv, g) {
    const t = EN_TYPS.slice(0, Math.min(EN_TYPS.length, 3 + lv));
    if (g === 'g1' && lv <= 1) t.unshift('letter');
    return t;
  }

  /* ---------- 语文题库 [题干, 正确, 错1, 错2, lv] ---------- */
  const SUBJ_QB = {
    cn: {
      g1: [
        ['"大"的反义词是：', '小', '高', '长', 0],
        ['"上"的反义词是：', '下', '左', '里', 0],
        ['"日"加一笔可以变成：', '目', '木', '水', 1],
        ['"mā ma"对应的词语是：', '妈妈', '马马', '麻麻', 1],
        ['选量词：一___小鸟', '只', '条', '头', 2],
        ['"东"的反义词是：', '西', '南', '北', 2],
        ['《静夜思》的作者是：', '李白', '杜甫', '白居易', 3],
        ['"床前明月光"的下一句是：', '疑是地上霜', '低头思故乡', '举头望明月', 3],
        ['"春眠不觉晓"的下一句是：', '处处闻啼鸟', '花落知多少', '夜来风雨声', 4],
        ['"山"共有几画？', '3 画', '2 画', '4 画', 4]
      ],
      g2: [
        ['选量词：一___小狗', '只', '座', '把', 0],
        ['"里"的反义词是：', '外', '上', '东', 0],
        ['《咏鹅》的作者是：', '骆宾王', '李白', '孟浩然', 1],
        ['"生日"的"生"可以组词：', '生活', '生肖', '升起', 1],
        ['"欲穷千里目"的下一句是：', '更上一层楼', '黄河入海流', '白日依山尽', 2],
        ['"春天"的"春"可以组词：', '春风', '日春', '春开', 2],
        ['"狐假虎威"中"假"的意思是：', '借', '不真', '假扮', 3],
        ['"高大"的反义词是：', '矮小', '巨大', '长短', 3],
        ['"遥知不是雪，为有暗香来"写的是：', '梅花', '雪花', '梨花', 4],
        ['"种瓜得瓜"的下一句是：', '种豆得豆', '种树得树', '自食其果', 4]
      ],
      g3: [
        ['"称"在"称重"中读：', 'chēng', 'chèng', 'chěng', 0],
        ['"分明"的近义词是：', '清楚', '模糊', '黑暗', 1],
        ['"霜叶红于二月花"出自：', '《山行》', '《夜书所见》', '《望天门山》', 2],
        ['"天门中断楚江开"的"楚江"指：', '长江', '黄河', '淮河', 2],
        ['"画蛇添足"比喻：', '多此一举', '画技高超', '锦上添花', 3],
        ['《夜书所见》的作者是：', '叶绍翁', '苏轼', '杜牧', 3],
        ['"二人同心，___"', '其利断金', '其利断银', '万事如意', 4],
        ['"灯不拨不亮，___"', '理不辩不明', '火不吹不灭', '话不说不明', 4]
      ],
      g4: [
        ['"雄伟"的近义词是：', '宏伟', '渺小', '普通', 0],
        ['《题西林壁》的作者苏轼是___代人：', '宋', '唐', '明', 0],
        ['"横看成岭侧成峰"的下一句是：', '远近高低各不同', '不识庐山真面目', '只缘身在此山中', 1],
        ['"锣鼓喧天"的"喧"意思是：', '声音大', '吵闹打架', '飞起来', 1],
        ['下面是比喻句的是：', '弯弯的月亮像一条小船', '月亮升起来了', '月亮真亮啊', 2],
        ['"博学多通"中"通"的意思是：', '通晓', '通过', '通行', 2],
        ['"精卫填海"里精卫是：', '一只神鸟', '一块石头', '一位渔夫', 3],
        ['"嫦娥应悔偷灵药"的作者是：', '李商隐', '李白', '王维', 3],
        ['"但使龙城飞将在"中"飞将"指：', '李广', '关羽', '岳飞', 4],
        ['"暮色"的"暮"意思是：', '傍晚', '早晨', '深夜', 4]
      ],
      g5: [
        ['"吩咐"的近义词是：', '嘱咐', '训斥', '唠叨', 0],
        ['《白鹭》的作者是：', '郭沫若', '老舍', '巴金', 0],
        ['"太阳揭开了面纱"是___句：', '拟人', '比喻', '夸张', 1],
        ['《示儿》的作者陆游是___代诗人：', '宋', '唐', '清', 1],
        ['"王师北定中原日"的下一句是：', '家祭无忘告乃翁', '但悲不见九州同', '遍插茱萸少一人', 2],
        ['"津津有味"中"津津"形容：', '兴趣浓厚', '汗水直流', '口水流出', 2],
        ['"及时雨"是《水浒传》里___的绰号：', '宋江', '武松', '林冲', 3],
        ['《少年中国说》的作者是：', '梁启超', '鲁迅', '朱自清', 3],
        ['"问君能有几多愁"的下一句是：', '恰似一江春水向东流', '只是朱颜改', '故国不堪回首月明中', 4],
        ['《假如给我三天光明》的作者是：', '海伦·凯勒', '安徒生', '格林兄弟', 4]
      ],
      g6: [
        ['《草原》的作者是：', '老舍', '巴金', '冰心', 0],
        ['"截然不同"的"截"在这里表示：', '界限分明', '切断', '阻拦', 0],
        ['"千里莺啼绿映红"出自：', '《江南春》', '《春日》', '《泊船瓜洲》', 1],
        ['"操千曲而后晓声"的下一句是：', '观千剑而后识器', '读万卷而后知理', '行万里而后明道', 1],
        ['"昔我往矣，杨柳依依"的下一句是：', '今我来思，雨雪霏霏', '路漫漫其修远', '风萧萧兮易水寒', 2],
        ['"五行"不包括下面哪个：', '风', '水', '火', 2],
        ['"弈秋，通国之___弈者也"填：', '善', '好', '会', 3],
        ['《两小儿辩日》中两小儿在争论：', '太阳什么时候离人近', '太阳有多大', '太阳是什么颜色', 3],
        ['"少壮不努力"的下一句是：', '老大徒伤悲', '岁月不待人', '悔恨泪满襟', 4],
        ['"苟利国家生死以"的作者是：', '林则徐', '文天祥', '陆游', 4]
      ]
    },
    /* ---------- 副课题库 [题干, 正确, 错1, 错2, kind, lv] ---------- */
    sub: {
      g1: [
        ['太阳从哪边升起？', '东边', '西边', '南边', 'sci', 0],
        ['植物生长需要：', '阳光和水', '只有土', '只有风', 'sci', 0],
        ['一年有几个季节？', '4 个', '2 个', '6 个', 'sci', 1],
        ['冰融化后会变成：', '水', '气', '石头', 'sci', 2],
        ['上课想发言应该：', '先举手', '直接喊', '站起来就走', 'eth', 0],
        ['红灯亮了应该：', '停下等待', '赶紧跑过去', '绕着走', 'eth', 1]
      ],
      g2: [
        ['月亮自己会发光吗？', '不会，反射太阳光', '会，月亮是灯', '有时会', 'sci', 0],
        ['彩虹一般有几种颜色？', '7 种', '5 种', '10 种', 'sci', 1],
        ['小鱼用什么呼吸？', '鳃', '鼻子', '肺', 'sci', 2],
        ['同学摔倒了你应该：', '扶起他', '笑话他', '装没看见', 'eth', 0],
        ['过马路要走：', '斑马线', '随便走', '车缝里钻', 'eth', 1],
        ['垃圾分类中，果皮属于：', '厨余垃圾', '可回收物', '有害垃圾', 'eth', 2]
      ],
      g3: [
        ['人体最大的器官是：', '皮肤', '心脏', '大脑', 'sci', 1],
        ['标准大气压下水的沸点是：', '100℃', '50℃', '200℃', 'sci', 1],
        ['声音在___中传播最快：', '固体', '液体', '气体', 'sci', 2],
        ['升国旗时应该：', '肃立敬礼', '继续玩耍', '大声聊天', 'eth', 1],
        ['遇到火灾应拨打电话：', '119', '110', '120', 'eth', 2],
        ['地球绕太阳转一圈是：', '一年', '一天', '一月', 'sci', 3]
      ],
      g4: [
        ['植物的光合作用吸收：', '二氧化碳', '氧气', '氮气', 'sci', 1],
        ['力的大小的单位是：', '牛顿', '米', '千克', 'sci', 2],
        ['食物中主要提供能量的是：', '糖类', '维生素', '纤维', 'sci', 3],
        ['乘公交车应该：', '排队先下后上', '抢着上车', '从后门挤', 'eth', 1],
        ['网上陌生人索要照片应：', '拒绝并告诉家长', '发给他', '聊着玩', 'eth', 2],
        ['维生素C 含量最多的是：', '新鲜蔬菜水果', '饼干', '可乐', 'sci', 3]
      ],
      g5: [
        ['地球自转产生：', '昼夜交替', '四季变化', '月相变化', 'sci', 1],
        ['声音不能在___中传播：', '真空', '水', '空气', 'sci', 2],
        ['种子萌发必需条件不包括：', '阳光', '水分', '空气', 'sci', 3],
        ['"诚信"是指：', '说话算数', '什么都答应', '不说真话', 'eth', 1],
        ['看见同学被欺负应该：', '告诉老师家长', '围观起哄', '帮忙欺负', 'eth', 3],
        ['人体需要的能量主要来自：', '食物', '晒太阳', '睡觉', 'sci', 3]
      ],
      g6: [
        ['地球绕太阳公转产生：', '四季变化', '昼夜交替', '潮汐', 'sci', 2],
        ['太阳系中最大的行星是：', '木星', '地球', '土星', 'sci', 2],
        ['光在真空中的速度约：', '30 万公里/秒', '3 万公里/秒', '300 公里/秒', 'sci', 3],
        ['"己所不欲，勿施于人"意思是：', '自己不想要的别强加给人', '自己想要就抢', '别人给就要', 'eth', 2],
        ['下面属于公民基本义务的是：', '依法纳税', '每天锻炼', '必须游泳', 'eth', 3],
        ['生物体的基本单位是：', '细胞', '器官', '组织', 'sci', 4]
      ]
    }
  };

  /* ---------- 数学出题器：按年级 × 难度档 lv0-4 ---------- */
  function numWrongs(r, step) {
    step = step || 1;
    const ok = (x) => { const v = Math.round(x * 1000) / 1000; return v >= 0 && v !== Math.round(r * 1000) / 1000; };
    const cs = [r + step, r - step, r + step * 2, r - step * 2, r + step * 5, r - step * 5].filter(ok);
    const out = [];
    for (const x of cs) { if (out.length >= 2) break; if (out.indexOf(x) < 0) out.push(x); }
    while (out.length < 2) out.push(Math.round((r + step * (3 + out.length)) * 1000) / 1000);
    return out;
  }
  const fmtN = (x) => String(Math.round(x * 100) / 100);
  /* 预置题（分数等无法数值生成的）：[题干, 正确, [错1, 错2]] */
  function presetQ(g, lv, u, table) {
    const s = pick(table);
    const opts = shuffle([s[1]].concat(s[2]));
    return { q: s[0], opts, a: opts.indexOf(s[1]), type: 'math', u };
  }
  function mathQ(g, lv, u) {
    const R = (a, b) => a + rnd(b - a + 1);
    let q, r, step = 1, pre = null;
    if (g === 'g1') {
      if (lv === 0) { const a = R(1, 9), b = R(1, 10 - a); q = a + ' + ' + b + ' = ?'; r = a + b; }
      else if (lv === 1) { const a = R(2, 15), b = R(1, Math.min(9, 20 - a)); q = a + ' + ' + b + ' = ?'; r = a + b; }
      else if (lv === 2) { const a = R(5, 20), b = R(1, a - 1); q = a + ' − ' + b + ' = ?'; r = a - b; }
      else if (lv === 3) { const a = R(2, 12), b = R(1, 8), c = R(1, Math.min(5, a + b - 1)); q = a + ' + ' + b + ' − ' + c + ' = ?'; r = a + b - c; }
      else { const a = R(1, 8) * 10, b = R(1, 8) * 10; q = a + ' + ' + b + ' = ?'; r = a + b; }
    } else if (g === 'g2') {
      if (lv === 0) { const a = R(10, 80), b = R(1, 99 - a); q = a + ' + ' + b + ' = ?'; r = a + b; }
      else if (lv === 1) { const a = R(1, 5), b = R(1, 9); q = a + ' × ' + b + ' = ?'; r = a * b; }
      else if (lv === 2) { const a = R(2, 9), b = R(2, 9); q = a + ' × ' + b + ' = ?'; r = a * b; }
      else if (lv === 3) { const b = R(2, 9), qq = R(2, 9); q = (b * qq) + ' ÷ ' + b + ' = ?'; r = qq; }
      else { const a = R(2, 9), b = R(2, 9), c = R(1, 20); q = a + ' × ' + b + ' + ' + c + ' = ?'; r = a * b + c; }
    } else if (g === 'g3') {
      if (lv === 0) { const a = R(100, 800), b = R(10, 99); q = a + ' + ' + b + ' = ?'; r = a + b; }
      else if (lv === 1) { const a = R(12, 49), b = R(2, 9); q = a + ' × ' + b + ' = ?'; r = a * b; }
      else if (lv === 2) { const b = R(2, 9), qq = R(12, 49); q = (b * qq) + ' ÷ ' + b + ' = ?'; r = qq; }
      else if (lv === 3) { const a = R(2, 9), b = R(2, 9), c = R(2, 9); q = '(' + a + ' + ' + b + ') × ' + c + ' = ?'; r = (a + b) * c; }
      else { const a = R(1, 8), b = R(1, 10 - a); q = a + '/10 + ' + b + '/10 = ?（填分子）'; r = a + b; }
    } else if (g === 'g4') {
      if (lv === 0) { const a = R(1000, 5000), b = R(100, 999); q = a + ' + ' + b + ' = ?'; r = a + b; }
      else if (lv === 1) { const a = R(12, 29), b = R(11, 19); q = a + ' × ' + b + ' = ?'; r = a * b; }
      else if (lv === 2) { const b = R(11, 29), qq = R(5, 20); q = (b * qq) + ' ÷ ' + b + ' = ?'; r = qq; }
      else if (lv === 3) { const a = R(2, 9), b = R(2, 9), c = R(2, 9), d = R(2, 9); q = a + ' × ' + b + ' + ' + c + ' × ' + d + ' = ?'; r = a * b + c * d; }
      else { const a = R(2, 9); q = a + ' × 25 × 4 = ?（用简便算法）'; r = a * 100; }
    } else if (g === 'g5') {
      if (lv === 0) { const a = R(1, 20) + R(1, 9) / 10, b = R(1, 20) + R(1, 9) / 10; q = fmtN(a) + ' + ' + fmtN(b) + ' = ?'; r = Math.round((a + b) * 10) / 10; step = 0.1; }
      else if (lv === 1) { const a = R(5, 30) / 10, b = R(2, 5); q = fmtN(a) + ' × ' + b + ' = ?'; r = Math.round(a * b * 10) / 10; step = 0.1; }
      else if (lv === 2) { return presetQ(g, lv, u, [['3.6 ÷ 0.9 = ?', '4', ['0.4', '40']], ['4.8 ÷ 1.2 = ?', '4', ['0.4', '3.6']], ['6.3 ÷ 0.9 = ?', '7', ['0.7', '63']], ['5.6 ÷ 0.8 = ?', '7', ['0.7', '4.8']], ['7.2 ÷ 0.8 = ?', '9', ['0.9', '8']]]); }
      else if (lv === 3) { const v = rnd(2); if (v === 0) { const b = R(2, 9), x = R(2, 20); q = 'x + ' + b + ' = ' + (x + b) + '，x = ?'; r = x; } else { const b = R(2, 9), x = R(2, 9); q = 'x × ' + b + ' = ' + (x * b) + '，x = ?'; r = x; } }
      else { return presetQ(g, lv, u, [['1/2 + 1/4 = ?', '3/4', ['2/6', '1/6']], ['1/2 + 1/3 = ?', '5/6', ['2/5', '1/5']], ['1/3 + 1/6 = ?', '1/2', ['1/3', '2/9']], ['1/4 + 1/8 = ?', '3/8', ['1/6', '2/8']], ['2/5 + 1/5 = ?', '3/5', ['3/10', '2/5']]]); }
    } else {
      if (lv === 0) { return presetQ(g, lv, u, [['1/2 × 1/2 = ?', '1/4', ['1/2', '2/4']], ['1/3 × 1/2 = ?', '1/6', ['1/5', '2/3']], ['2/3 × 1/2 = ?', '1/3', ['2/6', '2/3']], ['1/4 × 1/2 = ?', '1/8', ['1/4', '2/8']], ['3/4 × 2/3 = ?', '1/2', ['5/6', '3/2']]]); }
      else if (lv === 1) { return presetQ(g, lv, u, [['1/2 ÷ 1/4 = ?', '2', ['1/8', '8']], ['1/3 ÷ 1/6 = ?', '2', ['1/9', '3']], ['3/4 ÷ 1/4 = ?', '3', ['1/3', '4']], ['1/2 ÷ 1/8 = ?', '4', ['1/10', '16']], ['5/6 ÷ 1/6 = ?', '5', ['1/6', '6']]]); }
      else if (lv === 2) { const a = R(1, 9) * 10, b = R(2, 9) * 10; q = b + ' 的 ' + a + '% = ?'; r = b * a / 100; }
      else if (lv === 3) { const a = R(2, 6), b = R(2, 6), c = a * R(2, 5); q = a + ' : ' + b + ' = ' + c + ' : ?'; r = b * c / a; }
      else { const p = R(2, 9) * 50; q = '原价 ' + p + ' 元的商品打八折，现价多少元？'; r = p * 0.8; step = 5; }
    }
    const ws = numWrongs(r, step);
    const opts = shuffle([fmtN(r)].concat(ws.map(fmtN)));
    return { q, opts, a: opts.indexOf(fmtN(r)), type: 'math', u };
  }

  /* ---------- 按学科出一题 ---------- */
  function bankQ(arr, lv, u, type) {
    let pool = arr.filter((x) => Math.abs(x[4] - lv) <= 1);
    if (!pool.length) pool = arr;
    const s = pick(pool);
    const opts = shuffle([s[1], s[2], s[3]]);
    return { q: s[0], opts, a: opts.indexOf(s[1]), type, u };
  }
  /* ================= v3.45 大图谱题库出题（无损全量） =================
     题目全部来自 cn-math-taxonomy 大图谱（window.BIG_BANK，13679 题，答案 100% 正确）。
     v3.45 修复：旧版只取前 3 个选项、把第 4 项（常为正确答案）砍掉，导致约 24% 题目答案错误；
     现在保留全部选项、用 o[a] 精确定位答案；填空/简答题自动生成干扰项转成选择题，答案仍为原文。 */
  const BIG_BANK = (typeof window !== 'undefined') ? window.BIG_BANK : null;
  let _bbUsed = {};  /* 大图谱题按「题干」跨全学科去重，避免一局重复 */
  function resetBigBankUsed() { _bbUsed = {}; }
  /* 为填空/简答题生成干扰选项：优先同学科同知识点的其它答案，其次数值扰动 */
  function distractors(x, all) {
    const right = String(x.ans == null ? '' : x.ans).trim();
    const out = [];
    const sameKn = (all || []).filter((y) => y !== x && y.k === x.k && y.ans != null);
    const pool = sameKn.length >= 2 ? sameKn : (all || []).filter((y) => y !== x && y.ans != null);
    for (let i = 0; i < pool.length && out.length < 3; i++) {
      const v = String(pool[i].ans).trim();
      if (v && v !== right && out.indexOf(v) < 0) out.push(v);
    }
    /* 数值答案：补数值扰动干扰项 */
    if (out.length < 2 && /^-?\d+(\.\d+)?$/.test(right)) {
      const n = Number(right), step = Math.abs(n) >= 10 ? Math.max(1, Math.round(Math.abs(n) * 0.1)) : 1;
      [n + step, n - step, n + step * 2].forEach((v) => {
        if (v >= 0 && String(v) !== right && out.indexOf(String(v)) < 0 && out.length < 3) out.push(String(v));
      });
    }
    while (out.length < 3) out.push(['以上都不对', '不确定', '再想想'][out.length] || '其他答案');
    return out;
  }
  function bigBankQ(subj, g, lv, kn, u) {
    /* v5.1 分片版：出题时按需同步加载对应年级题库（首屏不再下载 4.2MB 全量） */
    if (window.BB_API) window.BB_API.load(g);
    if (!BIG_BANK || !BIG_BANK[g] || !BIG_BANK[g][subj]) return null;
    const all = BIG_BANK[g][subj];
    if (!all.length) return null;
    /* 难度映射：游戏 lv(0-4) -> 题库 l(0-3) */
    const bl = Math.min(3, Math.max(0, lv == null ? 1 : lv));
    let pool = all.filter((x) => Math.abs((x.l || 0) - bl) <= 1);
    if (!pool.length) pool = all;
    /* 知识点匹配：精确 → 去「单词·/句型·」前缀 → 包含，优先出对应知识点的题 */
    if (kn) {
      const clean = String(kn).replace(/^(单词|句型)\s*·\s*/, '');
      let byKn = pool.filter((x) => x.k === kn);
      if (!byKn.length) byKn = pool.filter((x) => x.k === clean);
      if (!byKn.length) byKn = pool.filter((x) => x.k && clean && (x.k.indexOf(clean) >= 0 || clean.indexOf(x.k) >= 0));
      if (byKn.length) pool = byKn;
    }
    /* v3.45 复习穿插：无指定知识点时，30% 概率定向出「错得多」的旧知识点（SRS：错的多复习勤） */
    if (!kn && Math.random() < 0.3) {
      try {
        const kk = (typeof kid === 'function') ? kid() : null;
        const mast = kk && kk.mastery ? kk.mastery : {};
        const weak = Object.keys(mast).filter((key) => (mast[key].w || 0) > (mast[key].r || 0))
          .map((key) => ({ name: key.split('|')[2], score: (mast[key].w || 0) - (mast[key].r || 0) }))
          .sort((a, b) => b.score - a.score);
        if (weak.length) {
          const reviewPool = pool.filter((x) => weak.some((w) => w.name && x.k === w.name));
          if (reviewPool.length) pool = reviewPool;
        }
      } catch (e) { /* 掌握度数据异常则忽略，正常出题 */ }
    }
    /* 未用过的优先，避免同局重复 */
    let fresh = pool.filter((x) => !_bbUsed[x.q]);
    if (!fresh.length) fresh = pool;  /* 该知识点题取尽则允许复用 */
    const pickPool = fresh.length ? fresh : pool;
    const x = pickPool[rnd(pickPool.length)];
    _bbUsed[x.q] = 1;
    /* 正确选项原文：choice 用 o[a]，fill/short 用 ans（无损） */
    const rightText = (x.t === 'choice' && x.o && x.o.length) ? String(x.o[x.a]) : String(x.ans == null ? '' : x.ans);
    let texts;
    if (x.t === 'choice' && x.o && x.o.length >= 2) {
      texts = x.o.slice();                       /* 保留全部 2-4 个选项，绝不再砍 */
    } else {
      texts = [rightText].concat(distractors(x, all).slice(0, 3));
    }
    const opts = shuffle(texts);
    return { q: x.q, opts, a: opts.indexOf(rightText) < 0 ? 0 : opts.indexOf(rightText),
             type: subj, u: u || 0, kn: x.k, big: true, tp: x.t || 'choice' };
  }

  function genSubjectQ(subj, g, lv, u, kn) {
    /* v3.44：五科一律优先大图谱真题；题库取不到才回退老生成器（保险） */
    const bq = bigBankQ(subj, g, lv, kn, u);
    if (bq) return bq;
    if (subj === 'math') return mathQ(g, lv, u);
    if (subj === 'cn') return bankQ(SUBJ_QB.cn[g], lv, u, 'cn');
    if (subj === 'sci' || subj === 'eth') {
      const all = SUBJ_QB.sub[g].filter((x) => x[4] === subj);
      const byLv = all.filter((x) => Math.abs(x[5] - lv) <= 1);
      const s = pick(byLv.length ? byLv : all);
      const opts = shuffle([s[1], s[2], s[3]]);
      return { q: s[0], opts, a: opts.indexOf(s[1]), type: subj, u };
    }
    return genQ(pick(enTypesFor(lv, g)), g, u);
  }
  /* 一组混学科题：makers[i] 生成第 i 题，自动去重；去重失败换随机学科兜底 */
  function genMix(count, makers, fallback) {
    const out = [], seen = {};
    for (let i = 0; i < count; i++) {
      let q = null;
      for (let guard = 0; guard < 12; guard++) {
        const c = (guard < 9 ? makers[i % makers.length] : (fallback || makers[0]))();
        const key = c.q + '|' + c.opts[c.a];
        if (!seen[key]) { q = c; break; }
      }
      if (!q) q = makers[0]();
      seen[q.q + '|' + q.opts[q.a]] = 1;
      out.push(q);
    }
    return out;
  }

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
  /* 地图节点出题：学科混排 + 难度随节点 lv
     kn（知识点关）：3 题聚焦该知识点学科
     boss：本节点学科为主（3/5），其余混科
     final：语数英全覆盖 + 混科，lv4 最高难度 */
  function genNodeQs(node, g) {
    const lv = node.lv == null ? 2 : node.lv;
    const subj = node.subj || 'en';
    const WS = () => genSubjectQ(weightedSubj(), g, lv, node.u);
    if (node.t === 'kn') {
      /* 每个知识点 3 级：识记 2 题 / 练习 3 题 / 精通 3 题（精通难度 +1） */
      const st = node.stage || 1;
      const cnt = node.qn || (st === 1 ? 2 : 3);
      if (subj === 'mix') return genMix(cnt, [WS, WS, WS], WS);
      const qlv = Math.min(4, lv + (st === 3 ? 1 : 0));
      /* 英语知识点分两类：单词点练词义/拼写，句型点练补全句子，题与点对得上 */
      if (node.sk === 'sent') {
        const sf = () => genQ('fill', g, node.u);
        const st2 = () => genQ('sit', g, node.u);
        return genMix(cnt, [sf, sf, st2], WS);
      }
      if (node.sk === 'word') {
        const wf = () => genQ(pick(['e2c', 'c2e', 'pic', 'fill']), g, node.u);
        return genMix(cnt, [wf, wf, wf], WS);
      }
      const f = () => genSubjectQ(subj, g, qlv, node.u, node.kn);
      return genMix(cnt, [f, f, f], WS);
    }
    if (node.t === 'chall') return genMix(4, [WS, WS, WS, WS], WS);
    if (node.t === 'boss') {
      const b = () => genSubjectQ(subj, g, lv, node.u);
      return genMix(5, [b, b, b, WS, WS], WS);
    }
    if (node.t === 'final') {
      return genMix(8, [
        () => genSubjectQ('en', g, 4, node.u),
        () => genSubjectQ('cn', g, 4, node.u),
        () => genSubjectQ('math', g, 4, node.u),
        WS, WS
      ], WS);
    }
    return genMix(3, [() => genSubjectQ(subj, g, lv, node.u), WS, WS], WS);
  }

  /* ================= 地图生成 ================= */
  /* 学科轮换：保证相邻关卡不同科，主课出场多于副课 */
  const SUBJ_ROT = ['en', 'math', 'cn', 'sci', 'math', 'en', 'cn', 'eth'];
  /* ================= v3.26 知识图谱 =================
     每年级 5 章 × (12 知识点关 + 1 学科 Boss) + 最终 Boss = 66 关
     知识点关 = 聚焦单科单知识点；题目难度 lv 随进度递增 */
  const MATH_KN = {
  g1: ["1到5各数的认识", "5以内数的大小", "几和第几", "5以内数的分与合", "0的认识", "5以内的加法", "5以内的减法", "6～10各数的认识", "10以内数的比较", "10以内的加法", "10以内的减法", "连加和连减", "10以内加减混合", "认识长方体、正方体、圆柱和球", "上下前后左右", "11～20各数的认识", "十位和个位", "20以内不进位加法", "凑十法", "9加几", "8、7、6加几", "找一找、分一分", "认识平面图形", "图形的拼组", "十几减9", "十几减8、7、6", "十几减5、4、3、2", "数数、数的组成", "数的顺序、比较大小", "简单的加、减法", "口算加法", "口算减法", "笔算加法", "笔算减法", "部分与整体", "求两数相差几", "求比一个数多（少）几的数", "认识人民币", "5、4、3、2加几", "逆向用加法解决问题", "用加减法解决问题", "拼一拼", "七巧板", "解决含有多余信息的问题", "读法和写法", "100的认识", "用连减解决问题", "买卖我做主"],
  g2: ["分类与整理", "乘法的初步认识", "2～6的乘法口诀", "选择一种运算解决问题", "乘加、乘减", "除法的意义", "用2～6的乘法口诀求商", "除法的基本应用", "认识东、南、西、北", "认识厘米及用厘米量", "认识米及用米量", "寻找、测量、运用身体尺", "7～9的乘法口诀", "用7～9的乘法口诀求商", "认识时间", "时、分、秒的进率", "我与时间的故事", "有余数的除法", "用口诀求商和余数", "有余数除法的应用", "数量间的乘除关系", "1000以内数的认识", "万以内数的大小比较", "万以内数的组成", "几百几十的口算加法", "几百几十的口算减法", "加法的估算", "加法", "减法", "加减法各部分间的关系", "简单的变化规律", "逐层分类", "用乘法解决购物问题", "平均分（包含）", "平均分（等分）", "认识线段", "用估量解决问题", "设计导游路线", "解决连续两问的问题", "10000以内数的认识", "简单的加、减法", "数独游戏", "连环画分享会", "我的时间小书"],
  g3: ["观察简单的立体积木", "长方体纸盒的展开", "同级运算与两级运算", "含有小括号的两级运算", "用混合运算解决问题", "毫米的认识", "分米的认识及单位换算", "千米的认识及单位换算", "认识质量单位", "吨的认识", "等量代换", "笔算乘法", "因数中间或末尾有0的乘法", "认识数字编码", "线段、射线、直线的概念", "角的认识", "直角、锐角、钝角", "认识几分之一", "认识几分之几", "简单的分数大小比较", "同分母分数的加减法", "倍的认识", "集合图里的重叠", "搭配问题", "生活中的运动现象", "笔算除法", "除法解决实际问题", "多边形", "长方形和正方形的特征", "周长", "面积和面积单位", "长方形和正方形的面积", "面积单位间的进率", "数据的收集与整理", "年历中的秘密", "作息时间表中的秘密", "认识小数", "简单的小数加、减法", "东北、东南、西北、西南", "根据直观图猜测积木形状", "口算乘法", "乘法估算", "用圆规比较线段的长短", "认识二分之一", "估测距离", "编制学号", "剪纸", "口算除法", "拼图游戏", "小数的大小比较", "年历设计师"],
  g4: ["亿以内数的认识", "大数的改写和近似", "1亿有多大", "角的度量", "平角、周角和角的分类", "两位数乘两位数", "两位数乘法的应用", "多位数乘两位数", "用估算解决问题", "常见数量关系", "加法模型", "乘法模型", "垂直", "平行", "平行四边形和梯形的特征", "用尺规画平行线", "条形统计图", "复式条形统计图", "寻找宝藏", "鸡兔同笼", "四则运算各部分间的关系", "整数四则混合运算", "从不同方向观察物体", "加法交换律和结合律", "乘法交换律和结合律", "乘法分配律", "用运算律简便计算", "小数的意义", "比较小数的大小", "小数点移动引起的大小变化", "求小数的近似数", "三角形的分类", "三角形的三边关系", "三角形的内角和", "小数加减法", "小数加减解决实际问题", "轴对称", "平移", "平均数", "除数是两位数的除法", "商不变的规律"],
  g5: ["观察简单组合体", "小数乘整数", "小数乘小数", "小数乘法的应用", "除数是整数的小数除法", "一个数除以小数", "小数除法的应用", "图形的运动", "用字母表示数", "等式的性质", "公顷和平方千米", "平行四边形的底和高", "平行四边形的面积", "三角形的面积", "梯形的面积", "组合图形的面积", "有趣的密铺", "可能性", "可能性的大小", "积的近似数", "方程的意义", "解简易方程", "列方程解决实际问题", "植树问题", "根据三个方向辨认物体", "因数和倍数", "2和5的倍数的特征", "3的倍数的特征", "奇数和偶数", "质数和合数", "最大公因数", "最小公倍数", "长方体和正方体的认识", "长方体的表面积", "体积单位", "长方体和正方体的体积", "容积", "分数的意义", "真分数和假分数", "分数的基本性质", "约分", "分数的大小比较", "分数和小数互化", "旋转", "通分", "异分母分数加减", "分数加减混合", "折线统计图", "找次品", "同分母分数加减", "探索图形", "怎样通知最快"],
  g6: ["用有序数对确定位置", "用方向和距离确定位置", "描述简单路线图", "分数乘整数", "一个数乘分数", "分数乘法的应用", "分数除以整数", "分数除法", "分数除法的应用", "认识负数", "用负数表示相反意义的量", "圆的认识", "圆周率", "圆的周长", "圆的周长的应用", "圆的面积", "扇形的认识", "体育中的数学", "百分数的意义", "百分数与分数、小数互化", "求一个数的百分之几", "求百分率", "已知一个数的百分之几求这个数", "折扣", "利率", "求一个数比另一个数多百分之几（增长率）", "水是生命之源", "倒数的认识", "分数、小数混合运算及运算律", "鸽巢问题", "圆柱的认识", "圆柱的体积", "圆柱的表面积", "圆锥的认识", "圆锥的体积", "比的意义", "化简比", "按比分配", "比例的意义和基本性质", "解比例", "比例尺", "图形的放大与缩小", "正比例", "反比例", "用比例解决实际问题", "自行车里的数学", "扇形统计图", "数与形"]
};
  const CN_KN = {
  g1: ["识字：天地人", "识字：金木水火土", "识字：口耳目手足", "识字：日月山川", "入学教育：我上学了", "语文园地一·我说你做", "快乐读书吧：读书真快乐", "单韵母 a、o、e 和四声", "单韵母 i、u、ü", "声母 b、p、m、f", "声母 d、t、n、l", "语文园地二·日积月累《画》", "声母 g、k、h", "声母 j、q、x", "平舌声母 z、c、s", "翘舌声母 zh、ch、sh、r", "声母 y、w", "语文园地三·整体认读音节", "复韵母 ai、ei、ui、ao、ou、iu", "特殊韵母 ie、üe、er", "鼻韵母 an、en、in、un、ün 和 ang、eng、ing、ong", "拼读音节", "语文园地四·给音节标调", "阅读《秋天》", "阅读《江南》", "阅读《雪地里的小画家》", "阅读《四季》", "语文园地五·把话说完整", "识字：对韵歌", "识字：日月明", "识字：小书包", "阅读《升国旗》", "语文园地六·大小多少与量词", "阅读《小小的船》", "阅读《影子》", "阅读《两件宝》", "语文园地七·用多大的声音", "阅读《比尾巴》", "阅读《乌鸦喝水》", "阅读《雨点儿》", "语文园地八·看图说出谁在做什么", "识字：春夏秋冬", "识字：姓氏歌", "识字：小青蛙", "识字：猜字谜", "口语交际：请你帮个忙", "快乐读书吧：读读童谣和儿歌", "阅读《热爱中国共产党》", "阅读《吃水不忘挖井人》", "阅读《我多想去看看》", "语文园地二·形近字和同音字", "阅读《小公鸡和小鸭子》", "阅读《树和喜鹊》", "阅读《怎么都快乐》", "口语交际：打电话", "古诗《静夜思》", "阅读《夜色》", "阅读《端午粽》", "语文园地四·标点与词语", "识字：动物儿歌", "识字：古对今", "识字：操场上", "识字：《人之初》", "口语交际：一起做游戏", "古诗《池上》", "古诗《小池》", "阅读《浪花》", "阅读《荷叶圆圆》", "阅读《要下雨了》", "语文园地六·量词和重叠词", "阅读《文具的家》", "阅读《一分钟》", "阅读《动物王国开大会》", "阅读《小猴子下山》", "口语交际：听故事，讲故事", "阅读《棉花姑娘》", "阅读《咕咚》", "阅读《小壁虎借尾巴》", "语文园地八·看图把事情说清楚"],
  g2: ["阅读《小蝌蚪找妈妈》", "阅读《我是什么》", "阅读《植物妈妈有办法》", "语文园地一·有趣的动物", "快乐读书吧：读读童话故事", "识字：《场景歌》", "识字：《树之歌》", "识字：《拍手歌》", "识字：《田家四季歌》", "语文园地二·反义词", "语文园地二·偏旁归类", "阅读《彩虹》", "阅读《去外婆家》", "阅读《数星星的孩子》", "语文园地三·把句子补充完整", "古诗《登鹳雀楼》", "古诗《望庐山瀑布》", "阅读《黄山奇石》", "阅读《日月潭》", "阅读《葡萄沟》", "语文园地四·颜色和比喻", "阅读《坐井观天》", "阅读《寒号鸟》", "阅读《我要的是葫芦》", "语文园地五·商量", "阅读《八角楼上》", "阅读《朱德的扁担》", "阅读《难忘的泼水节》", "阅读《刘胡兰》", "语文园地六·看图讲故事", "古诗《江雪》", "古诗《敕勒歌》", "阅读《雾在哪里》", "阅读《雪孩子》", "语文园地七·《夜宿山寺》", "阅读《称赞》", "阅读《纸船和风筝》", "阅读《快乐的小河》", "语文园地八·看图写话", "古诗《咏柳》", "古诗《村居》", "阅读《找春天》", "阅读《开满鲜花的小路》", "阅读《邓小平爷爷植树》", "语文园地一·注意说话的语气", "语文园地一·日积月累《赋得古原草送别》", "阅读《雷锋叔叔，你在哪里》", "阅读《千人糕》", "阅读《我不是最弱小的》", "语文园地二·职业和名言", "识字：《神州谣》", "识字：《传统节日》", "识字：《「贝」的故事》", "识字：《中国美食》", "语文园地三·形旁和十二生肖", "阅读《彩色的梦》", "阅读《一匹出色的马》", "阅读《枫树上的喜鹊》", "语文园地四·玩具和诚信", "阅读《亡羊补牢》", "阅读《揠苗助长》", "阅读《画杨桃》", "阅读《小马过河》", "语文园地五·说说自己的想法", "古诗《绝句》：两个黄鹂", "古诗《晓出净慈寺送林子方》", "阅读《雷雨》", "阅读《要是你在野外迷了路》", "阅读《太空生活趣事多》", "语文园地六·节气和问号", "阅读《大象的耳朵》", "阅读《蜘蛛开店》", "阅读《青蛙卖泥塘》", "阅读《小毛虫》", "语文园地七·大扫除", "阅读《羿射九日》", "阅读《黄帝的传说》", "阅读《大禹治水》", "语文园地八·把句子写具体"],
  g3: ["阅读《大青树下的小学》", "阅读《花的学校》", "阅读《不懂就要问》", "语文园地一·音序查字典", "语文园地一·部首查字典", "古诗《望洞庭》", "古诗《山行》", "古诗《夜书所见》", "阅读《铺满金色巴掌的水泥道》", "阅读《秋天的雨》", "阅读《听听，秋的声音》", "习作：写日记", "语文园地二·ABB 和 AABB 式词语", "阅读《总也倒不了的老屋》", "阅读《犟龟》", "阅读《小狗学叫》", "语文园地三·续写故事", "阅读《宝葫芦的秘密》（节选）", "阅读《在牛肚子里旅行》", "阅读《一块奶酪》", "语文园地四·我来编童话", "快乐读书吧：在那奇妙的王国里", "阅读《搭船的鸟》", "阅读《金色的草地》", "习作：我们眼中的缤纷世界", "习作：我们眼中的缤纷世界·的、地、得", "阅读《富饶的西沙群岛》", "阅读《海滨小城》", "阅读《美丽的小兴安岭》", "阅读《香港，璀璨的明珠》", "语文园地六·这儿真美", "古诗《鹿柴》", "古诗《望天门山》", "古诗《饮湖上初晴后雨》", "阅读《大自然的声音》", "阅读《读不完的大书》", "语文园地七·我有一个想法", "文言文《司马光》", "阅读《一定要争气》", "阅读《手术台就是阵地》", "阅读《一个粗瓷大碗》", "语文园地八·那次经历真难忘", "古诗《绝句》：迟日江山丽", "古诗《惠崇春江晚景》", "古诗《三衢道中》", "阅读《燕子》", "阅读《荷花》", "阅读《昆虫备忘录》", "语文园地一·比喻和拟人", "阅读《守株待兔》", "阅读《会摇尾巴的狼》", "阅读《鹿角和鹿腿》", "阅读《池子与河流》", "语文园地二·守株待兔与亡羊补牢", "快乐读书吧：小故事大道理", "阅读《海底世界》", "阅读《石蜂》", "阅读《小虾》", "语文园地三·我做了一项小实验", "古诗《元日》", "古诗《清明》", "古诗《九月九日忆山东兄弟》", "阅读《纸的发明》", "阅读《赵州桥》", "阅读《一幅名扬中外的画》", "语文园地四·中华传统节日", "阅读《胡萝卜先生的长胡子》", "阅读《我变成了一棵树》", "习作：奇妙的想象", "阅读《童年的水墨画》", "阅读《肥皂泡》", "阅读《灰雀》", "阅读《我不能失信》", "语文园地六·身边那些有特点的人", "阅读《火烧云》", "阅读《暴风雨来临之前》", "阅读《我们奇妙的世界》", "语文园地七·国宝大熊猫", "阅读《慢性子裁缝和急性子顾客》", "阅读《漏》", "阅读《枣核》", "语文园地八·趣味故事会"],
  g4: ["阅读《观潮》", "阅读《繁星》", "现代诗二首", "语文园地一·多音字：朝、涨、似、还", "阅读《一个豆荚里的五粒豆》", "阅读《夜间飞行的秘密》", "阅读《方帽子店》", "阅读《田忌赛马》", "语文园地二·形近字：辨、辩、辫、瓣", "语文园地二·同音字：在和再、做和作", "古诗《暮江吟》", "古诗《题西林壁》", "古诗《雪梅》", "阅读《爬山虎的脚》", "阅读《蟋蟀的住宅》", "语文园地三·近义词辨析", "阅读《盘古开天地》", "阅读《精卫填海》", "阅读《普罗米修斯》", "阅读《女娲补天》", "语文园地四·习作：我和____过一天", "快乐读书吧：很久很久以前", "阅读《麻雀》", "阅读《爬天都峰》", "习作：生活万花筒 ·把景物/事情写具体", "阅读《长城》", "阅读《颐和园》", "阅读《秦兵马俑》", "语文园地六·我是小小讲解员", "阅读《牛和鹅》", "阅读《一只窝囊的大老虎》", "阅读《陀螺》", "文言文《王戎不取道旁李》", "语文园地七·关联词：因为所以、虽然但是", "阅读《我将无我，不负人民》", "阅读《为中华之崛起而读书》", "阅读《延安，我把你追寻》", "古诗《凉州词》", "古诗《出塞》", "古诗《夏日绝句》", "语文园地八·习作：写信", "古诗《四时田园杂兴》", "古诗《宿新市徐公店》", "词《清平乐·村居》", "阅读《乡下人家》", "阅读《天窗》", "阅读《三月桃花水》", "语文园地一·形声字：清、晴、情、请", "阅读《琥珀》", "阅读《飞向蓝天的恐龙》", "阅读《纳米技术就在我们身边》", "阅读《千年梦圆在今朝》", "语文园地二·多音字：假、散、便、发", "语文园地二·形近字：幕、慕、暮、墓", "快乐读书吧：十万个为什么", "短诗三首·繁星", "阅读《绿》", "阅读《白桦》", "阅读《在天晴了的时候》", "语文园地三·词语搭配：严格、严厉、严密", "阅读《猫》", "阅读《母鸡》", "阅读《白鹅》", "语文园地四·词语的感情色彩", "阅读《海上日出》", "阅读《记金华的双龙洞》", "习作：游_____ ·把游览中的见闻写具体", "文言文二则", "阅读《小英雄雨来》", "阅读《我们家的男子汉》", "阅读《芦花鞋》", "语文园地六·对话和双引号", "古诗《芙蓉楼送辛渐》", "古诗《塞下曲》", "古诗《墨梅》", "阅读《黄继光》", "阅读《“诺曼底号”遇难记》", "阅读《挑山工》", "语文园地七·自我介绍和自画像", "阅读《宝葫芦的秘密》（节选）", "阅读《巨人的花园》", "阅读《海的女儿》", "语文园地八·故事新编"],
  g5: ["阅读《桂花雨》", "阅读《落花生》", "阅读《珍珠鸟》", "习作：我的心爱之物", "语文园地一·易读错的字音", "阅读《冀中的地道战》", "阅读《将相和》", "阅读《什么比猎豹的速度更快》", "阅读《“诺曼底号”遇难记》", "习作：“漫画”老师", "语文园地二·多音字：强、鲜、弹、模", "语文园地二·成语运用", "阅读《猎人海力布》", "阅读《牛郎织女》", "语文园地三·习作：故事新编", "快乐读书吧：从前有座山", "古诗《示儿》", "古诗《题临安邸》", "古诗《己亥杂诗》", "阅读《少年中国说》节选", "阅读《圆明园的毁灭》", "阅读《梅兰芳蓄须明志》", "语文园地四·联系上下文理解词语", "阅读《太阳》", "阅读《金字塔》", "习作：介绍一种事物", "阅读《慈母情深》", "阅读《父爱之舟》", "阅读《航天员写给孩子的信》", "习作：我想对您说", "语文园地六·形近字：戴、载、裁", "古诗《山居秋暝》", "古诗《枫桥夜泊》", "古诗《早春呈水部张十八员外》", "阅读《第一场雪》", "阅读《白鹭》", "语文园地七·修改病句", "阅读《古人谈读书》", "阅读《忆读书》", "阅读《走遍天下书为侣》", "语文园地八·习作：推荐一本书", "古诗《四时田园杂兴》（其三十一）", "古诗《稚子弄冰》", "古诗《村晚》", "阅读《祖父的园子》", "阅读《月是故乡明》", "阅读《梅花魂》", "习作：那一刻，我长大了", "语文园地一·易错字音（削、骨、血、处）", "阅读《草船借箭》", "阅读《景阳冈》", "阅读《猴王出世》", "阅读《红楼春趣》", "习作：写读后感", "语文园地二·成语（神机妙算、完好无缺等）", "快乐读书吧：读古典名著，品百味人生", "综合性学习·汉字真有趣", "综合性学习·我爱你，汉字", "古诗《从军行》", "古诗《秋夜将晓出篱门迎凉有感》", "古诗《闻官军收河南河北》", "阅读《青山处处埋忠骨》", "阅读《军神》", "阅读《清贫》", "习作：他____了", "语文园地四·描写人物的词语", "阅读《人物描写一组》", "阅读《刷子李》", "习作：把一个人的特点写具体", "文言文《自相矛盾》", "文言文《田忌赛马》", "阅读《跳水》", "习作：神奇的探险之旅", "语文园地六·缩句和扩句", "阅读《威尼斯的小艇》", "阅读《牧场之国》", "阅读《金字塔夕照》和《不可思议的金字塔》", "习作：中国的世界文化遗产", "语文园地七·用色彩把景物写具体", "文言文《杨氏之子》", "阅读《手指》", "阅读《童年的发现》", "习作：漫画的启示", "语文园地八·日积月累名言"],
  g6: ["阅读《草原》", "阅读《丁香结》", "古诗《西江月·夜行黄沙道中》", "古诗《宿建德江》", "古诗《六月二十七日望湖楼醉书》", "习作：变形记", "语文园地一·易错字音：屹、悼、炽、湃", "古诗《七律·长征》", "阅读《狼牙山五壮士》", "阅读《开国大典》", "阅读《我的战友邱少云》", "习作：多彩的活动", "语文园地二·爱国名言", "阅读《竹节人》", "阅读《宇宙生命之谜》", "阅读《故宫博物院》", "习作：____让生活更美好", "语文园地三·形近字：慨、概、溉", "阅读《桥》", "阅读《穷人》", "阅读《金色的鱼钩》", "习作：笔尖流出的故事", "语文园地四·品味含义深刻的词句", "快乐读书吧：笑与泪，经历与成长", "阅读《灯光》", "阅读《盼》", "习作：围绕中心意思写", "阅读《只有一个地球》", "阅读《青山不老》", "阅读《三黑和土地》", "古诗《浪淘沙》（其一）", "古诗《江南春》", "古诗《书湖阴先生壁》", "习作：学写倡议书", "语文园地六·关联词：不但而且、只要就", "文言文《两小儿辩日》", "文言文《曹冲称象》", "阅读《表里的生物》", "阅读《他们那时候多有趣啊》", "习作：插上科学的翅膀飞", "语文园地七·文言虚词：之、其、而", "阅读《少年闰土》", "阅读《好的故事》", "阅读《我的伯父鲁迅先生》", "阅读《有的人》", "习作：传承好家风", "语文园地八·鲁迅名言", "阅读《北京的春节》", "阅读《腊八粥》", "古诗《寒食》", "古诗《迢迢牵牛星》", "古诗《十五夜望月》", "阅读《藏戏》", "习作：家乡的风俗", "语文园地一·易错字音：粥、宵、饺、祭", "阅读《鲁滨逊漂流记》", "阅读《骑鹅旅行记》", "阅读《汤姆·索亚历险记》", "习作：写作品梗概", "语文园地二·多音字：泊、漂、载、难", "语文园地二·词语的语境义", "快乐读书吧：漫步世界名著花园", "阅读《匆匆》", "阅读《那个星期天》", "习作：让真情自然流露", "省略号和破折号", "古诗《马诗》", "古诗《石灰吟》", "古诗《竹石》", "阅读《十六年前的回忆》", "阅读《为人民服务》", "阅读《董存瑞舍身炸暗堡》", "综合性学习：奋斗的历程", "语文园地四·开头结尾与借物言志", "文言文《学弈》", "阅读《真理诞生于一百个问号之后》", "习作：围绕中心选择材料", "语文园地五·辩论", "综合性学习：回忆往事", "综合性学习：依依惜别", "活动：毕业赠言要具体", "古诗《采薇》（节选）", "古诗《送元二使安西》", "古诗《春夜喜雨》", "古诗《泊船瓜洲》", "古诗《游园不值》", "词《卜算子·送鲍浩然之浙东》"]
};
  const SC_KN = {
    g1: ['认识植物', '观察小动物', '太阳与影子', '四季变化', '垃圾分类', '交通规则', '礼貌用语', '爱护公物'],
    g2: ['水的三态', '磁铁的秘密', '动植物的成长', '月相变化', '同伴互助', '诚实守信', '安全用电', '健康饮食'],
    g3: ['天气观测', '水的循环', '动物分类', '认识空气', '校园安全', '集体荣誉', '节约用水', '废旧回收'],
    g4: ['声音的产生', '光的传播', '呼吸与消化', '运动与力', '遵守交规', '网络文明', '团队合作', '感恩父母'],
    g5: ['光的反射', '地球的运动', '生物与环境', '种子萌发', '社会公德', '爱护环境', '诚信友善', '珍爱生命'],
    g6: ['微小世界', '地球的卫星', '能量与能源', '生物多样性', '宪法意识', '责任担当', '合理上网', '明辨是非']
  };
  /* ================= v3.30 知识图谱全量 =================
     每年级知识点总量：数学 40 · 语文 40 · 科学 20 · 道法 10 · 英语 30 词 + 10 句型 = 150
     每章 30 个点（语数各 8、英语 8、科学 4、道法 2），5 章正好铺满，无重复无遗漏。 */
  const SCI_KN = {
  g1: ["我们知道的植物", "观察植物", "植物长在哪里", "给植物画张「像」", "植物的变化", "校园里的植物", "植物的根、茎、叶", "我们的身体", "发现生长", "游戏中的观察", "气味告诉我们", "通过感官来发现", "观察与比较", "做个「时间胶囊」", "保护我们的感官", "观察物体的特征", "给物体分类", "比较物体的轻重", "认识物体的形状", "观察一杯水", "哪个流动得快", "它们去哪里了", "物体是用什么做的", "我们周围的动物", "观察一种动物", "给蜗牛建个「家」", "水中的动物", "它们吃什么", "动物的身体特征", "动物联欢会"],
  g2: ["动物的「家」", "我们的家", "家里的物品", "设计小房子", "建造小房子", "「小房子」展示会", "牢固的结构", "地球家园有什么", "我们的校园", "我们周围的空气", "不同的天气", "不同的季节", "太阳与白天", "夜晚的月亮", "记录天气日历", "恐龙的故事", "挖掘恐龙「化石」", "测量恐龙「化石」", "拼接恐龙「化石」", "复原恐龙", "制作恐龙模型", "我们的恐龙公园", "化石是怎样形成的", "磁铁能吸引什么", "比较磁力的大小", "隔物吸铁", "设计和玩钓鱼玩具", "磁铁的两极", "让小车动起来", "磁铁在生活中的应用"],
  g3: ["我们关心天气", "认识气温计", "测量气温", "测量降水量", "观测风", "天气预报与天气的影响", "水到哪里去了", "水珠从哪里来", "观察云", "水沸腾了", "水结冰了", "冰熔化了", "水能溶解多少物质", "加快溶解", "用水分离", "运动和位置", "各种各样的运动", "直线运动和曲线运动", "比较运动的快慢", "运动和能量", "设计和测试「过山车」", "根据太阳辨别方向", "利用自然物辨别方向", "利用磁铁辨别方向", "磁极与方向", "制作和使用指南针", "不同种类的动物", "动物的繁殖", "蚕的一生", "幼蚕的生长", "蚕蛾与昆虫的一生", "动物的生命周期", "地球是我们的家园", "水的星球", "地球的卫星——月球", "发光发热的太阳", "一天中影子的变化", "地球的「兄弟姐妹」", "制作地球科普海报"],
  g4: ["感受空气", "空气能占据空间吗", "空气占据的空间会改变吗", "空气有质量吗", "空气流动有力量", "我们来做「热气球」", "风的成因", "我们的呼吸与消化", "认识呼吸器官", "呼吸的变化与肺活量", "口腔里的消化", "胃和小肠里的消化", "食物在身体里的旅行", "呵护我们的器官", "声音是怎样产生的", "声音的强弱", "声音的高低", "设计和改进我们的乐器", "声音的传播", "保护听力", "种子里孕育着新生命", "种子长出了根", "茎和叶", "开花了", "果实和种子", "种子的传播", "植物的一生", "电和我们的生活", "点亮小灯泡", "简易电路与开关", "电路出故障了", "导体和绝缘体", "里面是怎样连接的与安装照明电路", "认识常见的岩石", "岩石的组成", "岩石、沙和黏土", "观察土壤", "比较不同的土壤与保护土壤"],
  g5: ["研究放大镜", "怎样放得更大", "用显微镜观察", "观察细胞", "观察水中的微小生物", "微生物与人类", "各种各样的工具", "独轮车省力的秘密——杠杆", "巧用斜面", "妙用滑轮", "给小车安装方向盘——轮轴", "社会发展与工具和技术", "拆解我们的小车模型", "用重物驱动小车", "用弹力驱动小车", "测量力的大小", "摩擦力的比较", "设计、制作和评价「月球小车」", "地球的表面", "火山喷发对地表的作用", "地震对地表的作用", "地球表面的岩石", "岩石的类别与变化", "水和风对地表的作用", "种子发芽实验", "比较种子发芽实验", "绿豆苗的生长", "蚯蚓的选择", "当环境改变了", "食物链和食物网", "设计和制作生态瓶", "船的历史", "用浮的材料造船", "用沉的材料造船", "增加船的载重量", "给船装上动力", "设计、制作和测试我们的小船", "地球——宇宙的奇迹", "我们面临的环境问题", "珍惜水资源", "解决垃圾问题", "合理利用能源与资源再生", "温度与水的变化", "水的蒸发和凝结", "温度不同的物体相互接触", "热在金属中的传递", "热在水中的传递", "哪个传热快与做个保温杯"],
  g6: ["生长发育的信息", "食物中的营养与均衡膳食", "身体的「总指挥」", "睡眠与情绪", "制订健康生活计划", "怎样能看到物体", "光是怎样传播的", "光能穿透物体吗", "光的反射现象", "设计和制作潜望镜", "制造彩虹", "利用地球模型来研究", "昼夜交替与地球自转", "哪里先迎来黎明", "影长的四季变化", "地球的公转与四季", "时间在流逝", "用水计量时间与制作水钟", "机械摆钟与制作钟摆", "时间与变化", "了解我们的住房", "认识工程", "建造塔台", "设计、制作、测试和改进塔台模型", "校园生物大搜索与生物分布", "形形色色的植物", "多种多样的动物", "相貌各异的我们", "古代生物与保护生物多样性", "太阳系大家庭与八颗行星", "日食与月相", "认识星座与夏季星空", "浩瀚的宇宙与探索宇宙", "厨房里的物质与变化", "产生气体的变化", "发现变化中的新物质与伴随现象", "生活中的化学变化"]
};
  const ETH_KN = {
  g1: ["开开心心上学去", "我向国旗敬个礼", "这是我们的校园", "平平安安回家来", "老师，您好！", "拉拉手，交朋友", "上课了，好好学", "课余生活真丰富", "作息有规律", "吃饭有讲究", "对人有礼貌", "玩也有学问", "我们小点儿声", "人人爱护公物", "我们不乱扔", "大家排好队", "有个新目标", "做事要仔细", "错了就要改", "我们有精神", "和大家在一起", "请帮我一下", "我们爱分享", "大家来合作", "这是我的家", "相亲相爱一家人", "让我自己来整理", "学做家务活", "快乐儿童节", "光荣的少先队", "戴上红领巾", "学先锋 做先锋"],
  g2: ["假期有收获", "教师节快乐", "团团圆圆过中秋", "欢欢喜喜庆国庆", "这是我们班", "班级生活有规则", "我是班级值日生", "我为班级作贡献", "我爱家乡山和水", "家乡物产养育我", "可亲可敬的家乡人", "家乡新变化", "美丽中国我们的家", "我们都是中国人", "红红火火中国年", "祖国，我为您自豪", "身心健康很重要", "学做“快乐鸟”", "做个“开心果”", "坚持才会有收获", "亲近大自然", "爱护动植物", "小水滴的诉说", "我是一张纸", "勤俭传家好", "诚信贵如金", "少年当自强", "见贤要思齐", "每个人都有梦想", "我们共同的梦想", "梦想接力棒", "实现梦想从现在做起"],
  g3: ["学习伴我成长", "我学习，我快乐", "学习有方法", "科技力量大", "走近科学家", "从小爱科学", "走近我们的老师", "同学相伴", "让我们的学校更美好", "公共场所的文明素养", "我们都是热心人", "生活离不开规则", "安全记心上", "我们的生活越来越幸福", "幸福生活是奋斗出来的", "一切靠劳动", "致敬劳动者", "从小爱劳动", "少让父母操心", "我的家庭贡献与责任", "弘扬家庭美德", "学会倾听", "学会表达", "同学要互助", "待人要诚信"],
  g4: ["热爱班集体", "选举班委会", "协商决定班级事务", "我是独特的", "生命最宝贵", "自我保护，免受伤害", "神奇的世界", "别让它抢走太多", "安全文明上网", "购物有学问", "学会合理消费", "反对浪费", "我们的好朋友", "说话要算数", "当冲突发生", "买东西的学问", "合理消费", "有多少浪费本可以避免", "我们的衣食之源", "这些东西哪里来", "生活离不开他们", "我们当地的风俗", "多姿多彩的民间艺术", "家乡的喜与忧"],
  g5: ["开天辟地的大事变", "探索中国革命道路", "抗日战争的中流砥柱", "夺取胜利的解放战争", "中国人民站起来了", "人民当家作主", "社会主义好", "改革开放展宏图", "综合国力日益提升", "祖国统一大业不断推进", "走进新时代", "历史性成就", "开启新征程", "读懂彼此的心", "让我们的家更美好", "弘扬优秀家风", "我们的公共生活", "建立良好的公共秩序", "我参与 我奉献", "不甘屈辱 奋勇抗争", "推翻帝制 民族觉醒", "中国有了共产党", "夺取抗日战争和人民解放战争的胜利", "屹立在世界的东方", "富起来到强起来"],
  g6: ["法律是什么", "法律作用大", "宪法是根本法", "我是中国公民", "公民的基本权利和义务", "了解国家机构", "未成年人需特殊保护", "专门法律来保护", "特殊关爱 助我成长", "用好法律 维护权利", "做守法公民", "学会尊重", "学会宽容", "学会反思", "地球——我们的家园", "应对自然灾害", "探访古代文明", "多元文化 多样魅力", "科技发展 造福人类", "日益重要的国际组织", "我们爱和平"]
};
  const EN_KN = {
  g1: [],
  g2: [],
  g3: ["英语字母表", "字母的大写和小写", "辅音字母 b 的开头音", "问候用语", "be 动词 am", "问候、告别和致谢", "读懂自我介绍", "家庭成员", "Who is 询问是谁", "This is 与 That is", "介绍家人", "读懂家人介绍", "动物", "用 This is a 介绍动物", "大小和高矮", "用形容词说大小高矮", "读懂动物句子", "读懂动物园的句子", "水果", "可数名词复数", "I like 表达喜好", "Do you like 一般疑问句", "读懂水果喜好", "颜色", "It is 说明颜色", "询问颜色", "看图认颜色", "元音字母", "1 到 10", "How many 问数量", "询问年龄", "读懂数量", "短元音 a", "a-e 的读音", "国家和来自哪里", "I am from 说明来自哪里", "询问来自哪里", "读懂来自哪里", "短元音 i", "i-e 的读音", "身体部位", "介绍身体部位", "读懂五官介绍", "短元音 o", "o-e 的读音", "教室物品", "书包里的文具", "Let's 建议句", "教室里的建议", "谈论书包里有什么", "读懂教室短文", "读懂书包里的物品", "短元音 u", "u-e 的读音", "食物", "表达想吃什么", "读懂喜好短文", "晚餐食物", "Would you like 用餐", "读懂晚餐对话", "短元音 e", "长元音 e", "玩具和礼物", "房间里的物品", "in、on、under", "询问位置", "读懂位置", "五个短元音复习", "11 到 20", "How many 与 11 到 20", "读懂 11 到 20 的数量"],
  g4: ["职业", "询问职业与 his、her", "介绍家人的职业", "读懂家人职业", "家务活动", "帮忙做家务", "读懂快乐家庭介绍", "描述朋友", "He has 与 I have", "介绍朋友", "读懂朋友介绍", "朋友的品质", "介绍并选择朋友", "家里的房间", "is 和 are 说明人在哪里", "询问家人在哪个房间", "读懂家里的位置", "社区场所", "社区里人们做什么", "学校场所", "楼层与 first、second", "问路：学校里的场所", "读懂学校平面说明", "年轻人如何帮助社区", "读懂学校帮手介绍", "天气", "It is 描述天气", "谈论天气并给建议", "读懂天气预报", "不同天气做什么", "恶劣天气提醒", "衣服", "Whose 与名词所有格", "谈论穿着", "读懂衣服是谁的", "复习：一起帮忙", "季节里的活动", "读懂旅行卡片", "规则用词", "祈使句", "说规则", "读懂规则", "must 与 mustn't 说班规", "制作班级规则海报", "家规：have to 与 can't", "家规用词", "用 have to 说家规", "读懂家规短文", "一天中的活动", "What time is it", "说时刻和该做的事", "读懂作息时刻", "It's time to 该做什么", "读懂作息时间表", "商店物品", "How much 询问价格", "在商店购物", "读懂价签", "购物用语 I'll take", "读懂购物小票与价签", "农场", "These are 与 Those are", "在农场谈论动物和蔬菜", "读懂农场短文", "农场动物与作物", "There be 说农场有什么", "从农场到餐桌的食物", "农场活动", "在农场做什么", "读懂农场劳动短文", "周末计划词汇", "用 will 说周末打算", "讨论精彩周末计划", "读懂周末计划短文"],
  g5: ["开头辅音连缀 bl、cl、fl", "ai 和 ay 的读音", "性格和外貌", "What is he like", "描述老师", "读懂老师介绍", "感受", "询问感受并建议", "能力动词", "can 表示能力", "谈论会做的事", "读懂能力短文", "爱好", "does 与第三人称单数", "谈论笔友和爱好", "读懂笔友介绍", "更多职业", "What does he do", "介绍职业和工作地点", "读懂职业短文", "星期", "have 与 on Mondays", "周末活动", "用 often 谈论日常", "读懂一周课程", "餐食", "What would you like to eat", "读懂点餐", "房间里的东西", "There is 与 There are", "描述自己的房间", "读懂房间短文", "自然公园", "Is there 与 Are there", "谈论公园里有什么", "读懂自然公园", "一天的活动", "When do you 询问时间", "谈论作息", "读懂一天的作息", "频率词 often usually sometimes", "用频率词谈作息", "季节", "谈论最喜欢的季节", "读懂季节短文", "季节活动词汇", "Why 与 because 说理由", "读懂季节与理由短文", "月份", "in 加月份", "谈论节日在几月", "读懂校历", "更多月份", "谈论校历活动月份", "序数词", "说出日期", "读懂日期通知", "更多序数词", "When is your birthday", "读懂活动日程表", "名词性物主代词", "现在进行时", "Whose 与正在做的事", "读懂正在做的事", "安静做事用词", "Keep 与 No 类规则", "说图书馆与教室规则", "正在做与遵守规则", "排队与轮流", "读懂公共场所规则", "现在分词变化", "看图说谁的与正在做什么"],
  g6: ["城市场所", "左转、右转和直行", "问路和指路", "读懂指路", "规则动词过去式", "不规则动词过去式", "Did 提问", "谈论去过哪里", "读懂旅行日记", "周末计划", "be going to 一般将来时", "谈论计划", "读懂周末计划", "聚会与邀请词汇", "should 提建议", "读懂感受和建议", "健康生活词汇", "健康习惯建议", "读懂健康生活短文", "金钱与花销词汇", "用 hundred 和 thousand 说价格", "读懂零花钱计划", "谈论存钱计划", "太空词汇", "用 will 说未来的太空生活", "读懂太空短文", "谈论太空探索", "交通工具", "must 与交通规则", "说明出行方式", "读懂交通规则", "能源与节约词汇", "读懂节能倡议", "陈述句和疑问句的语调", "身高和体重", "形容词比较级", "用 than 比较", "询问身高", "读懂比较短文", "周末活动词汇", "Did you 问周末活动", "How was your weekend", "谈论上周末", "用过去式说周末安排", "读懂上周末日记", "假期活动词汇", "Where did you go 问去向", "What did you do 问活动", "怎么去的与和谁去的", "谈论假期旅行", "读懂假期旅行短文", "过去和现在", "was 与 were", "比较过去和现在", "读懂今昔对比", "易混词 there、its、too", "读懂一封短信", "复习：Mike 的快乐日子"]
};
  /* 每章剧情引子（借鉴章节式冒险叙事） */
  const CHAP_STORY = [
    '冒险开始！和小伙伴一起踏上知识大陆，用知识点点亮脚下的路。',
    '前方是迷雾森林，每答对一道题，迷雾就会散开一格。',
    '问答桥到了——桥上每一块石板都刻着一个知识点，别踩空！',
    '知识城堡就在眼前，把守城门的 Boss 可不好对付，做好准备！',
    '最终决战！集齐五章知识之力，挑战最强的知识魔王！'
  ];
  /* ================= v3.40 剧情引子（小说式开场 → 战斗） =================
     每章一段小说式剧情，点关卡先看剧情卡，再开打；可在闯关页一键关掉 */
  const STORY_CHAP = [
    { n: '风起 · 会发光的石板路',
      t: ['清晨的雾还没散，小队的靴子踩上知识大陆的软土。脚下的石板一块接一块亮起来，像在说：走吧，前面有新的知识在等你。',
          '伙伴们把行囊背好，宠物抖了抖绒毛。第一缕阳光落下来的时候，路悄悄向前伸了一段——那是知识大陆在给勇敢的人指路。'] },
    { n: '雾锁 · 迷雾森林的灯',
      t: ['森林里的雾又冷又厚，伸手只能看见五根手指。传说每答对一个问题，头顶就会亮起一盏灯，灯多了，路自然就出来了。',
          '树后传来窸窸窣窣的声音，是谁把知识藏进了雾里？小队点起第一盏灯，光晕刚好照亮脚下一枚会发光的蘑菇。'] },
    { n: '桥语 · 一次只问一个问题',
      t: ['问答桥横在深谷之上，桥上的老人只有一个规矩：一次，只问一个问题。答对了，脚下的石板就向前挪一格。',
          '石板缝里长着会发光的青苔，谷底的风把远处 Boss 的呼噜声吹了上来。小队深吸一口气——稳住，一道一道来。'] },
    { n: '城下 · 守门人的赌局',
      t: ['知识城堡就在眼前，可吊桥拉着，守门人抱着手臂：想进城？先赢我一局。他出的题一道比一道刁钻，答错的人要绕很远的路。',
          '宠物在身后轻轻蹭了蹭裤腿，像在说别怕。城墙上章鱼旗猎猎作响，这一次，把学会的东西全部用上吧！'] },
    { n: '王座之巅 · 知识魔王',
      t: ['书山堆成的王座上，知识魔王缓缓睁开眼睛。它由所有「没弄懂」的题目组成，越害怕它，它就越强大。',
          '但小队一路走来，每一块石板、每一盏灯、每一座桥都是证据——知识已经在心里生了根。魔王打了个寒颤：这一局，轮到它紧张了。'] }
  ];
  /* 每个学科的一句风景描写，让剧情跟着关卡内容变化 */
  const STORY_SUBJ = {
    en:  '风里飘来几个英文单词，像纸飞机一样打着旋落在面前。',
    math: '地上画满了算式，数字在石缝里一闪一闪，等着被摆正。',
    cn:  '书页翻动的声音从树后传来，半句诗停在空中，缺了下阕。',
    sci:  '路边的试管咕噜咕噜冒泡，气泡里映出一道小小的彩虹。',
    eth:  '路口的木牌写着「请排队通行」，字迹认真得像新贴上去的。'
  };
  /* 由关卡生成剧情卡内容 */
  function storyOf(n, g) {
    if (n.t === 'treasure') return null;
    const G = DB[g];
    const chap = STORY_CHAP[Math.min(4, n.u || 0)];
    const S = n.subj ? SUBJ[n.subj] : null;
    const scene = STORY_SUBJ[n.subj] || '风把五科的书页一起吹响，像在列队欢迎。';
    const unitT = (G.units[n.u] && G.units[n.u].t) || '未知的领域';
    if (n.t === 'kn') {
      const st = n.stage || 1;
      const stLine = st === 1
        ? '「' + n.kn + '」刻在路边的石碑上，字迹被雾气糊住了。守碑的小精灵眨眨眼：「念对了，我就把路让开。」'
        : st === 2
          ? '小精灵把「' + n.kn + '」拆成三块碎字抛向空中：「接得住，才算真的记住了。」'
          : '石碑裂开一道缝，里面传出低沉的声音：「最后一个问题——' + n.kn + '，你真的懂了吗？」';
      return { ch: n.u || 0, em: S ? S.icon : '📖', title: chap.n.split('·')[1].trim() + ' · ' + n.kn,
        lines: [scene, stLine, '答对问题，就能点亮这块石板，继续往前走。'] };
    }
    if (n.t === 'boss') {
      const bn = S ? S.name + '·' + S.bosses[n.u % S.bosses.length] : BOSSES[n.u];
      return { ch: n.u || 0, em: S ? S.icon : '👹', title: 'Boss 来袭 · ' + bn,
        lines: ['「' + unitT + '」的出口被挡住了。' + bn + '从阴影里站起来，个头比想象中大得多。',
          '它搓着手指，摆出守门人的姿势：「过了我这关，徽章才归你。」',
          '小队互相看了看，点点头——把学会的全部用上，赢下这一局！'] };
    }
    if (n.t === 'final') {
      return { ch: 4, em: '👑', title: '最终决战 · 知识魔王',
        lines: ['书山之巅，' + gradeName(g) + '所有的「没弄懂」堆成了知识魔王的身体。它盯着小队，声音像雷滚过山谷。',
          '「你们答对的每一道题，都是从我这儿抢走的。」魔王咆哮着张开双臂。',
          '宠物站到了最前面，五色的徽章在胸口发亮。最后一场——去吧，把这一学年彻底赢下来！'] };
    }
    if (n.t === 'review') {
      return { ch: n.u || 0, em: '🛡️', title: '复习营地 · 休整一下',
        lines: ['营地里的篝火噼啪作响，复习木桩立在场子中央，等着大家练手。',
          '把之前学过的招式再打一遍，手感就回来了。', '热身完毕？那就开始吧。'] };
    }
    if (n.t === 'chall' || n.t === 'battle') {
      const en = ENEMIES[(n.u || 0) % ENEMIES.length];
      return { ch: n.u || 0, em: en.split(' ')[0], title: '遭遇战 · ' + en.split(' ')[1],
        lines: [scene, en.split(' ')[1] + '从草丛里跳了出来，挡在路中间，一副「此路是我开」的表情。',
          '别慌，题目就是武器。上！'] };
    }
    return null;
  }
  /* 剧情卡片：小说式开场，看完进入战斗；localStorage 关掉后直接开打 */
  function storyEnabled() { try { return localStorage.getItem('beast.story') !== 'off'; } catch (e) { return true; } }
  function storyCard(story, onStart) {
    if (!story) return onStart();
    if (!storyEnabled()) return onStart();
    BP.SND.play('frag');
    const m = document.createElement('div');
    m.className = 'story-mask sc-' + (story.ch % 5);
    m.innerHTML = '<div class="story-card">' +
      '<button class="story-x" id="stX">✕</button>' +
      '<div class="story-em">' + story.em + '</div>' +
      '<h2 class="story-t">' + esc(story.title) + '</h2>' +
      '<div class="story-lines">' + story.lines.map((l, i) => '<p style="animation-delay:' + (0.3 + i * 0.9) + 's">' + esc(l) + '</p>').join('') + '</div>' +
      '<div class="story-foot"><button class="btn" id="stGo">⚔️ 开始挑战</button>' +
      '<button class="story-off" id="stOff">⚡ 以后直接开打，不再看剧情</button></div></div>';
    document.body.appendChild(m);
    requestAnimationFrame(() => m.classList.add('in'));
    const go = () => { m.classList.remove('in'); setTimeout(() => m.remove(), 260); onStart(); };
    m.querySelector('#stGo').onclick = go;
    m.querySelector('#stX').onclick = () => { m.classList.remove('in'); setTimeout(() => m.remove(), 260); };
    m.querySelector('#stOff').onclick = () => {
      try { localStorage.setItem('beast.story', 'off'); } catch (e) {}
      toast('已关闭剧情引子，闯关页可随时重新打开 📖');
      go();
    };
  }
  /* ================= v3.41 知识大陆 · 完整冒险小说 =================
     每个年级一本书：序章 + 5 章（对应 5 个单元）+ 终章。
     正文按年级单元名与本章知识点动态生成，主角用孩子自己的名字。
     阅读进度存在 kid.novel = { g, c, p, read:{章:页}, done:{章:1} } */
  function novelCtx(k) {
    const g = gradeOf(k);
    const G = DB[g];
    const name = esc(k.name || '小探险家');
    const pet = esc((k.pet && k.pet.name) || '宠物');
    const knsOf = (c) => {
      const list = buildChapterKn(g, c);
      const seen = {}, out = [];
      list.forEach((x) => { if (out.length >= 3 || seen[x.s] || x.s === 'mix') return; seen[x.s] = 1; out.push(x.n); });
      list.forEach((x) => { if (out.length >= 3 && out.indexOf(x.n) < 0) out.push(x.n); });
      return out;
    };
    /* v3.44：按本章知识点从大图谱题库抽真题，题干/选项/答案都来自真实数据 */
    const quizOf = (c) => {
      if (window.BB_API) window.BB_API.load(g);   /* v5.1 按需加载该年级真题分片 */
      const kns = buildChapterKn(g, c);
      const seen = {}, out = [];
      kns.forEach((x) => {
        if (out.length >= 3 || seen[x.s] || x.s === 'mix') return;
        seen[x.s] = 1;
        const bank = (window.BIG_BANK && window.BIG_BANK[g] && window.BIG_BANK[g][x.s]) || [];
        let q = bank.find((z) => z.k === x.n)
             || bank.find((z) => z.k && x.n && (z.k.indexOf(x.n) >= 0 || x.n.indexOf(z.k) >= 0));
        if (!q && bank.length) q = bank[rnd(bank.length) % bank.length];
        if (q) out.push({ s: x.s, n: x.n, q: q.q, o: q.o, a: q.a });
      });
      return out;
    };
    return { g, G, name, pet, gn: gradeName(g), units: G.units.map((u) => u.t), knsOf, quizOf };
  }
  const NOVEL = [
    /* 0 序章 */
    { t: '序章 · 抽屉里的金纸片', sub: '一封邀请', em: '✉️', locked: false,
      pages: (c) => [
        ['雨停的那个傍晚，天边烧着一层橘红。' + c.name + '写完最后一页作业，伸手去抽屉里摸橡皮，指尖却碰到一张硬硬的纸片——它不属于这个抽屉。',
          '纸片上只有一个字：「来。」字是烫金的，摸上去微微发烫。翻过来，背面画着一条石板路，路的尽头立着一扇门。'],
        ['就在这时，' + c.pet + '从书包里探出头，鼻尖抽动了两下，忽然跳到桌上，冲着纸片叫了一声。纸片「嗡」地亮了，金光从字缝里漫出来，把整个房间都照成了蜂蜜的颜色。',
          '「……你要带我去哪儿？」' + c.name + '话音未落，脚下一空——书桌、台灯、窗外的路灯，全都化成了一片流动的光。'],
        ['光散开的时候，' + c.name + '站在一条会发光的石板路上。两边是望不到边的原野，天上悬着五个发亮的符号：📖 🧮 🌏 🔬 🌱。',
          '「这里是知识大陆。」一个声音从背后传来，「欢迎你，' + c.gn + '的挑战者。」']
      ] },
    /* 1-5 章 */
    { t: (c) => '第一章 · ' + c.units[0], sub: '石板路的邀请', em: '🌅', u: 0,
      pages: (c) => [
        ['声音的主人是个扎着两条小辫子的女孩，怀里抱着一本大得离谱的书。「我叫米娅，」她喘着气说，「这本书里所有的问题，我都想问一遍。」书页自己翻动起来，像被风吹过。',
          '旁边还站着个胖胖的男孩，正把最后一口面包塞进嘴里：「我叫小胖。别看我这样，我跑得快……虽然主要是逃跑快。」'],
        ['石板路在脚下延伸。每走一步，脚下的石板就亮起一层薄薄的金光，等走远了又暗下去。米娅蹲下摸了摸：「它在记住我们走过的路。」',
          '「' + c.gn + '的第一课，」她翻开书，指着上面跳动的三个词：「' + c.knsOf(0)[0] + '」「' + c.knsOf(0)[1] + '」「' + c.knsOf(0)[2] + '」，「这些就是这一章的钥匙。凑齐它们，石板路才会继续往前。」'],
        ['第一次考验来得比想象中快。路中央的石碑忽然立起，碑面浮出一行字——正是「' + c.knsOf(0)[0] + '」。',
          '「我来。」' + c.name + '深吸一口气。' + c.pet + '跳到肩头，尾巴绷得笔直。答案说出口的瞬间，石碑「咔」地裂开一道缝，金光从缝里涌出来，铺成新的一段路。'],
        ['米娅在书上打了个勾，小胖兴奋得原地跳了两下。',
          '「这只是开始。」米娅抬头望向远处——那里有一片灰白色的雾，正慢慢往这边涌。「雾里的东西，可不会像石碑这么客气。」']
      ] },
    { t: (c) => '第二章 · ' + c.units[1], sub: '雾里的灯', em: '🌫️', u: 1,
      pages: (c) => [
        ['雾比看上去要冷。踏进去的第一秒，' + c.name + '就看不见自己的手了。小胖在后面小声说：「我数三下，谁也别松手……一、二——」',
          '「三」还没出口，雾里传来「啪」的一声轻响。头顶亮起一盏小小的灯，暖黄色的光晕把三个人兜在里面。'],
        ['「每答对一个，就会亮一盏。」米娅的声音有点发抖，但很稳，「灯多了，路就出来了。」',
          '第一盏灯的光里，浮着一行字：「' + c.knsOf(1)[0] + '」。'],
        [c.pet + '忽然朝雾里叫了一声。雾动了一下，一个毛茸茸的影子缩回树后——那是只和' + c.pet + '差不多大的小家伙，浑身发抖，眼睛却亮得像两颗星。',
          '「它也怕黑。」' + c.name + '蹲下去，把手伸过去，「跟我们一起走吧，灯会越来越多。」'],
        ['第二盏、第三盏灯接连亮起。雾被光一点点推开，露出森林本来的样子：树上挂着写满字的叶子，叶子一碰就念出声——「' + c.knsOf(1)[1] + '」「' + c.knsOf(1)[2] + '」。',
          '米娅笑得眼睛都弯了：「原来雾里的知识，全都是活的。」小胖突然指着前面：「你们看！雾的尽头有光。」'],
        ['那是森林的出口，也是问答桥的桥头。回头望去，身后已经是一条亮堂堂的灯河。',
          '小家伙蹲在' + c.name + '脚边，蹭了蹭裤腿，不打算走了。「带上它吧。」米娅说，「它现在也是队伍的一员了。」']
      ] },
    { t: (c) => '第三章 · ' + c.units[2], sub: '问答桥', em: '🌉', u: 2,
      pages: (c) => [
        ['问答桥比传说中更长。桥板一块接一块，每块上都刻着字，桥下是白茫茫的云。',
          '桥中央坐着一位老人，眉毛长得垂到膝盖。「想过桥？」他慢悠悠地说，「一次只问一个问题。答对了，桥往前走一格。」'],
        ['第一块桥板亮了：「' + c.knsOf(2)[0] + '」。',
          c.name + '答得很快，桥「咔嗒」往前挪了一格。第二块、第三块……节奏慢慢稳下来，像心跳。走到一半，老人忽然换了语气：「这一题，我要问得难一点。」'],
        [c.name + '停住了。脑子里像有一团乱麻。',
          '「别急。」米娅把书翻到那一页，推过来，「你看，这里我们学过。」小胖在旁边大声数着呼吸：「一——二——三——」' + c.pet + '把爪子搭在' + c.name + '手背上，温温的。',
          '答案终于说出口的时候，整座桥「轰」地亮了起来，一直亮到对岸。'],
        ['老人站起来，深深鞠了一躬：「过了。这一路，你们不是一个人在答题。」',
          '对岸的城门已经能看见，城墙上飘着一面画着章鱼的旗子。风把旗子吹得猎猎作响。',
          '「下一关，」米娅合上书，「是守门人。」']
      ] },
    { t: (c) => '第四章 · ' + c.units[3], sub: '城下的赌局', em: '🏰', u: 3,
      pages: (c) => [
        ['守门人是个高个子，戴着单边眼镜，手里转着一支羽毛笔。「想进城？」他笑了笑，「先赢我一局。赢一半，我放你们一个人进去；全赢，吊桥放下。」',
          '小胖咽了口唾沫：「赢一半……是什么意思？」「意思是，」守门人敲了敲城门，「你们得先弄清楚，自己到底会什么。」'],
        ['第一轮，题目像雨点落下来。' + c.name + '答得快，米娅答得细，小胖把「' + c.knsOf(3)[0] + '」答成了笑话，三个人笑得直不起腰，守门人也笑了。',
          '笑完，他收起笑容：「轻松是好事。但知识不能只靠运气。」'],
        ['第二轮，题目陡然变难。' + c.name + '卡在「' + c.knsOf(3)[1] + '」上，米娅皱眉，小胖抓头发。',
          '「我们分开想。」' + c.name + '说，「你算这一步，我理这一层，小胖——你负责把我们的答案对一遍。」三个脑袋凑在一起，声音越来越小，最后同时抬起头。'],
        ['答案是对的。守门人的羽毛笔停在半空，好一会儿才落下，在名册上写下一行字。',
          '吊桥「吱呀」一声放下来，重重砸在地上，扬起一片尘土。「进去吧。」他说，「城堡里那位，可比我难缠多了。」',
          '城墙上的章鱼旗被风吹得翻卷，露出背面一行小字：「所有没弄懂的问题，最后都会回来找你。」']
      ] },
    { t: (c) => '第五章 · ' + c.units[4], sub: '王座之巅', em: '👑', u: 4,
      pages: (c) => [
        ['城堡里没有楼梯，只有一级级浮在空中的书堆。踩上去，书页会沙沙地翻，像在小声说话。',
          '最高处是一张书山堆成的王座。知识魔王坐在那里，身体由无数半透明的题目组成，随着呼吸一明一暗。「你们答对的每一道题，」它开口，声音像雷滚过山谷，「都是从我这里抢走的。」'],
        ['战斗开始得毫无预兆。题目像潮水一样涌来，一道比一道刁钻。',
          c.name + '答对一道，魔王就少一块；答错一道，它就长大一分。「它在吃我们的犹豫！」米娅喊，「别停！」'],
        ['最艰难的一题出现了：「' + c.knsOf(4)[0] + '」。',
          c.name + '的手心在出汗。就在这时，肩上的' + c.pet + '叫了一声，声音不大，却像一根线，把散开的思绪重新串起来。',
          '石板路、雾里的灯、问答桥、城下的赌局——一路走来的每一步，都在心里。答案说出口。'],
        ['魔王僵住了。它低头看着自己正在碎掉的身体，忽然笑了一下，那笑声竟然有点疲惫：「原来……你们真的学会了。」',
          '书山塌下来，化成漫天飞舞的书页。每一页上都写着一道题，题目的下面，是三个孩子歪歪扭扭的答案。']
      ] },
    /* 6 终章 */
    { t: '终章 · 回到教室的那天', sub: '全书完', em: '🏫', locked: true,
      pages: (c) => [
        ['再睁眼时，' + c.name + '趴在书桌上，台灯还亮着，窗外天已经黑透了。抽屉里那张纸片还在，只是上面的金字淡了，变成一行小字：「下次考试前，我再来找你。」',
          c.pet + '打了个哈欠，缩回书包。'],
        ['第二天上课，老师在黑板上写下一道题。' + c.name + '举起手，答案几乎脱口而出。',
          '米娅在教室另一头冲' + c.name + '眨眼——她的桌上，摊着一本大得离谱的书。'],
        ['知识大陆没有消失。它只是变成了教室里的一次举手、作业本上的一个对勾，和某个忽然想通的瞬间。',
          '——全书完。']
      ] }
  ];
  /* 本章「知识咒语」：最后一句提示这一章真正要掌握的东西 */
  function novelKnChips(g, c) {
    const list = buildChapterKn(g, c);
    const seen = {}, out = [];
    list.forEach((x) => { if (out.length >= 3 || seen[x.s] || x.s === 'mix') return; seen[x.s] = 1; out.push(x); });
    return out;
  }
  function ensureNovel(k) {
    const g = gradeOf(k);
    if (!k.novel || k.novel.g !== g || typeof k.novel.read !== 'object') {
      k.novel = { g, c: 0, p: 0, read: {}, done: {} };
    }
    return k.novel;
  }
  /* 阅读器：一页一页翻，进度自动记 */
  function novelReader(k, ci, page) {
    const nv = ensureNovel(k);
    const ctx = novelCtx(k);
    const ch = NOVEL[ci];
    if (!ch) return;
    const pages = ch.pages(ctx);
    let p = Math.max(0, Math.min(pages.length - 1, page == null ? 0 : page));
    const title = typeof ch.t === 'function' ? ch.t(ctx) : ch.t;
    const m = document.createElement('div');
    m.className = 'novel-mask';
    document.body.appendChild(m);
    const save = () => {
      nv.c = ci; nv.p = p;
      nv.read[ci] = Math.max(nv.read[ci] || 0, p + 1);
      if (p >= pages.length - 1) nv.done[ci] = 1;
      P.save();
    };
    const paint = (dir) => {
      save();
      const last = p >= pages.length - 1;
      const kns = (ch.u != null) ? novelKnChips(ctx.g, ch.u) : null;
      m.innerHTML = '<div class="nv-top"><button class="nv-back" id="nvBack">☰ 目录</button>' +
        '<span class="nv-ch">' + esc(title) + '</span>' +
        '<span class="nv-num">' + (p + 1) + ' / ' + pages.length + '</span></div>' +
        '<div class="nv-page' + (dir ? ' turn' : '') + '">' +
        (p === 0 ? '<div class="nv-em">' + ch.em + '</div><h2 class="nv-t">' + esc(title) + '</h2><div class="nv-sub">' + esc(ch.sub || '') + '</div>' : '') +
        pages[p].map((t) => '<p>' + t + '</p>').join('') +
        (last && kns ? '<div class="nv-kn"><b>📖 本章知识咒语</b>' +
          kns.map((x) => '<span><i>' + (SUBJ[x.s] ? SUBJ[x.s].icon : '📘') + '</i>' + esc(x.n) + '</span>').join('') + '</div>' +
          (ch.u != null ? (function () {
            const rqs = ctx.quizOf(ch.u);
            if (!rqs.length) return '';
            return '<div class="nv-realq"><b>🗝️ 大图谱真题 · 本章考点</b>' +
              rqs.map((z, i) => '<div class="nv-rq"><span class="nv-rqn">' + (i + 1) + '. <i>' +
                (SUBJ[z.s] ? SUBJ[z.s].icon : '📘') + '</i> ' + esc(z.q) + '</span>' +
                '<span class="nv-rqa">✓ ' + esc(z.o[z.a]) + '</span></div>').join('') +
              '<small>这些就是闯关时会遇到的同类题 · 数据来源 cn-math-taxonomy</small></div>';
          })() : '') +
          (ch.u != null ? '<button class="btn nv-go" id="nvGo">⚔️ 去闯这一章</button>' : '') +
          (ci === NOVEL.length - 1 ? '<button class="btn ghost nv-go" id="nvAgain">🔁 再读一遍</button>' : '') : '') +
        '</div>' +
        '<div class="nv-bar"><button class="nv-arrow" id="nvPrev"' + (p === 0 ? ' disabled' : '') + '>‹ 上一页</button>' +
        '<div class="nv-dots">' + pages.map((_, i) => '<i class="' + (i === p ? 'on' : i < p ? 'rd' : '') + '"></i>').join('') + '</div>' +
        '<button class="nv-arrow" id="nvNext"' + (last ? ' disabled' : '') + '>下一页 ›</button></div>' +
        '<div class="nv-hint">' + (last ? '本章读完啦 · 去闯关检验一下' : '左右滑动也可以翻页') + '</div>';
      m.querySelector('#nvBack').onclick = () => { close(); };
      m.querySelector('#nvPrev').onclick = () => { if (p > 0) { p--; paint('prev'); } };
      m.querySelector('#nvNext').onclick = () => { if (p < pages.length - 1) { p++; paint('next'); } };
      const go = m.querySelector('#nvGo');
      if (go) go.onclick = () => {
        close();
        const q = questState(k);
        if (q.vis && ch.u != null) { q.vis[ch.u] = q.vis[ch.u] || {}; q.vis[ch.u].open = true; }
        P.save();
        location.hash = '#/quest';
        render();
        toast('⚔️ 已打开第' + ['一', '二', '三', '四', '五'][ch.u] + '章关卡');
      };
      const ag = m.querySelector('#nvAgain');
      if (ag) ag.onclick = () => { p = 0; paint('next'); };
      BP.SND.play('page');
    };
    const close = () => { m.classList.remove('in'); setTimeout(() => m.remove(), 240); };
    paint();
    requestAnimationFrame(() => m.classList.add('in'));
    /* 滑动翻页 */
    let sx = 0, sy = 0;
    m.addEventListener('touchstart', (e) => { sx = e.touches[0].clientX; sy = e.touches[0].clientY; }, { passive: true });
    m.addEventListener('touchend', (e) => {
      const dx = e.changedTouches[0].clientX - sx, dy = e.changedTouches[0].clientY - sy;
      if (Math.abs(dx) < 50 || Math.abs(dy) > Math.abs(dx)) return;
      if (dx < 0 && p < pages.length - 1) { p++; paint('next'); }
      if (dx > 0 && p > 0) { p--; paint('prev'); }
    });
  }
  /* 小说页：封面 + 目录 + 继续阅读 */
  /* 小说摘要：首页卡片用一行字说明读到哪儿 */
  function novelBrief(k) {
    if (!k.novel || !k.novel.read) return '每个年级一本书 · 主角就是你';
    const nv = ensureNovel(k);
    let d = 0;
    NOVEL.forEach((_, i) => { if (nv.done[i]) d++; });
    if (d >= NOVEL.length) return '已读完 ' + NOVEL.length + '/' + NOVEL.length + ' 章 · 可以重读';
    return '已读 ' + d + '/' + NOVEL.length + ' 章 · 继续读第 ' + ((nv.c || 0) + 1) + ' 章';
  }

  function viewNovel() {
    const k = kid(); if (!k) return;
    ensureKid(k);
    const nv = ensureNovel(k);
    const ctx = novelCtx(k);
    const q = questState(k);
    const total = NOVEL.length;
    let readN = 0, doneN = 0;
    NOVEL.forEach((_, i) => { if (nv.read[i]) readN++; if (nv.done[i]) doneN++; });
    /* 继续阅读：第一本没读完的章 */
    let cont = 0;
    for (let i = 0; i < total; i++) { if (!nv.done[i]) { cont = i; break; } if (i === total - 1) cont = total - 1; }
    const pct = Math.round(doneN / total * 100);
    const cover =
      '<div class="nv-hero">' +
      '<div class="nv-cover"><span class="nvc-em">📖</span><b>知识大陆</b><small>' + ctx.gn + ' · 冒险小说</small>' +
      '<i class="nvc-line"></i><em>著 · ' + ctx.name + ' 与 ' + ctx.pet + '</em></div>' +
      '<div class="nv-hr"><b>一本书，五段旅程</b><small>' + doneN + '/' + total + ' 章读完 · ' + pct + '%</small>' +
      '<div class="nv-hbar"><i style="width:' + pct + '%"></i></div>' +
      '<button class="btn" id="nvCont">' + (readN ? '📖 继续阅读' : '📖 从序章开始') + '</button></div></div>';
    const rows = NOVEL.map((ch, i) => {
      const title = typeof ch.t === 'function' ? ch.t(ctx) : ch.t;
      const locked = ch.locked && !q.trophy;
      const rd = nv.read[i] || 0;
      const pages = ch.pages(ctx).length;
      return '<button class="nv-row' + (nv.done[i] ? ' done' : '') + (locked ? ' lock' : '') + '" data-c="' + i + '">' +
        '<span class="nvr-em">' + (locked ? '🔒' : ch.em) + '</span>' +
        '<span class="nvr-t"><b>' + esc(title) + '</b><small>' +
        (locked ? '通关最终决战后解锁' : nv.done[i] ? '已读完 · 点开重读' : rd ? '读到第 ' + rd + '/' + pages + ' 页' : (ch.sub || '待阅读')) + '</small></span>' +
        '<span class="nvr-go">' + (locked ? '🔒' : rd ? '继续' : '阅读') + '</span></button>';
    }).join('');
    BP.$view.innerHTML = '<div class="page novel-page">' + cover +
      '<div class="section-h" style="margin-top:14px"><h2>📚 目录</h2><span class="sub">每章末尾可直达关卡</span></div>' +
      '<div class="nv-list">' + rows + '</div>' +
      '<div class="tiny" style="margin:12px 4px;line-height:1.7">读小说不占时间也不掉分：剧情里的知识咒语就是这一章要掌握的知识点，读完再去闯关，题目会眼熟很多。</div>' +
      '</div>';
    const open = (i, p) => {
      const ch = NOVEL[i];
      if (ch.locked && !q.trophy) return toast('🔒 先把知识魔王打赢，终章才解锁');
      novelReader(k, i, p == null ? 0 : p);
    };
    document.getElementById('nvCont').onclick = () => {
      const ch = NOVEL[cont];
      if (ch.locked && !q.trophy) return open(0, 0);
      novelReader(k, cont, Math.max(0, (nv.read[cont] || 1) - 1));
    };
    document.querySelectorAll('.nv-row').forEach((b) => (b.onclick = () => {
      const i = +b.dataset.c;
      open(i, Math.max(0, (nv.read[i] || 1) - 1));
    }));
  }

  /* ================= v3.30 知识图谱关卡引擎 =================
     每章 30 个知识点：英语 8（6 单词 + 2 句型）· 数学 8 · 语文 8 · 科学 4 · 道法 2
     每个知识点 3 级关卡（识记 / 练习 / 精通）→ 90 关 + 章 Boss
     5 章 + 章末宝箱 + 学年决战 = 每学年 460 关；1-6 年级合计 2760 关
     每年级 150 个知识点全部来自知识图谱，无占位、无重复
     关卡不一次性铺开：每章只渲染当前进度附近的一小段（见 viewQuest 的视窗逻辑） */
  const KN_PER_CHAP = 30;
  const KN_STAGES = 3;
  const STAGE_NAME = ['识记', '练习', '精通'];
  /* 每章各科知识点配额（与知识图谱总量严格对齐：40/40/20/10/词句 40） */
  const KN_MIX = { en: 8, math: 8, cn: 8, sci: 4, eth: 2 };
  function buildChapterKn(g, c) {
    /* 大图谱全量：把每科知识点均分到 5 章，每章铺开该科的一段，5 章覆盖全部 */
    const CH = 5;
    const arr = (a) => (a && a.length) ? a : [];
    const slice = (a) => {
      const per = Math.ceil(a.length / CH);
      return a.slice(c * per, (c + 1) * per);
    };
    const pools = {
      en:   slice(arr(EN_KN[g]   || EN_KN.g3)).map(n => ({ s: 'en',   n: '单词 · ' + n })),
      math: slice(arr(MATH_KN[g] || MATH_KN.g3)).map(n => ({ s: 'math', n })),
      cn:   slice(arr(CN_KN[g]   || CN_KN.g3)).map(n => ({ s: 'cn',   n })),
      sci:  slice(arr(SCI_KN[g]  || SCI_KN.g3)).map(n => ({ s: 'sci',  n })),
      eth:  slice(arr(ETH_KN[g]  || ETH_KN.g3)).map(n => ({ s: 'eth',  n }))
    };
    const keys = ['en', 'math', 'cn', 'sci', 'eth'];
    const target = keys.reduce((t, k) => t + pools[k].length, 0);
    const list = [];
    let guard = 0;
    while (list.length < target && guard++ < 1000) {
      let took = false;
      keys.forEach((k) => {
        if (list.length >= target) return;
        if (pools[k].length) { list.push(pools[k].shift()); took = true; }
      });
      if (!took) break;
    }
    return list;
  }
  function buildMap(g) {
    const nodes = [];
    for (let c = 0; c < 5; c++) {
      const kns = buildChapterKn(g, c);
      kns.forEach((kn) => {
        for (let st = 1; st <= KN_STAGES; st++) {
          nodes.push({
            t: 'kn', u: c, subj: kn.s, kn: kn.n, stage: st, sk: kn.sk || '',
            lv: Math.min(4, st + (c >= 4 ? 1 : 0)),
            qn: st === 1 ? 2 : 3
          });
        }
      });
      /* 章 Boss：学科轮换，难度随章加深 */
      nodes.push({ t: 'boss', u: c, subj: SUBJ_ROT[c * 3 % SUBJ_ROT.length], lv: Math.min(4, 2 + Math.floor(c / 2)) });
      if (c < 4) nodes.push({ t: 'treasure', u: c });
    }
    nodes.push({ t: 'final', u: 4, lv: 4 });
    return nodes.map((n, i) => Object.assign(n, { i, done: false, stars: 0 }));
  }
  /* 关卡总数（供 UI 展示，不生成节点） */
  function mapSize(g) {
    let n = 0;
    for (let c = 0; c < 5; c++) { n += buildChapterKn(g, c).length * KN_STAGES + 1; if (c < 4) n += 1; }
    return n + 1;
  }
  function ensureMapFields(q) {
    if (!Array.isArray(q.nodes)) return;
    q.nodes.forEach((n) => {
      const need = n.t === 'kn' || n.t === 'battle' || n.t === 'review' || n.t === 'boss' || n.t === 'final';
      if (!need) return;
      if (n.subj == null && n.t !== 'final') n.subj = SUBJ_ROT[(n.i || 0) % SUBJ_ROT.length];
      if (n.stage == null && n.t === 'kn') n.stage = 1;
      if (n.lv == null) n.lv = n.t === 'final' ? 4 : n.i != null ? Math.min(4, Math.floor(n.i / q.nodes.length * 5)) : 2;
    });
  }
  function questState(k) {
    const g = gradeOf(k);
    /* 大图谱全量地图（ver=6，知识点全量铺开）：
       旧版关卡按通关比例平移到新图，老玩家的进度不清零。 */
    if (!k.quest || k.quest.grade !== g || !Array.isArray(k.quest.nodes) || k.quest.ver !== 6) {
      const oldQ = k.quest;
      const oldNodes = (oldQ && Array.isArray(oldQ.nodes)) ? oldQ.nodes : [];
      const oldDone = oldNodes.filter((n) => n.done).length;
      const nodes = buildMap(g);
      if (oldDone > 0 && oldNodes.length > 1) {
        const ratio = oldDone / oldNodes.length;
        const target = Math.max(1, Math.min(nodes.length - 1, Math.round(ratio * (nodes.length - 1))));
        for (let i = 0; i < target; i++) { nodes[i].done = true; nodes[i].stars = 3; }
      }
      k.quest = {
        grade: g, ver: 6, nodes,
        cards: (oldQ && oldQ.cards) || [],
        badges: (oldQ && oldQ.badges) || [],
        trophy: false, built: todayStr(),
        vis: {}   /* 每章「已展开到第几组」的视窗状态 */
      };
      P.save();
    }
    if (!k.quest.vis) k.quest.vis = {};
    return k.quest;
  }
  const curIdx = (q) => { for (let i = 0; i < q.nodes.length; i++) if (!q.nodes[i].done) return i; return -1; };
  const wrongOpen = (k) => (k.wrongBook || []).filter((w) => !w.ok);
  /* 老数据/新用户兜底：补齐游戏所需字段 */
  function ensureKid(k) {
    if (!Array.isArray(k.wrongBook)) k.wrongBook = [];
    if (!k.frags) k.frags = {};
    if (!Array.isArray(k.aid)) k.aid = [];
    if (ensurePetSys) ensurePetSys(k);
  }

  /* ================= v3.24 稀有度 / 掉落 / 助战 ================= */
  const RAR = {
    N:   { name: '普通', c: '#8fa0b3', w: 52 },
    R:   { name: '稀有', c: '#4da3ff', w: 28 },
    SR:  { name: '史诗', c: '#b46bff', w: 15 },
    SSR: { name: '传说', c: '#ffb300', w: 5 }
  };
  const rarOf = (t) => {
    if (BP.PETS[t] && BP.PETS[t].rar) return BP.PETS[t].rar;
    const n = parseInt(String(t).replace(/\D/g, ''), 10) || 0;
    if (String(t)[0] === 'S' && n >= 101) return 'SSR';
    if (n >= 81) return 'SR';
    if (n >= 41) return 'R';
    return 'N';
  };
  function rollRarity(pool) {
    const ps = pool.map((r) => ({ r, w: RAR[r].w }));
    const tot = ps.reduce((s, x) => s + x.w, 0);
    let v = Math.random() * tot;
    for (const x of ps) { v -= x.w; if (v <= 0) return x.r; }
    return ps[0].r;
  }
  const petsOfRar = (r) => Object.keys(BP.PETS).filter((t) => rarOf(t) === r);
  /* 随机掉一只指定稀有度的宠物（优先未收集的） */
  function dropPetOf(k, q, rar) {
    if (!Array.isArray(q.cards)) q.cards = [];
    const owned = new Set(q.cards);
    let cands = petsOfRar(rar).filter((t) => !owned.has(t));
    if (!cands.length) cands = Object.keys(BP.PETS).filter((t) => !owned.has(t));
    if (!cands.length) cands = Object.keys(BP.PETS);
    const card = pick(cands);
    q.cards.push(card);
    return card;
  }
  /* 掉 1 枚碎片：普通关卡以 N/R 为主，boss 碎片含 SR */
  function dropFrag(k, pool) {
    k.frags = k.frags || {};
    const r = rollRarity(pool || ['N', 'R', 'SR']);
    const t = pick(petsOfRar(r));
    k.frags[t] = (k.frags[t] || 0) + 1;
    return t;
  }
  const fragAll = (k) => Object.values(k.frags || {}).reduce((s, x) => s + x, 0);
  /* 助战：Lv6/9/12 解锁 1/2/3 个栏位，从收集的宠物卡里选 */
  const aidSlots = (k) => (k.pet.lv >= 12 ? 3 : k.pet.lv >= 9 ? 2 : k.pet.lv >= 6 ? 1 : 0);
  function aidList(k) { return (k.aid || []).filter(Boolean).slice(0, 3).map((t) => 'images/gif/' + t + '-growth.gif'); }
  function ensureAid(k) { if (!Array.isArray(k.aid)) k.aid = []; }

  /* ================= 答题引擎（全屏覆盖层） =================
     cfg: {qs, enemy:{em,name,hp}, mode:'battle'|'single'|'drill',
           onEnd(result {win, stars, right, total, wrongQs}) } */
  function quizRun(cfg) {
    resetBigBankUsed();  /* v3.44：每局重置大图谱去重 */
    const k = kid();
    let idx = 0, petHp = 3 + (cfg.aid ? cfg.aid.length : 0), eHp = cfg.enemy ? cfg.enemy.hp : 0;
    const results = []; /* v3.27 逐题对错记录，供知识点掌握分析 */
    const wrongQs = [];
    const el = document.createElement('div');
    el.className = 'qz-mask';
    document.body.appendChild(el);
    /* v3.40 BGM 只在战斗中播放：有敌人的关卡开播治愈战斗曲，退出/结束即停 */
    if (cfg.enemy) BP.SND.bgmStart('battle');
    const stopBgm = () => BP.SND.bgmStop();
    const petSrc = petImg(k);
    const petName = BP.displayName(k);
    /* v3.32: 武器 + 宠物稀有度 → 助战协力概率加成 */
    const hitBonus = (function () {
      ensurePetSys(k);
      const mwd = BP.wardOf ? BP.wardOf(k, 'main') : k.wardrobe;
      const w = mwd && mwd.hand && BP.WEAPONS[mwd.hand];
      return ((w && w.fx && w.fx.hit) || 0) + (BP.rarFx(k.pet.type).hit || 0);
    })();

    function headHTML() {
      return '<div class="qz-top"><button class="qz-x" id="qzX">✕</button>' +
        '<div class="qz-prog">' + cfg.qs.map((_, i) => '<i class="' + (i < idx ? 'ok' : i === idx ? 'now' : '') + '"></i>').join('') + '</div>' +
        '<div class="qz-hp">' + (cfg.enemy ? '❤️'.repeat(Math.max(0, petHp)) : '') + '</div></div>';
    }
    function aidChips() {
      return (cfg.aid && cfg.aid.length) ? '<div class="qz-aids">' +
        cfg.aid.map((a, i) => '<span class="qz-aid" data-i="' + i + '"><img src="' + a + '" alt=""></span>').join('') + '</div>' : '';
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
          '<div class="qz-vs"><img class="qz-pet ' + (cfg.mode === 'drill' ? '' : '') + '" id="qzPet" src="' + petSrc + '" alt=""></div>' +
          aidChips()
          : '<div class="qz-solo"><img class="qz-pet" id="qzPet" src="' + petSrc + '" alt=""><div class="qz-petnm">' + esc(petName) + '</div></div>') +
        '<div class="qz-card"><div class="qz-no">第 ' + (idx + 1) + ' / ' + cfg.qs.length + ' 题</div>' +
        '<div class="qz-qq">' + esc(q.q) + '</div>' +
        '<div class="qz-opts">' + q.opts.map((o, i) => '<button class="qz-opt" data-i="' + i + '">' + esc(o) + '</button>').join('') + '</div>' +
        '<div class="qz-fb" id="qzFb"></div></div>' +
        '</div>';
      el.querySelector('#qzX').onclick = () => { if (confirm('中途退出本题不记录成绩，确定退出？')) { stopBgm(); el.remove(); } };
      el.querySelectorAll('.qz-opt').forEach((b) => (b.onclick = () => answer(+b.dataset.i, b)));
      /* 自动化测试钩子: 仅当测试脚本显式写入 sessionStorage 时生效 */
      if (sessionStorage.getItem('qzTestMark')) el.querySelectorAll('.qz-opt')[q.a].style.border = '3px solid gold';
    }
    function answer(i, btn) {
      const q = cfg.qs[idx];
      const right = i === q.a;
      results.push({ q, ok: right });
      el.querySelectorAll('.qz-opt').forEach((b) => (b.disabled = true));
      btn.classList.add(right ? 'good' : 'bad');
      if (!right) {
        BP.SND.play('wrong'); BP.SND.play('hurt');
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
        BP.SND.play('right', !!cfg.enemy);
        const pet = el.querySelector('#qzPet');
        if (pet) { pet.classList.add('atk'); setTimeout(() => pet.classList.remove('atk'), 500); }
        const foe = el.querySelector('#foeCard');
        if (foe) { foe.classList.add('hit'); setTimeout(() => foe.classList.remove('hit'), 400); }
        /* 助战宠物协战：每只 22% 概率追加 1 点伤害 */
        let extra = 0;
        if (cfg.enemy && cfg.aid) cfg.aid.forEach((a, i) => {
          if (Math.random() < 0.22 + hitBonus) {
            extra++;
            const chip = el.querySelector('.qz-aid[data-i="' + i + '"]');
            if (chip) { chip.classList.add('go'); setTimeout(() => chip.classList.remove('go'), 600); }
          }
        });
        if (extra) {
          eHp -= extra;
          const foe2 = el.querySelector('#foeCard');
          if (foe2) { foe2.classList.add('hit'); setTimeout(() => foe2.classList.remove('hit'), 500); }
        }
        const fb = el.querySelector('#qzFb');
        fb.innerHTML = pick(['🎉 太棒了！', '✨ 答对啦！', '🔥 厉害！', '💫 知识就是力量！']) + (extra ? '<small class="aid-fx">🤝 助战宠物协力攻击 ×' + extra + '！</small>' : '');
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
      stopBgm();
      BP.SND.play(win ? 'victory' : 'lose');
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
      if (cfg.onEnd) cfg.onEnd({ win, stars, right, total, wrongQs, results });
    }
    render();
    return el;
  }

  /* ================= 奖励发放 ================= */
  function reward(k, pts, exp, text, em, subj) {
    if (pts) grantPoints(k, pts, text, subj || 'all');
    if (exp) { addExp(k, exp); addSubjExp(k, subj, exp); }
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
    ensureKid(k);
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
            reward(k, 2, 10, '完成每日答题「' + QTYPES[t.ty].name + '」', QTYPES[t.ty].icon, 'en');
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
      reward(k, 5, 15, '完成全部每日答题，打开打卡宝箱', '🎁', 'en');
      P.save();
      /* v3.38: 还有学科没宠物时，宝箱必掉一只 */
      const missS = (BP.SUBJ_LIST || []).filter((s) => !k.subjPets[s.k]).map((s) => s.k);
      chestFX('+5 积分 · +15 经验 · 连续打卡 ' + d.streak + ' 天', () => {
        if (missS.length && BP.grantSubjPet) {
          const sk = missS[Math.floor(Math.random() * missS.length)];
          BP.grantSubjPet(k, sk, (pp) => {
            if (pp && BP.petDropFXShow) BP.petDropFXShow(pp.type, (BP.SUBJ_LIST || []).find((x) => x.k === sk));
            else render();
          });
        } else render();
      });
    };
  }
  /* 掉落宠物展示（带稀有度光效） */
  function petDropFX(card, k, cb) {
    const meta = BP.PETS[card] || { name: card, emoji: '🐾' };
    const rar = rarOf(card), R = RAR[rar];
    BP.SND.play(rar === 'SSR' ? 'dropSSR' : 'drop');
    const m = document.createElement('div');
    m.className = 'evo-mask';
    m.innerHTML = '<div class="evo-box drop-box" style="border-color:' + R.c + ';box-shadow:0 0 40px ' + R.c + '66">' +
      '<i class="drop-rays" style="--rc:' + R.c + '"></i>' +
      '<div class="rar-chip" style="background:' + R.c + '">' + rar + ' · ' + R.name + '</div>' +
      '<div class="big img"><img src="' + BP.imgFor(card, 2) + '" alt=""></div>' +
      '<h2>🐾 获得' + (rar === 'SSR' ? '传说' : '') + '宠物！</h2>' +
      '<p>' + meta.emoji + ' <b>' + esc(meta.name) + '</b><br>已收入图鉴 · 可在收集页设为助战</p>' +
      '<button class="btn sm" style="margin-top:14px;background:#ffd76e;color:#5b3a00" id="pdOk">收下啦</button></div>';
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
    m.querySelector('#pdOk').onclick = close;
    m.onclick = (e) => { if (e.target === m) close(); };
  }

  /* ================= v3.32 Boss 掉落饰品/武器（带光柱特效 + 音效） ================= */
  function rollItemDrop(tier) {
    /* tier: 'boss' | 'final' —— 决战稀有度更高 */
    let rar;
    if (tier === 'final') rar = Math.random() < .6 ? 'SSR' : 'SR';
    else rar = Math.random() < .12 ? 'SSR' : (Math.random() < .5 ? 'SR' : 'R');
    const isAcc = Math.random() < .5;
    const pool = isAcc
      ? Object.keys(BP.ACCS).filter((id) => (BP.ACCS[id].rar || 'R') === rar)
      : Object.keys(BP.WEAPONS).filter((id) => BP.WEAPONS[id].rar === rar);
    if (!pool.length) return null;
    return { kind: isAcc ? 'acc' : 'wpn', id: pick(pool), rar };
  }
  function giveItemDrop(k, d) {
    if (!d) return;
    if (d.kind === 'acc') {
      if (!k.owned.includes(d.id)) k.owned.push(d.id);
    } else {
      if (!k.weapons) k.weapons = [];
      if (!k.weapons.includes(d.id)) k.weapons.push(d.id);
      if (!k.wardrobes || typeof k.wardrobes !== 'object') k.wardrobes = {};
      const mwd = k.wardrobes.main || (k.wardrobes.main = k.wardrobe || {});
      k.wardrobe = mwd;
      if (!mwd.hand) mwd.hand = d.id; /* 首件自动装备（主宠物） */
    }
  }
  function itemDropFX(d, k, cb) {
    if (!d) { if (cb) cb(); return; }
    const def = d.kind === 'acc' ? BP.ACCS[d.id] : BP.WEAPONS[d.id];
    const R = RAR[d.rar] || RAR.R;
    BP.SND.play(d.rar === 'SSR' ? 'dropSSR' : 'drop');
    const m = document.createElement('div');
    m.className = 'evo-mask';
    m.innerHTML = '<div class="evo-box drop-box" style="border-color:' + R.c + ';box-shadow:0 0 40px ' + R.c + '66">' +
      '<i class="drop-rays" style="--rc:' + R.c + '"></i>' +
      '<div class="rar-chip" style="background:' + R.c + '">' + d.rar + ' · ' + R.name + (d.kind === 'wpn' ? ' 武器' : ' 饰品') + '</div>' +
      '<div class="big img idrop" style="font-size:76px;color:' + R.c + '">' + def.e + '</div>' +
      '<h2>' + (d.kind === 'wpn' ? '⚔️ Boss 掉落武器！' : '🎀 Boss 掉落饰品！') + '</h2>' +
      '<p><b>' + esc(def.n) + '</b><br>' + esc(def.d || '装扮后宠物形象同步更新') + '</p>' +
      '<button class="btn sm" style="margin-top:14px;background:#ffd76e;color:#5b3a00" id="idOk">收下啦</button></div>';
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
    m.querySelector('#idOk').onclick = close;
    m.onclick = (e) => { if (e.target === m) close(); };
  }

  /* v3.40 碎片掉落小卡：普通关卡打完也能看见「掉什么」 */
  function fragDropFX(ft, sub) {
    const meta = BP.PETS[ft] || { name: '', emoji: '🧩' };
    const rar = rarOf(ft), R = RAR[rar];
    BP.SND.play('frag');
    const m = document.createElement('div');
    m.className = 'frag-drop';
    m.innerHTML = '<div class="fd-card" style="border-color:' + R.c + ';box-shadow:0 6px 24px ' + R.c + '44">' +
      '<i class="drop-rays" style="--rc:' + R.c + '"></i>' +
      '<span class="fd-img"><img src="' + BP.imgFor(ft, 1) + '" alt="" onerror="this.style.display=\'none\'"><i class="rar-tag" style="background:' + R.c + '">' + rar + '</i></span>' +
      '<div class="fd-t"><b>🧩 掉落「' + esc(meta.name) + '」碎片 ×1</b>' + (sub ? '<small>' + esc(sub) + '</small>' : '') + '</div></div>';
    document.body.appendChild(m);
    requestAnimationFrame(() => m.classList.add('in'));
    const rm = () => { if (!m.parentNode) return; m.classList.remove('in'); setTimeout(() => m.remove(), 300); };
    m.onclick = rm;
    setTimeout(rm, 2600);
  }

  /* ================= v3.24 每日互动（每天首次给经验） ================= */
  const INTERS = {
    pat:  { em: '🫶', label: '摸摸头', parts: ['💖', '✨', '😊'], lines: ['蹭了蹭你的手心', '眯起眼睛很享受', '尾巴摇成了小风扇'] },
    feed: { em: '🍖', label: '喂食', parts: ['🍗', '😋', '💖'], lines: ['吧唧吧唧吃得真香', '还想再来一份！', '吃饱了更有劲学习'] },
    play: { em: '🎾', label: '玩耍', parts: ['🎾', '⭐', '😆'], lines: ['追着球满地打滚', '接住啦！好身手！', '玩得不想停下来'] }
  };
  function petInteract(k, kind) {
    const it = INTERS[kind] || INTERS.pat;
    const stage = document.querySelector('.stage .pet-zone');
    const pet = document.querySelector('#petTap');
    if (pet) {
      pet.classList.add('inter-go');
      setTimeout(() => pet.classList.remove('inter-go'), 800);
    }
    /* 粒子动效 */
    if (stage) {
      for (let i = 0; i < 6; i++) {
        const s = document.createElement('span');
        s.className = 'inter-part';
        s.textContent = it.parts[rnd(it.parts.length)];
        s.style.left = (25 + Math.random() * 50) + '%';
        s.style.animationDelay = (i * 0.08) + 's';
        stage.appendChild(s);
        setTimeout(() => s.remove(), 1600);
      }
    }
    const first = !k.inter || k.inter.date !== todayStr();
    if (first) {
      k.inter = { date: todayStr(), kind };
      addExp(k, 3);
      addLog(k, it.em, '和' + (k.pet.name || '宠物') + it.label + ' · 每日首次互动 +3 经验', 0);
      P.save();
      toast('🫧 ' + (k.pet.name || '宠物') + pick(it.lines) + ' · +3 EXP ✨');
      const bar = document.querySelector('.exp-bar i'), num = document.querySelector('.exp-num');
      if (bar && num) {
        const need = BP.expNeed(k.pet.lv);
        bar.style.width = Math.min(100, Math.round(k.pet.exp / need * 100)) + '%';
        num.textContent = k.pet.exp + '/' + need + ' EXP';
      }
    } else {
      toast('🫧 ' + (k.pet.name || '宠物') + pick(it.lines) + '（今天的互动经验已领过啦）');
    }
  }

  function chestFX(text, cb) {    const m = document.createElement('div');
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
  /* 视窗：一次只铺开当前进度附近的一小段（渐近式），越往后越不让提前看 */
  const VIS_DEFAULT = 2;   /* 默认可见组数：当前组 + 下一组 */
  const VIS_MAX = 4;       /* 手动展开上限：最多再往后 2 组 */
  function chapView(q, c, groups, curG, allDone) {
    if (!q.vis) q.vis = {};
    const v = q.vis[c] || (q.vis[c] = {});
    const len = groups.length;
    let e = v.e == null ? Math.min(len, (allDone ? len : curG + VIS_DEFAULT)) : v.e;
    /* 渐近线：进度越过关卡视野时，视野自动跟着进度往前推 */
    if (!allDone && curG >= e) { e = Math.min(len, curG + 1); v.e = e; v.b = null; }
    e = Math.max(1, Math.min(len, e));
    let b = v.b == null ? Math.max(0, e - 3) : v.b;
    b = Math.max(0, Math.min(b, e - 1));
    const cap = allDone ? len : Math.min(len, curG + VIS_MAX);
    return { b, e, cap, len };
  }
  function viewQuest() {
    const k = kid(); if (!k) return;
    ensureKid(k);
    const q = questState(k);
    ensureMapFields(q);
    const g = gradeOf(k);
    const ci = curIdx(q);
    const curChap = ci >= 0 ? q.nodes[ci].u : 4;
    const total = q.nodes.length;
    const doneN = q.nodes.filter((n) => n.done).length;
    const pct = total ? Math.round(doneN / total * 100) : 0;
    const finalLocked = wrongOpen(k).length > 0;
    const chapName = ['一', '二', '三', '四', '五'];

    /* 单关节点（Boss / 宝箱 / 决战） */
    const renderSpecial = (n) => {
      const meta = NODE_META[n.t] || { icon: '📘', name: '知识点' };
      const locked = (ci === -1 ? false : n.i > ci) || (n.t === 'final' && finalLocked);
      const cur = n.i === ci && !(n.t === 'final' && finalLocked);
      const S = n.subj ? SUBJ[n.subj] : null;
      const icon = n.t === 'boss' ? (S ? S.icon : '👹') : n.t === 'treasure' ? '📦' : n.t === 'final' ? '👑' : meta.icon;
      const name = n.t === 'boss' ? (S ? S.name + '·' + S.bosses[n.u % S.bosses.length] : BOSSES[n.u])
        : n.t === 'treasure' ? '神秘宝箱' : n.t === 'final' ? '知识魔王' : meta.name;
      const dot = n.done ? (n.t === 'treasure' ? '📦' : '✅') : locked ? '🔒' : icon;
      return '<button class="adv-node t-' + n.t + ' ' + (n.done ? 'done' : '') + (cur ? ' cur' : '') + (locked ? ' lock' : '') + '" data-i="' + n.i + '">' +
        '<span class="an-dot">' + dot + '</span>' +
        '<span class="an-lb"><b>' + esc(name) + '</b><small>' +
        (n.done ? '⭐'.repeat(n.stars) + '☆'.repeat(3 - n.stars)
          : n.t === 'final' ? (finalLocked ? '🔒 先订正错题' : '🎓 学年最强')
            : n.t === 'boss' ? '章节 Boss · 难度 ' + '●'.repeat(n.lv + 1)
              : '打开有惊喜') + '</small></span>' +
        (cur ? '<span class="qn-go">GO</span>' : '') + '</button>';
    };
    /* 知识点组：一个知识点 3 个难度关 */
    const renderGroup = (grp, pos) => {
      const items = grp.items.slice().sort((x, y) => (x.stage || 1) - (y.stage || 1));
      const first = items[0];
      const doneC = items.filter((x) => x.done).length;
      const cur = items.some((x) => x.i === ci);
      const locked = first.i > ci;
      const S = SUBJ[grp.subj] || { icon: '📘', name: '综合', c: '#8899aa' };
      const dots = items.map((n) => {
        const dn = n.done, cu = n.i === ci;
        const lk = n.i > ci;
        return '<button class="kn-dot' + (dn ? ' done' : '') + (cu ? ' cur' : '') + (lk && !cu ? ' lock' : '') +
          '" data-i="' + n.i + '" title="' + STAGE_NAME[(n.stage || 1) - 1] + '">' +
          (dn ? '✓' : cu ? 'GO' : lk ? '·' : '▶') + '<i>' + STAGE_NAME[(n.stage || 1) - 1].slice(0, 1) + '</i></button>';
      }).join('');
      return '<div class="kn-row pos-' + (pos % 4) + (doneC === items.length ? ' done' : '') + (cur ? ' cur' : '') + (locked ? ' lock' : '') + '">' +
        '<div class="kn-info"><i class="qkn-tag" style="background:' + S.c + '">' + S.icon + ' ' + S.name + '</i>' +
        '<b>' + esc(grp.kn) + '</b>' +
        '<small>' + (doneC === items.length ? '已掌握 ⭐ 三级全通' : '难度 ' + (doneC + 1) + '/3 · ' + STAGE_NAME[doneC] + ' 待挑战') + '</small></div>' +
        '<div class="kn-dots">' + dots + '</div></div>';
    };

    let html = '<div class="adv-map">';
    for (let c = 0; c < 5; c++) {
      const chNodes = q.nodes.filter((n) => n.u === c);
      const groups = [];
      chNodes.forEach((n) => {
        if (n.t === 'kn') {
          const last = groups[groups.length - 1];
          if (last && last.kn === n.kn && !last.special) last.items.push(n);
          else groups.push({ kn: n.kn, subj: n.subj, items: [n] });
        } else groups.push({ special: n, items: [n] });
      });
      let curG = groups.findIndex((x) => x.items.some((n) => !n.done));
      const allDone = curG < 0;
      if (allDone) curG = groups.length;
      const v = chapView(q, c, groups, curG, allDone);
      if (!q.vis[c]) q.vis[c] = {};
      const open = q.vis[c].open == null ? (c === curChap) : q.vis[c].open === true;
      const chapDone = groups.reduce((s, x) => s + x.items.filter((n) => n.done).length, 0);
      const chapTotal = groups.reduce((s, x) => s + x.items.length, 0);
      const G = DB[g];
      html += '<div class="adv-chap chap-' + (c % 5) + (open ? ' open' : ' folded') + (c === curChap ? ' now' : '') + '">' +
        '<button class="ac-head" data-chap="' + c + '"><b>第' + chapName[c] + '章 · ' + esc(G.units[c].t) + '</b>' +
        '<span class="ac-cnt">' + chapDone + '/' + chapTotal + (q.badges.includes(c) ? ' · ' + G.units[c].em + '徽章' : '') + '</span>' +
        '<span class="ac-arrow">' + (open ? '▾' : '▸') + '</span></button>' +
        '<div class="ac-prog"><i style="width:' + (chapTotal ? Math.round(chapDone / chapTotal * 100) : 0) + '%"></i></div>';
      if (open) {
        html += '<div class="ac-story">' + esc(CHAP_STORY[c]) + '</div>';
        if (v.b > 0) html += '<button class="adv-more up" data-chap="' + c + '" data-dir="up">↑ 前面还有 ' + v.b + ' 组已通关知识点（回看）</button>';
        html += '<div class="ac-path">';
        groups.slice(v.b, v.e).forEach((grp, idx) => {
          html += grp.special ? renderSpecial(grp.special) : renderGroup(grp, v.b + idx);
        });
        html += '</div>';
        if (v.e < v.len) {
          html += '<button class="adv-more down" data-chap="' + c + '" data-dir="down" data-cap="' + v.cap + '">' +
            (v.e < v.cap ? '展开后续关卡（还有 ' + (v.len - v.e) + ' 组 · ' + ((v.len - v.e) * 3) + ' 关）' : '🔒 先通关当前知识点，后面的会逐步解锁') + '</button>';
        }
      }
      html += '</div>';
    }
    /* 最终决战 */
    const fin = q.nodes[q.nodes.length - 1];
    html += '<div class="adv-chap chap-final open"><div class="ac-head"><b>🎓 最终决战</b></div>' +
      '<div class="ac-story">' + esc(CHAP_STORY[4]) + '</div><div class="ac-path">' + renderSpecial(fin) + '</div></div>';
    html += '</div>';

    BP.$view.innerHTML = '<div class="page quest-page">' +
      '<div class="quest-hero">' +
      '<img class="qh-pet" src="' + petImg(k) + '" alt="">' +
      '<div class="qh-t"><b>' + gradeName(g) + ' · 知识冒险</b><small>' +
      (k.className ? esc(k.className) + ' · ' : '') +
      (q.trophy ? '🏆 已通关，可重刷拿满星' : '进度 ' + doneN + '/' + total + ' 关 · 大图谱 ' + ((MATH_KN[g]||MATH_KN.g3).length+(CN_KN[g]||CN_KN.g3).length+(EN_KN[g]||EN_KN.g3).length+(SCI_KN[g]||SCI_KN.g3).length+(ETH_KN[g]||ETH_KN.g3).length) + ' 个知识点') + '</small></div>' +
      '<div class="qh-btns"><button id="qKnMap" title="知识图谱">📚</button><button id="qColl" title="我的收集">🧸</button>' +
      '<button id="qNovel" title="冒险小说">📜</button>' +
      '<button id="qStory" title="剧情引子开关">' + (storyEnabled() ? '📖' : '⚡') + '</button>' +
      '<button id="qWrong" title="错题本">📕' + (wrongOpen(k).length ? '<b class="wr-n">' + wrongOpen(k).length + '</b>' : '') + '</button><button id="qGrade" title="切换年级">🎓</button></div></div>' +
      '<div class="qbar-wrap"><div class="qbar"><i style="width:' + pct + '%"></i></div>' +
      '<div class="qbar-lb"><span>本学年 ' + total + ' 关 · 已通关 ' + doneN + '</span><b>' + pct + '%</b></div></div>' +
      '<div class="tiny q-tip">🎯 大图谱全量知识点，每个 3 级关卡（识记 → 练习 → 精通）；只显示当前进度附近，通关后自动推进</div>' +
      html + '</div>';

    if (k.classCode) document.getElementById('qGrade').style.display = 'none';
    else document.getElementById('qGrade').onclick = () => pickGradeSheet((gg) => {
      if (gg === k.grade) return;
      const q2 = questState(k);
      const hasProgress = q2.nodes.some((n) => n.done);
      if (hasProgress && !confirm('切换到' + gradeName(gg) + '会重置当前冒险进度（收集保留），确定？')) return;
      k.grade = gg;
      k.quest = { grade: gg, ver: 6, nodes: buildMap(gg), cards: q2.cards, badges: [], trophy: false, built: todayStr(), vis: {} };
      P.save(); render(); toast('新的冒险：' + gradeName(gg) + ' · ' + mapSize(gg) + ' 关');
    });
    document.getElementById('qColl').onclick = () => collSheet(k, q);
    document.getElementById('qNovel').onclick = () => { location.hash = '#/novel'; };
    document.getElementById('qStory').onclick = () => {
      const on = !storyEnabled();
      try { localStorage.setItem('beast.story', on ? 'on' : 'off'); } catch (e) {}
      render();
      toast(on ? '📖 剧情引子已开启：每关先看小说式开场' : '⚡ 剧情引子已关闭：点关直接开打');
    };
    document.getElementById('qWrong').onclick = () => wrongSheet(k, () => render());
    document.getElementById('qKnMap').onclick = () => knMapSheet(k, q);
    /* 章节折叠 / 视窗展开 */
    document.querySelectorAll('.ac-head').forEach((el) => (el.onclick = () => {
      const c = +el.dataset.chap;
      if (!q.vis) q.vis = {};
      const cur = q.vis[c] || (q.vis[c] = {});
      cur.open = !el.closest('.adv-chap').classList.contains('open');
      P.save(); render();
    }));
    document.querySelectorAll('.adv-more').forEach((el) => (el.onclick = () => {
      const c = +el.dataset.chap;
      const cur = q.vis[c] || (q.vis[c] = {});
      if (el.dataset.dir === 'up') cur.b = Math.max(0, (cur.b == null ? 0 : cur.b) - 3);
      else {
        const cap = +el.dataset.cap || 999;
        const curE = cur.e == null ? cap : cur.e;
        if (curE >= cap) return toast('先通关当前知识点，后面的关卡会逐步解锁 🔒');
        cur.e = Math.min(cap, curE + 1);
      }
      P.save(); render();
    }));
    document.querySelectorAll('.adv-node, .kn-dot').forEach((el) => (el.onclick = () => {
      const i = +el.dataset.i, n = q.nodes[i];
      if (!n) return;
      const myCi = curIdx(q);
      const locked = myCi !== -1 && i > myCi || (n.t === 'final' && wrongOpen(k).length > 0);
      if (locked) {
        if (n.t === 'final' && myCi === -1 && wrongOpen(k).length) return toast('错题本还有 ' + wrongOpen(k).length + ' 道题没订正，先把知识补牢！');
        return toast('这位知识点还没轮到，先完成前面的关卡');
      }
      tapNode(k, q, n, () => render());
    }));
  }
  /* 知识图谱总览：5 章 × 20 知识点，颜色=掌握度，数字=通关级数 */
  function knMapSheet(k, q) {
    const g = gradeOf(k);
    const chapName = ['一', '二', '三', '四', '五'];
    let body = '<div class="tiny">' + gradeName(g) + ' · 大图谱全量 ' + ((MATH_KN[g]||MATH_KN.g3).length+(CN_KN[g]||CN_KN.g3).length+(EN_KN[g]||EN_KN.g3).length+(SCI_KN[g]||SCI_KN.g3).length+(ETH_KN[g]||ETH_KN.g3).length) + ' 个知识点 · ' + mapSize(g) + ' 个关卡（每点 3 级）</div>';
    for (let c = 0; c < 5; c++) {
      const kns = buildChapterKn(g, c);
      const cNode = q.nodes.filter((n) => n.u === c && n.t === 'kn');
      const cDone = cNode.filter((n) => n.done).length;
      body += '<details class="knm-chap"' + (c === 0 ? ' open' : '') + '><summary><b>第' + chapName[c] + '章 · ' + esc(DB[g].units[c].t) + '</b><span>' + cDone + '/' + cNode.length + '</span></summary>' + kns.map((x) => {
        const st = (k.mastery || {})[g + '|' + x.s + '|' + x.n];
        const p = st ? Math.round(st.r / Math.max(1, st.r + st.w) * 100) : -1;
        const ns = q.nodes.filter((n) => n.u === c && n.t === 'kn' && n.kn === x.n);
        const d = ns.filter((n) => n.done).length;
        const cls = d >= 3 ? 'ok' : p >= 0 && p < 60 ? 'weak' : d > 0 ? 'ing' : '';
        const S = SUBJ[x.s] || { icon: '📘', name: '综合' };
        return '<div class="knm-it ' + cls + '"><span class="knm-em">' + S.icon + '</span>' +
          '<span class="knm-n">' + esc(x.n) + '</span><b>' + d + '/3</b>' +
          (p >= 0 ? '<small>' + p + '%</small>' : '<small>—</small>') + '</div>';
      }).join('') + '</details>';
    }
    body += '<div class="tiny" style="margin-top:8px">左侧图标=学科，右侧 3 级通关数，百分比=答题正确率。薄弱知识点优先出现在每日答题里。</div>';
    openSheet('<div class="sheet-h">📚 ' + gradeName(g) + '知识图谱</div>' + body);
  }
  function curIdxOk(i, q) { return i === curIdx(q); }

  /* ================= v3.27 知识点掌握 + 班级数据同步 ================= */
  function mastAdd(k, subj, knName, ok) {
    if (!k.mastery) k.mastery = {};
    const key = (k.grade || 'g3') + '|' + (subj || 'mix') + '|' + (knName || '综合');
    const m = k.mastery[key] || (k.mastery[key] = { r: 0, w: 0 });
    if (ok) m.r++; else m.w++;
  }
  /* 按学科聚合掌握度：{ en:{r,w}, math:{r,w}, ... } */
  function mastStats(k) {
    const out = {};
    Object.keys(SUBJ).forEach((s) => (out[s] = { r: 0, w: 0 }));
    Object.keys(k.mastery || {}).forEach((key) => {
      const subj = key.split('|')[1];
      if (!out[subj]) out[subj] = { r: 0, w: 0 };
      out[subj].r += k.mastery[key].r;
      out[subj].w += k.mastery[key].w;
    });
    return out;
  }
  /* 学生答题数据合入班级存储（老师端学情分析可见） */
  function syncClassData(k) {
    if (!k.classCode) return;
    /* 跨设备：学生手机上没有本机班级副本，必须先把快照推到云端 */
    try { if (window.BeastCloud) window.BeastCloud.report(k); } catch (e) {}
    try {
      const cd = JSON.parse(localStorage.getItem('beast.v1.class') || 'null');
      if (!cd || !Array.isArray(cd.classes)) return;
      cd.classes.forEach((c) => {
        if (c.code !== k.classCode) return;
        let stu = (c.kids || []).find((x) => x.sid === k.id) || (c.kids || []).find((x) => x.name === k.name);
        if (!stu) { stu = { name: k.name, points: 0, daily: {}, pet: { name: k.pet.name, type: k.pet.type, exp: 0, lv: k.pet.lv }, dex: { egg: true }, companions: [], milestones: [], skin: null, wrongBook: [], frags: {}, aid: [] }; c.kids.push(stu); }
        stu.sid = k.id;
        stu.joined = true;
        stu.mastery = k.mastery || {};
        stu.points = k.points;
        stu.pet = stu.pet || {};
        stu.pet.lv = k.pet.lv;
        stu.wrongN = (k.wrongBook || []).filter((w) => !w.ok).length;
      });
      localStorage.setItem('beast.v1.class', JSON.stringify(cd));
    } catch (e) {}
  }
  /* 学生加入班级（运行时入口） */
  function joinClassSheet(k, refresh) {
    openSheet('<div class="sheet-h">🏫 加入班级</div>' +
      '<div class="tiny">问老师要 6 位班级码，加入后年级随班级、每天答题数据同步给老师</div>' +
      '<div class="field"><label>班级码</label><input id="jcCode" maxlength="6" placeholder="比如：AB3CD5" style="text-transform:uppercase"></div>' +
      '<button class="btn" id="jcGo" style="margin-top:12px">加入</button>', (m, close) => {
      m.querySelector('#jcGo').onclick = () => {
        const code = m.querySelector('#jcCode').value.trim().toUpperCase();
        if (!code) return;
        const btn = m.querySelector('#jcGo');
        const doneLocal = () => {
          let cd = null;
          try { cd = JSON.parse(localStorage.getItem('beast.v1.class') || 'null'); } catch (e) {}
          const cls = cd && (cd.classes || []).find((c) => c.code === code);
          if (!cls) { toast('没找到班级码 ' + code + '，请向老师确认'); btn.textContent = '加入'; return false; }
          k.classCode = code;
          k.className = cls.name;
          if (cls.grade) k.grade = cls.grade;
          if (!k.quest || k.quest.grade !== k.grade) k.quest = null;
          P.save(); close(); if (refresh) refresh();
          toast('🏫 已加入 ' + cls.name + '（本机）');
          return true;
        };
        /* 优先云端：老师的班在老师的设备上，只有云端能跨过去 */
        const C = window.BEAST_CLOUD;
        if (!C) { doneLocal(); return; }
        btn.textContent = '连接班级…';
        C.join(code, {
          name: k.name, points: k.points || 0,
          petName: (k.pet && k.pet.name) || '', petType: (k.pet && k.pet.type) || '', petLv: (k.pet && k.pet.lv) || 1,
          grade: k.grade || '', mastery: k.mastery || {},
          sid: k.cloudSid, token: k.cloudToken
        }).then((j) => {
          k.classCode = code;
          k.className = (j.cls && j.cls.name) || '班级';
          k.cloudSid = j.sid;
          k.cloudToken = j.token;
          k.bonusApplied = (j.me && j.me.bonus) || 0;
          if (j.cls && j.cls.grade) {
            if (k.grade && k.grade !== j.cls.grade) k.quest = null;
            k.grade = j.cls.grade;
          }
          P.save(); close(); if (refresh) refresh();
          toast('🏫 已加入「' + k.className + '」· 年级随班级');
          if (window.BeastCloud) window.BeastCloud.report(k);
        }).catch((e) => {
          btn.textContent = '加入';
          const m2 = (e && e.message) || '';
          if (m2 === 'class_not_found') toast('班级码 ' + code + ' 不存在，问问老师');
          else if (!doneLocal()) toast('网络不通，稍后再试');
        });
      };
    });
  }
  /* 学生每日答题：每天一次 10 题全科，成绩计入掌握度并同步班级 */
  function studentDaily(k) {
    ensureKid(k);
    if (k.dailyQuizDate === todayStr()) { toast('今天已答过题啦，明天再来！'); return; }
    /* 难度随冒险进度：通关越多题越难 */
    const q = questState(k);
    const prog = q.nodes.filter((n) => n.done).length / q.nodes.length;
    const lv = Math.max(1, Math.min(4, Math.round(prog * 4) || 1));
    const ROT = ['en', 'math', 'cn', 'math', 'en', 'cn', 'sci', 'math', 'en', 'eth'];
    const qs = genMix(10, ROT.map((s) => () => genSubjectQ(s, gradeOf(k), lv, 0)), WS0);
    function WS0() { return genSubjectQ(weightedSubj(), gradeOf(k), lv, 0); }
    quizRun({
      qs, mode: 'drill',
      aid: aidList(k),
      onEnd: (r) => {
        k.dailyQuizDate = todayStr();
        (r.results || []).forEach((x) => mastAdd(k, x.q.type, null, x.ok));
        r.wrongQs.forEach((w) => {
          if (k.wrongBook.length > 40) k.wrongBook.shift();
          k.wrongBook.push({ q: w, g: gradeOf(k), u: 0, ok: false, t: Date.now() });
        });
        const right = r.results ? r.results.filter((x) => x.ok).length : 0;
        reward(k, 2 + right, 8 + right * 3, '每日答题 · 答对 ' + right + '/' + qs.length, '📖', 'mix');
        syncClassData(k);
        P.save();
        toast('每日答题完成 · 答对 ' + right + '/' + qs.length + ' · 掌握度已更新 📊');
        BP.render();
      }
    });
  }

  /* 按本次答题成绩决定掉落稀有度：成绩越好 SSR 概率越高 */
  function rarityByScore(right, total, pool) {
    const p = right / Math.max(1, total);
    let w;
    if (p >= 0.95) w = { SSR: 18, SR: 32, R: 30, N: 20 };
    else if (p >= 0.7) w = { SSR: 8, SR: 27, R: 35, N: 30 };
    else w = { SSR: 3, SR: 15, R: 35, N: 47 };
    const ps = (pool || Object.keys(w)).filter((r) => w[r]);
    const tot = ps.reduce((s, r) => s + w[r], 0);
    let v = Math.random() * tot;
    for (const r of ps) { v -= w[r]; if (v <= 0) return r; }
    return ps[0] || 'N';
  }
  function tapNode(k, q, n, refresh) {
    const g = gradeOf(k);
    ensureMapFields(q);
    if (n.t === 'treasure') return openTreasure(k, q, n, refresh);
    const lv = n.lv == null ? 2 : n.lv;
    const qs = genNodeQs(n, g);
    /* 敌人血量 = 题目数（答对扣血，保证可击败）；难度体现在题目 lv 与题量上 */
    const bossS = n.subj ? SUBJ[n.subj] : null;
    const enemy = n.t === 'kn' ? (function (s) { return { em: s.split(' ')[0], name: s.split(' ')[1], hp: qs.length }; })(ENEMIES[n.u % ENEMIES.length])
      : n.t === 'battle' ? (function (s) { return { em: s.split(' ')[0], name: s.split(' ')[1], hp: qs.length }; })(ENEMIES[n.u % ENEMIES.length])
      : n.t === 'review' ? { em: '🛡️', name: '复习木桩', hp: qs.length }
      : n.t === 'boss' ? (bossS ? { em: bossS.icon, name: bossS.name + '·' + bossS.bosses[n.u % bossS.bosses.length], hp: qs.length }
        : (function (s) { return { em: s.split(' ')[0], name: s.split(' ')[1], hp: qs.length }; })(BOSSES[n.u]))
      : { em: '👑', name: '知识魔王', hp: qs.length };
    /* v3.40 剧情引子：先看小说式开场卡，再进入答题战斗 */
    storyCard(storyOf(n, g), () => quizRun({
      qs, enemy,
      aid: aidList(k),
      onEnd: (r) => {
        if (!r.win) { refresh(); return; }
        n.done = true; n.stars = r.stars;
        ensureAid(k);
        /* 错题入本 */
        r.wrongQs.forEach((w) => {
          if (k.wrongBook.length > 40) k.wrongBook.shift();
          k.wrongBook.push({ q: w, g, u: n.u, ok: false, t: Date.now() });
        });
        /* 知识点掌握累计（kn 关精确到知识点，混科关按学科） */
        (r.results || []).forEach((x) => mastAdd(k, n.t === 'kn' ? n.subj : x.q.type, n.t === 'kn' ? n.kn : null, x.ok));
        let dropMsg = '';
        let dropItem = null;
        let dropSubj = null;
        let dropSubjType = null;
        let dropFragType = null;
        const bonus = n.lv || 0; /* 难度加成：关卡越靠后奖励越高 */
        if (n.t === 'chall') {
          const ft = dropFrag(k, [rarityByScore(r.right, r.total)]);
          reward(k, 3 + bonus, 15 + bonus * 3, '挑战关达成 · ' + DB[g].units[n.u].t + ' · 掉落🧩' + (BP.PETS[ft] ? BP.PETS[ft].name : '') + '碎片', '🏅', (n.subj || 'mix'));
          dropMsg = '🧩 掉落「' + (BP.PETS[ft] ? BP.PETS[ft].name : '?') + '」碎片 ×1'; dropFragType = ft;
        }
        if (n.t === 'kn') {
          /* 知识点三级关：识记 1 分 / 练习 2 分 / 精通 3 分，精通满分必掉碎片 */
          const full = r.right === r.total;
          const st = n.stage || 1;
          reward(k, st + bonus, 6 + st * 4 + bonus * 2,
            '知识点' + STAGE_NAME[st - 1] + ' · ' + n.kn + (full ? ' · 完美!' : ''), '📖', (n.subj || 'mix'));
          if (full && (st >= 3 || Math.random() < 0.45)) {
            const ft = dropFrag(k, [rarityByScore(r.right, r.total)]);
            dropMsg = '🧩 掉落「' + (BP.PETS[ft] ? BP.PETS[ft].name : '?') + '」碎片 ×1'; dropFragType = ft;
          }
        }
        if (n.t === 'battle') {
          const ft = dropFrag(k, [rarityByScore(r.right, r.total)]);
          reward(k, 2 + bonus, 12 + bonus * 3, '冒险战斗获胜 · ' + DB[g].units[n.u].t + ' · 掉落🧩' + (BP.PETS[ft] ? BP.PETS[ft].name : '') + '碎片', '⚔️', (n.subj || 'mix'));
          dropMsg = '🧩 掉落「' + (BP.PETS[ft] ? BP.PETS[ft].name : '?') + '」碎片 ×1'; dropFragType = ft;
        }
        if (n.t === 'review') {
          const ft = dropFrag(k, ['N', 'R']);
          reward(k, 1 + bonus, 6 + bonus * 2, '完成复习营地 · 掉落🧩' + (BP.PETS[ft] ? BP.PETS[ft].name : '') + '碎片', '🛡️', (n.subj || 'mix'));
          dropMsg = '🧩 掉落「' + (BP.PETS[ft] ? BP.PETS[ft].name : '?') + '」碎片 ×1'; dropFragType = ft;
        }
        if (n.t === 'boss') {
          if (!q.badges.includes(n.u)) q.badges.push(n.u);
          const card = dropPetOf(k, q, rarityByScore(r.right, r.total, ['R', 'SR', 'SSR']));
          /* v3.32: Boss 额外概率掉饰品/武器 */
          const item = Math.random() < .55 ? rollItemDrop('boss') : null;
          giveItemDrop(k, item);
          /* v3.38: 还有学科没宠物时，Boss 战 50% 掉一只 */
          const missS = (BP.SUBJ_LIST || []).filter((s) => !k.subjPets[s.k]).map((s) => s.k);
          dropSubj = (missS.length && Math.random() < .5) ? missS[Math.floor(Math.random() * missS.length)] : null;
          if (dropSubj && BP.grantSubjPet) { const gp = BP.grantSubjPet(k, dropSubj, null); dropSubjType = gp ? gp.type : null; if (!dropSubjType) dropSubj = null; }
          reward(k, 5 + bonus, 25 + bonus * 5, '击败' + (bossS ? bossS.name : '单元') + ' Boss · 获得「' + DB[g].units[n.u].em + '」徽章 + 宠物「' + (BP.PETS[card] ? BP.PETS[card].name : card) + '」' + (item ? ' · 掉落' + (item.kind === 'wpn' ? '武器' : '饰品') + '「' + (item.kind === 'wpn' ? BP.WEAPONS[item.id].n : BP.ACCS[item.id].n) + '」' : '') + (dropSubj ? ' · 掉落新' + (BP.SUBJ_NAME[dropSubj] || '') + '宠物' : ''), '👑', (n.subj || 'mix'));
          dropMsg = card; dropItem = item;
        }
        if (n.t === 'final') {
          q.trophy = true;
          const card = dropPetOf(k, q, 'SSR');
          /* v3.32: 决战必掉饰品/武器（稀有度更高） */
          const item = rollItemDrop('final');
          giveItemDrop(k, item);
          /* v3.38: 决战必掉缺科宠物 */
          const missS = (BP.SUBJ_LIST || []).filter((s) => !k.subjPets[s.k]).map((s) => s.k);
          dropSubj = missS.length ? missS[Math.floor(Math.random() * missS.length)] : null;
          if (dropSubj && BP.grantSubjPet) { const gp = BP.grantSubjPet(k, dropSubj, null); dropSubjType = gp ? gp.type : null; if (!dropSubjType) dropSubj = null; }
          reward(k, 20, 60, '🏆 击败知识魔王，通关' + gradeName(g) + '冒险 · 获得传说宠物「' + (BP.PETS[card] ? BP.PETS[card].name : card) + '」' + (item ? ' · 掉落' + (item.kind === 'wpn' ? '武器' : '饰品') + '「' + (item.kind === 'wpn' ? BP.WEAPONS[item.id].n : BP.ACCS[item.id].n) + '」' : '') + (dropSubj ? ' · 掉落新' + (BP.SUBJ_NAME[dropSubj] || '') + '宠物' : ''), '🏆', 'mix');
          dropMsg = card; dropItem = item;
        }
        P.save();
        syncClassData(k); /* 班级学员：答题数据合入班级 */
        refresh();
        if (n.t === 'boss' || n.t === 'final') {
          const isFinal = n.t === 'final';
          victoryFX(isFinal ? '🏆 通关啦！' : '👑 Boss 击败！',
            isFinal ? gradeName(g) + '全部知识掌握！' : '获得「' + DB[g].units[n.u].em + '」单元徽章',
            () => petDropFX(dropMsg, k, () => itemDropFX(dropItem, k, () => {
              if (dropSubj && BP.petDropFXShow) {
                const sd = (BP.SUBJ_LIST || []).find((x) => x.k === dropSubj);
                BP.petDropFXShow(dropSubjType, sd);
              } else refresh();
            })));
        } else {
          /* v3.40 普通关卡也看得见掉落：碎片小卡特效替代纯文字 toast */
          refresh();
          const pts = (n.t === 'review' ? 1 + bonus : n.t === 'kn' ? 1 + bonus : 2 + bonus);
          if (dropFragType) fragDropFX(dropFragType, '+' + pts + ' 积分 · 经验已到账');
          else toast((n.t === 'kn' ? '知识点掌握 +' : '战斗胜利 +') + pts + ' 积分');
        }
      }
    }));
  }

  function openTreasure(k, q, n, refresh) {
    if (n.done) { toast('宝箱已经开过啦'); if (n.i >= 0) { n.done = true; P.save(); refresh(); } return; }
    const owned = q.cards || (q.cards = []);
    const pool = Object.keys(BP.PETS).filter((t) => !owned.includes(t));
    const card = pool.length ? pick(pool) : pick(Object.keys(BP.PETS));
    owned.push(card);
    /* v3.32: 宝箱 40% 额外开出饰品 */
    let item = null;
    if (Math.random() < .4) {
      item = rollItemDrop('boss');
      if (item && item.kind === 'wpn') { /* 宝箱只出饰品，武器留给 Boss */ item = null; }
      giveItemDrop(k, item);
    }
    if (n.i >= 0) { n.done = true; n.stars = 3; }
    P.save();
    const meta = BP.PETS[card];
    BP.SND.play('chest');
    const m = document.createElement('div');
    m.className = 'evo-mask';
    m.innerHTML = '<div class="evo-box"><div class="big img"><img src="' + BP.imgFor(card, 1) + '" alt=""></div>' +
      '<h2>🧸 收集到宠物卡！</h2><p>' + meta.emoji + ' <b>' + meta.name + '</b><br>已收集 ' + owned.length + ' 张，继续冒险集齐图鉴！</p>' +
      (item ? '<p class="tk-item">✨ 额外开出饰品「' + BP.ACCS[item.id].n + '」！可在宠物装扮里穿戴</p>' : '') +
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
        '<button class="wr-it" data-i="' + i + '"><span class="wr-em">' + (QTYPES[w.q.type] ? QTYPES[w.q.type].icon : SUBJ[w.q.type] ? SUBJ[w.q.type].icon : '❓') + '</span>' +
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
                reward(k, 1, 4, '错题订正成功', '📕', SUBJ[w.q.type] ? w.q.type : 'en');
                P.save(); toast('订正成功！+1 积分');
              }
              if (refresh) refresh();
            }
          });
        }));
      });
  }

  /* ================= 收集图鉴（v3.24：稀有度 + 碎片合成 + 助战栏位） ================= */
  function collSheet(k, q) {
    const g = gradeOf(k), G = DB[g];
    ensureAid(k);
    const slots = aidSlots(k);
    const frags = k.frags || {};
    const fragKeys = Object.keys(frags).filter((t) => frags[t] > 0).sort((a, b) => frags[b] - frags[a]);
    openSheet('<div class="sheet-h">🧸 我的收集</div>' +
      '<div class="tiny">徽章来自单元 Boss · 战斗掉碎片 · Boss 掉宠物 · 通关掉传说宠</div>' +
      '<div class="coll-h">🎖️ 单元徽章（' + (q.badges || []).length + '/' + G.units.length + '）</div>' +
      '<div class="badge-row">' + G.units.map((u, i) =>
        '<div class="badge-it' + ((q.badges || []).includes(i) ? ' on' : '') + '"><span>' + ((q.badges || []).includes(i) ? u.em : '❔') + '</span><small>' + esc(u.t.split(' ')[0].slice(0, 4)) + '</small></div>').join('') +
      (q.trophy ? '<div class="badge-it on big"><span>🏆</span><small>通关</small></div>' : '') + '</div>' +
      '<div class="coll-h">🤝 助战栏位（' + slots + ' 个 · Lv.6/9/12 解锁）<small style="font-weight:400">助战宠物会一起出战，提供额外血量并有几率协力攻击</small></div>' +
      '<div class="aid-row">' + (slots ? Array.from({ length: slots }, (_, i) => {
        const t = k.aid[i];
        return t
          ? '<button class="aid-slot on" data-slot="' + i + '"><img src="images/gif/' + t + '-growth.gif" alt=""><small>' + esc((BP.PETS[t] || {}).name || t) + '</small></button>'
          : '<button class="aid-slot" data-slot="' + i + '"><span>＋</span><small>选择助战</small></button>';
      }).join('') : '<div class="tiny">宠物升到 Lv.6 解锁第一个助战位</div>') + '</div>' +
      '<div class="coll-h">🧩 宠物碎片（共 ' + fragAll(k) + ' 枚 · 集满 10 枚合成宠物）</div>' +
      (fragKeys.length ? '<div class="frag-grid">' + fragKeys.map((t) => {
        const n = frags[t], can = n >= 10;
        return '<div class="frag-it' + (can ? ' can' : '') + '"><img src="images/gif/' + t + '-baby.gif" alt="" onerror="this.style.display=\'none\'">' +
          '<div class="frag-bar"><i style="width:' + Math.min(100, n * 10) + '%"></i></div>' +
          '<small>' + esc((BP.PETS[t] || {}).name || t) + ' ' + n + '/10</small>' +
          (can ? '<button class="frag-craft" data-t="' + t + '">合成</button>' : '') + '</div>';
      }).join('') + '</div>' : '<div class="tiny">冒险战斗和复习营地会掉落碎片</div>') +
      '<div class="coll-h">🧸 宠物卡（' + (q.cards || []).length + ' 张）</div>' +
      '<div class="card-grid">' +
      (q.cards || []).map((c) => {
        const rar = rarOf(c), meta = BP.PETS[c] || { name: c, emoji: '🐾' };
        return '<div class="card-it rar-' + rar + '"><i class="rar-tag" style="background:' + RAR[rar].c + '">' + rar + '</i><img src="images/gif/' + c + '-baby.gif" alt=""><small>' + esc(meta.name) + '</small></div>';
      }).join('') +
      '<div class="card-it unknown"><span>❓</span></div>' +
      '</div>',
      (m, close) => {
        /* 助战选择 */
        m.querySelectorAll('.aid-slot').forEach((b) => (b.onclick = () => {
          const slot = +b.dataset.slot;
          const cur = k.aid[slot];
          const cands = (q.cards || []).filter((t) => !k.aid.includes(t) || t === cur);
          if (!cands.length && !cur) return toast('先去冒险收集宠物卡，再选助战');
          const rows = (cur ? '<button class="aid-pick off" data-t="">🚫 卸下这只</button>' : '') +
            cands.map((t) => {
              const meta = BP.PETS[t] || { name: t, emoji: '🐾' };
              const rar = rarOf(t);
              return '<button class="aid-pick" data-t="' + t + '"><img src="images/gif/' + t + '-baby.gif" alt=""><div><b>' + esc(meta.name) + '</b><small style="color:' + RAR[rar].c + '">' + rar + ' · ' + RAR[rar].name + '</small></div></button>';
            }).join('');
          openSheet('<div class="sheet-h">选择助战宠物</div><div class="tiny">稀有度越高的助战并不更强，但都可以协战</div>' +
            '<div class="aid-pick-list">' + rows + '</div>', (m2, close2) => {
            m2.querySelectorAll('.aid-pick').forEach((bb) => (bb.onclick = () => {
              const t = bb.dataset.t;
              if (t) k.aid[slot] = t; else k.aid[slot] = null;
              P.save(); close2(); close(); collSheet(k, q); toast(t ? '助战已设置 🤝' : '已卸下');
            }));
          });
        }));
        /* 碎片合成 */
        m.querySelectorAll('.frag-craft').forEach((b) => (b.onclick = () => {
          const t = b.dataset.t;
          if ((k.frags[t] || 0) < 10) return;
          k.frags[t] -= 10;
          if (!q.cards.includes(t)) q.cards.push(t);
          P.save();
          close();
          petDropFX(t, k, () => collSheet(k, q));
        }));
      });
  }

  /* ================= v3.26 入学摸底（家长模式添加孩子第一步） =================
     动态出 10 题：混学科、难度递进；按正确率决定初始宠物稀有度 */
  function genPlacement(g) {
    const ROT = ['en', 'math', 'cn', 'math', 'en', 'cn', 'sci', 'math', 'en', 'eth'];
    const qs = [];
    for (let i = 0; i < 10; i++) {
      const lv = Math.min(4, Math.floor(i / 2));
      qs.push(genSubjectQ(ROT[i], g, lv, 0));
    }
    return qs;
  }
  function rollPlacementPet(right, total) {
    const p = right / Math.max(1, total);
    let pool;
    if (p >= 0.9) pool = { SSR: 50, SR: 35, R: 15 };
    else if (p >= 0.7) pool = { SSR: 20, SR: 45, R: 35 };
    else if (p >= 0.4) pool = { SSR: 5, SR: 25, R: 45, N: 25 };
    else pool = { R: 20, N: 80 };
    const ps = Object.entries(pool);
    let v = Math.random() * ps.reduce((s, x) => s + x[1], 0), rar = 'N';
    for (const [r, wt] of ps) { v -= wt; if (v <= 0) { rar = r; break; } }
    return { type: pick(petsOfRar(rar)), rar, right, total };
  }

  /* ================= 导出给 app.js 调用 ================= */
  window.BPGames = { petInteract, aidSlots, rarOf, RAR, SUBJ, mastStats, mastAdd,
    genPlacement, rollPlacementPet, studentDaily, joinClassSheet, syncClassData,
    rollItemDrop, giveItemDrop, itemDropFX, petDropFX, viewNovel, novelReader, novelBrief };

  /* ================= 注册路由 ================= */
  const hook = window.BPHook;
  if (hook) {
    hook.routes.daily = viewDaily;
    hook.routes.quest = viewQuest;
    hook.routes.novel = viewNovel;
    hook.ROUTES_ALL.push('daily', 'quest', 'novel');
    /* 知识图谱加载完毕：把学科名称/图标/颜色同步给 app.js 的全部界面 */
    if (window.BP && BP.refreshSubjList) BP.refreshSubjList();
    /* 若打开时 hash 已指向游戏页（首渲染早于本文件注册），补一次渲染 */
    const h = (location.hash || '').replace('#/', '').split('?')[0];
    if (h === 'daily' || h === 'quest' || h === 'novel') BP.render();
  }
})();
