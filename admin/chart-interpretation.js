import {smallGroupSize} from './relationship-analysis.js?v=2';

const formats = {
  vi: new Intl.NumberFormat('vi-VN', {maximumFractionDigits: 2}),
  ko: new Intl.NumberFormat('ko-KR', {maximumFractionDigits: 2})
};
const sum = rows => rows.reduce((total, row) => total + row.value, 0);

function reportNumbers(lang) {
  const fmt = formats[lang].format;
  const share = (count, total) => `${fmt(count / total * 100)}%`;
  const modes = rows => {
    const max = Math.max(...rows.map(row => row.value));
    const labels = rows.filter(row => row.value === max).map(row => row.label);
    const count = lang === 'ko' ? `각 ${fmt(max)}건` : `${fmt(max)} phiếu mỗi mục`;
    return `${labels.join(', ')} (${count})`;
  };
  return {fmt, share, modes};
}

export function genreReport(genres, rows, total, lang = 'vi') {
  const {fmt, share, modes} = reportNumbers(lang);
  const n = rows ? rows.reduce((count, row) => count + row.total, 0) : sum(genres);
  const active = genres.filter(genre => genre.value > 0).length;
  const largest = rows?.reduce((a, b) => a.total >= b.total ? a : b);
  const rowModes = largest ? modes(genres.map((genre, index) => ({label: genre.label, value: largest.values[index]}))) : '';
  if (lang === 'ko') return [
    `장르 분석에는 전체 유효 응답 ${fmt(total)}건 가운데 ${fmt(n)}건(${share(n, total)})이 포함되었습니다. 현재 표본에서는 ${fmt(active)}개 장르가 한 번 이상 선택되었으며, 전체에서 가장 많이 선택된 장르는 ${modes(genres)}입니다. A07 문항에서는 최근 7일 동안 스트레스를 느낀 상황에서 가장 많이 들은 장르를 하나 선택합니다. 이 집계는 응답자가 회상한 주된 선택을 보여줍니다. 평소에 즐겨 듣는 모든 장르나 각 장르에 들인 시간은 별도의 질문으로 살펴볼 수 있습니다.`,
    largest ? `${largest.label}세는 장르를 선택한 응답이 ${fmt(largest.total)}건으로 가장 많았으며, 히트맵에 포함된 응답의 ${share(largest.total, n)}를 차지했습니다. ${largest.total >= smallGroupSize ? `이 연령대에서 가장 많이 선택된 장르는 ${rowModes}입니다.` : `응답이 있는 연령대는 모두 ${smallGroupSize}건 미만이므로 각 칸의 응답 수를 먼저 확인하는 편이 좋습니다.`} 행마다 분모가 다르므로 연령대별 비교에서는 응답 수와 비율을 함께 봅니다. 별표와 빗금이 있는 행에서는 응답 한 건만 추가되어도 최다 장르나 비율이 달라질 수 있습니다.`
      : `가로 막대에서 각 장르를 선택한 응답 수를 읽을 수 있습니다. 길이와 정렬 순서로 차이를 확인하고, 같은 길이의 막대는 동률로 기록합니다. 연령대별로 어떤 장르를 선택했는지 분석하려면 한 응답 안에서 연령과 장르를 함께 확인해야 합니다. 연령별 전체 건수와 장르별 전체 건수만으로는 각 칸의 조합을 구할 수 없습니다. 두 항목이 함께 있는 CSV가 있다면 연령대별 교차 집계를 볼 수 있습니다.`,
    `비교할 때는 각 연령대의 전체 응답 수를 확인한 뒤 같은 행의 장르 비율을 읽습니다. 4건이 12명 중에서 나왔을 때와 9명 중에서 나왔을 때는 선택한 인원이 같아도 비율이 다릅니다. 색상은 각 연령대 안에서의 비중을 읽는 단서이며, 칸에 적힌 수치는 표본 크기에 관한 정보를 함께 제공합니다. 연령대 간 차이가 작으면 실제 선택 건수로도 차이가 얼마나 되는지 확인한 뒤 보고서에 옮깁니다.`,
    `유효 응답 가운데 ${fmt(total - n)}건은 이 장르 분석의 분모에 들어가지 않았습니다. 스트레스 상황에서 음악을 듣지 않았다고 답한 사람도 전체 설문 응답에는 포함될 수 있습니다. 따라서 전체 응답자 수와 이 차트에 들어간 응답자 수가 달라질 수 있습니다. 또한 응답을 많이 제공한 연령대의 선택이 전체 장르 순위에 큰 영향을 줍니다. 어떤 연령대에서 응답이 적으면, 관찰된 선택을 그 나이대 전체의 특징으로 해석하기 전에 표본 구성을 살펴봐야 합니다.`,
    `보고서에는 연령대와 해당 집단의 응답 수, 최다 장르를 선택한 건수와 비율을 함께 제시할 수 있습니다. 다음 순위와 차이가 작거나 공동 최다라면 동률이나 상대적으로 분산된 선택도 그대로 기록하는 편이 정확합니다. 같은 장르를 자주 선택했다는 사실과 그 장르를 고른 사람들의 스트레스 점수 분포는 서로 다른 결과입니다. 장르별 상자그림을 함께 읽을 때 두 차트가 사용하는 분모와 질문을 각각 확인하면 어떤 차이가 실제로 관찰되었는지 명확해집니다.`,
    `현재 자료에서 연령대별 선호가 다르게 보이면 다음 조사에서 확인할 질문으로 삼을 수 있습니다. 예를 들어 비슷한 규모의 연령대 표본에서도 최다 장르와 다음 장르의 순서가 유지되는지 살펴볼 수 있습니다. 스트레스 상황에서 고른 장르와 음악을 선택한 목적을 함께 살펴보려면 두 문항의 응답을 같은 사람 단위로 연결해야 합니다. 향후 자료에서 같은 양상이 반복되는지 살피면 단일 표본에서 우연히 나타난 차이와 일관된 차이를 구별하는 데 도움이 됩니다.`
  ];
  const groupReading = largest && largest.total >= smallGroupSize
    ? `Trong nhóm này, lựa chọn nhiều nhất là ${rowModes}.`
    : `Các nhóm có dữ liệu đều dưới ${smallGroupSize} phiếu, nên phần tóm tắt để người đọc quan sát trực tiếp các số phiếu trong từng ô.`;
  return [
    `Biểu đồ sử dụng ${fmt(n)} trong ${fmt(total)} phiếu hợp lệ (${share(n, total)}) có câu trả lời phù hợp với phần phân tích thể loại. Trong mẫu hiện tại, ${fmt(active)} thể loại có ít nhất một lượt chọn. Nhìn trên tổng số lượt chọn, các thể loại đứng đầu là ${modes(genres)}. Mỗi phiếu ghi một lựa chọn ở câu A07, tức thể loại được nghe nhiều nhất trong những lúc căng thẳng. Các con số vì vậy mô tả lựa chọn chính mà người trả lời nhớ lại trong khoảng thời gian khảo sát.`,
    largest ? `Nhóm ${largest.label} có ${fmt(largest.total)} phiếu chọn thể loại và chiếm ${share(largest.total, n)} số phiếu trên heatmap. ${groupReading} Số lượt chọn và tỷ lệ theo nhóm cần đọc cùng nhau vì quy mô các nhóm tuổi khác nhau. Các dòng gạch chéo có ít phiếu. Những dòng đó vẫn hiển thị cả số lượt và tỷ lệ, với ký hiệu riêng để người đọc biết rằng một câu trả lời có thể làm tỷ lệ thay đổi đáng kể.`
      : `Biểu đồ cột cho thấy số lượt chọn của từng thể loại trong toàn bộ nhóm có câu trả lời A07. Thứ tự từ trên xuống giúp xác định những lựa chọn phổ biến nhất và phát hiện trường hợp đồng hạng. Để biết một thể loại được chọn nhiều vì nhóm tuổi nào, cần dữ liệu tuổi và thể loại trên cùng phiếu. Tổng số phiếu theo tuổi và tổng số phiếu theo thể loại là hai bảng riêng và không thể dùng để suy ra bảng giao giữa chúng.`,
    `Hãy đọc từ quy mô nhóm đến mẫu hình lựa chọn. Trước hết xác định nhóm nào có đủ nhiều phiếu để trở thành cơ sở so sánh với các nhóm còn lại. Sau đó đối chiếu thứ tự các thể loại và khoảng cách giữa những lựa chọn liền nhau. Một thể loại dẫn đầu sát nút phản ánh sở thích khá phân tán, trong khi lựa chọn dẫn xa có thể gợi ý sự tập trung trong chính nhóm đó. Kiểm tra số phiếu trước khi mô tả một chênh lệch nhỏ như đặc điểm ổn định.`,
    `Những phiếu nằm ngoài phần phân tích này giúp xác định phạm vi của kết quả. Người không chọn thể loại, chẳng hạn người báo cáo rằng họ không nghe nhạc khi căng thẳng, vẫn thuộc tổng số phiếu khảo sát. Tỷ lệ trong biểu đồ dùng mẫu số là các phiếu có câu trả lời thể loại phù hợp. Kích thước mẫu ở mỗi nhóm tuổi cũng phản ánh cách khảo sát thu được người tham gia. Nếu một nhóm chiếm tỷ trọng lớn, mô tả chung có thể nghiêng về lựa chọn của chính nhóm đó.`,
    `Khi dùng kết quả trong báo cáo, nên nêu số phiếu của nhóm cùng với thể loại dẫn đầu và tỷ lệ tương ứng. Đặt nhận xét này cạnh biểu đồ hộp để phân biệt mức độ phổ biến của một lựa chọn với phân bố điểm căng thẳng đi kèm. Hai biểu đồ dùng những câu trả lời khác nhau và cung cấp hai góc nhìn bổ sung. Nếu phát hiện một chênh lệch đáng chú ý, có thể xem nó như câu hỏi cho lần thu thập tiếp theo và kiểm tra xem mẫu hình có lặp lại ở các nhóm có quy mô cân bằng hơn hay không.`
  ];
}

