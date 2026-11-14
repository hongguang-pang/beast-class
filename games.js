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

  /* ================= v3.25 学科混排 =================
     主课：语文/数学/英语（权重高）  副课：科学/生活常识（权重低）
     关卡难度 lv0-4 与节点进度挂钩，题目按 lv 出 */
  const SUBJ = {
    en:   { icon: '🔤', name: '英语', c: '#4da3ff', bosses: ['单词巨龙', '句型法师'] },
    cn:   { icon: '🀄', name: '语文', c: '#ff8a65', bosses: ['拼音妖王', '成语守门人'] },
    math: { icon: '➗', name: '数学', c: '#7ecb5f', bosses: ['计算魔王', '算式巨兽'] },
    sci:  { icon: '🔬', name: '科学', c: '#9b7bff', bosses: ['自然谜题兽', '实验怪博士'] },
    eth:  { icon: '🌱', name: '常识', c: '#4db6ac', bosses: ['习惯小卫士', '品德考官'] }
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
     battle/review：本节点学科 + 加权随机混科（保证一关多科）
     boss：本节点学科为主（3/5），其余混科
     final：语数英全覆盖 + 混科，lv4 最高难度 */
  function genNodeQs(node, g) {
    const lv = node.lv == null ? 2 : node.lv;
    const subj = node.subj || 'en';
    const WS = () => genSubjectQ(weightedSubj(), g, lv, node.u);
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
    return genMix(node.t === 'battle' && lv >= 3 ? 4 : 3, [() => genSubjectQ(subj, g, lv, node.u), WS, WS]);
  }

  /* ================= 地图生成 ================= */
  /* 学科轮换：保证相邻关卡不同科，主课出场多于副课 */
  const SUBJ_ROT = ['en', 'math', 'cn', 'sci', 'math', 'en', 'cn', 'eth'];
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
    const total = nodes.length;
    return nodes.map((n, i) => {
      n.i = i; n.done = false; n.stars = 0;
      if (n.t === 'battle' || n.t === 'review' || n.t === 'boss') {
        n.subj = SUBJ_ROT[i % SUBJ_ROT.length];
        n.lv = Math.min(4, Math.floor(i / total * 5));
      }
      if (n.t === 'final') n.lv = 4;
      return n;
    });
  }
  /* 旧存档节点缺 subj/lv 字段时补默认值（运行时兜底，宝箱不需要） */
  function ensureMapFields(q) {
    if (!Array.isArray(q.nodes)) return;
    q.nodes.forEach((n) => {
      const need = n.t === 'battle' || n.t === 'review' || n.t === 'boss' || n.t === 'final';
      if (!need) return;
      if (n.subj == null && n.t !== 'final') n.subj = SUBJ_ROT[n.i % SUBJ_ROT.length];
      if (n.lv == null) n.lv = n.t === 'final' ? 4 : n.i != null ? Math.min(4, Math.floor(n.i / q.nodes.length * 5)) : 2;
    });
  }
  function questState(k) {
    const g = gradeOf(k);
    if (!k.quest || k.quest.grade !== g || !Array.isArray(k.quest.nodes)) {
      k.quest = { grade: g, nodes: buildMap(g), cards: [], badges: [], trophy: false, built: todayStr() };
    }
    return k.quest;
  }
  const curIdx = (q) => { for (let i = 0; i < q.nodes.length; i++) if (!q.nodes[i].done) return i; return -1; };
  const wrongOpen = (k) => (k.wrongBook || []).filter((w) => !w.ok);
  /* 老数据/新用户兜底：补齐游戏所需字段 */
  function ensureKid(k) {
    if (!Array.isArray(k.wrongBook)) k.wrongBook = [];
    if (!k.frags) k.frags = {};
    if (!Array.isArray(k.aid)) k.aid = [];
  }

  /* ================= v3.24 稀有度 / 掉落 / 助战 ================= */
  const RAR = {
    N:   { name: '普通', c: '#8fa0b3', w: 52 },
    R:   { name: '稀有', c: '#4da3ff', w: 28 },
    SR:  { name: '史诗', c: '#b46bff', w: 15 },
    SSR: { name: '传说', c: '#ffb300', w: 5 }
  };
  const rarOf = (t) => {
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
      el.querySelector('#qzX').onclick = () => { if (confirm('中途退出本题不记录成绩，确定退出？')) { el.remove(); } };
      el.querySelectorAll('.qz-opt').forEach((b) => (b.onclick = () => answer(+b.dataset.i, b)));
      /* 自动化测试钩子: 仅当测试脚本显式写入 sessionStorage 时生效 */
      if (sessionStorage.getItem('qzTestMark')) el.querySelectorAll('.qz-opt')[q.a].style.border = '3px solid gold';
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
        /* 助战宠物协战：每只 22% 概率追加 1 点伤害 */
        let extra = 0;
        if (cfg.enemy && cfg.aid) cfg.aid.forEach((a, i) => {
          if (Math.random() < 0.22) {
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
  /* 掉落宠物展示（带稀有度光效） */
  function petDropFX(card, k, cb) {
    const meta = BP.PETS[card] || { name: card, emoji: '🐾' };
    const rar = rarOf(card), R = RAR[rar];
    const m = document.createElement('div');
    m.className = 'evo-mask';
    m.innerHTML = '<div class="evo-box drop-box" style="border-color:' + R.c + ';box-shadow:0 0 40px ' + R.c + '66">' +
      '<div class="rar-chip" style="background:' + R.c + '">' + rar + ' · ' + R.name + '</div>' +
      '<div class="big img"><img src="images/gif/' + card + '-growth.gif" alt=""></div>' +
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
  function viewQuest() {
    const k = kid(); if (!k) return;
    ensureKid(k);
    const q = questState(k);
    ensureMapFields(q);
    const g = gradeOf(k);
    const ci = curIdx(q);
    const finalLocked = wrongOpen(k).length > 0;
    BP.$view.innerHTML = '<div class="page quest-page">' +
      '<div class="quest-hero">' +
      '<img class="qh-pet" src="' + petImg(k) + '" alt="">' +
      '<div class="qh-t"><b>' + gradeName(g) + ' · 知识冒险</b><small>' +
      (q.trophy ? '🏆 已通关！可以重刷拿满星' : '进度 ' + q.nodes.filter((n) => n.done).length + '/' + q.nodes.length) + ' · 语数英为主 · 科学常识为辅</small></div>' +
      '<div class="qh-btns"><button id="qColl">🧸 收集</button><button id="qWrong">📕 错题本' + (wrongOpen(k).length ? ' <b class="wr-n">' + wrongOpen(k).length + '</b>' : '') + '</button><button id="qGrade">🎓</button></div></div>' +
      '<div class="qmap">' +
      q.nodes.map((n, i) => {
        const meta = NODE_META[n.t];
        const locked = i > ci || (n.t === 'final' && finalLocked);
        const cur = i === ci && !(n.t === 'final' && finalLocked);
        const G = DB[g];
        const S = (n.t === 'battle' || n.t === 'boss') && n.subj ? SUBJ[n.subj] : null;
        const title = n.t === 'final' ? FINAL : n.t === 'boss' ? (S ? S.icon + ' ' + S.name + '·' + S.bosses[n.u % S.bosses.length] : BOSSES[n.u]) : n.t === 'treasure' ? '神秘宝箱' :
          n.t === 'review' ? '复习营地 · ' + G.units[n.u - 1].t : G.units[n.u].t + ' · ' + (n.t === 'battle' ? '战斗' : '');
        let sub = meta.name;
        if (n.lv != null && (n.t === 'battle' || n.t === 'review' || n.t === 'boss')) sub += ' · 难度 ' + '●'.repeat(n.lv + 1) + '○'.repeat(4 - n.lv);
        if (n.t === 'final' && finalLocked && i === ci + 1) sub = '🔒 先去错题本订正错题';
        else if (n.t === 'final' && i === ci + 1) sub = '🎓 挑战年级最强';
        return '<div class="qnode ' + n.t + ' ' + (n.done ? 'done' : '') + (cur ? ' cur' : '') + (locked ? ' lock' : '') + '" data-i="' + i + '">' +
          '<div class="qn-line"></div>' +
          '<div class="qn-ic">' + (n.done ? (n.t === 'treasure' ? '📦' : '✅') : locked ? '🔒' : n.t === 'boss' && S ? S.icon : meta.icon) + '</div>' +
          '<div class="qn-b">' +
          (S ? '<i class="qn-tag" style="background:' + S.c + '">' + S.icon + S.name + '</i>' : '') +
          '<b>' + esc(title) + '</b>' +
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
    ensureMapFields(q);
    if (n.t === 'treasure') return openTreasure(k, q, n, refresh);
    const lv = n.lv == null ? 2 : n.lv;
    const qs = genNodeQs(n, g);
    /* 敌人血量 = 题目数（答对扣血，保证可击败）；难度体现在题目 lv 与题量上 */
    const bossS = n.subj ? SUBJ[n.subj] : null;
    const enemy = n.t === 'battle' ? (function (s) { return { em: s.split(' ')[0], name: s.split(' ')[1], hp: qs.length }; })(ENEMIES[n.u % ENEMIES.length])
      : n.t === 'review' ? { em: '🛡️', name: '复习木桩', hp: qs.length }
      : n.t === 'boss' ? (bossS ? { em: bossS.icon, name: bossS.name + '·' + bossS.bosses[n.u % bossS.bosses.length], hp: qs.length }
        : (function (s) { return { em: s.split(' ')[0], name: s.split(' ')[1], hp: qs.length }; })(BOSSES[n.u]))
      : { em: '👑', name: '知识魔王', hp: qs.length };
    quizRun({
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
        let dropMsg = '';
        const bonus = n.lv || 0; /* 难度加成：关卡越靠后奖励越高 */
        if (n.t === 'battle') {
          const ft = dropFrag(k);
          reward(k, 2 + bonus, 12 + bonus * 3, '冒险战斗获胜 · ' + DB[g].units[n.u].t + ' · 掉落🧩' + (BP.PETS[ft] ? BP.PETS[ft].name : '') + '碎片', '⚔️');
          dropMsg = '🧩 掉落「' + (BP.PETS[ft] ? BP.PETS[ft].name : '?') + '」碎片 ×1';
        }
        if (n.t === 'review') {
          const ft = dropFrag(k, ['N', 'R']);
          reward(k, 1 + bonus, 6 + bonus * 2, '完成复习营地 · 掉落🧩' + (BP.PETS[ft] ? BP.PETS[ft].name : '') + '碎片', '🛡️');
          dropMsg = '🧩 掉落「' + (BP.PETS[ft] ? BP.PETS[ft].name : '?') + '」碎片 ×1';
        }
        if (n.t === 'boss') {
          if (!q.badges.includes(n.u)) q.badges.push(n.u);
          const card = dropPetOf(k, q, rollRarity(['R', 'SR', 'SSR']));
          reward(k, 5 + bonus, 25 + bonus * 5, '击败' + (bossS ? bossS.name : '单元') + ' Boss · 获得「' + DB[g].units[n.u].em + '」徽章 + 宠物「' + (BP.PETS[card] ? BP.PETS[card].name : card) + '」', '👑');
          dropMsg = card;
        }
        if (n.t === 'final') {
          q.trophy = true;
          const card = dropPetOf(k, q, 'SSR');
          reward(k, 20, 60, '🏆 击败知识魔王，通关' + gradeName(g) + '冒险 · 获得传说宠物「' + (BP.PETS[card] ? BP.PETS[card].name : card) + '」', '🏆');
          dropMsg = card;
        }
        P.save(); refresh();
        if (n.t === 'boss' || n.t === 'final') {
          const isFinal = n.t === 'final';
          victoryFX(isFinal ? '🏆 通关啦！' : '👑 Boss 击败！',
            isFinal ? gradeName(g) + '全部知识掌握！' : '获得「' + DB[g].units[n.u].em + '」单元徽章',
            () => petDropFX(dropMsg, k, refresh));
        } else toast('战斗胜利 +' + (n.t === 'review' ? 1 + bonus : 2 + bonus) + ' 积分' + (dropMsg ? ' · ' + dropMsg : ''));
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
                reward(k, 1, 4, '错题订正成功', '📕');
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

  /* ================= 导出给 app.js 调用 ================= */
  window.BPGames = { petInteract, aidSlots, rarOf, RAR };

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
