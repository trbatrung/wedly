# Wedly — Điều phối mọi đám cưới

Ứng dụng tiếng Việt dành cho đội ngũ tổ chức tiệc cưới. Giao diện dùng chữ sans-serif, số tiền VND, ngày Việt Nam và thiết kế thích ứng với điện thoại.

## Trải nghiệm ngay

- Trang chủ: https://wedly-sepia.vercel.app
- Không gian trải nghiệm: https://wedly-sepia.vercel.app/demo
- GitHub: https://github.com/trbatrung/wedly

Bản trải nghiệm hoạt động ngay, không cần tài khoản. Hồ sơ, công việc, chi phí, sơ đồ, thiệp mời và câu trả lời của khách được lưu bằng localStorage trên thiết bị hiện tại. Ảnh được lưu trong IndexedDB, không gửi lên máy chủ. Nguồn ảnh hết hạn sau 48 giờ và được dọn khi ứng dụng mở/đang chạy. Thiệp mời minh họa (`/demo/thiep/…`) chỉ mở được trên trình duyệt đã tạo thiệp; muốn gửi cho khách thật cần không gian đội ngũ đã kết nối Supabase. Đây là bản để đánh giá giao diện, không phải không gian đội ngũ đồng bộ.

## Đã có trong giao diện

- Tổng quan đám cưới, công việc quá hạn, khoản dự kiến thanh toán và cập nhật cần xác nhận.
- Tạo/sửa/lưu trữ hồ sơ đám cưới; tạo và hoàn thành công việc; phân công cho thành viên.
- Nhà cung cấp: đang trao đổi, nhận báo giá, thương lượng, đã chốt.
- Tách báo giá, giá trị thỏa thuận, khoản dự kiến trả và lịch sử thanh toán đã xác nhận.
- Thả/chọn/dán ảnh; gắn vào một đám cưới; phát hiện ảnh trùng; xem trước; giữ làm chứng từ.
- Dán nội dung trao đổi để tạo đề xuất có thể sửa. Bộ đọc nội dung trong bản trải nghiệm dựa trên quy tắc rõ ràng, không giả lập AI đọc ảnh.
- Người dùng kiểm tra đề xuất và xác nhận thanh toán riêng trước khi số tiền được ghi nhận.
- Sơ đồ bàn tiệc: kích thước phòng theo mét, số bàn, đường kính, số khách mỗi bàn, kích thước sân khấu. Bố trí có tỷ lệ, kéo/thay đổi vị trí bằng số hoặc phím mũi tên, cảnh báo chồng lấn, lưu, tải SVG và in/lưu PDF.
- Trợ lý điều hướng có sẵn cho bản trải nghiệm; trợ lý Haiku cho đội ngũ được cấu hình.
- Cổng thông tin khách hàng: thông tin ngày cưới, tiến độ tổng hợp, số khách xác nhận và liên kết thiệp. Không công khai báo giá, thanh toán, ảnh, ghi chú, tên khách hoặc chi tiết công việc nội bộ.
- Thiệp mời online cho từng đám cưới (tab Thiệp mời): lời mời, ngày âm lịch tự tính, lịch trình, địa điểm và chỉ đường, xác nhận tham dự, hỏi đáp, lời cảm ơn, thêm vào lịch; 4 màu, chữ sans-serif, xem trước trực tiếp trong khung điện thoại; đăng/tạm ẩn.
- Khách mời (tab Khách mời): số người tham dự (gồm người đi cùng), nhà trai/nhà gái, ăn uống, ước tính số bàn nối sang sơ đồ; thêm khách xác nhận qua điện thoại; tải CSV mở được bằng Google Sheets/Excel.
- Google Sheets (tùy chọn): dán Apps Script vào Sheet của cô dâu chú rể; mỗi xác nhận mới được thêm/cập nhật một dòng. Danh sách trong Wedly vẫn là bản chính.
- Điều hướng nhanh: Tìm nhanh (⌘K / Ctrl K hoặc phím /) cho đám cưới, khách, công việc, nhà cung cấp và thao tác; menu Tạo mới; thanh điều hướng dưới cùng trên điện thoại; tab đám cưới có địa chỉ riêng (Quay lại, tải lại và chia sẻ liên kết giữ đúng tab); lọc theo đám cưới; lọc “Của tôi”.

## Chạy tại máy

Node.js >=20.9.

```sh
npm ci
npm run dev
npm run typecheck
npm test
npm run build
```

## Kết nối tài khoản, dữ liệu thật và AI

Chưa cấu hình các dịch vụ này thì đăng nhập hiển thị trạng thái đang chuẩn bị; bản trải nghiệm vẫn dùng được. Không có AI/đồng bộ tự động nếu chưa thiết lập.

