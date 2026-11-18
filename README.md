# Music Healing · Survey A

Dự án độc lập gồm **10 câu hỏi** về thói quen nghe nhạc và stress tự báo cáo, với bốn ngôn ngữ Việt, Hàn, Anh và Trung. Không có phần nghỉ, nghe nhạc thử nghiệm hoặc phiên B. Không phát nhạc nền khi trả lời. Không thay đổi mã nguồn, endpoint hoặc dữ liệu của `music-healing-dna`.

## Câu hỏi

| Mã | Nội dung | Kiểu trả lời |
|---|---|---|
| A01 | Tuổi | Số nguyên, 18–120 |
| A02 | Giới tính | Lựa chọn, có Không trả lời |
| A03 | Nền văn hóa / quốc gia | Lựa chọn, có Việt Nam, Hàn Quốc, Mông Cổ, Myanmar, Nepal, Khác, Không trả lời |
| A04 | Tình trạng hiện tại | Lựa chọn, tự chọn |
| A05 | Thời gian nghe nhạc trung bình mỗi ngày | Phút, 0–1440, tự chọn |
| A06 | Tần suất nghe nhạc khi căng thẳng | Không bao giờ → Luôn luôn |
| A07 | Thể loại thường nghe khi căng thẳng | Lựa chọn, có Không nghe nhạc khi stress |
| A08 | Mục đích nghe nhạc chính | Lựa chọn, tự chọn |
| A09 | Mức yêu thích thể loại đã chọn | Thanh kéo 0–10; có thể bỏ qua nếu A07 là Không nghe nhạc |
| A10 | Stress tự cảm nhận trong tuần qua | Thanh kéo 0–10 |

Đồng ý tham gia nằm ở màn hình mở đầu, không tính là một câu trong 10 câu. Không thu họ tên/email. Điểm giữa của thanh kéo không tự động được ghi thành đáp án; điểm 0 hợp lệ. Giữ nguyên câu trả lời khi đổi ngôn ngữ. Đĩa than có nút tạm dừng và tôn trọng cài đặt giảm chuyển động.

## Trạng thái thu thập dữ liệu

**Mặc định chưa kết nối máy chủ.** Website hiển thị rõ điều này, cho phép trải nghiệm khảo sát và tải JSON về thiết bị; không tuyên bố dữ liệu đã được gửi. Không có endpoint của dự án cũ trong mã nguồn. Câu trả lời nháp chỉ ở `sessionStorage` trong thẻ trình duyệt, được xóa sau hoàn tất. Không có analytics hoặc thư viện bên thứ ba.

### Kết nối một Google Sheet mới

1. Tạo một dự án mới tại Google Apps Script; sao chép `backend/Code.gs` vào đó.
2. Chạy `setup()` một lần và cấp quyền. Hàm này tạo **Google Sheet mới**, không mở sheet của A+B. Xem URL Sheet trong Execution log. Giữ Sheet riêng tư cho nhóm nghiên cứu.
3. Deploy → New deployment → Web app → Execute as: Me → Who has access: Anyone. Chỉ endpoint nhận câu trả lời công khai, không công khai Sheet. Endpoint này chưa có cơ chế chống spam; không cung cấp API đọc dữ liệu.
4. Sao chép URL `/exec` của deployment mới vào `config.js`, trường `endpoint`.
5. Thực hiện một lần gửi thử từ website đã triển khai, kiểm tra thông báo máy chủ xác nhận và đúng một dòng trong Sheet mới. Đánh dấu/xóa dòng thử trước khi thu chính thức. Thử gửi lặp cùng id để kiểm tra không nhân đôi dòng.
6. Nếu trình duyệt hoặc chính sách tài khoản chặn phản hồi Apps Script/CORS, website báo chưa xác nhận và cho tải bản sao; **không coi fetch `no-cors` là gửi thành công**. Kiểm tra deployment trước khi thu thật.

Script kiểm tra schema, consent, kiểu số, giới hạn và giá trị enum; khóa ghi và kiểm tra UUID để không ghi trùng do thử gửi lại. Sau thay đổi Apps Script, cập nhật deployment sang phiên bản mới.

## Chạy và kiểm tra

Không cần build hay cài gói. Phục vụ thư mục bằng static HTTP server (không mở trực tiếp bằng file:// vì dùng ES modules). Chạy `npm test` với Node để kiểm tra 10 câu, ngôn ngữ, missing/0, giới hạn số và nhánh không nghe nhạc.

GitHub Pages: Settings → Pages → Deploy from a branch → main → / (root) → Save. Mã nguồn và nội dung giao diện được công khai, không đưa dữ liệu trả lời, khóa API hay mật khẩu vào repository.

## Cách diễn giải dữ liệu

Đây là khảo sát cắt ngang tự báo cáo, phù hợp mô tả phân bố, khác biệt nhóm và mối liên hệ giữa việc nghe nhạc và stress. Không có đo trước/sau hoặc nhóm can thiệp nên không kết luận nhạc gây giảm stress. A10 là một câu tự đánh giá 0–10, không phải PSS-10. Không tạo “điểm sức khỏe” bằng cách cộng các câu khác đơn vị. Giữ missing khác 0, phân biệt không nghe nhạc với không trả lời, và nêu mẫu hợp lệ của từng biểu đồ.

## Files

- `index.html`, `style.css`, `app.js`: giao diện và điều hướng
- `schema.js`, `i18n.js`: 10 câu hỏi và bốn ngôn ngữ
- `logic.js`: kiểm tra và schema payload `music-healing-survey-a/v1`
- `config.js`: endpoint riêng (để trống mặc định)
- `backend/Code.gs`: collector Google Apps Script tùy chọn
- `tests/survey.test.js`: kiểm tra logic
