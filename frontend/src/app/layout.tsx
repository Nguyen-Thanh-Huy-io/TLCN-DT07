import type { Metadata } from "next";
import { Be_Vietnam_Pro, Merriweather, Noto_Serif } from "next/font/google";
import "./globals.css";

const beVietnamPro = Be_Vietnam_Pro({
  weight: ["400", "500", "600", "700"],
  subsets: ["latin", "vietnamese"],
  variable: "--font-be-vietnam-pro",
  display: "swap",
});

const merriweather = Merriweather({
  weight: ["300", "400", "700"],
  style: ["normal", "italic"],
  subsets: ["latin", "vietnamese"],
  variable: "--font-merriweather",
  display: "swap",
});

const notoSerif = Noto_Serif({
  weight: ["600", "700"],
  subsets: ["latin", "vietnamese"],
  variable: "--font-noto-serif",
  display: "swap",
});

export const metadata: Metadata = {
  title: "HISGO — Nền tảng Khám phá Lịch sử Việt Nam",
  description:
    "Khám phá lịch sử Việt Nam qua những dòng thời gian sống động, những câu chuyện ý nghĩa và những nhân vật kiệt xuất.",
  keywords: [
    "lịch sử việt nam",
    "dòng chảy lịch sử",
    "nhân vật lịch sử",
    "văn lang âu lạc",
    "triều đại việt nam",
  ],
  authors: [{ name: "HISGO" }],
  openGraph: {
    title: "HISGO — Nền tảng Khám phá Lịch sử Việt Nam",
    description:
      "Khám phá lịch sử Việt Nam qua những dòng thời gian sống động, những câu chuyện ý nghĩa và những nhân vật kiệt xuất.",
    url: "https://hisgo.vn",
    siteName: "HISGO",
    locale: "vi_VN",
    type: "website",
  },
  icons: {
    icon: "/favicon.svg",
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html
      lang="vi"
      className={`${beVietnamPro.variable} ${merriweather.variable} ${notoSerif.variable} font-sans h-full antialiased`}
    >
      <body className="min-h-full">
        {children}
      </body>
    </html>
  );
}