1. Tạo một dự án Supabase và chạy `supabase/schema.sql`, sau đó `supabase/rsvp.sql` (bảng câu trả lời của khách) trong SQL Editor của dự án mới.
2. Trong Supabase Auth, đặt Site URL là `https://wedly-sepia.vercel.app`; cho phép redirect `https://wedly-sepia.vercel.app/auth/callback` (và `http://localhost:3000/auth/callback` khi phát triển). Cấu hình SMTP cho đăng nhập email trước khi triển khai cho đội ngũ thật.
3. Thêm biến môi trường vào Vercel (tên trong `.env.example`). Không đưa giá trị bí mật vào Git:
   - `NEXT_PUBLIC_SUPABASE_URL`
   - `NEXT_PUBLIC_SUPABASE_ANON_KEY`
   - `SUPABASE_SERVICE_ROLE_KEY` — chỉ trên máy chủ
   - `ANTHROPIC_API_KEY` — chỉ trên máy chủ
   - `ANTHROPIC_MODEL` — mặc định `claude-haiku-5-5`; thay bằng model đã được cấp quyền trên tài khoản nếu cần
   - `CRON_SECRET` — chuỗi ngẫu nhiên dài, chỉ trên máy chủ
4. Triển khai lại sau khi thêm biến môi trường. Đăng nhập email, tạo đội ngũ và dùng liên kết mời tại màn hình Đội ngũ.
5. Bật pg_cron, pg_net và Vault trong Supabase. Tạo secret Vault `wedly_site_url` và `wedly_cron_secret` (giá trị trùng `CRON_SECRET`), sau đó chạy `supabase/cleanup.sql`.
6. Kiểm tra job trong `cron.job_run_details` và gọi `/api/cleanup` với header Authorization hợp lệ để xác minh xóa file thực tế trước khi nhận ảnh thật.

Ảnh được lưu trong bucket **riêng tư**. API xác minh đăng nhập, đội ngũ và thời hạn trước khi đọc ảnh. Sau đúng 48 giờ, ảnh không được đọc hay giữ lại mới. Worker thử xóa file vật lý mỗi 5 phút; xóa lỗi được thử lại. Metadata chỉ được đánh dấu đã xóa sau khi Storage API thành công. Thông tin có cấu trúc và trích đoạn ngắn đã xác nhận vẫn được giữ. Không xóa trực tiếp dòng `storage.objects`, vì thao tác đó không xóa file vật lý.

Không có job Vercel theo phút trong cấu hình: Vercel Hobby chỉ cho lịch hằng ngày. Job trong Supabase đáp ứng chu kỳ dọn 5 phút. Nếu chưa cấu hình job, việc xóa vật lý chưa tự động hoạt động.

Thiệp mời thật: khi đăng thiệp, Wedly tạo liên kết `/thiep/<mã>` khó đoán. Khách gửi xác nhận qua `/api/rsvp`; máy chủ kiểm tra thiệp đang mở, giới hạn số lần gửi và lưu vào bảng `rsvps` (không nằm trong dữ liệu đội ngũ có revision, nên khách gửi không gây xung đột khi đội ngũ đang sửa). Nếu có liên kết Apps Script, máy chủ gửi thêm một bản sang Google Sheet; liên kết này không bao giờ được gửi tới trình duyệt của khách. Trang thiệp và cổng khách hàng có `noindex`.

## Cấu trúc & giới hạn bản đầu

Next.js 16 / React 19 / TypeScript / Tailwind / Supabase / Anthropic Messages API.

- `lib/domain.ts`: phân biệt báo giá/thỏa thuận/thanh toán; xác nhận và kiểm tra trùng nguồn/giao dịch.
- `lib/floorplan.ts`: sinh bố trí theo kích thước thực, giới hạn vật thể trong phòng.
- `lib/invitation.ts`, `lib/lunar.ts`: dữ liệu công khai của thiệp, quy tắc RSVP, CSV, lịch, ngày âm lịch (múi giờ Việt Nam).
- `components/invitation/`: trang thiệp cho khách, trình soạn thiệp và danh sách khách mời.
- `lib/search.ts`, `components/CommandPalette.tsx`: tìm nhanh không dấu và menu Tạo mới.
- `components/Workspace.tsx`: không gian chung, lưu dữ liệu và điều hướng.
- `app/api/`: phiên đăng nhập, hồ sơ, ảnh, phân tích, trợ lý và dọn ảnh.
- `supabase/`: chính sách RLS, revision cho cập nhật đồng thời, lời mời đội ngũ, quota AI và lịch dọn.
- `tests/`: trạng thái tiền, xác nhận, nguồn trùng, hạn ảnh, hình học; thiệp mời (không lộ dữ liệu riêng, RSVP, CSV, âm lịch) và tìm nhanh.

Mỗi tài khoản thuộc một đội ngũ. Cập nhật dùng revision: khi hai người cùng sửa, phiên cũ bị từ chối thay vì ghi đè âm thầm. Chủ đội ngũ tạo liên kết mời; liên kết mới thay thế liên kết cũ và hết hạn sau 7 ngày. Giới hạn ban đầu 100 lượt AI và 100 ảnh/ngày/đội ngũ. Cần kiểm tra lượng sử dụng thực tế trước khi bán gói.

Chưa có đồng bộ nhóm Zalo cá nhân, email, nhập danh sách khách từ file, lịch trình phút theo phút, phê duyệt từ cô dâu/chú rể, thanh toán thuê bao hay chứng nhận an toàn mặt bằng. Thiệp mời chưa có tải ảnh lên (ảnh bìa dùng liên kết https), đường dẫn tùy chọn, mã QR để in hay ảnh xem trước khi chia sẻ qua Zalo. Sơ đồ là công cụ bố trí đơn giản; khoảng trống quanh bàn và lối đi vẫn cần được đội ngũ kiểm tra tại địa điểm thực tế.