export function minutesReport(bands, stats, total, lang = 'vi') {
  const {fmt, share, modes} = reportNumbers(lang);
  const zero = stats.values.find(row => row.value === 0)?.count ?? 0;
  const long = stats.values.reduce((n, row) => n + (row.value >= 120 ? row.count : 0), 0);
  if (lang === 'ko') return [
    `하루 평균 음악 청취 시간을 묻는 A05 문항에는 유효 응답 ${fmt(total)}건 중 ${fmt(stats.n)}건이 답했습니다. 가장 많이 나타난 구간은 ${modes(bands)}입니다. 막대 길이는 같은 시간 구간에 속한 응답자 수를 나타냅니다. 모든 막대가 공통 축을 사용하므로 구간마다 얼마나 많은 응답이 있는지 직접 비교할 수 있습니다. 0분 막대는 음악을 듣지 않았다고 응답한 건만 표시하며, 나머지 막대는 정해진 범위에 포함된 여러 시간 값을 합산합니다.`,
    `한 사람의 하루 청취 시간을 하나의 수치로 요약할 때 평균과 중앙값은 서로 다른 정보를 줍니다. 이 표본에서 평균은 ${fmt(stats.mean)}분, 중앙값은 ${fmt(stats.median)}분입니다. 제1사분위수 ${fmt(stats.q1)}분과 제3사분위수 ${fmt(stats.q3)}분 사이에는 응답의 가운데 절반이 놓입니다. 평균이 중앙값보다 많이 높다면 긴 청취시간을 보고한 응답이 몇 건인지 살펴볼 수 있습니다. 중앙값에 가까운 값이 어느 막대에 해당하는지도 확인하면 표본에서 흔한 청취시간을 이해하기 쉽습니다.`,
    `A05 응답 가운데 0분은 ${fmt(zero)}건(${share(zero, stats.n)})이고, 하루 120분 이상은 ${fmt(long)}건(${share(long, stats.n)})입니다. 관찰된 범위는 ${fmt(stats.min)}분에서 ${fmt(stats.max)}분까지입니다. 0분 역시 연구에 포함되는 응답입니다. 높은 값은 집중해서 음악을 들은 시간과 공부, 업무 또는 이동 중 배경 음악이 재생된 시간을 함께 떠올린 결과일 수 있습니다. 시간 기록은 참가자의 추정에 기반하므로 어떤 상황에서 들었는지에 따라 같은 시간 값도 다른 생활 습관을 설명할 수 있습니다.`,
    `막대의 시간 구간은 청취시간을 이해하기 쉬운 단위로 묶기 위해 폭을 다르게 설정했습니다. 막대 두 개의 응답 수가 같아도 분당 빈도는 각 구간의 폭에 따라 달라질 수 있습니다. 구간별 사람 수를 비교할 때는 막대가 나타내는 범위를 함께 읽습니다. 응답자가 시간을 떠올릴 때 30분이나 60분처럼 익숙한 단위로 반올림했을 가능성도 있습니다. 특정 값에 응답이 몰렸다면 실제 청취 습관과 응답자가 시간을 추정한 방법을 함께 고려할 수 있습니다.`,
    `시간 구간의 분포는 아래에서 스트레스 점수와 함께 보는 산점도의 배경을 제공합니다. 산점도는 같은 사람의 청취시간과 A10 점수를 연결하므로, 응답이 많이 모이는 시간대에서 스트레스 점수도 한 범위에 모이는지 확인할 수 있습니다. 짧거나 긴 구간에 응답자가 소수라면 그 구간의 스트레스 패턴을 설명할 때 해당 응답 수를 함께 밝혀야 합니다. 시간 분포에서는 전체 유효 응답 중 A05에 답하지 않은 ${fmt(total - stats.n)}건이 빠져 있다는 점도 집계표에 기록할 수 있습니다.`,
    `발표에서는 가장 흔한 청취 구간과 중앙값을 먼저 제시하고, 이어 평균과 관찰 범위를 함께 보여주면 분포를 압축해서 설명할 수 있습니다. 분포가 한쪽으로 길게 이어지면 평균 하나로 전형적인 응답을 설명하기 어려울 수 있습니다. 같은 시간 문항을 다른 집단에서 조사할 경우 같은 구간과 하루 평균 시간의 정의를 사용하는 것이 비교에 도움이 됩니다. 특히 청취하지 않은 날까지 포함하는지에 따라 응답에 쓰이는 기준이 달라질 수 있습니다.`
  ];
  return [
    `Có ${fmt(stats.n)} trong ${fmt(total)} phiếu hợp lệ trả lời câu A05 về số phút nghe nhạc trung bình mỗi ngày. Các khoảng có nhiều phiếu nhất là ${modes(bands)}. Cột dài cho thấy nhiều người cùng nằm trong một khoảng, còn các mốc trên cùng một trục giúp so sánh các khoảng trực tiếp. Khi đọc kết quả, cần lưu ý rằng khoảng từ 0 đến 0 chỉ đại diện cho người trả lời đúng 0 phút, trong khi những khoảng còn lại gộp nhiều giá trị phút khác nhau.`,
    `Thời gian trung bình là ${fmt(stats.mean)} phút mỗi ngày và trung vị là ${fmt(stats.median)} phút. Nửa giữa mẫu nằm khoảng từ ${fmt(stats.q1)} đến ${fmt(stats.q3)} phút theo tứ phân vị. Khoảng giữa này cho biết mức độ tập trung của câu trả lời và cho phép đọc trung bình cùng với một thước đo ít nhạy với các giá trị lớn. Nếu trung bình cao hơn trung vị đáng kể, hãy kiểm tra xem một số phiếu ở các khoảng nghe dài có góp phần kéo trung bình lên hay không.`,
    `Trong các phiếu có trả lời A05, ${fmt(zero)} phiếu báo 0 phút (${share(zero, stats.n)}) và ${fmt(long)} phiếu báo từ 120 phút trở lên (${share(long, stats.n)}). Giá trị thấp nhất được ghi nhận là ${fmt(stats.min)} phút và cao nhất là ${fmt(stats.max)} phút. Hai đầu phân bố có ý nghĩa riêng: 0 phút là một câu trả lời hợp lệ, còn những giá trị cao cần được hiểu trong bối cảnh thời gian nghe có thể bao gồm cả lúc học, làm việc, di chuyển hoặc có nhạc phát nền.`,
    `Các khoảng trên biểu đồ có độ rộng khác nhau vì mục đích của chúng là mô tả những mức thời lượng dễ hiểu. Chiều dài cột thể hiện số người trong từng khoảng, nên khi hai khoảng có số phiếu bằng nhau, mật độ theo từng phút vẫn có thể khác. Với mục tiêu mô tả thói quen, hãy ưu tiên báo cáo số phiếu theo khoảng và vị trí của trung vị. Số phút được tự ước lượng, vì thế các giá trị tròn như nửa giờ hoặc một giờ có thể là các mốc làm tròn tự nhiên.`,
    `Biểu đồ này đặt bối cảnh cho phần phân tích căng thẳng. Nếu đa số người trả lời tập trung ở vài khoảng thời lượng, bằng chứng về những mức nghe rất ngắn hoặc rất dài sẽ đến từ ít phiếu hơn. Biểu đồ phân tán bên dưới nối số phút với điểm A10 của chính từng người, nhờ đó có thể xem những mức thời lượng phổ biến đi với một cụm điểm hẹp hay nhiều mức điểm. Khi trình bày kết quả, hãy dùng số phiếu trả lời A05 làm mẫu số và ghi riêng ${fmt(total - stats.n)} phiếu thiếu câu trả lời này.`
  ];
}

