import type { Metadata } from "next";
import { Fraunces, Archivo, JetBrains_Mono } from "next/font/google";
import "./globals.css";
import { PostHogProvider } from "@/components/analytics/PostHogProvider";

const fraunces = Fraunces({
  variable: "--font-fraunces",
  subsets: ["latin"],
  axes: ["opsz", "SOFT", "WONK"],
});

const archivo = Archivo({
  variable: "--font-archivo",
  subsets: ["latin"],
});

const jetbrainsMono = JetBrains_Mono({
  variable: "--font-mono-jb",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  metadataBase: new URL("https://1ball1game.org"),
  title: "1 Ball 1 Game Foundation — Access, opportunity & community through youth soccer",
  description:
    "The 1 Ball 1 Game Foundation funds youth soccer and returns 75% of every registration fee directly to participating school PTAs — grassroots impact for students, teachers, and families.",
  openGraph: {
    title: "1 Ball 1 Game Foundation",
    description:
      "75% of every registration fee goes directly back to participating schools. Play, grow, and thrive through sport.",
    type: "website",
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html
      lang="en"
      className={`${fraunces.variable} ${archivo.variable} ${jetbrainsMono.variable} h-full antialiased`}
    >
      <body className="grain min-h-full">
        <PostHogProvider>{children}</PostHogProvider>
      </body>
    </html>
  );
}
