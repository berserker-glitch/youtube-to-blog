import type { Metadata } from "next";
import "./globals.css";
import { Providers } from "./providers";
import { ThemeScript } from "./_components/ThemeScript";

export const metadata: Metadata = {
  title: "ArticleAlchemist",
  description:
    "ArticleAlchemist turns captioned YouTube videos into structured, SEO-optimized long-form Markdown articles.",
  keywords: [
    "YouTube",
    "Blog generator",
    "Markdown",
    "SEO",
    "Transcription",
    "AI writing",
  ],
  authors: [{ name: "ArticleAlchemist" }],
};

export const viewport = {
  width: "device-width",
  initialScale: 1,
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html
      lang="en"
      suppressHydrationWarning
    >
      <head>
        <ThemeScript />
      </head>
      <body className="font-sans antialiased" suppressHydrationWarning>
        <Providers>{children}</Providers>
      </body>
    </html>
  );
}
