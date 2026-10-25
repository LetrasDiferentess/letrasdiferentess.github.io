# CHÍNH SÁCH KHÓA 96 URL — Unicode Research Library

Hiệu lực: 25/10/2026. Phạm vi: 96 bài nghiên cứu thuộc 12 nhóm Virtual Silo của website Letras Diferentes phiên bản US.

Nguồn chuẩn duy nhất: data/unicode-library-96.lock.json. Danh sách 96 URL đã khóa, gồm thứ tự, chuyên mục, slug và trạng thái xuất bản. Mã SHA-256 tính trên 96 URL theo thứ tự, mỗi URL một dòng và newline ở cuối:

59d5a23d48ee7631c0653afe313444fdea2ff45cd6049b38e4076c7e0aa0e5ec

**Không tự ý đổi slug, tạo bài số 97, thay URL hoặc sửa nhóm.** Mọi thay đổi đối với tập 96 URL cần chủ website đồng ý rõ ràng; không suy đoán URL bằng AI.

## 1. Liên kết nội bộ

- Khi soạn bài, tra đối chiếu danh mục JSON. Chỉ cho phép liên kết nội bộ đến 96 URL chính xác và đã có trạng thái PUBLISHED, cộng với hai ngoại lệ được xác nhận: https://letrasdiferentess.github.io/us/ (money tool) và https://letrasdiferentess.github.io/us/library/ (trang tổng thư viện).
- 12 chuyên mục Virtual Silo tồn tại bằng anchor ngay trên /us/library/ như #unicode-characters, #styled-text. Không tạo URL /us/library/<category>/.
- Các bài ở trạng thái PLANNED là bản quy hoạch, tuyệt đối không chèn liên kết click được dẫn đến 404. Có thể nhắc chủ đề bằng văn bản thường.
- Khi xuất bản bài: tạo index.html ở đúng đường dẫn đã khóa, đổi trạng thái sang PUBLISHED, thêm liên kết HTML tại đúng chuyên mục ở trang thư viện và xác minh triển khai.
- Liên kết nội bộ bình thường không gắn rel=nofollow.
- **Quy tắc mới từ chủ website (Batch 2, 25/10/2026):** Nếu nội dung bài nghiên cứu có mối liên hệ hữu ích, thực chất với ứng dụng Fancy Text, chủ động chèn một liên kết nội bộ ngữ cảnh, không mang tính quảng cáo, tới chính xác https://letrasdiferentess.github.io/us/. Ví dụ: nghiên cứu Unicode styled text, glyph/normalization, lỗi hiển thị, copy/paste. Không bắt buộc mọi bài có liên kết tool; không nhồi anchor, không tạo URL tool khác, không thêm tracking, không gắn nofollow nội bộ. Nội dung kỹ thuật phải đầy đủ độc lập kể cả khi không nhấp tool.


## 2. Không gắn theo dõi GPT và tham số tracking

- Liên kết nội bộ tuyệt đối không có query string: không có dấu ? và các tham số phía sau URL.
- Không chèn UTM, ?utm_source=chatgpt.com, ?ref=chatgpt, ?source=chatgpt, gpt, fbclid, gclid, msclkid hoặc các tham số tracking khác vào liên kết nội bộ hoặc link out.
- Nếu nguồn tìm kiếm hay AI trả URL có tham số theo dõi, dùng URL sạch (canonical URL) của trang đích.

## 3. Tất cả link out dùng nofollow

- Mọi liên kết HTTP(S) từ 96 bài viết sang domain khác đều phải có thuộc tính rel="nofollow" trên thẻ a.
- Nếu mở trang ngoài ở tab mới, dùng target="_blank" và rel="nofollow noopener noreferrer".
- Vẫn có thể dẫn trực tiếp đến các nguồn học thuật và kỹ thuật phù hợp (Unicode Consortium, W3C, ICU, MDN, GitHub,...), nhưng giữ nofollow theo quyết định của chủ website.
- Không áp dụng nofollow cho liên kết nội bộ hợp lệ.

## 4. Giám sát tự động

- Bộ kiểm tra: node scripts/check-unicode-library-links.mjs
- Test: node --test scripts/test-unicode-library-links.mjs
- CI: .github/workflows/unicode-library-link-policy.yml
- CI đối chiếu mã băm SHA-256 đã khóa, đúng 12 nhóm và 96 URL, chặn URL lạ/URL chưa xuất bản, chặn tham số tracking và yêu cầu nofollow trên external links.
- Phạm vi áp dụng cho 96 trang nghiên cứu us/<slug>/index.html, không tự sửa trang công cụ /us/ hoặc trang gốc Brazil.

**Quan trọng:** Danh mục JSON của repository là nguồn chuẩn cho các lần viết bài tiếp theo. Không chỉ dựa vào trí nhớ cuộc trò chuyện.
