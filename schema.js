export const fields = [
  {
    "code": "A01",
    "key": "age",
    "label": [
      "Bạn bao nhiêu tuổi (tính theo số năm tròn)?",
      "현재 만 나이는 몇 세입니까?",
      "What is your age in completed years?",
      "您的周岁年龄是多少？"
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
      "您如何描述自己的性别？"
    ],
    "required": true,
    "type": "choice",
    "options": "gender"
  },
  {
    "code": "A03",
    "key": "culture",
    "label": [
      "Hiện bạn đang sinh sống ở quốc gia nào?",
      "현재 거주하고 있는 국가는 어디입니까?",
      "In which country do you currently live?",
      "您目前居住在哪个国家？"
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
      "哪一项最符合您目前的学习和有偿工作情况？"
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
      "过去7天，您平均每天听多少分钟音乐？请把没有听音乐的日子也计算在内。"
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
      "过去7天，当您感到压力时，您听音乐的频率如何？"
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
      "在这些感到压力的时刻，您最常听哪类音乐？"
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
      "过去7天，您听音乐的主要原因是什么？"
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
      "您有多喜欢第7题所选的音乐类型？"
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
      "总体而言，过去7天您感受到的压力有多大？"
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
      "女性"
    ],
    [
      "male",
      "Nam",
      "남성",
      "Male",
      "男性"
    ],
    [
      "nonbinary",
      "Phi nhị nguyên",
      "논바이너리",
      "Nonbinary",
      "非二元性别"
    ],
    [
      "other",
      "Khác",
      "기타",
      "Other",
      "其他"
    ],
    [
      "na",
      "Không trả lời",
      "응답하지 않음",
      "Prefer not to answer",
      "不回答"
    ]
  ],
  "culture": [
    [
      "vn",
      "Việt Nam",
      "베트남",
      "Vietnam",
      "越南"
    ],
    [
      "kr",
      "Hàn Quốc",
      "한국",
      "South Korea",
      "韩国"
    ],
    [
      "cn",
      "Trung Quốc",
      "중국",
      "China",
      "中国"
    ],
    [
      "mn",
      "Mông Cổ",
      "몽골",
      "Mongolia",
      "蒙古国"
    ],
    [
      "mm",
      "Myanmar",
      "미얀마",
      "Myanmar",
      "缅甸"
    ],
    [
      "np",
      "Nepal",
      "네팔",
      "Nepal",
      "尼泊尔"
    ],
    [
      "other",
      "Khác",
      "기타",
      "Other",
      "其他"
    ],
    [
      "na",
      "Không trả lời",
      "응답하지 않음",
      "Prefer not to answer",
      "不回答"
    ]
  ],
  "status": [
    [
      "student",
      "Chỉ đi học",
      "학업만",
      "Study only",
      "仅学习"
    ],
    [
      "work",
      "Chỉ đi làm",
      "유급 근로만",
      "Paid work only",
      "仅从事有偿工作"
    ],
    [
      "both",
      "Vừa học vừa làm",
      "학업과 근로 병행",
      "Studying and working",
      "半工半读"
    ],
    [
      "neither",
      "Không học và không làm công việc có thu nhập",
      "학업·유급 근로 모두 해당 없음",
      "Neither studying nor in paid work",
      "目前既未学习也未从事有偿工作"
    ],
    [
      "other",
      "Khác",
      "기타",
      "Other",
      "其他"
    ]
  ],
  "genre": [
    [
      "pop",
      "Pop",
      "팝",
      "Pop",
      "流行"
    ],
    [
      "ballad",
      "Ballad",
      "발라드",
      "Ballad",
      "抒情"
    ],
    [
      "classical_piano",
      "Classical / Piano",
      "클래식 / 피아노",
      "Classical / Piano",
      "古典／钢琴"
    ],
    [
      "lofi_ambient",
      "Lo-fi / Ambient",
      "로파이 / 앰비언트",
      "Lo-fi / Ambient",
      "低保真／氛围"
    ],
    [
      "rock_metal",
      "Rock / Metal",
      "록 / 메탈",
      "Rock / Metal",
      "摇滚／金属"
    ],
    [
      "hiphop_rnb",
      "Hip-hop / R&B",
      "힙합 / R&B",
      "Hip-hop / R&B",
      "嘻哈／节奏布鲁斯"
    ],
    [
      "traditional",
      "Truyền thống",
      "전통음악",
      "Traditional",
      "传统"
    ],
    [
      "other",
      "Khác",
      "기타",
      "Other",
      "其他"
    ],
    [
      "none",
      "Không nghe nhạc khi stress",
      "스트레스 시 음악을 듣지 않음",
      "I do not listen to music when stressed",
      "压力大时不听音乐"
    ]
  ],
  "purpose": [
    [
      "destress",
      "Giảm stress",
      "스트레스 완화",
      "Reduce stress",
      "减轻压力"
    ],
    [
      "study_work",
      "Học / làm",
      "공부 / 업무",
      "Study / work",
      "学习／工作"
    ],
    [
      "sleep",
      "Ngủ",
      "수면",
      "Sleep",
      "睡眠"
    ],
    [
      "commute",
      "Đi lại",
      "이동",
      "Travel / commute",
      "出行"
    ],
    [
      "entertain",
      "Giải trí",
      "오락",
      "Entertainment",
      "娱乐"
    ],
    [
      "other",
      "Khác",
      "기타",
      "Other",
      "其他"
    ],
    [
      "none",
      "Không nghe nhạc trong 7 ngày qua",
      "지난 7일간 음악을 듣지 않음",
      "I did not listen to music in the past 7 days",
      "过去7天没有听音乐"
    ]
  ],
  "stress_frequency": [
    [
      "never",
      "Không bao giờ",
      "전혀 없음",
      "Never",
      "从不"
    ],
    [
      "rarely",
      "Hiếm khi",
      "드물게",
      "Rarely",
      "很少"
    ],
    [
      "sometimes",
      "Thỉnh thoảng",
      "가끔",
      "Sometimes",
      "有时"
    ],
    [
      "often",
      "Thường xuyên",
      "자주",
      "Often",
      "经常"
    ],
    [
      "always",
      "Luôn luôn",
      "항상",
      "Always",
      "总是"
    ],
    [
      "no_stress",
      "Không cảm thấy căng thẳng trong 7 ngày qua",
      "지난 7일간 스트레스를 느끼지 않음",
      "I did not feel stressed in the past 7 days",
      "过去7天没有感到压力"
    ]
  ]
};
