import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "Wedly — Điều phối mọi đám cưới",
  description:
    "Không gian làm việc tiếng Việt cho đội ngũ tổ chức tiệc cưới. Quản lý công việc, nhà cung cấp, thanh toán, ảnh trao đổi và sơ đồ bàn tiệc.",
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="vi">
      <body>{children}</body>
    </html>
  );
}
