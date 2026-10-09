import Link from "next/link";
import {
  ArrowRight,
  Check,
  CheckCheck,
  LayoutDashboard,
  Sparkles,
  Upload,
  Users,
  CalendarDays,
  LockKeyhole,
  Grid2X2,
  ImagePlus,
} from "lucide-react";
export default function Home() {
  return (
    <main>
      <nav className="marketing-nav">
        <Link href="/" className="logo">
          <span className="logo-mark">
            <CheckCheck size={21} />
          </span>
          wedly<span style={{ color: "#8ba16f" }}>.</span>
        </Link>
        <div className="marketing-links">
          <a href="#features">Cách Wedly giúp bạn</a>
          <Link href="/login">Đăng nhập</Link>
          <Link href="/demo" className="btn primary">
            Trải nghiệm ngay <ArrowRight size={14} />
          </Link>
        </div>
      </nav>
      <section className="hero">
        <div>
          <span className="hero-label">
            <span className="dot" style={{ background: "var(--green)" }} />
            Dành cho đội ngũ tổ chức tiệc cưới
          </span>
          <h1>
            Mùa cưới bận rộn.
            <br />
            <span>Mọi việc vẫn rõ ràng.</span>
          </h1>
          <p>
            Công việc, báo giá, thanh toán và sơ đồ bàn tiệc — cùng một chỗ. Để
            đội ngũ nắm đúng việc, theo đúng tiến độ và chăm chút từng đám cưới.
          </p>
          <div className="hero-actions">
            <Link href="/demo" className="btn primary">
              Khám phá không gian làm việc <ArrowRight size={15} />
            </Link>
            <Link href="/login" className="btn">
              Tạo đội ngũ của bạn
            </Link>
          </div>
          <div className="hero-note">
            Hoàn toàn tiếng Việt · Trải nghiệm không cần đăng ký
          </div>
        </div>
        <div className="hero-preview" aria-label="Minh họa tổng quan đội ngũ">
          <div className="preview-top">
            <span className="row">
              <LayoutDashboard size={14} />
              Nhà Mình Weddings
            </span>
            <span className="badge">Minh họa</span>
          </div>
          <div className="preview-content">
            <span className="eyebrow">Một ngày rõ việc hơn</span>
            <h3>Hôm nay cần làm gì?</h3>
            <div className="preview-stats">
              <div className="preview-stat">
                Đám cưới đang chuẩn bị<strong>12</strong>
              </div>
              <div className="preview-stat">
                Công việc hôm nay<strong>8</strong>
              </div>
              <div className="preview-stat">
                Cập nhật cần duyệt<strong>3</strong>
              </div>
            </div>
            <div className="preview-task">
              <span className="check-button" />
              <span>Chốt thực đơn · Minh & Anh</span>
              <span className="badge orange">Hôm nay</span>
            </div>
            <div className="preview-task">
              <span className="check-button" />
              <span>Thanh toán cọc trang trí · Nam & Linh</span>
              <span className="avatar">H</span>
            </div>
            <div className="preview-task">
              <span className="check-button done">
                <Check size={11} />
              </span>
              <span>Xác nhận lịch chụp ảnh</span>
              <span className="badge">Hoàn thành</span>
            </div>
            <div className="preview-ai">
              <Sparkles size={19} />
              <span>
                <strong>Từ một ảnh trao đổi → thành việc cần làm</strong>
                <br />
                <span className="muted">
                  Đọc nội dung, xem đề xuất, xác nhận cập nhật.
                </span>
              </span>
            </div>
          </div>
        </div>
      </section>
      <div className="feature-strip">
        <div>
          <Users size={17} />
          Một nơi cho cả đội ngũ
        </div>
        <div>
          <ImagePlus size={17} />
          Xử lý ảnh trao đổi
        </div>
        <div>
          <Grid2X2 size={17} />
          Sơ đồ bàn đúng kích thước
        </div>
        <div>
          <LockKeyhole size={17} />
          Hồ sơ và ảnh riêng tư
        </div>
      </div>
      <section id="features" className="marketing-section">
        <span className="eyebrow">Ít tìm kiếm. Rõ đầu việc.</span>
        <h2>Thiết kế cho nhịp làm việc mùa cưới.</h2>
        <p>
          Từ tin nhắn rời rạc đến hồ sơ có tổ chức. Mỗi cập nhật có đám cưới,
          người phụ trách và bước tiếp theo rõ ràng.
        </p>
        <div className="feature-grid">
          <article className="feature-card">
            <CalendarDays size={26} />
            <h3>Nắm cả mùa cưới</h3>
            <p>
              Xem đám cưới sắp tới, công việc đến hạn và các khoản cần thanh
              toán. Phân công và đánh dấu hoàn thành ngay trong hồ sơ.
            </p>
          </article>
          <article className="feature-card">
            <Upload size={26} />
            <h3>Thả ảnh, xử lý cập nhật</h3>
            <p>
              Đưa ảnh trao đổi vào đúng đám cưới. Xem đề xuất về báo giá, thương
              lượng, thanh toán và công việc trước khi xác nhận. Ảnh mặc định
              hết hạn sau 48 giờ.
            </p>
          </article>
          <article className="feature-card">
            <Grid2X2 size={26} />
            <h3>Bố trí tiệc trực quan</h3>
            <p>
              Nhập kích thước phòng, sân khấu và số bàn. Tạo sơ đồ có tỷ lệ, kéo
              để sắp xếp và xuất bản in cho đội ngũ triển khai.
            </p>
          </article>
        </div>
      </section>
      <section className="marketing-cta">
        <div>
          <h2>Để mỗi đám cưới được chăm chút.</h2>
          <p>Bắt đầu với một hồ sơ. Cùng đội ngũ đưa mọi việc về đúng chỗ.</p>
        </div>
        <Link className="btn" href="/demo">
          Mở bản trải nghiệm <ArrowRight size={16} />
        </Link>
      </section>
      <footer className="marketing-footer">
        <Link className="logo" href="/" style={{ fontSize: 20 }}>
          wedly.
        </Link>
        <span>Không gian điều phối tiệc cưới · Tiếng Việt từ đầu</span>
        <span>© {new Date().getFullYear()} Wedly</span>
      </footer>
    </main>
  );
}
