import { NextResponse } from "next/server";

// Bộ nhớ tạm lưu danh sách email đăng ký (stub in-memory)
const subscribedEmails = new Set<string>();

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const { email, honeypot } = body;

    // 1. Kiểm tra Honeypot chặn bot (nếu có dữ liệu honeypot thì chặn ngay lập tức)
    if (honeypot && String(honeypot).trim() !== "") {
      return NextResponse.json(
        { ok: false, message: "Spam detected." },
        { status: 400 }
      );
    }

    // 2. Validate email bằng Regex hợp lý
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!email || !emailRegex.test(String(email).trim())) {
      return NextResponse.json(
        { ok: false, message: "Email chưa hợp lệ, bạn kiểm tra lại nhé." },
        { status: 400 }
      );
    }

    const cleanEmail = String(email).trim().toLowerCase();

    // 3. Chống trùng lặp email
    if (subscribedEmails.has(cleanEmail)) {
      return NextResponse.json({
        ok: true,
        message: "Email này đã được đăng ký trước đó rồi nhé!",
      });
    }

    // 4. Lưu vào bộ nhớ (TODO: nối dịch vụ gửi mail thật như Mailchimp/Resend)
    subscribedEmails.add(cleanEmail);

    return NextResponse.json({
      ok: true,
      message: "Cảm ơn bạn! Hãy kiểm tra hộp thư để xác nhận.",
    });
  } catch {
    return NextResponse.json(
      { ok: false, message: "Đã có lỗi xảy ra. Vui lòng thử lại sau." },
      { status: 500 }
    );
  }
}
