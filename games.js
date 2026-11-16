/* ============================================================
   伴学宠物 v3.25 · 答题游戏包
   游戏一：🎯 每日打卡答题（每天随机 5 种题型，参考闯关原型）
   游戏二：🗺️ 知识冒险闯关（家庭模式：易到难地图 + 复习营地
           + 单元 Boss + 年级最终 Boss + 收集 + 错题校验）
   依赖 app.js 暴露的 window.BP 桥接对象
   ============================================================ */
(function () {
  const BP = window.BP;
  if (!BP) {
    /* v3.46 明确报错：以前这里静默 return，整个游戏包半残运行还查不出原因 */
    if (window.console) console.error('[games.js] window.BP 未就绪，游戏/知识包未加载 —— 请检查 index.html 中 app.js 是否先于 games.js');
    return;
  }
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
  function genSubjectQ(subj, g, lv, u) {
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
      const f = () => genSubjectQ(subj, g, qlv, node.u);
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
    g1: ['数一数比多少', '位置上下前后', '左右的认识', '5以内数的认识', '5以内加法', '5以内减法', '6-10的认识', '6-10的加减法', '10以内加法', '10以内减法', '10以内连加', '10以内连减', '加减混合', '认识图形', '认识长方体正方体', '认识圆柱球', '分类整理', '11-20的认识', '20以内数的顺序', '20以内数的组成', '20以内不进位加法', '20以内进位加法', '20以内不退位减法', '20以内退位减法', '认识钟表', '整十数加法', '整十数减整十数', '100以内数的认识', '比较大小', '找规律', '认识人民币', '元角分的换算', '两位数加一位数', '两位数减一位数', '购物中的数学', '摆一摆拼一拼', '认识平行四边形', '看图解决问题', '用数学提问题', '整理与复习'],
    g2: ['100以内加减法', '两位数加两位数', '两位数减两位数', '连加连减竖式', '乘法初步认识', '乘法口诀1-5', '乘法口诀6-9', '乘加乘减', '除法初步认识', '用口诀求商', '平均分', '除法竖式', '倍的认识', '角的认识', '直角的认识', '锐角钝角', '观察物体', '平移与旋转', '轴对称图形', '长度单位', '米和厘米', '线段的认识', '1000以内数的认识', '万以内数的认识', '数的读写与组成', '近似数', '整百整十加减', '整百数加减法', '混合运算', '有余数的除法', '两位数乘一位数', '时分秒', '秒的认识', '时间计算', '统计表', '数据收集整理', '图形拼组', '简单推理', '克与千克', '解决问题'],
    g3: ['万以内数的大小比较', '三位数加三位数', '三位数减三位数', '三位数加减法', '估算', '多位数乘一位数', '口算乘法', '笔算乘法', '两位数乘两位数', '多位数除以一位数', '除数是一位数除法', '周长', '长方形与正方形', '面积', '面积单位', '长方形面积', '正方形面积', '面积单位换算', '时分秒应用', '年月日', '平年与闰年', '年月日的计算', '24时计时法', '毫米分米', '千米', '吨的认识', '分数初步认识', '分数的简单计算', '分数的比较', '倍数关系', '小数初步认识', '小数的读写', '小数的大小比较', '简单的小数加减', '复式统计表', '搭配问题', '位置与方向', '东南西北方向', '数字编码', '集合思想'],
    g4: ['大数的认识', '亿以内数的读写', '数的产生与十进制', '亿以上数的认识', '计算工具的认识', '公顷与平方千米', '线段射线直线', '角的度量', '角的分类', '画角', '三位数乘两位数', '积的变化规律', '平行与垂直', '平行四边形与梯形', '除数是两位数除法', '商的变化规律', '单价数量总价', '速度时间路程', '四则运算', '运算律', '简便计算', '小数的意义', '小数的性质', '小数点移动', '小数与单位换算', '求小数的近似数', '小数加减法', '小数乘法', '小数除法', '三角形', '三角形的特性', '三角形的分类', '三角形的内角和', '观察物体二', '条形统计图', '复式条形统计图', '平均数', '用数对确定位置', '优化问题', '鸡兔同笼'],
    g5: ['小数乘整数', '小数乘小数', '积的近似数', '整数乘法运算律推广', '小数乘法', '除数是整数的小数除法', '一个数除以小数', '商的近似数', '循环小数', '小数除法', '用计算器探索规律', '位置', '可能性', '用字母表示数', '等式的性质', '解方程', '简易方程', '实际问题与方程', '多边形的面积', '平行四边形的面积', '三角形的面积', '梯形的面积', '组合图形的面积', '因数与倍数', '2、3、5的倍数特征', '质数与合数', '长方体和正方体', '分数的意义', '分数的基本性质', '真分数与假分数', '约分与通分', '同分母分数加减', '异分母分数加减', '分数与小数互化', '图形的旋转', '折线统计图', '解决问题策略', '图形面积变换', '找次品', '数学广角'],
    g6: ['分数乘整数', '分数乘分数', '分数乘法简便运算', '倒数', '分数乘法', '分数除以整数', '一个数除以分数', '分数除法解决问题', '分数除法', '分数四则混合运算', '比的认识', '比的基本性质', '化简比', '比的应用', '圆的认识', '圆的各部分名称', '圆的周长', '圆的面积', '扇形', '位置与方向', '百分数', '百分数应用', '折扣', '成数', '税率', '利率', '扇形统计图', '负数', '比例', '正比例', '反比例', '比例尺', '比例应用', '图形的放大与缩小', '圆柱的认识', '圆柱的表面积', '圆柱的体积', '圆锥的体积', '数与形', '鸽巢问题']
  };
  const CN_KN = {
    g1: ['汉语拼音字母表', '拼音声母', '拼音韵母', '拼音声调', '拼读方法', '三拼音节', '整体认读音节', '轻声', '儿化音', '笔画笔顺', '偏旁部首', '独体字与合体字', '识字与朗读', '同音字', '形近字', '看图识字', '日月明', '猜字谜', '对韵歌', '金木水火土', '口耳目', '方位词', '反义词', '叠词', '量词', '姓氏歌', '四季与自然', '影子课文', '比尾巴', '古诗诵读一', '秋冬课文', '大小多少', '小书包', '升国旗', '小蜗牛', '雨点儿', '明天要下雨', '说话写话', '标点符号', '阅读理解'],
    g2: ['场景歌', '树之歌', '拍手歌', '田家四季歌', '曹冲称象', '玲玲的画', '古诗二首', '黄山奇石', '日月潭', '葡萄沟', '坐井观天', '寒号鸟', '我要的是葫芦', '大禹治水', '朱德的扁担', '纸船和风筝', '雪孩子', '狐假虎威', '成语积累', '查字典方法', '部首查字法', '音序查字法', '词语搭配', 'AABB式词语', 'ABB式词语', '比喻句', '拟人句', '把字句', '被字句', '陈述句与疑问句', '感叹句', '问号与感叹号', '留言条', '日记格式', '续写故事', '口语交际', '反义词积累', '多音字', '偏旁归类', '看图写话'],
    g3: ['生字词语', '多音字', '近义词与反义词', '修辞手法', '秋天的雨', '铺满金色巴掌的水泥道', '卖火柴的小女孩', '去年的树', '那一定会很好', '搭船的鸟', '翠鸟', '古诗三首', '富饶的西沙群岛', '美丽的小兴安岭', '搭石', '总也倒不了的老屋', '司马光', '守株待兔', '陶罐和铁罐', '阅读策略', '部首查字', '词语理解方法', '成语故事', '寓言的特点', '童话的特点', '总分结构', '中心句', '过渡句', '比喻与拟人', '排比句', '反问句', '引号用法', '冒号用法', '修改病句', '扩句与缩句', '习作写人', '习作写事', '习作写景', '观察日记', '复述课文'],
    g4: ['观潮', '走月亮', '现代诗', '繁星', '一个豆荚里的五粒豆', '蝙蝠和雷达', '呼风唤雨的世纪', '爬山虎的脚', '蟋蟀的住宅', '盘古开天地', '精卫填海', '普罗米修斯', '女娲补天', '母鸡', '猫', '白鹅', '古诗三首', '神话的特点', '批注阅读', '记叙文六要素', '形声字', '多义字', '词语的感情色彩', '四字词语', '谚语积累', '歇后语', '对偶句', '设问句', '双重否定句', '关联词', '段落大意', '文章结构', '写景顺序', '说明性文章', '寓言的寓意', '诗歌的节奏', '书信格式', '连续观察日记', '习作写童话', '习作写观察'],
    g5: ['白鹭', '落花生', '桂花雨', '珍珠鸟', '搭石', '将相和', '什么比猎豹的速度更快', '地道战', '太阳', '松鼠', '慈母情深', '父爱之舟', '鸟的天堂', '月迹', '古人谈读书', '忆读书', '四季之美', '圆明园的毁灭', '说明方法', '体会思想感情', '汉字演变', '楷书与行书', '词语辨析', '成语运用', '名言警句', '诗句积累', '场景描写', '人物描写方法', '环境描写作用', '详写与略写', '倒叙与插叙', '举例子与列数字', '演讲稿', '读后感', '缩写故事', '民间故事', '古典名著阅读', '习作写说明文', '习作写读后感', '修改习作'],
    g6: ['草原', '丁香结', '古诗词三首', '花之歌', '七律·长征', '狼牙山五壮士', '开国大典', '灯光', '竹节人', '宇宙生命之谜', '故宫博物院', '桥', '穷人', '在柏林', '夏天里的成长', '盼', '文言文二则', '月光曲', '少年闰土', '好的故事', '拼音复习', '汉字结构', '词语积累与运用', '成语典故', '古诗文诵读', '文言实词', '文言虚词', '句子衔接', '修辞综合', '标点综合', '概括主要内容', '体会文章情感', '表达方法', '非连续性文本', '名著阅读童年', '鲁滨逊漂流记', '汤姆·索亚历险记', '习作写倡议书', '习作写科幻', '毕业赠言']
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
    g1: ['植物有生命', '观察一棵树', '认识常见植物', '动物的家', '观察蜗牛', '石头与土壤', '玩磁铁', '认识天气', '天气与穿衣', '白天与黑夜', '四季变化', '水的样子', '空气在哪里', '声音从哪里来', '我们的感官', '身体的部位', '保护牙齿', '爱护小动物', '影子游戏', '种子的旅行'],
    g2: ['植物的根', '茎和叶', '花与果实', '植物的种子', '蚂蚁的家', '蜗牛观察', '动物的过冬方式', '石头分类', '土壤里的生物', '磁铁能吸什么', '指南针', '云和雨', '风向与风力', '太阳和月亮', '声音的高低', '光的直线传播', '水的三态', '常见的材料', '纸的特点', '简单的电路'],
    g3: ['水沸腾', '水的蒸发与凝结', '水的循环', '空气占据空间', '空气有质量', '声音由振动产生', '声音的传播', '光的反射', '影子长短变化', '测量气温', '认识温度计', '植物的一生', '植物的茎的作用', '动物的生命周期', '昆虫的特征', '人的呼吸', '人的消化', '土壤的类型', '岩石与矿物', '天气与生活'],
    g4: ['声音的强弱与高低', '噪声与危害', '声音的传播介质', '光的传播', '平面镜成像', '潜望镜', '呼吸器官', '心跳与运动', '食物的营养', '食物的保存', '消化与吸收', '骨骼与肌肉', '植物的光合作用', '动物怎样繁殖', '岩石风化', '岩石的用途', '地球的内部', '火山与地震', '常见的力', '电路连接'],
    g5: ['光的反射与折射', '光的色散', '透镜与放大镜', '热胀冷缩', '地球自转', '地球公转与四季', '月相变化', '日食与月食', '地球的内部结构', '地震的成因', '生物与环境', '食物链', '生态瓶', '种子萌发条件', '植物的繁殖方式', '热的传递', '保温与散热', '杠杆', '滑轮与斜面', '能源与节约'],
    g6: ['显微镜与细胞', '微生物与健康', '生物的遗传', '变异现象', '生物的适应', '生物的进化', '生态系统', '能量转换', '电磁铁', '电路与开关', '杠杆平衡', '轮轴与齿轮', '地球的资源', '气候变化', '太阳系', '月球的秘密', '星座与星空', '新能源', '航天探索', '科技与生活']
  };
  const ETH_KN = {
    g1: ['校园礼仪', '课间安全', '上下楼梯', '垃圾分类', '爱护课本', '诚实不说谎', '排队守秩序', '饭前洗手', '认识国旗', '和家人打招呼'],
    g2: ['交通安全', '防溺水', '用电安全', '陌生人防范', '公共场所礼仪', '爱护花草', '借东西要说', '做错事要道歉', '班级值日', '节约用纸'],
    g3: ['消防安全', '地震避险', '食品保质期', '上网时间管理', '对校园欺凌说不', '集体活动守则', '节约用电', '保护水资源', '尊重他人隐私', '按时完成作业'],
    g4: ['遵守交通信号', '乘车安全', '拒绝烟酒', '网络文明用语', '保护个人隐私', '垃圾分类投放', '团队分工合作', '感恩与表达', '爱护公共设施', '遇到危险要求助'],
    g5: ['社会公德', '公共场所秩序', '志愿服务', '诚实守信', '拒绝危险游戏', '合理使用零花钱', '尊重劳动成果', '保护生态环境', '遵守法律法规', '理性对待网络信息'],
    g6: ['宪法与公民', '权利与义务', '责任担当', '国家安全意识', '明辨是非', '拒绝校园暴力', '青春期健康', '防沉迷上网', '保护文化遗产', '国际理解与尊重']
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
  /* ================= v3.45 学科冒险小说馆 =================
     每学科一本冒险书（语/数/英/科/道法），每本书按本年级该科知识点分章。
     · 知识点用 <mark class="kn-hi"> 重点标记
     · 阅读进度按「书→章」存 kid.novels = { [科]:{ read:{章:页}, done:{章:1} } }
     · 顺序阅读：第 n 章读完才能读第 n+1 章，不能跳读
     · 兼容旧 kid.novel（年级单书）：首次自动迁移为语文书 */
  const BOOK_ORDER = ['cn', 'math', 'en', 'sci', 'eth'];
  const BOOK_META = {
    cn:   { name: '语文', icon: '🀄', color: '#ff8a65', world: '文字森林', hero: '书页精灵·墨墨',
            foe: '错别字大魔王', relic: '金字成语词典', scene: ['森林里每片叶子都是一个字，风一吹就沙沙地念出声来。', '小溪的水面浮着一行行诗句，踩上去会溅起墨香。'] },
    math: { name: '数学', icon: '➗', color: '#7ecb5f', world: '数字王国', hero: '算数小熊·阿数',
            foe: '粗心计算魔王', relic: '黄金算盘', scene: ['石板路上刻着算式，数字在缝隙里一闪一闪。', '远处的山是立体的几何体，随着光线变换形状。'] },
    en:   { name: '英语', icon: '🔤', color: '#4da3ff', world: '单词海湾', hero: '字母海豚·Dobi',
            foe: '忘词章鱼', relic: '闪光单词贝壳', scene: ['海面上漂着英文字母，像一条条会游的小鱼。', '沙滩上写着句子，浪花一来就冲掉一半。'] },
    sci:  { name: '科学', icon: '🔬', color: '#9b7bff', world: '奇境实验室', hero: '实验小狐·玻玻',
            foe: '未知谜题博士', relic: '水晶显微镜', scene: ['路边支着小小的试管，气泡里映出一道彩虹。', '草丛里藏着会发光的微生物，一眨一眨地呼吸。'] },
    eth:  { name: '道德与法治', icon: '🌱', color: '#4db6ac', world: '美德花园', hero: '礼仪小鹿·然然',
            foe: '坏习惯藤蔓', relic: '七色美德花', scene: ['花园里立着木牌，写着「请排队」「说谢谢」。', '小路分成两条，一条 shortcuts 长满荆棘，一条正道开满鲜花。'] }
  };
  /* 取某科本年级的知识点列表（用于分章与重点标记） */
  function bookKnList(subj, g) {
    if (subj === 'math') return (MATH_KN[g] || MATH_KN.g3).slice();
    if (subj === 'cn') return (CN_KN[g] || CN_KN.g3).slice();
    if (subj === 'sci') return (SCI_KN[g] || SCI_KN.g3).slice();
    if (subj === 'eth') return (ETH_KN[g] || ETH_KN.g3).slice();
    if (subj === 'en') {
      const G = DB[g] || DB.g3, out = [];
      (G.units || []).forEach((u) => {
        (u.words || []).slice(0, 6).forEach((w) => out.push(w[0] + ' ' + w[1]));
        (u.sents || []).slice(0, 2).forEach((x) => out.push(x[0].replace('{w}', '____')));
      });
      return out;
    }
    return [];
  }
  /* 把知识点切成 5 章（每章若干点） */
  function bookChapters(subj, g) {
    const list = bookKnList(subj, g);
    const n = 5, size = Math.ceil(list.length / n) || 1;
    const chs = [];
    for (let i = 0; i < n; i++) chs.push(list.slice(i * size, (i + 1) * size).filter(Boolean));
    return chs.filter((c, i) => c.length || i === 0);
  }
  function ensureNovels(k) {
    if (!k.novels || typeof k.novels !== 'object') k.novels = {};
    /* 迁移旧小说进度到语文书 */
    if (k.novel && k.novel.read && !k.novels.cn) {
      k.novels.cn = { g: k.novel.g || gradeOf(k), read: k.novel.read || {}, done: k.novel.done || {} };
    }
    BOOK_ORDER.forEach((s) => {
      if (!k.novels[s] || typeof k.novels[s] !== 'object') k.novels[s] = { read: {}, done: {} };
    });
    return k.novels;
  }
  function novelProgress(k, subj) {
    const nv = ensureNovels(k);
    const chs = bookChapters(subj, gradeOf(k));
    let readN = 0, doneN = 0, firstUnread = 0;
    for (let i = 0; i < chs.length; i++) {
      if (nv[subj].read[i]) readN++;
      if (nv[subj].done[i]) doneN++; else if (firstUnread === i && nv[subj].read[i]) firstUnread = i;
    }
    let cur = 0;
    for (let i = 0; i < chs.length; i++) { if (!nv[subj].done[i]) { cur = i; break; } cur = i; }
    return { readN, doneN, total: chs.length, cur, pct: Math.round(doneN / chs.length * 100) };
  }
  function novelBrief(k) {
    ensureNovels(k);
    let doneSum = 0, totSum = 0;
    BOOK_ORDER.forEach((s) => { const p = novelProgress(k, s); doneSum += p.doneN; totSum += p.total; });
    return '5 本学科冒险书 · 已读 ' + doneSum + '/' + totSum + ' 章';
  }
  /* 生成某书某章的正文页（含重点标记的知识点） */
  function bookPages(k, subj, ci) {
    const g = gradeOf(k), M = BOOK_META[subj] || BOOK_META.cn;
    const name = esc(k.name || '小探险家');
    const pet = esc((k.pet && k.pet.name) || '宠物');
    const gn = gradeName(g);
    const kns = bookChapters(subj, g)[ci] || [];
    const hi = (x) => '<mark class="kn-hi">' + esc(x) + '</mark>';
    const knLine = kns.map(hi).join('　');
    const chTitles = ['启程·知识的邀请', '试炼·迷雾小径', '桥梁·一问一答', '城门·守门人的题', '王座·最终决战'];
    if (ci === 0) {
      return [
        ['放学后，' + name + '在抽屉里发现一张烫金的邀请函，上面只写着两个字：「出发」。' + pet + '从书包里探出头，冲着纸片叫了一声。',
          '金光漫开，' + name + '站上一条会发光的石板路。远处悬着一块木牌，写着——<b>' + M.world + '</b>。一个声音说：「欢迎你，' + gn + '的挑战者。」'],
        ['迎面走来' + M.hero + '，怀里抱着一本厚厚的书。「我是这里的向导，」' + M.hero + '说，「' + M.world + '被' + M.foe + '施了魔法，' + M.relic + '也被藏了起来。只有把这一章的知识点学会，路才会亮起来。」',
          M.scene[0]],
        ['『这一章要掌握的关键词是——』' + M.hero + '翻开书，金字一个个浮起来：', knLine,
          '「把它们记在心里，遇到' + M.foe + '时才不会慌。」' + pet + '轻轻蹭了蹭' + name + '的手背。']
      ];
    }
    const last = ci === 4;
    return [
      [chTitles[ci] + '。' + M.scene[ci % M.scene.length],
        last ? M.foe + '已经等在王座上，它的身体由无数「没弄懂」的题目组成。' : '前方的路被一道石门挡住，门上刻着这一章要考的知识点。'],
      ['「别怕，」' + M.hero + '说，「把学过的用上就行。」' + name + '深吸一口气，脑海中闪过一个个关键词：', knLine,
        last ? '石板路、迷雾、问答桥——一路走来的每一步，都变成了心里的底气。' : '每念对一个，石门上的光就亮一分。'],
      [M.foe + '冷笑一声，出招了。题目像潮水一样涌来。' + name + '沉着地一道道回答，' + pet + '在肩头给出暗暗的鼓励。',
        '最后一题破解的瞬间，' + M.relic + '从光里浮现，' + M.foe + '化作一缕烟散去。' + M.hero + '在书上打了个大大的勾。',
        last ? '「' + M.world + '得救了！」大家欢呼起来。' + name + '把' + M.relic + '收进背包，心里满满的。' : '石门打开，前方还有新的关卡在等着。']
    ];
  }
  /* 阅读器：一页一页翻，逐章解锁，进度自动记 */
  function novelReader(k, subj, ci, page) {
    const nv = ensureNovels(k);
    const M = BOOK_META[subj] || BOOK_META.cn;
    const chs = bookChapters(subj, gradeOf(k));
    ci = Math.max(0, Math.min(chs.length - 1, ci));
    /* 顺序锁：上一章没读完不能进这一章 */
    if (ci > 0 && !nv[subj].done[ci - 1]) { toast('🔒 先把第 ' + ci + ' 章读完，才能读下一章'); return; }
    const pages = bookPages(k, subj, ci);
    let p = Math.max(0, Math.min(pages.length - 1, page == null ? 0 : page));
    const title = '第 ' + (ci + 1) + ' 章 · ' + ['启程的石板路', '迷雾小径', '问答之桥', '守门人的题', '王座之巅'][ci];
    const m = document.createElement('div');
    m.className = 'novel-mask';
    document.body.appendChild(m);
    const save = () => {
      nv[subj].read[ci] = Math.max(nv[subj].read[ci] || 0, p + 1);
      if (p >= pages.length - 1) nv[subj].done[ci] = 1;
      P.save();
    };
    const paint = (dir) => {
      save();
      const last = p >= pages.length - 1;
      m.innerHTML = '<div class="nv-top"><button class="nv-back" id="nvBack">☰ 目录</button>' +
        '<span class="nv-ch">' + M.icon + ' ' + esc(M.name) + ' · ' + esc(title) + '</span>' +
        '<span class="nv-num">' + (p + 1) + ' / ' + pages.length + '</span></div>' +
        '<div class="nv-page' + (dir ? ' turn' : '') + '">' +
        (p === 0 ? '<div class="nv-em">' + M.icon + '</div><h2 class="nv-t">' + esc(title) + '</h2><div class="nv-sub">' + esc(M.world) + '</div>' : '') +
        pages[p].map((t) => '<p>' + t + '</p>').join('') +
        (last ? '<div class="nv-kn"><b>📖 本章知识点（重点）</b>' +
          (bookChapters(subj, gradeOf(k))[ci] || []).map((x) => '<span><i>' + M.icon + '</i>' + esc(x) + '</span>').join('') + '</div>' +
          '<button class="btn nv-go" id="nvGo">⚔️ 去闯这一章</button>' : '') +
        '</div>' +
        '<div class="nv-bar"><button class="nv-arrow" id="nvPrev"' + (p === 0 ? ' disabled' : '') + '>‹ 上一页</button>' +
        '<div class="nv-dots">' + pages.map((_, i) => '<i class="' + (i === p ? 'on' : i < p ? 'rd' : '') + '"></i>').join('') + '</div>' +
        '<button class="nv-arrow" id="nvNext"' + (last ? ' disabled' : '') + '>下一页 ›</button></div>' +
        '<div class="nv-hint">' + (last ? '本章读完啦 · 下一章已解锁' : '左右滑动也可以翻页') + '</div>';
      m.querySelector('#nvBack').onclick = () => { close(); };
      m.querySelector('#nvPrev').onclick = () => { if (p > 0) { p--; paint('prev'); } };
      m.querySelector('#nvNext').onclick = () => { if (p < pages.length - 1) { p++; paint('next'); } };
      const go = m.querySelector('#nvGo');
      if (go) go.onclick = () => {
        close(true);
        const q = questState(k);
        if (q.vis && ci < 5) { q.vis[ci] = q.vis[ci] || {}; q.vis[ci].open = true; }
        P.save();
        location.hash = '#/quest';
        render();
        toast('⚔️ 已打开第 ' + (ci + 1) + ' 章关卡');
      };
      BP.SND.play('page');
    };
    /* v3.45 关闭阅读器后刷新当前视图，让「已读完/在读/未解锁」状态立刻更新 */
    const close = (noRender) => {
      m.classList.remove('in');
      setTimeout(() => {
        m.remove();
        if (!noRender) { try { render(); } catch (e) {} }
      }, 240);
    };
    paint();
    requestAnimationFrame(() => m.classList.add('in'));
    let sx = 0, sy = 0;
    m.addEventListener('touchstart', (e) => { sx = e.touches[0].clientX; sy = e.touches[0].clientY; }, { passive: true });
    m.addEventListener('touchend', (e) => {
      const dx = e.changedTouches[0].clientX - sx, dy = e.changedTouches[0].clientY - sy;
      if (Math.abs(dx) < 50 || Math.abs(dy) > Math.abs(dx)) return;
      if (dx < 0 && p < pages.length - 1) { p++; paint('next'); }
      if (dx > 0 && p > 0) { p--; paint('prev'); }
    });
  }
  /* 小说馆首页：5 本学科书 + 每本章节进度（已读/在读/未解锁） */
  function viewNovel() {
    const k = kid(); if (!k) return;
    ensureKid(k);
    const nv = ensureNovels(k);
    /* 默认展开第一本没读完的书 */
    let openSubj = BOOK_ORDER[0];
    for (let i = 0; i < BOOK_ORDER.length; i++) {
      const p0 = novelProgress(k, BOOK_ORDER[i]);      /* v3.46 每次循环只算一次（原来一次循环调两遍） */
      if (p0.doneN < p0.total) { openSubj = BOOK_ORDER[i]; break; }
    }
    const g = gradeOf(k);
    const books = BOOK_ORDER.map((s) => {
      const M = BOOK_META[s], p = novelProgress(k, s);
      return '<button class="nv-book' + (s === openSubj ? ' on' : '') + '" data-s="' + s + '" style="--bc:' + M.color + '">' +
        '<span class="nvb-em">' + M.icon + '</span>' +
        '<span class="nvb-t"><b>' + M.name + '冒险书</b><small>' + p.doneN + '/' + p.total + ' 章 · ' + p.pct + '%</small>' +
        '<i class="nvb-bar"><i style="width:' + p.pct + '%"></i></i></span></button>';
    }).join('');
    const renderChapters = (subj) => {
      const M = BOOK_META[subj], chs = bookChapters(subj, g), pr = novelProgress(k, subj);
      return '<div class="nv-book-hero" style="--bc:' + M.color + '">' +
        '<div class="nvbh-cover"><span>' + M.icon + '</span><b>' + M.name + '冒险书</b><small>' + gradeName(g) + ' · 主角是你</small></div>' +
        '<div class="nvbh-info"><b>' + M.world + '</b><small>' + M.hero + ' 等你一起出发</small>' +
        '<div class="nvbh-bar"><i style="width:' + pr.pct + '%"></i></div>' +
        '<span>已读 ' + pr.doneN + '/' + pr.total + ' 章</span></div></div>' +
        '<div class="nv-list">' + chs.map((kns, i) => {
          const done = !!nv[subj].done[i], rd = nv[subj].read[i] || 0;
          const locked = i > 0 && !nv[subj].done[i - 1];
          const status = locked ? '🔒 未解锁' : done ? '✅ 已读完' : rd ? '📖 在读 · ' + rd + '/' + bookPages(k, subj, i).length + ' 页' : '待阅读';
          return '<button class="nv-row' + (done ? ' done' : '') + (locked ? ' lock' : '') + (rd && !done ? ' reading' : '') + '" data-c="' + i + '">' +
            '<span class="nvr-em">' + (locked ? '🔒' : done ? '✅' : rd ? '📖' : ['🌅','🌫️','🌉','🏰','👑'][i]) + '</span>' +
            '<span class="nvr-t"><b>第 ' + (i + 1) + ' 章 · ' + ['启程的石板路','迷雾小径','问答之桥','守门人的题','王座之巅'][i] + '</b>' +
            '<small>' + status + ' · ' + kns.length + ' 个知识点</small></span>' +
            '<span class="nvr-go">' + (locked ? '🔒' : done ? '重读' : rd ? '继续' : '阅读') + '</span></button>';
        }).join('') + '</div>' +
        '<div class="tiny" style="margin:12px 4px;line-height:1.7">读过上一章才会解锁下一章，不能跳读。每章正文里 <mark class="kn-hi">橙色重点</mark> 就是本章要掌握的知识点，读完再去闯关会眼熟很多。</div>';
    };
    BP.$view.innerHTML = '<div class="page novel-page"><div class="section-h"><h2>📚 学科冒险小说馆</h2><span class="sub">每科一本 · 主角就是你</span></div>' +
      '<div class="nv-books">' + books + '</div><div id="nvBookDetail">' + renderChapters(openSubj) + '</div></div>';
    const openCh = (subj, i) => {
      const locked = i > 0 && !nv[subj].done[i - 1];
      if (locked) return toast('🔒 先把第 ' + i + ' 章读完，才能读下一章');
      const rd = nv[subj].read[i] || 0;
      novelReader(k, subj, i, Math.max(0, rd - 1));
    };
    document.querySelectorAll('.nv-book').forEach((b) => (b.onclick = () => {
      document.querySelectorAll('.nv-book').forEach((x) => x.classList.remove('on'));
      b.classList.add('on');
      document.getElementById('nvBookDetail').innerHTML = renderChapters(b.dataset.s);
      bindRows(b.dataset.s);
    }));
    const bindRows = (subj) => document.querySelectorAll('#nvBookDetail .nv-row').forEach((b) => (b.onclick = () => openCh(subj, +b.dataset.c)));
    bindRows(openSubj);
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
    const un = (DB[g] && DB[g].units[c]) || DB.g3.units[c];
    const at = (arr, i) => arr[((i % arr.length) + arr.length) % arr.length];
    const pools = { en: [], math: [], cn: [], sci: [], eth: [] };
    /* 英语：本单元 6 个单词各成一点，再由 2 个句型各成一点（count 句子的题型） */
    const enList = [];
    (un.words || []).slice(0, 6).forEach((w) => enList.push({ s: 'en', n: '单词 ' + w[0] + '（' + w[1] + '）', sk: 'word' }));
    /* 句型插在词中间，避免一章结尾连着两道句型关 */
    (un.sents || []).slice(0, 2).forEach((x, i) => enList.splice(1 + i * 3, 0, { s: 'en', n: '句型 ' + x[0].replace('{w}', '____'), sk: 'sent', cn: x[1] }));
    pools.en = enList;
    for (let i = 0; i < KN_MIX.math; i++) pools.math.push({ s: 'math', n: at(MATH_KN[g] || MATH_KN.g3, c * KN_MIX.math + i) });
    for (let i = 0; i < KN_MIX.cn; i++) pools.cn.push({ s: 'cn', n: at(CN_KN[g] || CN_KN.g3, c * KN_MIX.cn + i) });
    for (let i = 0; i < KN_MIX.sci; i++) pools.sci.push({ s: 'sci', n: at(SCI_KN[g] || SCI_KN.g3, c * KN_MIX.sci + i) });
    for (let i = 0; i < KN_MIX.eth; i++) pools.eth.push({ s: 'eth', n: at(ETH_KN[g] || ETH_KN.g3, c * KN_MIX.eth + i) });
    const keys = ['en', 'math', 'cn', 'sci', 'eth'];
    const list = [];
    let guard = 0;
    /* 五科轮转铺开，避免同科连排 */
    while (list.length < KN_PER_CHAP && guard++ < 120) {
      let took = false;
      keys.forEach((k) => {
        if (list.length >= KN_PER_CHAP) return;
        if (pools[k].length) { list.push(pools[k].shift()); took = true; }
      });
      if (!took) break;
    }
    while (list.length < KN_PER_CHAP) list.push({ s: 'mix', n: '综合练习 · ' + un.t });
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
    for (let c = 0; c < 5; c++) { n += KN_PER_CHAP * KN_STAGES + 1; if (c < 4) n += 1; }
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
    /* v3.30 知识图谱地图（ver=5，460 关/年级）：
       旧版关卡按通关比例平移到新图，老玩家的进度不清零。 */
    if (!k.quest || k.quest.grade !== g || !Array.isArray(k.quest.nodes) || k.quest.ver !== 5) {
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
        grade: g, ver: 5, nodes,
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
    if (typeof ensureNovels === 'function') ensureNovels(k);
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
      (q.trophy ? '🏆 已通关，可重刷拿满星' : '进度 ' + doneN + '/' + total + ' 关 · 5 大学科 150 个知识点') + '</small></div>' +
      '<div class="qh-btns"><button id="qKnMap" title="知识图谱">📚</button><button id="qColl" title="我的收集">🧸</button>' +
      '<button id="qNovel" title="冒险小说">📜</button>' +
      '<button id="qStory" title="剧情引子开关">' + (storyEnabled() ? '📖' : '⚡') + '</button>' +
      '<button id="qWrong" title="错题本">📕' + (wrongOpen(k).length ? '<b class="wr-n">' + wrongOpen(k).length + '</b>' : '') + '</button><button id="qGrade" title="切换年级">🎓</button></div></div>' +
      '<div class="qbar-wrap"><div class="qbar"><i style="width:' + pct + '%"></i></div>' +
      '<div class="qbar-lb"><span>本学年 ' + total + ' 关 · 已通关 ' + doneN + '</span><b>' + pct + '%</b></div></div>' +
      '<div class="tiny q-tip">🎯 每章 30 个知识点，每个 3 级关卡（识记 → 练习 → 精通）；只显示当前进度附近，通关后自动推进</div>' +
      html + '</div>';

    if (k.classCode) document.getElementById('qGrade').style.display = 'none';
    else document.getElementById('qGrade').onclick = () => pickGradeSheet((gg) => {
      if (gg === k.grade) return;
      const q2 = questState(k);
      const hasProgress = q2.nodes.some((n) => n.done);
      if (hasProgress && !confirm('切换到' + gradeName(gg) + '会重置当前冒险进度（收集保留），确定？')) return;
      k.grade = gg;
      k.quest = { grade: gg, ver: 5, nodes: buildMap(gg), cards: q2.cards, badges: [], trophy: false, built: todayStr(), vis: {} };
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
    let body = '<div class="tiny">' + gradeName(g) + ' · 5 章 × ' + KN_PER_CHAP + ' 个知识点 = ' + (5 * KN_PER_CHAP) + ' 个点 · ' + mapSize(g) + ' 个关卡（每点 3 级）</div>';
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
  /* v3.45 每年级各科知识点总量（与知识图谱严格对齐：数学40·语文40·科学20·道法10·英语40） */
  const KN_TOTAL = { math: 40, cn: 40, en: 40, sci: 20, eth: 10 };
  /* v3.45 掌握度 = 当前「真正掌握的知识点数」/ 全年级该科知识点总数。
     「掌握」判定：该知识点答对次数 r>=2 且正确率>=60%，或已过三级精通。
     前期几乎没答题时掌握数≈0，显示个位数百分比，绝不会一上来就 100%。 */
  function masteredCount(k, subj) {
    const g = gradeOf(k);
    let n = 0;
    Object.keys(k.mastery || {}).forEach((key) => {
      const p = key.split('|');
      if (p[0] !== g || p[1] !== subj) return;
      const m = k.mastery[key] || {};
      const tot = (m.r || 0) + (m.w || 0);
      if ((m.r || 0) >= 2 && tot > 0 && m.r / tot >= 0.6) n++;
    });
    /* 闯关三级全通的知识点也算掌握 */
    try {
      const q = k.quest && k.quest.grid;
      if (q) return Math.max(n, Object.keys(q).filter((id) => (q[id] || 0) >= 3).length);
    } catch (e) {}
    return n;
  }
  /* 掌握进度：{ mastered, total, pct } —— 供首页图标与学情面板统一使用 */
  function mastProgress(k) {
    const out = {};
    Object.keys(SUBJ).forEach((s) => {
      /* v3.46 兜底不再静默吞错：缺表就报警并把分母设成 1（宁可显示 0/1，也不要拿错分母算出假百分比） */
      let total = KN_TOTAL[s];
      if (!total || total <= 0) {
        if (window.console) console.warn('[mastProgress] KN_TOTAL 缺少学科 ' + s + ' 的知识点总数，已按 1 兜底');
        total = 1;
      }
      const mastered = Math.min(total, masteredCount(k, s));
      out[s] = { mastered, total, pct: Math.round(mastered / total * 100) };
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
        if (!stu) { stu = { name: k.name, points: 0, daily: {}, pet: { name: k.pet.name, type: k.pet.type, exp: 0, lv: k.pet.lv }, dex: { [k.pet.type + '-baby']: true }, companions: [], milestones: [], skin: null, wrongBook: [], frags: {}, aid: [] }; c.kids.push(stu); }
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
  window.BPGames = { petInteract, aidSlots, rarOf, RAR, SUBJ, mastStats, mastAdd, mastProgress, masteredCount, KN_TOTAL,
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