export function scoreReport(scores, stats, high, total, lang = 'vi') {
  const {fmt, share, modes} = reportNumbers(lang);
  const zero = scores[0].value;
  if (lang === 'ko') return [
    `최근 7일의 스트레스 정도를 묻는 A10 문항에는 ${fmt(stats.n)}건의 응답이 모였습니다. 참가자는 0점부터 10점까지의 척도에서 점수를 골랐으며, 가장 많이 고른 점수는 ${modes(scores)}입니다. 가로축은 점수의 자연스러운 순서대로 배치했고, 막대의 높이는 각 점수를 고른 사람 수를 나타냅니다. 높은 막대만 확인하기보다 인접한 점수의 막대도 함께 살펴보면 하나의 뚜렷한 정점이 있는지, 여러 점수가 비슷한 빈도로 나타났는지 확인할 수 있습니다.`,
    `전체 응답의 평균은 ${fmt(stats.mean)}/10점, 중앙값은 ${fmt(stats.median)}/10점입니다. 응답의 가운데 절반은 ${fmt(stats.q1)}점에서 ${fmt(stats.q3)}점 사이에 있습니다. 평균은 응답 전체를 하나의 수치로 요약하고, 중앙값과 사분위 범위는 응답자 가운데 절반이 어디에 모여 있는지 보여줍니다. 실제 응답에서 관찰된 최저점은 ${fmt(stats.min)}점, 최고점은 ${fmt(stats.max)}점입니다. 설문에서 선택할 수 있는 범위와 표본에서 실제로 관찰된 범위를 구분하면 극단에 응답이 얼마나 모였는지 더 정확하게 설명할 수 있습니다.`,
    `7~10점을 보고한 응답은 ${fmt(high)}건으로 A10 응답의 ${share(high, stats.n)}이고, 0점은 ${fmt(zero)}건(${share(zero, stats.n)})입니다. 7~10점은 척도 상단에 모인 응답을 함께 설명하기 위한 집계 구간입니다. 조사에서 0점과 10점 모두 유효한 선택지로 처리합니다. 상단 구간의 막대 높이를 비교하면 몇 개의 점수대에 고르게 퍼져 있는지, 특정 점수에 주로 모여 있는지 볼 수 있습니다. 점수에 의미를 부여할 때는 응답자가 선택한 점수와 이 집계 구간의 목적을 함께 밝혀야 합니다.`,
    `점수는 최근 7일 동안 느낀 스트레스에 대한 자기평가입니다. 개인의 학업, 업무, 수면, 최근 사건에 따라 점수가 달라질 수 있고, 같은 정도의 경험도 사람마다 다른 숫자로 표현할 수 있습니다. 따라서 분포를 설명할 때는 특정 점수를 개인의 임상 상태와 연결하는 해석을 피해야 합니다. 구간 전체의 빈도와 가운데 절반이 놓인 범위를 함께 보면, 표본 안에서 응답이 얼마나 다양했는지 확인할 수 있습니다. 서로 다른 집단의 점수를 비교할 때도 집단별 응답 기준이나 관찰 기간이 같았는지 살펴보는 것이 좋습니다.`,
    `이 차트는 장르별 또는 청취 빈도별 스트레스 점수를 읽을 때 전체 표본의 기준이 됩니다. 장르 집단의 중앙값이 전체 중앙값과 비슷하더라도 집단의 점수가 더 넓게 퍼져 있을 수 있습니다. 빈도별 평균에서 높거나 낮은 집단이 보이면 해당 집단의 응답 수와 가능한 경우 점수 분포를 함께 확인해야 합니다. 유효 응답 가운데 A10의 점수가 집계에 포함되지 않은 응답은 ${fmt(total - stats.n)}건입니다. 보고서에는 전체 응답 수와 해당 차트의 분모를 같이 적습니다.`,
    `결과를 한 문단으로 요약할 때는 가장 많이 선택된 점수, 중앙값, 상단 구간 인원을 차례로 제시할 수 있습니다. 극단값이 많을 경우에는 어느 점수에서 빈도가 늘어나는지 덧붙입니다. 수치가 비슷하게 나타난 여러 점수가 있다면 한 점수에 응답이 몰렸다고 해석하기보다 넓게 분포했다는 사실을 설명하면 됩니다. 이후 다른 시점에 다시 조사한다면 같은 문항과 응답 척도를 사용하고, 표본이 어떻게 달랐는지도 함께 기록하면 비교에 도움이 됩니다.`
  ];
  return [
    `Biểu đồ trình bày ${fmt(stats.n)} câu trả lời A10 trên thang tự đánh giá căng thẳng từ 0 đến 10. Các mức điểm xuất hiện nhiều nhất là ${modes(scores)}. Trục ngang giữ nguyên thứ tự của thang điểm và mỗi cột đếm số phiếu tại đúng mức đó, nên một cột cao phản ánh mức điểm được chọn thường xuyên trong mẫu. Quan sát toàn bộ dãy cột giúp phân biệt một đỉnh rõ với tình huống nhiều mức điểm có số lượt chọn tương đương.`,
    `Điểm trung bình đạt ${fmt(stats.mean)}/10 và trung vị đạt ${fmt(stats.median)}/10. Nửa giữa mẫu nằm trong khoảng từ ${fmt(stats.q1)} đến ${fmt(stats.q3)} điểm. Nếu khoảng này rộng, người tham gia có thể có trải nghiệm khác nhau dù nghiên cứu dùng một số trung bình chung. Đồng thời, các mức thấp nhất và cao nhất được quan sát là ${fmt(stats.min)} và ${fmt(stats.max)}. Đây là phạm vi thực tế của mẫu, khác với phạm vi mà bảng hỏi cho phép người tham gia chọn.`,
    `Có ${fmt(high)} phiếu điểm từ 7 đến 10, tương đương ${share(high, stats.n)} số câu trả lời A10, và ${fmt(zero)} phiếu điểm 0 (${share(zero, stats.n)}). Khoảng 7 đến 10 là một cách gộp mô tả để đọc phần trên của thang đo. Điểm 0 và điểm 10 được tính như các lựa chọn hợp lệ. Vì số lần xuất hiện của mỗi điểm đều được thể hiện, người đọc có thể kiểm tra xem phần điểm cao rải đều hay chủ yếu tập trung vào một mức cụ thể.`,
    `Khi phân tích, hãy xem xét khả năng các nhóm người trả lời sử dụng cùng một thang điểm theo cách khác nhau. Điểm phản ánh tự đánh giá trong bảy ngày gần đây và có thể chịu ảnh hưởng của bối cảnh học tập, công việc, giấc ngủ hoặc biến cố cá nhân. Mức độ khác biệt trong mẫu vì vậy nên được mô tả nhiều hơn bằng số phiếu và phân bố, thay vì nhìn một mức điểm như một chẩn đoán hoặc dùng ngưỡng mô tả để gắn nhãn cho từng người.`,
    `Phần này làm mốc khi đọc các biểu đồ so sánh nhóm. Nếu một nhóm thể loại có trung vị gần trung vị toàn mẫu, hãy tiếp tục xem khoảng giữa của nhóm có rộng hơn hay hẹp hơn. Nếu một nhóm nghe nhạc có điểm trung bình cao, hãy xem số phiếu nhóm đó và cách các điểm phân bố trước khi diễn giải. Với ${fmt(total - stats.n)} phiếu hợp lệ ngoài mẫu số A10, báo cáo nên phân biệt tổng số phiếu với số người thực sự có điểm căng thẳng.`
  ];
}

