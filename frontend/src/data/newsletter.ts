export interface NewsletterData {
  titleLine1: string;
  titleLine2: string;
  description: string;
  inputPlaceholder: string;
  buttonText: string;
  successMessage: string;
  errorMessage: string;
}

export const newsletterData: NewsletterData = {
  titleLine1: "Cùng HISGO",
  titleLine2: "lan tỏa giá trị lịch sử Việt Nam",
  description:
    "Đăng ký nhận bản tin để cập nhật những câu chuyện, sự kiện và nội dung mới nhất.",
  inputPlaceholder: "Nhập email của bạn",
  buttonText: "Đăng ký",
  successMessage: "Cảm ơn bạn! Hãy kiểm tra hộp thư để xác nhận.",
  errorMessage: "Email chưa hợp lệ, bạn kiểm tra lại nhé.",
};
