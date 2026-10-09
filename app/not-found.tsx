import Link from "next/link";
export default function NotFound() {
  return (
    <main className="loading">
      <h1>Không tìm thấy trang</h1>
      <p>Liên kết không hợp lệ hoặc hồ sơ không còn được chia sẻ.</p>
      <Link href="/" className="btn primary">
        Về trang chủ
      </Link>
    </main>
  );
}