export function frequencyReport(rows, total, smallGroupSize, lang = 'vi') {
  const {fmt} = reportNumbers(lang);
  const n = rows.reduce((count, row) => count + row.n, 0);
  const comparable = rows.filter(row => row.n >= smallGroupSize);
  const low = Math.min(...comparable.map(row => row.value)), high = Math.max(...comparable.map(row => row.value));
  const groupsAt = value => comparable.filter(row => row.value === value).map(row => `${row.label} (n=${fmt(row.n)})`).join(', ');
  if (lang === 'ko') return [
    `이 차트에는 스트레스를 느낀 상황에서 음악을 들은 빈도별로 ${fmt(rows.length)}개 집단, 총 ${fmt(n)}건이 포함되었습니다. 각 점은 같은 빈도를 고른 사람들의 A10 스트레스 점수 평균을 나타냅니다. 척도 범위는 0~10점이며, n은 그 점수 계산에 들어간 응답 수입니다. 스트레스를 느꼈으나 음악을 듣지 않았던 사람도 해당 빈도 집단에 포함됩니다. 조사 기간에 스트레스를 느끼지 않았다고 답한 사람은 상황별 청취 빈도를 비교하는 집계에서 별도로 처리합니다.`,
    comparable.length < 2
      ? `현재 ${smallGroupSize}건 이상인 집단은 ${fmt(comparable.length)}개입니다. 각 빈도의 평균은 응답 수와 함께 그대로 표시합니다. 응답 수가 적은 집단은 빈 원으로 구별하며, 이런 집단에서는 한두 건이 추가되면 평균이 크게 움직일 수 있습니다. 비교할 수 있는 집단이 최소 두 개일 때 평균의 범위를 요약합니다. 관찰된 점수의 배경이 필요하면 전체 점수 분포에서 점수대별 인원과 중앙값을 살펴볼 수 있습니다.`
      : `${smallGroupSize}건 이상인 ${fmt(comparable.length)}개 집단에서 평균이 가장 낮은 쪽은 ${groupsAt(low)}의 ${fmt(low)}/10점이고, 가장 높은 쪽은 ${groupsAt(high)}의 ${fmt(high)}/10점입니다. 두 값의 차이는 ${fmt(high - low)}점입니다. 빈 원은 이 범위 산출에서 제외된 소표본 집단을 가리킵니다. ${smallGroupSize}건 기준은 데이터가 적은 집단을 표시하기 위한 화면상의 규칙입니다. 관찰된 차이를 다른 집단에도 적용할 수 있는지는 응답 모집 방식과 표본 분포에 따라 판단해야 합니다.`,
    `평균이 비슷한 두 집단에서도 사람마다 선택한 점수의 범위와 분산은 다를 수 있습니다. 반대로 평균이 다른 두 집단에서 응답 점수가 상당히 겹칠 수도 있습니다. 이 차트의 한 점에는 집단 응답을 요약한 평균이 들어가므로, 개인별로 많이 선택한 점수나 점수가 흩어진 정도를 읽기는 어렵습니다. 점 간격이 좁거나 집단별 크기가 서로 크게 다를 때는 평균 순위보다 각 집단의 응답 수와 실제 점수 차이를 함께 설명하는 편이 낫습니다.`,
    `빈도는 스트레스를 이미 느낀 상황에서 얼마나 자주 음악을 들었는지 묻습니다. 점수는 지난 7일 동안의 스트레스를 전반적으로 묻습니다. 스트레스를 많이 느낀 사람은 이를 다루기 위해 음악을 더 자주 들었을 수 있습니다. 생활 환경이나 업무량처럼 두 문항에 동시에 영향을 주는 요인도 있을 수 있습니다. 이 자료는 두 특성이 함께 나타난 양상을 비교하며, 음악을 듣기 시작한 시점과 점수가 변한 시점을 확인할 수 있는 시간 정보는 따로 수집하지 않았습니다.`,
    `전체 유효 응답 ${fmt(total)}건 가운데 ${fmt(total - n)}건은 이 차트의 분모에 포함되지 않았습니다. 발표에서는 어떤 빈도 집단이 집계되었는지 명시하고, 제외된 응답과 소표본 표시의 의미를 간단히 설명할 수 있습니다. 산점도는 하루에 들은 분 단위의 시간을 비교하고, 상자그림은 자주 선택한 장르에 따라 점수를 비교합니다. 시간, 상황별 빈도, 장르는 다른 문항에서 수집한 값입니다. 예를 들어 같은 빈도를 골라도 한 번에 듣는 길이는 사람마다 다를 수 있습니다.`,
    `이 차트에서 확인하려는 질문은 음악을 듣는 빈도에 따라 현재 표본의 자기보고 점수가 어떻게 분포하는가입니다. 응답이 늘어나면 같은 빈도 집단에서 평균이 유지되는지, 특정 연령이나 생활환경에 응답이 몰려 있는지 확인할 수 있습니다. 점수 차이가 보일 때 결과 문장에는 빈도 집단 두 곳의 이름과 각각의 평균 및 인원을 함께 기재하면 독자가 관찰된 범위를 직접 판단할 수 있습니다.`
  ];
  return [
    `Biểu đồ tổng hợp ${fmt(n)} phiếu từ ${fmt(rows.length)} mức tần suất nghe nhạc khi căng thẳng có dữ liệu. Điểm của mỗi nhóm là trung bình câu trả lời A10 trên thang 0 đến 10. Ký hiệu n ghi số phiếu đứng sau trung bình đó. Nhóm có trải nghiệm căng thẳng nhưng không nghe nhạc vẫn có thể thuộc phép so sánh. Người trả lời rằng họ không cảm thấy căng thẳng trong giai đoạn khảo sát được xử lý riêng vì câu hỏi về cách nghe trong lúc căng thẳng có ý nghĩa khác với họ.`,
    comparable.length < 2 ? `Hiện có ${fmt(comparable.length)} nhóm đạt ít nhất ${smallGroupSize} phiếu. Các giá trị trung bình vẫn được hiển thị theo từng mức tần suất, kèm số phiếu. Dấu tròn rỗng dùng cho nhóm ít phiếu để phân biệt những giá trị có thể thay đổi nhanh khi có thêm người trả lời. Bản tóm tắt chỉ so sánh biên độ khi có từ hai nhóm đạt mốc hiển thị. Biểu đồ phân bố điểm toàn mẫu giúp cung cấp thêm bối cảnh trong lúc các nhóm tần suất còn thưa.`
      : `Trong ${fmt(comparable.length)} nhóm có ít nhất ${smallGroupSize} phiếu, trung bình thấp nhất thuộc ${groupsAt(low)} với ${fmt(low)}/10 và cao nhất thuộc ${groupsAt(high)} với ${fmt(high)}/10. Khoảng chênh lệch là ${fmt(high - low)} điểm. Các nhóm ít phiếu được vẽ bằng vòng tròn rỗng và nằm ngoài phép so sánh biên độ này. Mốc ${smallGroupSize} phiếu là quy ước trình bày để làm nổi bật độ thưa của dữ liệu. Nó không bảo đảm rằng một chênh lệch quan sát có thể khái quát cho nhóm người rộng hơn.`,
    `Một điểm đại diện cho trung bình có thể tóm tắt gọn một nhóm nhưng sẽ che bớt phân bố điểm của các cá nhân trong nhóm đó. Hai nhóm có trung bình gần nhau vẫn có thể khác về độ biến thiên. Tương tự, trung bình của một nhóm ít phiếu có thể thay đổi rõ khi có thêm một câu trả lời. Những thông tin này đặc biệt quan trọng khi các điểm trung bình chỉ cách nhau một khoảng nhỏ trên thang đo chung, hoặc khi một nhóm có số phiếu lớn hơn hẳn các nhóm khác.`,
    `Câu hỏi về tần suất tập trung vào hành vi diễn ra khi đã cảm thấy căng thẳng, còn câu hỏi điểm số phản ánh cả khoảng bảy ngày. Một cách đọc hợp lý là xem hai chỉ số như những đặc điểm được báo cáo đồng thời. Người cảm thấy căng thẳng nhiều hơn có thể chủ động nghe thường xuyên hơn để đối phó. Bối cảnh cá nhân cũng có thể ảnh hưởng tới cả mức căng thẳng lẫn tần suất nghe. Do đó, thứ tự trung bình trên biểu đồ chỉ mô tả mẫu đang quan sát.`,
    `Trong ${fmt(total)} phiếu hợp lệ toàn bộ, có ${fmt(total - n)} phiếu không thuộc tập nhóm đã dùng cho biểu đồ này. Khi đưa biểu đồ vào báo cáo, hãy trình bày rõ nhóm nào được gộp và nhóm nào nằm ngoài mẫu số. Biểu đồ phân tán bổ sung góc nhìn về số phút nghe mỗi ngày, còn biểu đồ hộp so sánh điểm căng thẳng giữa các lựa chọn thể loại. Đọc cả ba theo đúng biến số giúp tránh đánh đồng nghe lâu, nghe thường xuyên khi căng thẳng và chọn một loại nhạc cụ thể.`
  ];
}

