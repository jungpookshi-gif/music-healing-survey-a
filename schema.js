export const fields = [
  {
    "code": "A01",
    "key": "age",
    "label": [
      "Bạn bao nhiêu tuổi (tính theo số năm tròn)?",
      "현재 만 나이는 몇 세입니까?",
      "What is your age in completed years?",
      "您的周岁年龄是多少？",
      "Та хэдэн настай вэ? Бүтэн насаа оруулна уу."
    ],
    "required": true,
    "type": "number",
    "options": "age"
  },
  {
    "code": "A02",
    "key": "gender",
    "label": [
      "Bạn tự mô tả giới tính của mình như thế nào?",
      "본인의 성별을 어떻게 표현하시겠습니까?",
      "How do you describe your gender?",
      "您如何描述自己的性别？",
      "Та хүйсээ хэрхэн тодорхойлох вэ?"
    ],
    "required": true,
    "type": "choice",
    "options": "gender"
  },
  {
    "code": "A03",
    "key": "culture",
    "label": [
      "Bạn thuộc nền văn hóa nào hoặc bạn đến từ quốc gia nào?",
      "어느 문화권에 속해 있거나 어느 나라 출신입니까?",
      "What is your cultural background or country of origin?",
      "您的文化背景是什么，或您来自哪个国家？",
      "Та ямар соёлын бүлэгт харьяалагддаг вэ, эсвэл аль улсаас гаралтай вэ?"
    ],
    "required": true,
    "type": "choice",
    "options": "culture"
  },
  {
    "code": "A04",
    "key": "status",
    "label": [
      "Hiện bạn đang học tập hoặc làm công việc có thu nhập theo hình thức nào?",
      "현재 학업과 유급 근로 중 어디에 해당합니까?",
      "Which best describes your current study and paid work status?",
      "哪一项最符合您目前的学习和有偿工作情况？",
      "Суралцах болон цалинтай ажил эрхлэх байдлыг тань аль хариулт хамгийн сайн тодорхойлох вэ?"
    ],
    "required": false,
    "type": "choice",
    "options": "status"
  },
  {
    "code": "A05",
    "key": "listen_min",
    "label": [
      "Trong 7 ngày qua, trung bình mỗi ngày bạn nghe nhạc bao nhiêu phút? Tính cả ngày không nghe.",
      "지난 7일간 하루 평균 몇 분 음악을 들었습니까? 듣지 않은 날도 포함해 주세요.",
      "Over the past 7 days, how many minutes per day did you listen to music on average? Include days with no listening.",
      "过去7天，您平均每天听多少分钟音乐？请把没有听音乐的日子也计算在内。",
      "Өнгөрсөн 7 хоногт та өдөрт дунджаар хэдэн минут хөгжим сонссон бэ? Хөгжим сонсоогүй өдрүүдийг ч тооцно уу."
    ],
    "required": false,
    "type": "number",
    "options": "listen_min"
  },
  {
    "key": "stress_frequency",
    "label": [
      "Trong 7 ngày qua, khi cảm thấy căng thẳng, bạn nghe nhạc thường xuyên đến mức nào?",
      "지난 7일간 스트레스를 느꼈을 때 얼마나 자주 음악을 들었습니까?",
      "Over the past 7 days, how often did you listen to music when you felt stressed?",
      "过去7天，当您感到压力时，您听音乐的频率如何？",
      "Өнгөрсөн 7 хоногт та стресстэй үедээ хэр олон удаа хөгжим сонссон бэ?"
    ],
    "required": true,
    "code": "A06",
    "type": "choice",
    "options": "stress_frequency"
  },
  {
    "code": "A07",
    "key": "stress_genre",
    "label": [
      "Trong những lúc căng thẳng đó, bạn nghe thể loại nào nhiều nhất?",
      "그렇게 스트레스를 느꼈을 때 가장 많이 들은 장르는 무엇입니까?",
      "During those stressful moments, which genre did you listen to most?",
      "在这些感到压力的时刻，您最常听哪类音乐？",
      "Тухайн стресстэй үед та ямар төрлийн хөгжим хамгийн их сонссон бэ?"
    ],
    "required": true,
    "type": "choice",
    "options": "genre"
  },
  {
    "code": "A08",
    "key": "purpose",
    "label": [
      "Trong 7 ngày qua, lý do chính bạn nghe nhạc là gì?",
      "지난 7일간 음악을 들은 주된 이유는 무엇입니까?",
      "What was your main reason for listening to music over the past 7 days?",
      "过去7天，您听音乐的主要原因是什么？",
      "Өнгөрсөн 7 хоногт хөгжим сонссон гол шалтгаан тань юу байсан бэ?"
    ],
    "required": false,
    "type": "choice",
    "options": "purpose"
  },
  {
    "code": "A09",
    "key": "genre_like",
    "label": [
      "Bạn thích thể loại đã chọn ở câu 7 đến mức nào?",
      "7번에서 선택한 음악 장르를 얼마나 좋아합니까?",
      "How much do you like the genre you chose in question 7?",
      "您有多喜欢第7题所选的音乐类型？",
      "Та 7-р асуултад сонгосон хөгжмийн төрөлдөө хэр дуртай вэ?"
    ],
    "required": true,
    "type": "scale",
    "options": "genre_like"
  },
  {
    "code": "A10",
    "key": "stress_week",
    "label": [
      "Nhìn chung, trong 7 ngày qua, mức căng thẳng bạn cảm nhận là bao nhiêu?",
      "지난 7일을 전반적으로 돌아볼 때, 체감한 스트레스는 어느 정도였습니까?",
      "Overall, how much stress did you feel over the past 7 days?",
      "总体而言，过去7天您感受到的压力有多大？",
      "Ерөнхийдөө өнгөрсөн 7 хоногт та хэр их стресс мэдэрсэн бэ?"
    ],
    "required": true,
    "type": "scale",
    "options": "stress_week"
  }
];
export const options = {
  "gender": [
    [
      "female",
      "Nữ",
      "여성",
      "Female",
      "女性",
      "Эмэгтэй"
    ],
    [
      "male",
      "Nam",
      "남성",
      "Male",
      "男性",
      "Эрэгтэй"
    ],
    [
      "nonbinary",
      "Phi nhị nguyên",
      "논바이너리",
      "Nonbinary",
      "非二元性别",
      "Хоёртын бус хүйс"
    ],
    [
      "other",
      "Khác",
      "기타",
      "Other",
      "其他",
      "Бусад"
    ],
    [
      "na",
      "Không trả lời",
      "응답하지 않음",
      "Prefer not to answer",
      "不回答",
      "Хариулахгүй"
    ]
  ],
  "culture": [
    [
      "vn",
      "Việt Nam",
      "베트남",
      "Vietnam",
      "越南",
      "Вьетнам"
    ],
    [
      "kr",
      "Hàn Quốc",
      "한국",
      "South Korea",
      "韩国",
      "Өмнөд Солонгос"
    ],
    [
      "cn",
      "Trung Quốc",
      "중국",
      "China",
      "中国",
      "Хятад"
    ],
    [
      "mn",
      "Mông Cổ",
      "몽골",
      "Mongolia",
      "蒙古国",
      "Монгол"
    ],
    [
      "mm",
      "Myanmar",
      "미얀마",
      "Myanmar",
      "缅甸",
      "Мьянмар"
    ],
    [
      "np",
      "Nepal",
      "네팔",
      "Nepal",
      "尼泊尔",
      "Балба"
    ],
    [
      "other",
      "Khác",
      "기타",
      "Other",
      "其他",
      "Бусад"
    ],
    [
      "na",
      "Không trả lời",
      "응답하지 않음",
      "Prefer not to answer",
      "不回答",
      "Хариулахгүй"
    ]
  ],
  "status": [
    [
      "student",
      "Chỉ đi học",
      "학업만",
      "Study only",
      "仅学习",
      "Зөвхөн суралцдаг"
    ],
    [
      "work",
      "Chỉ đi làm",
      "유급 근로만",
      "Paid work only",
      "仅从事有偿工作",
      "Зөвхөн цалинтай ажил эрхэлдэг"
    ],
    [
      "both",
      "Vừa học vừa làm",
      "학업과 근로 병행",
      "Studying and working",
      "半工半读",
      "Суралцахын зэрэгцээ цалинтай ажил эрхэлдэг"
    ],
    [
      "neither",
      "Không học và không làm công việc có thu nhập",
      "학업·유급 근로 모두 해당 없음",
      "Neither studying nor in paid work",
      "目前既未学习也未从事有偿工作",
      "Суралцдаггүй, цалинтай ажил эрхэлдэггүй"
    ],
    [
      "other",
      "Khác",
      "기타",
      "Other",
      "其他",
      "Бусад"
    ]
  ],
  "genre": [
    [
      "pop",
      "Pop",
      "팝",
      "Pop",
      "流行",
      "Поп"
    ],
    [
      "ballad",
      "Ballad",
      "발라드",
      "Ballad",
      "抒情",
      "Баллад"
    ],
    [
      "classical_piano",
      "Classical / Piano",
      "클래식 / 피아노",
      "Classical / Piano",
      "古典／钢琴",
      "Сонгодог / төгөлдөр хуур"
    ],
    [
      "lofi_ambient",
      "Lo-fi / Ambient",
      "로파이 / 앰비언트",
      "Lo-fi / Ambient",
      "低保真／氛围",
      "Лоу-фай / эмбиент"
    ],
    [
      "rock_metal",
      "Rock / Metal",
      "록 / 메탈",
      "Rock / Metal",
      "摇滚／金属",
      "Рок / металл"
    ],
    [
      "hiphop_rnb",
      "Hip-hop / R&B",
      "힙합 / R&B",
      "Hip-hop / R&B",
      "嘻哈／节奏布鲁斯",
      "Хип-хоп / R&B"
    ],
    [
      "traditional",
      "Truyền thống",
      "전통음악",
      "Traditional",
      "传统",
      "Уламжлалт хөгжим"
    ],
    [
      "other",
      "Khác",
      "기타",
      "Other",
      "其他",
      "Бусад"
    ],
    [
      "none",
      "Không nghe nhạc khi stress",
      "스트레스 시 음악을 듣지 않음",
      "I do not listen to music when stressed",
      "压力大时不听音乐",
      "Стресстэй үед хөгжим сонсдоггүй"
    ]
  ],
  "purpose": [
    [
      "destress",
      "Giảm stress",
      "스트레스 완화",
      "Reduce stress",
      "减轻压力",
      "Стрессээ багасгах"
    ],
    [
      "study_work",
      "Học / làm",
      "공부 / 업무",
      "Study / work",
      "学习／工作",
      "Хичээл хийх / ажиллах"
    ],
    [
      "sleep",
      "Ngủ",
      "수면",
      "Sleep",
      "睡眠",
      "Унтах"
    ],
    [
      "commute",
      "Đi lại",
      "이동",
      "Travel / commute",
      "出行",
      "Замд явах"
    ],
    [
      "entertain",
      "Giải trí",
      "오락",
      "Entertainment",
      "娱乐",
      "Зугаацах"
    ],
    [
      "other",
      "Khác",
      "기타",
      "Other",
      "其他",
      "Бусад"
    ],
    [
      "none",
      "Không nghe nhạc trong 7 ngày qua",
      "지난 7일간 음악을 듣지 않음",
      "I did not listen to music in the past 7 days",
      "过去7天没有听音乐",
      "Өнгөрсөн 7 хоногт хөгжим сонсоогүй"
    ]
  ],
  "stress_frequency": [
    [
      "never",
      "Không bao giờ",
      "전혀 없음",
      "Never",
      "从不",
      "Огт сонсоогүй"
    ],
    [
      "rarely",
      "Hiếm khi",
      "드물게",
      "Rarely",
      "很少",
      "Ховор"
    ],
    [
      "sometimes",
      "Thỉnh thoảng",
      "가끔",
      "Sometimes",
      "有时",
      "Заримдаа"
    ],
    [
      "often",
      "Thường xuyên",
      "자주",
      "Often",
      "经常",
      "Байнга шахуу"
    ],
    [
      "always",
      "Luôn luôn",
      "항상",
      "Always",
      "总是",
      "Үргэлж"
    ],
    [
      "no_stress",
      "Không cảm thấy căng thẳng trong 7 ngày qua",
      "지난 7일간 스트레스를 느끼지 않음",
      "I did not feel stressed in the past 7 days",
      "过去7天没有感到压力",
      "Өнгөрсөн 7 хоногт стресс мэдрээгүй"
    ]
  ]
};
