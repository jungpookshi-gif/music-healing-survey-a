import {smallGroupSize} from './relationship-analysis.js?v=2';

const values = new Intl.NumberFormat('vi-VN', {maximumFractionDigits: 2});
const fmt = number => values.format(number);
const share = (count, total) => `${fmt(count / total * 100)}%`;
const sum = rows => rows.reduce((total, row) => total + row.value, 0);

function modes(rows) {
  const max = Math.max(...rows.map(row => row.value));
  const labels = rows.filter(row => row.value === max).map(row => row.label);
  return `${labels.join(', ')} (${fmt(max)} phiếu mỗi mục)`;
}

export function genreReport(genres, rows, total) {
  const n = rows ? rows.reduce((count, row) => count + row.total, 0) : sum(genres);
  const active = genres.filter(genre => genre.value > 0).length;
  const largest = rows?.reduce((a, b) => a.total >= b.total ? a : b);
  const rowModes = largest ? modes(genres.map((genre, index) => ({label: genre.label, value: largest.values[index]}))) : '';
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

export function minutesReport(bands, stats, total) {
  const zero = stats.values.find(row => row.value === 0)?.count ?? 0;
  const long = stats.values.reduce((n, row) => n + (row.value >= 120 ? row.count : 0), 0);
  return [
    `Có ${fmt(stats.n)} trong ${fmt(total)} phiếu hợp lệ trả lời câu A05 về số phút nghe nhạc trung bình mỗi ngày. Các khoảng có nhiều phiếu nhất là ${modes(bands)}. Cột dài cho thấy nhiều người cùng nằm trong một khoảng, còn các mốc trên cùng một trục giúp so sánh các khoảng trực tiếp. Khi đọc kết quả, cần lưu ý rằng khoảng từ 0 đến 0 chỉ đại diện cho người trả lời đúng 0 phút, trong khi những khoảng còn lại gộp nhiều giá trị phút khác nhau.`,
    `Thời gian trung bình là ${fmt(stats.mean)} phút mỗi ngày và trung vị là ${fmt(stats.median)} phút. Nửa giữa mẫu nằm khoảng từ ${fmt(stats.q1)} đến ${fmt(stats.q3)} phút theo tứ phân vị. Khoảng giữa này cho biết mức độ tập trung của câu trả lời và cho phép đọc trung bình cùng với một thước đo ít nhạy với các giá trị lớn. Nếu trung bình cao hơn trung vị đáng kể, hãy kiểm tra xem một số phiếu ở các khoảng nghe dài có góp phần kéo trung bình lên hay không.`,
    `Trong các phiếu có trả lời A05, ${fmt(zero)} phiếu báo 0 phút (${share(zero, stats.n)}) và ${fmt(long)} phiếu báo từ 120 phút trở lên (${share(long, stats.n)}). Giá trị thấp nhất được ghi nhận là ${fmt(stats.min)} phút và cao nhất là ${fmt(stats.max)} phút. Hai đầu phân bố có ý nghĩa riêng: 0 phút là một câu trả lời hợp lệ, còn những giá trị cao cần được hiểu trong bối cảnh thời gian nghe có thể bao gồm cả lúc học, làm việc, di chuyển hoặc có nhạc phát nền.`,
    `Các khoảng trên biểu đồ có độ rộng khác nhau vì mục đích của chúng là mô tả những mức thời lượng dễ hiểu. Chiều dài cột thể hiện số người trong từng khoảng, nên khi hai khoảng có số phiếu bằng nhau, mật độ theo từng phút vẫn có thể khác. Với mục tiêu mô tả thói quen, hãy ưu tiên báo cáo số phiếu theo khoảng và vị trí của trung vị. Số phút được tự ước lượng, vì thế các giá trị tròn như nửa giờ hoặc một giờ có thể là các mốc làm tròn tự nhiên.`,
    `Biểu đồ này đặt bối cảnh cho phần phân tích căng thẳng. Nếu đa số người trả lời tập trung ở vài khoảng thời lượng, bằng chứng về những mức nghe rất ngắn hoặc rất dài sẽ đến từ ít phiếu hơn. Biểu đồ phân tán bên dưới nối số phút với điểm A10 của chính từng người, nhờ đó có thể xem những mức thời lượng phổ biến đi với một cụm điểm hẹp hay nhiều mức điểm. Khi trình bày kết quả, hãy dùng số phiếu trả lời A05 làm mẫu số và ghi riêng ${fmt(total - stats.n)} phiếu thiếu câu trả lời này.`
  ];
}

export function scoreReport(scores, stats, high, total) {
  const zero = scores[0].value;
  return [
    `Biểu đồ trình bày ${fmt(stats.n)} câu trả lời A10 trên thang tự đánh giá căng thẳng từ 0 đến 10. Các mức điểm xuất hiện nhiều nhất là ${modes(scores)}. Trục ngang giữ nguyên thứ tự của thang điểm và mỗi cột đếm số phiếu tại đúng mức đó, nên một cột cao phản ánh mức điểm được chọn thường xuyên trong mẫu. Quan sát toàn bộ dãy cột giúp phân biệt một đỉnh rõ với tình huống nhiều mức điểm có số lượt chọn tương đương.`,
    `Điểm trung bình đạt ${fmt(stats.mean)}/10 và trung vị đạt ${fmt(stats.median)}/10. Nửa giữa mẫu nằm trong khoảng từ ${fmt(stats.q1)} đến ${fmt(stats.q3)} điểm. Nếu khoảng này rộng, người tham gia có thể có trải nghiệm khác nhau dù nghiên cứu dùng một số trung bình chung. Đồng thời, các mức thấp nhất và cao nhất được quan sát là ${fmt(stats.min)} và ${fmt(stats.max)}. Đây là phạm vi thực tế của mẫu, khác với phạm vi mà bảng hỏi cho phép người tham gia chọn.`,
    `Có ${fmt(high)} phiếu điểm từ 7 đến 10, tương đương ${share(high, stats.n)} số câu trả lời A10, và ${fmt(zero)} phiếu điểm 0 (${share(zero, stats.n)}). Khoảng 7 đến 10 là một cách gộp mô tả để đọc phần trên của thang đo. Điểm 0 và điểm 10 được tính như các lựa chọn hợp lệ. Vì số lần xuất hiện của mỗi điểm đều được thể hiện, người đọc có thể kiểm tra xem phần điểm cao rải đều hay chủ yếu tập trung vào một mức cụ thể.`,
    `Khi phân tích, hãy xem xét khả năng các nhóm người trả lời sử dụng cùng một thang điểm theo cách khác nhau. Điểm phản ánh tự đánh giá trong bảy ngày gần đây và có thể chịu ảnh hưởng của bối cảnh học tập, công việc, giấc ngủ hoặc biến cố cá nhân. Mức độ khác biệt trong mẫu vì vậy nên được mô tả nhiều hơn bằng số phiếu và phân bố, thay vì nhìn một mức điểm như một chẩn đoán hoặc dùng ngưỡng mô tả để gắn nhãn cho từng người.`,
    `Phần này làm mốc khi đọc các biểu đồ so sánh nhóm. Nếu một nhóm thể loại có trung vị gần trung vị toàn mẫu, hãy tiếp tục xem khoảng giữa của nhóm có rộng hơn hay hẹp hơn. Nếu một nhóm nghe nhạc có điểm trung bình cao, hãy xem số phiếu nhóm đó và cách các điểm phân bố trước khi diễn giải. Với ${fmt(total - stats.n)} phiếu hợp lệ ngoài mẫu số A10, báo cáo nên phân biệt tổng số phiếu với số người thực sự có điểm căng thẳng.`
  ];
}

export function frequencyReport(rows, total, smallGroupSize) {
  const n = rows.reduce((count, row) => count + row.n, 0);
  const comparable = rows.filter(row => row.n >= smallGroupSize);
  const low = Math.min(...comparable.map(row => row.value)), high = Math.max(...comparable.map(row => row.value));
  const groupsAt = value => comparable.filter(row => row.value === value).map(row => `${row.label} (n=${fmt(row.n)})`).join(', ');
  return [
    `Biểu đồ tổng hợp ${fmt(n)} phiếu từ ${fmt(rows.length)} mức tần suất nghe nhạc khi căng thẳng có dữ liệu. Điểm của mỗi nhóm là trung bình câu trả lời A10 trên thang 0 đến 10. Ký hiệu n ghi số phiếu đứng sau trung bình đó. Nhóm có trải nghiệm căng thẳng nhưng không nghe nhạc vẫn có thể thuộc phép so sánh. Người trả lời rằng họ không cảm thấy căng thẳng trong giai đoạn khảo sát được xử lý riêng vì câu hỏi về cách nghe trong lúc căng thẳng có ý nghĩa khác với họ.`,
    comparable.length < 2 ? `Hiện có ${fmt(comparable.length)} nhóm đạt ít nhất ${smallGroupSize} phiếu. Các giá trị trung bình vẫn được hiển thị theo từng mức tần suất, kèm số phiếu. Dấu tròn rỗng dùng cho nhóm ít phiếu để phân biệt những giá trị có thể thay đổi nhanh khi có thêm người trả lời. Bản tóm tắt chỉ so sánh biên độ khi có từ hai nhóm đạt mốc hiển thị. Biểu đồ phân bố điểm toàn mẫu giúp cung cấp thêm bối cảnh trong lúc các nhóm tần suất còn thưa.`
      : `Trong ${fmt(comparable.length)} nhóm có ít nhất ${smallGroupSize} phiếu, trung bình thấp nhất thuộc ${groupsAt(low)} với ${fmt(low)}/10 và cao nhất thuộc ${groupsAt(high)} với ${fmt(high)}/10. Khoảng chênh lệch là ${fmt(high - low)} điểm. Các nhóm ít phiếu được vẽ bằng vòng tròn rỗng và nằm ngoài phép so sánh biên độ này. Mốc ${smallGroupSize} phiếu là quy ước trình bày để làm nổi bật độ thưa của dữ liệu. Nó không bảo đảm rằng một chênh lệch quan sát có thể khái quát cho nhóm người rộng hơn.`,
    `Một điểm đại diện cho trung bình có thể tóm tắt gọn một nhóm nhưng sẽ che bớt phân bố điểm của các cá nhân trong nhóm đó. Hai nhóm có trung bình gần nhau vẫn có thể khác về độ biến thiên. Tương tự, trung bình của một nhóm ít phiếu có thể thay đổi rõ khi có thêm một câu trả lời. Những thông tin này đặc biệt quan trọng khi các điểm trung bình chỉ cách nhau một khoảng nhỏ trên thang đo chung, hoặc khi một nhóm có số phiếu lớn hơn hẳn các nhóm khác.`,
    `Câu hỏi về tần suất tập trung vào hành vi diễn ra khi đã cảm thấy căng thẳng, còn câu hỏi điểm số phản ánh cả khoảng bảy ngày. Một cách đọc hợp lý là xem hai chỉ số như những đặc điểm được báo cáo đồng thời. Người cảm thấy căng thẳng nhiều hơn có thể chủ động nghe thường xuyên hơn để đối phó. Bối cảnh cá nhân cũng có thể ảnh hưởng tới cả mức căng thẳng lẫn tần suất nghe. Do đó, thứ tự trung bình trên biểu đồ chỉ mô tả mẫu đang quan sát.`,
    `Trong ${fmt(total)} phiếu hợp lệ toàn bộ, có ${fmt(total - n)} phiếu không thuộc tập nhóm đã dùng cho biểu đồ này. Khi đưa biểu đồ vào báo cáo, hãy trình bày rõ nhóm nào được gộp và nhóm nào nằm ngoài mẫu số. Biểu đồ phân tán bổ sung góc nhìn về số phút nghe mỗi ngày, còn biểu đồ hộp so sánh điểm căng thẳng giữa các lựa chọn thể loại. Đọc cả ba theo đúng biến số giúp tránh đánh đồng nghe lâu, nghe thường xuyên khi căng thẳng và chọn một loại nhạc cụ thể.`
  ];
}

export function scatterReport(stats, total, sensitivity) {
  const overlapping = stats.points.filter(point => point.count > 1).length;
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

export function boxReport(groups, total, minimumBoxSize) {
  const n = groups.reduce((count, group) => count + group.stats.n, 0);
  const largest = groups.reduce((a, b) => a.stats.n >= b.stats.n ? a : b);
  const small = groups.filter(group => group.stats.n < minimumBoxSize).length;
  const comparable = groups.filter(group => group.stats.n >= minimumBoxSize);
  const range = comparable.map(group => group.stats.median);
  return [
    `Biểu đồ đối chiếu câu A07 về thể loại nghe nhiều nhất lúc căng thẳng với điểm A10 của cùng người trả lời. Có ${fmt(n)} trong ${fmt(total)} phiếu hợp lệ tạo thành ${fmt(groups.length)} nhóm thể loại có điểm. Mỗi hàng dùng chung thang 0 đến 10 và ghi số phiếu của nhóm. Những người không chọn thể loại cụ thể nằm ngoài phần so sánh này. Vì vậy, bảng phân bố toàn mẫu và biểu đồ hộp có thể dùng mẫu số khác nhau, dù đều sử dụng câu A10 để lấy điểm căng thẳng.`,
    `Nhóm có nhiều phiếu nhất là ${largest.label} với ${fmt(largest.stats.n)} câu trả lời. Điểm trung vị của nhóm này là ${fmt(largest.stats.median)}. Tứ phân vị thứ nhất và thứ ba lần lượt là ${fmt(largest.stats.q1)} và ${fmt(largest.stats.q3)}, còn điểm quan sát chạy từ ${fmt(largest.stats.min)} đến ${fmt(largest.stats.max)}. Khi đọc một hộp, đường đậm nằm ở trung vị và hai cạnh của hộp bao quanh nửa giữa phân bố. Hộp rộng hơn cho thấy các câu trả lời ở phần giữa trải trên nhiều mức điểm hơn.`,
    `Có ${fmt(small)} nhóm dưới ${minimumBoxSize} phiếu được thể hiện bằng các điểm quan sát. Với nhóm ít người, cách này giúp thấy trực tiếp từng giá trị có mặt và phân biệt mức trùng lặp. Với nhóm có hộp, râu kéo đến các giá trị quan sát còn nằm trong giới hạn một phẩy năm lần khoảng tứ phân vị tính từ hai mép hộp. Các điểm nằm ngoài râu vẫn được vẽ để giữ thông tin về những trường hợp ít gặp, kể cả khi chúng khác rõ với vùng tập trung của nhóm.`,
    comparable.length > 1 ? `Trong ${fmt(comparable.length)} nhóm có đủ phiếu để vẽ hộp, trung vị dao động từ ${fmt(Math.min(...range))} đến ${fmt(Math.max(...range))} điểm. Hãy so cả vị trí đường trung vị lẫn phần chồng lấp giữa các hộp. Một chênh lệch trung vị nhỏ đi kèm khoảng giữa chồng lấp nhiều có thể cùng tồn tại với sự khác nhau ở hai đầu phân bố. Ngược lại, khi hai hộp tách rõ về vị trí, vẫn cần nêu quy mô từng nhóm để người đọc thấy lượng dữ liệu đứng sau nhận xét.`
      : `Hiện có ${fmt(comparable.length)} nhóm đủ số phiếu để vẽ hộp, nên phần so sánh giữa các thể loại chủ yếu dựa vào các điểm được quan sát và số phiếu ở từng hàng. Dùng bộ chọn để làm nổi một thể loại, đọc n và vị trí các điểm trước khi so với nhóm khác. Một nhóm nhỏ có thể xuất hiện ở một phía của thang điểm chỉ vì tình cờ thu được vài câu trả lời giống nhau. Cần thêm phiếu ở những nhóm đó để mô tả ổn định hơn.`,
    `Một thể loại có trung vị cao hoặc thấp trong biểu đồ này phản ánh điểm tự báo cáo của những người đã chọn thể loại đó. Những người chọn các thể loại khác nhau cũng có thể khác nhau về tuổi, thời lượng nghe, hoàn cảnh hoặc mức căng thẳng ban đầu. Khi viết kết luận, nên ghi tên nhóm, trung vị và số phiếu, sau đó mô tả sự phân tán và mức chồng lấp. Đặt kết quả cạnh heatmap tuổi theo thể loại sẽ giúp nhận ra khả năng cơ cấu tuổi khác nhau giữa các nhóm đang được so sánh.`
  ];
}