export function scatterReport(stats, total, sensitivity, lang = 'vi') {
  const {fmt} = reportNumbers(lang);
  const overlapping = stats.points.filter(point => point.count > 1).length;
  if (lang === 'ko') return [
    `산점도는 동일한 응답에 있는 하루 청취시간 A05와 스트레스 점수 A10을 연결합니다. 유효 응답 ${fmt(total)}건 중 두 값이 모두 있는 응답은 ${fmt(stats.n)}건이며, ${fmt(total - stats.n)}건은 이 분석에 포함되지 않았습니다. 가로축은 하루 평균 청취 분, 세로축은 스트레스 점수 0~10점입니다. 서로 다른 좌표는 ${fmt(stats.points.length)}개이고, 그중 ${fmt(overlapping)}개 좌표에서는 여러 응답이 겹칩니다. 원의 크기가 클수록 같은 시간과 점수 조합을 답한 인원이 많습니다.`,
    `짝을 이룬 응답에서 청취시간의 중앙값은 하루 ${fmt(stats.minutes.median)}분, 스트레스 점수의 중앙값은 ${fmt(stats.scores.median)}점입니다. 청취시간에서 가운데 절반은 ${fmt(stats.minutes.q1)}~${fmt(stats.minutes.q3)}분에 놓입니다. 관찰된 전체 범위는 시간 ${fmt(stats.minutes.min)}~${fmt(stats.minutes.max)}분, 점수 ${fmt(stats.scores.min)}~${fmt(stats.scores.max)}점입니다. 점선이 교차하는 곳은 각각의 중앙값을 표시합니다. 한 축에서 멀리 떨어진 점이 보여도 세로 위치와 겹친 응답 수를 함께 확인하면 그 응답이 전체 패턴에서 어떤 위치에 있는지 파악할 수 있습니다.`,
    `${stats.rho === null ? '스피어만 순위상관은 유효한 응답 쌍이 최소 세 건이고 두 변수 모두에 변이가 있을 때 계산할 수 있습니다.' : `스피어만 순위상관은 ${fmt(stats.rho)}입니다. 범위는 −1부터 +1까지이며, 부호는 순위 관계의 방향을 나타냅니다. 절댓값은 두 변수가 한 방향으로 변하는 경향을 나타냅니다. 구간마다 변화 방향이 다르거나 단조 관계가 약하면 값이 0에 가까울 수 있습니다.`} 같은 값을 가진 응답에는 평균 순위를 부여했고, 겹친 좌표의 응답 수를 순위 계산에 반영했습니다.`,
    sensitivity
      ? `민감도 분석에서는 제3사분위수에 사분위 범위의 1.5배를 더한 ${fmt(sensitivity.cutoff)}분을 기준으로, 이를 초과한 ${fmt(sensitivity.omitted)}건을 잠시 제외했습니다. ${sensitivity.rho === null ? '남은 자료의 응답 수 또는 값의 변이가 부족해 순위상관을 다시 계산하지 못했습니다.' : `남은 ${fmt(sensitivity.n)}건에서 순위상관은 ${fmt(sensitivity.rho)}입니다. 두 수치를 비교하면 긴 청취시간 응답이 포함되었을 때 해석이 어느 정도 달라지는지 볼 수 있습니다.`} 산점도와 주 분석의 순위상관에는 모든 유효 응답 쌍을 사용했습니다. 이 기준을 넘었다는 사실만으로 응답의 오류 여부를 판단할 수는 없습니다.`
      : `관계의 모양은 순위상관 수치 옆에서 직접 살펴볼 수 있습니다. 비슷한 시간에 서로 다른 점수가 세로로 늘어서 있다면, 같은 시간 동안 들은 사람들의 스트레스 점수가 다양하다는 뜻입니다. 점이 여러 곳에 모일 경우에는 어떤 시간대에서 분산이 큰지 확인합니다. 표본에서 관찰되지 않은 시간이나 점수를 그래프로부터 추정하는 해석에는 한계가 있습니다. 특히 응답 수가 적은 구간의 모양을 설명할 때는 겹친 인원과 실제 관찰 범위를 밝혀야 합니다.`,
    `점수 선택 기능으로 한 점수에 해당하는 원을 강조해, 그 점수를 보고한 사람이 어느 청취시간에 분포하는지 살펴볼 수 있습니다. 마우스로 가리키거나 터치하고 키보드 화살표를 사용하면 좌표의 시간과 점수, 응답 수를 읽을 수 있습니다. 강조를 해제해 전체 점의 위치를 다시 보면 일부 점수가 표본 전체 분포에서 차지하는 위치가 명확해집니다. 화면의 강조는 관찰 대상을 바꾸기 위한 기능이며, 이 문단의 통계는 전체 응답 쌍을 대상으로 계산됩니다.`,
    `두 문항은 같은 기간을 묻습니다. 업무 중 배경 음악을 들은 사람과 스트레스에 대처하려고 음악을 들은 사람은 청취시간이 같아도 이유가 다를 수 있습니다. 두 변수의 시간 순서나 다른 생활 요인은 이 그래프만으로 판단하기 어렵습니다. 보고서에서는 ${fmt(stats.n)}건이라는 분모와 관찰된 경향을 함께 기록하고, 하루 청취시간 분포도 확인해 두 값이 모두 있는 사람들이 전체 응답에서 주로 어느 시간대에 해당하는지 살펴볼 수 있습니다.`
  ];
  const rho = stats.rho === null ? 'Chưa tính hệ số Spearman vì cần ít nhất ba phiếu ghép cặp và cả hai biến phải có biến thiên.'
    : `Hệ số tương quan hạng Spearman là ${fmt(stats.rho)}. Hệ số này nằm từ −1 đến +1. Dấu cho biết chiều liên hệ theo thứ hạng, còn trị tuyệt đối cho biết mức độ hai biến có xu hướng cùng thay đổi một chiều. Giá trị gần 0 có thể xuất hiện khi có ít liên hệ theo thứ hạng hoặc khi mẫu hình thay đổi hướng ở các khoảng khác nhau.`;
  return [
    `Biểu đồ ghép câu A05 và A10 trên cùng một phiếu. Trong ${fmt(total)} phiếu hợp lệ, ${fmt(stats.n)} phiếu có đủ hai giá trị, còn ${fmt(total - stats.n)} phiếu nằm ngoài phân tích này. Phần trục ngang thể hiện số phút nghe trung bình mỗi ngày và trục dọc ghi điểm căng thẳng từ 0 đến 10. Mẫu có ${fmt(stats.points.length)} tọa độ khác nhau, trong đó ${fmt(overlapping)} tọa độ được nhiều phiếu chia sẻ. Vòng tròn lớn hơn biểu thị nhiều phiếu hơn tại đúng cặp giá trị đó.`,
    `Trong tập phiếu ghép cặp, trung vị thời lượng là ${fmt(stats.minutes.median)} phút mỗi ngày và trung vị điểm căng thẳng là ${fmt(stats.scores.median)}. Nửa giữa của thời lượng nằm trong khoảng ${fmt(stats.minutes.q1)} đến ${fmt(stats.minutes.q3)} phút. Thời lượng quan sát trải từ ${fmt(stats.minutes.min)} đến ${fmt(stats.minutes.max)} phút, còn điểm quan sát trải từ ${fmt(stats.scores.min)} đến ${fmt(stats.scores.max)}. Sự khác nhau giữa khoảng giữa và toàn bộ phạm vi giúp nhận ra những trường hợp ở xa vùng tập trung mà vẫn giữ nguyên thông tin của chúng trên biểu đồ.`,
    `${rho} ${sensitivity ? `Phép kiểm tra độ nhạy tạm bỏ ${fmt(sensitivity.omitted)} phiếu trên mốc ${fmt(sensitivity.cutoff)} phút, tính bằng Q3 cộng 1,5 lần khoảng tứ phân vị của thời lượng. ${sensitivity.rho === null ? 'Dữ liệu còn lại chưa đủ biến thiên hoặc số phiếu để tính hệ số.' : `Với ${fmt(sensitivity.n)} phiếu còn lại, hệ số là ${fmt(sensitivity.rho)}. So sánh hai kết quả cho biết nhận xét thay đổi ra sao khi giảm ảnh hưởng của các thời lượng rất dài.`} Biểu đồ và hệ số chính vẫn dùng toàn bộ phiếu ghép cặp.` : 'Hãy đọc hệ số cạnh hình dạng của đám điểm. Các giá trị lặp được xử lý bằng hạng trung bình và số phiếu tại mỗi tọa độ được tính vào phân tích. Khi các điểm xếp thành nhiều dải ở cùng một mức thời lượng, điểm căng thẳng vẫn biến thiên giữa những người nghe cùng số phút.'}`,
    `Có thể chọn một mức căng thẳng để làm nổi các vòng tròn tương ứng và xem những người chọn mức điểm đó báo cáo thời lượng nghe ở đâu trên trục. Rê chuột, chạm hoặc dùng bàn phím để đọc số phiếu tại một tọa độ. Sau đó trở lại toàn bộ mẫu để đặt nhóm vừa chọn vào bối cảnh. Cách đọc này giúp kiểm tra chồng điểm và quan sát những cụm nhỏ mà chỉ nhìn một hệ số tương quan có thể bỏ qua. Các số liệu trong đoạn phân tích vẫn mô tả toàn bộ tập phiếu ghép cặp.`,
    `Hai câu trả lời đề cập cùng một giai đoạn, nên vị trí của các điểm cho thấy mối liên hệ quan sát được. Thứ tự diễn ra giữa hai yếu tố vẫn chưa rõ. Một người nghe lâu vì căng thẳng và một người nghe lâu khi làm việc có thể cùng nằm ở một khoảng thời lượng. Khi trình bày kết quả, hãy nêu mẫu số ${fmt(stats.n)}, mô tả hướng và mức độ phân tán nếu thấy rõ, đồng thời đối chiếu với biểu đồ thời lượng chung để xem những phiếu có đủ hai câu trả lời có tập trung ở một nhóm thời lượng cụ thể không.`
  ];
}

