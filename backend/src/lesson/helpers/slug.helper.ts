/**
 * Helper sinh Slug chuẩn SEO từ chuỗi tiếng Việt
 * Đảm bảo Single Responsibility Principle (SRP)
 */
export class SlugHelper {
  /**
   * Chuyển đổi chuỗi tiếng Việt có dấu và ký tự đặc biệt thành URL Slug thân thiện
   */
  static generateSlug(input: string): string {
    if (!input || typeof input !== 'string') return '';

    let str = input.trim().toLowerCase();

    // Thay thế ký tự có dấu tiếng Việt
    str = str.replace(/[àáạảãâầấậẩẫăằắặẳẵ]/g, 'a');
    str = str.replace(/[èéẹẻẽêềếệểễ]/g, 'e');
    str = str.replace(/[ìíịỉĩ]/g, 'i');
    str = str.replace(/[òóọỏõôồốộổỗơờớợởỡ]/g, 'o');
    str = str.replace(/[ùúụủũưừứựửữ]/g, 'u');
    str = str.replace(/[ỳýỵỷỹ]/g, 'y');
    str = str.replace(/đ/g, 'd');

    // Bỏ ký tự đặc biệt
    str = str.replace(/[^a-z0-9\s-]/g, '');

    // Thay khoảng trắng thành dấu gạch nối '-'
    str = str.replace(/[\s-]+/g, '-');

    // Bỏ dấu gạch nối ở đầu và cuối
    str = str.replace(/^-+|-+$/g, '');

    return str;
  }
}
