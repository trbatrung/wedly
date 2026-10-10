import type { Invitation, Rsvp, Workspace } from "./types";
import { RETENTION_MS, analyzeText, today } from "./domain";
import { defaultInvitation } from "./invitation";

export function emptyWorkspace(
  name = "Đội ngũ của bạn",
  member = "Bạn",
): Workspace {
  return {
    teamName: name,
    members: [member],
    weddings: [],
    tasks: [],
    vendors: [],
    payments: [],
    updates: [],
    floorplans: [],
    invitations: [],
    activity: [],
  };
}
// Sample invitation for the demo wedding "Minh & Anh".
export function sampleInvitations(state: Workspace): Invitation[] {
  const wedding = state.weddings.find((w) => w.id === "minh-anh");
  if (!wedding) return [];
  const base = defaultInvitation(wedding);
  return [
    {
      ...base,
      published: true,
      venueName: "GEM Center",
      venueAddress: "8 Nguyễn Bỉnh Khiêm, TP. Hồ Chí Minh",
      dressCode: "Lịch sự · Tông pastel nhẹ nhàng",
      events: [
        {
          id: "e1",
          time: "09:00",
          title: "Lễ gia tiên",
          note: "Tư gia nhà gái · Dành cho gia đình",
        },
        { id: "e2", time: "17:30", title: "Đón khách", note: "Sảnh tầng 2" },
        { id: "e3", time: "18:30", title: "Lễ thành hôn", note: "" },
        { id: "e4", time: "19:00", title: "Khai tiệc", note: "" },
      ],
      contact: "Lan · Điều phối tiệc cưới",
    },
  ];
}
// Fictional sample answers so the demo guest list is not empty.
export function demoRsvps(state: Workspace): Rsvp[] {
  if (!state.weddings.some((w) => w.id === "minh-anh")) return [];
  const at = (hoursAgo: number) =>
    new Date(Date.now() - hoursAgo * 3600000).toISOString();
  const rows: [
    string,
    boolean,
    number,
    string,
    Rsvp["side"],
    string,
    string,
  ][] = [
    [
      "Trần Thu Hà",
      true,
      1,
      "Lê Minh Quân",
      "bride",
      "",
      "Chúc hai bạn trăm năm hạnh phúc!",
    ],
    ["Lê Quốc Bảo", true, 0, "", "groom", "Ăn chay", ""],
    [
      "Phạm Ngọc Mai",
      false,
      0,
      "",
      "bride",
      "",
      "Mình đi công tác, gửi lời chúc mừng hai bạn!",
    ],
    [
      "Đỗ Minh Khang",
      true,
      2,
      "Vợ và con gái",
      "groom",
      "",
      "Cho mình xin một ghế trẻ em nhé.",
    ],
    ["Vũ Hải Yến", true, 0, "", "bride", "Dị ứng hải sản", ""],
    [
      "Nguyễn Gia Huy",
      true,
      1,
      "Trịnh Bảo Ngọc",
      "groom",
      "",
      "Hẹn gặp cả nhà!",
    ],
  ];
  return rows.map(
    ([name, attending, guests, guestNames, side, dietary, message], i) => ({
      id: `00000000-0000-4000-8000-00000000000${i + 1}`,
      weddingId: "minh-anh",
      name,
      phone: "",
      attending,
      guests,
      guestNames,
      side,
      dietary,
      message,
      source: "sample" as const,
      createdAt: at(4 + i * 9),
      updatedAt: at(4 + i * 9),
    }),
  );
}
export function demoWorkspace(): Workspace {
  const now = new Date().toISOString();
  const localToday = today();
  const relative = (offset: number) => {
    const d = new Date(`${localToday}T12:00:00Z`);
    d.setUTCDate(d.getUTCDate() + offset);
    return d.toISOString().slice(0, 10);
  };
  const samples = [
    {
      id: "minh-anh",
      couple: "Minh & Anh",
      date: "2026-11-15",
      venue: "GEM Center · TP. Hồ Chí Minh",
      guestCount: 280,
      budget: 450000000,
      lead: "Lan",
      color: "#79917d",
      note: "Lễ gia tiên buổi sáng · Tiệc cưới buổi tối",
    },
    {
      id: "nam-linh",
      couple: "Nam & Linh",
      date: "2026-11-22",
      venue: "White Palace · TP. Hồ Chí Minh",
      guestCount: 350,
      budget: 580000000,
      lead: "Hương",
      color: "#bc9573",
      note: "Tông màu trắng và xanh · 35 bàn",
    },
    {
      id: "khoa-trang",
      couple: "Khoa & Trang",
      date: "2026-12-06",
      venue: "The Reverie · TP. Hồ Chí Minh",
      guestCount: 200,
      budget: 620000000,
      lead: "Lan",
      color: "#a198b3",
      note: "Tiệc thân mật · Cần chốt thực đơn chay",
    },
    {
      id: "huy-mai",
      couple: "Huy & Mai",
      date: "2026-12-19",
      venue: "Chloe Gallery · TP. Hồ Chí Minh",
      guestCount: 180,
      budget: 380000000,
      lead: "Phúc",
      color: "#b58483",
      note: "Tiệc ngoài trời · Chuẩn bị phương án trời mưa",
    },
  ];
  const state: Workspace = {
    teamName: "Nhà Mình Weddings",
    members: ["Lan", "Hương", "Phúc"],
    weddings: samples.map((w) => ({ ...w, archived: false, shareToken: null })),
    tasks: [
      {
        id: "t1",
        weddingId: "minh-anh",
        title: "Xác nhận thực đơn với nhà hàng",
        owner: "Lan",
        dueDate: relative(-1),
        done: false,
        sourceId: null,
      },
      {
        id: "t2",
        weddingId: "minh-anh",
        title: "Thanh toán phần cọc trang trí",
        owner: "Lan",
        dueDate: relative(0),
        done: false,
        sourceId: null,
      },
      {
        id: "t3",
        weddingId: "nam-linh",
        title: "Gửi phương án hoa cho cô dâu",
        owner: "Hương",
        dueDate: relative(0),
        done: false,
        sourceId: null,
      },
      {
        id: "t4",
        weddingId: "khoa-trang",
        title: "Chốt lịch thử trang điểm",
        owner: "Lan",
        dueDate: relative(1),
        done: false,
        sourceId: null,
      },
      {
        id: "t5",
        weddingId: "huy-mai",
        title: "Khảo sát phương án sân khấu ngoài trời",
        owner: "Phúc",
        dueDate: relative(3),
        done: false,
        sourceId: null,
      },
      {
        id: "t6",
        weddingId: "minh-anh",
        title: "Đặt lịch chụp ảnh cưới",
        owner: "Lan",
        dueDate: relative(-4),
        done: true,
        sourceId: null,
      },
      {
        id: "t7",
        weddingId: "nam-linh",
        title: "Xác nhận số lượng bàn tiệc",
        owner: "Hương",
        dueDate: relative(2),
        done: false,
        sourceId: null,
      },
      {
        id: "t8",
        weddingId: "minh-anh",
        title: "Đặt cọc địa điểm",
        owner: "Phúc",
        dueDate: relative(-6),
        done: true,
        sourceId: null,
      },
    ],
    vendors: [
      {
        id: "v1",
        weddingId: "minh-anh",
        name: "Mộc Decor",
        category: "Trang trí",
        status: "confirmed",
        quoted: 38000000,
        agreed: 35000000,
        nextAmount: 5000000,
        dueDate: relative(0),
      },
      {
        id: "v2",
        weddingId: "minh-anh",
        name: "GEM Center",
        category: "Nhà hàng",
        status: "confirmed",
        quoted: 220000000,
        agreed: 220000000,
        nextAmount: 55000000,
        dueDate: relative(4),
      },
      {
        id: "v3",
        weddingId: "nam-linh",
        name: "Hoa Tháng Mười",
        category: "Trang trí",
        status: "negotiating",
        quoted: 42000000,
        agreed: 0,
        nextAmount: 0,
        dueDate: null,
      },
      {
        id: "v4",
        weddingId: "khoa-trang",
        name: "An Makeup",
        category: "Trang điểm",
        status: "quoted",
        quoted: 12000000,
        agreed: 0,
        nextAmount: 0,
        dueDate: null,
      },
      {
        id: "v5",
        weddingId: "huy-mai",
        name: "Nắng Studio",
        category: "Chụp ảnh",
        status: "inquiry",
        quoted: 0,
        agreed: 0,
        nextAmount: 0,
        dueDate: null,
      },
    ],
    payments: [
      {
        id: "p1",
        weddingId: "minh-anh",
        vendorId: "v1",
        amount: 5000000,
        date: relative(-2),
        reference: "DEMO-001",
        sourceId: null,
      },
      {
        id: "p2",
        weddingId: "minh-anh",
        vendorId: "v2",
        amount: 55000000,
        date: relative(-6),
        reference: "DEMO-002",
        sourceId: null,
      },
    ],
    updates: [
      {
        id: "u1",
        weddingId: "minh-anh",
        filename: "Trao đổi với Mộc Decor",
        createdAt: now,
        expiresAt: new Date(Date.now() + RETENTION_MS).toISOString(),
        retained: false,
        imageDeleted: false,
        status: "ready",
        analysis: {
          ...analyzeText(
            "Chốt decor 35 triệu. Chuyển thêm 5 triệu trước 20/11 giúp em nhé.",
            "2026-11-15",
          ),
          vendorName: "Mộc Decor",
          ownerName: "Lan",
          warnings: [
            "Đây là dữ liệu minh họa. Khoản dự kiến chưa phải khoản đã thanh toán.",
          ],
        },
        source: "sample",
        hash: "sample-update",
        reviewedAt: null,
      },
    ],
    floorplans: [],
    invitations: [],
    activity: [
      {
        id: "a1",
        text: "Lan đã xác nhận đặt cọc địa điểm cho Minh & Anh",
        at: now,
      },
      {
        id: "a2",
        text: "Hương đang thương lượng báo giá với Hoa Tháng Mười",
        at: new Date(Date.now() - 3600000).toISOString(),
      },
    ],
  };
  return { ...state, invitations: sampleInvitations(state) };
}