export function boxReport(groups, total, minimumBoxSize, lang = 'vi') {
  const {fmt} = reportNumbers(lang);
  const n = groups.reduce((count, group) => count + group.stats.n, 0);
  const largest = groups.reduce((a, b) => a.stats.n >= b.stats.n ? a : b);
  const small = groups.filter(group => group.stats.n < minimumBoxSize).length;
  const comparable = groups.filter(group => group.stats.n >= minimumBoxSize);
  const range = comparable.map(group => group.stats.median);
  if (lang === 'ko') return [
    `이 차트는 스트레스 상황에서 가장 많이 들은 장르 A07을 같은 사람의 스트레스 점수 A10과 연결해 비교합니다. 전체 유효 응답 ${fmt(total)}건 중 ${fmt(n)}건이 분석에 포함되었으며, 자료가 있는 장르는 ${fmt(groups.length)}개입니다. 각 행은 동일한 0~10점 축을 사용하고, 장르별로 응답 수를 표시합니다. 특정 장르를 선택하지 않은 응답은 이 집계의 분모에 포함되지 않습니다. 따라서 같은 A10 문항을 사용하는 전체 점수 분포와 이 차트의 응답 수는 서로 다를 수 있습니다.`,
    `응답이 가장 많은 장르는 ${largest.label}이며, 해당 장르를 고른 응답은 ${fmt(largest.stats.n)}건입니다. 이 집단의 중앙값은 ${fmt(largest.stats.median)}점이고, 제1사분위수는 ${fmt(largest.stats.q1)}점, 제3사분위수는 ${fmt(largest.stats.q3)}점입니다. 관찰된 점수는 ${fmt(largest.stats.min)}점에서 ${fmt(largest.stats.max)}점에 걸쳐 있습니다. 상자의 양쪽 끝 사이에는 집단 점수의 가운데 절반이 있으며, 굵은 선이 중앙값을 가리킵니다. 상자가 긴 집단에서는 가운데 절반의 점수가 여러 수준에 걸쳐 있는 것으로 읽을 수 있습니다.`,
    `${minimumBoxSize}건 미만인 ${fmt(small)}개 장르에서는 관찰된 점수를 개별 점으로 보여줍니다. 표본이 적을 때는 몇 점에 응답이 있었고 값이 겹치는지 파악하는 데 이 방식이 도움이 됩니다. 상자가 있는 집단의 수염은 상자 양끝에서 사분위 범위의 1.5배 이내에 있는 관찰값까지 뻗습니다. 이 범위 밖의 값도 점으로 그대로 남깁니다. 수염 바깥의 점은 해당 집단의 중심에서 멀리 떨어진 하나의 응답 특성을 보여주므로, 분포 전체를 읽는 데 포함할 수 있습니다.`,
    comparable.length > 1
      ? `상자를 표시할 수 있는 ${fmt(comparable.length)}개 집단의 중앙값은 ${fmt(Math.min(...range))}~${fmt(Math.max(...range))}점에 걸쳐 있습니다. 중앙값의 위치와 상자가 겹치는 범위를 함께 살펴봅니다. 가운데 점수대가 많이 겹쳐도 최저점이나 최고점은 다를 수 있습니다. 반대로 중앙값이 떨어져 있다면 어느 정도 차이가 나는지와 각 집단의 자료가 몇 건인지 함께 제시할 수 있습니다. 중앙값과 수염, 바깥쪽 점을 차례로 확인하면 같은 평균으로는 구별하기 어려운 분포의 모습을 설명할 수 있습니다.`
      : `현재 상자를 표시할 수 있는 집단은 ${fmt(comparable.length)}개입니다. 장르 간 비교는 각 행의 응답 수와 관찰된 점수를 중심으로 해석합니다. 선택 메뉴에서 관심 장르를 강조한 다음, 점들이 어느 위치에 함께 놓이는지 확인해 보세요. 응답 수가 적은 장르의 점수가 한쪽에 모여 있더라도 몇 사람의 응답을 넘어서는 해석에는 추가 자료가 필요합니다. 장르에 따라 응답이 얼마나 모였는지 먼저 확인하면 비교의 범위를 정하기 쉽습니다.`,
    `어떤 장르를 고른 사람들이 높은 중앙값을 보고했다면 해당 표본에서 그 장르 선택과 점수가 함께 나타났다는 뜻입니다. 장르를 고른 사람들의 연령, 평소 청취시간, 상황, 이전 스트레스가 서로 다를 수 있습니다. 보고서에는 장르, 중앙값, 응답 수를 함께 제시하고 다른 집단과 분포가 얼마나 겹치는지 설명하는 편이 좋습니다. 연령대별 장르 히트맵을 나란히 읽으면 특정 장르를 많이 선택한 연령대가 두 집단 사이의 구성 차이와 관련 있는지도 확인할 수 있습니다.`,
    `장르를 강조할 때는 먼저 선택한 행에서 점과 상자의 위치를 살펴본 뒤 전체 보기로 돌아가 다른 장르와 축을 비교합니다. 같은 점수를 여러 사람이 보고한 곳에서는 점수와 응답 수를 함께 읽어 중복 위치를 놓치지 않도록 합니다. 서로 다른 장르의 점수 간격이 눈에 띄는 경우에는 현재 자료를 바탕으로 새 연구 질문을 만들 수 있습니다. 그 차이가 다른 표본에서 반복되는지 평가할 때는 장르별 응답 수와 참가자 구성도 함께 기록합니다.`
  ];
  return [
    `Biểu đồ đối chiếu câu A07 về thể loại nghe nhiều nhất lúc căng thẳng với điểm A10 của cùng người trả lời. Có ${fmt(n)} trong ${fmt(total)} phiếu hợp lệ tạo thành ${fmt(groups.length)} nhóm thể loại có điểm. Mỗi hàng dùng chung thang 0 đến 10 và ghi số phiếu của nhóm. Những người không chọn thể loại cụ thể nằm ngoài phần so sánh này. Vì vậy, bảng phân bố toàn mẫu và biểu đồ hộp có thể dùng mẫu số khác nhau, dù đều sử dụng câu A10 để lấy điểm căng thẳng.`,
    `Nhóm có nhiều phiếu nhất là ${largest.label} với ${fmt(largest.stats.n)} câu trả lời. Điểm trung vị của nhóm này là ${fmt(largest.stats.median)}. Tứ phân vị thứ nhất và thứ ba lần lượt là ${fmt(largest.stats.q1)} và ${fmt(largest.stats.q3)}, còn điểm quan sát chạy từ ${fmt(largest.stats.min)} đến ${fmt(largest.stats.max)}. Khi đọc một hộp, đường đậm nằm ở trung vị và hai cạnh của hộp bao quanh nửa giữa phân bố. Hộp rộng hơn cho thấy các câu trả lời ở phần giữa trải trên nhiều mức điểm hơn.`,
    `Có ${fmt(small)} nhóm dưới ${minimumBoxSize} phiếu được thể hiện bằng các điểm quan sát. Với nhóm ít người, cách này giúp thấy trực tiếp từng giá trị có mặt và phân biệt mức trùng lặp. Với nhóm có hộp, râu kéo đến các giá trị quan sát còn nằm trong giới hạn một phẩy năm lần khoảng tứ phân vị tính từ hai mép hộp. Các điểm nằm ngoài râu vẫn được vẽ để giữ thông tin về những trường hợp ít gặp, kể cả khi chúng khác rõ với vùng tập trung của nhóm.`,
    comparable.length > 1 ? `Trong ${fmt(comparable.length)} nhóm có đủ phiếu để vẽ hộp, trung vị dao động từ ${fmt(Math.min(...range))} đến ${fmt(Math.max(...range))} điểm. Hãy so cả vị trí đường trung vị lẫn phần chồng lấp giữa các hộp. Một chênh lệch trung vị nhỏ đi kèm khoảng giữa chồng lấp nhiều có thể cùng tồn tại với sự khác nhau ở hai đầu phân bố. Ngược lại, khi hai hộp tách rõ về vị trí, vẫn cần nêu quy mô từng nhóm để người đọc thấy lượng dữ liệu đứng sau nhận xét.`
      : `Hiện có ${fmt(comparable.length)} nhóm đủ số phiếu để vẽ hộp, nên phần so sánh giữa các thể loại chủ yếu dựa vào các điểm được quan sát và số phiếu ở từng hàng. Dùng bộ chọn để làm nổi một thể loại, đọc n và vị trí các điểm trước khi so với nhóm khác. Một nhóm nhỏ có thể xuất hiện ở một phía của thang điểm chỉ vì tình cờ thu được vài câu trả lời giống nhau. Cần thêm phiếu ở những nhóm đó để mô tả ổn định hơn.`,
    `Một thể loại có trung vị cao hoặc thấp trong biểu đồ này phản ánh điểm tự báo cáo của những người đã chọn thể loại đó. Những người chọn các thể loại khác nhau cũng có thể khác nhau về tuổi, thời lượng nghe, hoàn cảnh hoặc mức căng thẳng ban đầu. Khi viết kết luận, nên ghi tên nhóm, trung vị và số phiếu, sau đó mô tả sự phân tán và mức chồng lấp. Đặt kết quả cạnh heatmap tuổi theo thể loại sẽ giúp nhận ra khả năng cơ cấu tuổi khác nhau giữa các nhóm đang được so sánh.`
  ];
}
