/**
 * Adapter Pattern: Phân giải thông tin bản quyền và nguồn gốc tư liệu ảnh từ Wikimedia Commons
 * Đảm bảo tính minh bạch học thuật và tuân thủ bản quyền đa phương tiện (Creative Commons / Public Domain)
 */

export interface ICommonsImageMetadata {
  license?: string;
  artist?: string;
  credit?: string;
}

export class WikimediaCommonsAdapter {
  /**
   * Truy vấn thông tin bản quyền của ảnh từ Wikimedia Commons
   * @param imageFileName Tên tệp ảnh (Vd: "Vo_Nguyen_Giap_2008.jpg")
   */
  public static async fetchImageMetadata(imageFileName: string): Promise<ICommonsImageMetadata> {
    if (!imageFileName) {
      return {};
    }

    try {
      const cleanFileName = imageFileName.replace(/^File:/i, '').trim();
      const url = `https://commons.wikimedia.org/w/api.php?action=query&titles=File:${encodeURIComponent(
        cleanFileName,
      )}&prop=imageinfo&iiprop=extmetadata&format=json&origin=*`;

      const res = await fetch(url, {
        headers: {
          'Accept': 'application/json',
          'Api-User-Agent': 'HisgoHistoryApp/1.0 (contact@hisgo.edu.vn)',
        },
      });

      if (!res.ok) return {};

      const data = await res.json();
      const pages = data?.query?.pages;
      if (!pages) return {};

      const pageKey = Object.keys(pages)[0];
      const extmetadata = pages[pageKey]?.imageinfo?.[0]?.extmetadata;

      if (!extmetadata) return {};

      const license = extmetadata.LicenseShortName?.value || extmetadata.UsageTerms?.value || 'Public Domain';
      // Xóa các thẻ HTML trong tên tác giả nếu có
      const rawArtist = extmetadata.Artist?.value || '';
      const artist = rawArtist.replace(/<[^>]*>/g, '').trim();
      const credit = extmetadata.Credit?.value?.replace(/<[^>]*>/g, '').trim() || '';

      return {
        license,
        artist,
        credit,
      };
    } catch (err) {
      console.warn('Could not fetch Commons image license:', err);
      return {};
    }
  }

  /**
   * Bóc tách tên file từ URL ảnh Wikimedia Commons
   * Vd: https://upload.wikimedia.org/wikipedia/commons/b/b6/Vo_Nguyen_Giap_2008.jpg -> Vo_Nguyen_Giap_2008.jpg
   */
  public static extractFileNameFromUrl(url: string): string {
    if (!url) return '';
    try {
      const parts = url.split('/');
      const lastPart = parts[parts.length - 1];
      // Loại bỏ query string nếu có
      return lastPart.split('?')[0];
    } catch {
      return '';
    }
  }
}
