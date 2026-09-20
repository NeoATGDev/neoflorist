import type { Metadata, Viewport } from "next";
import "./globals.css";
import { StoreProvider } from "@/components/StoreProvider";

export const metadata: Metadata = {
  title: "PicklePad — Find & book pickleball courts in Bengaluru",
  description:
    "Search pickleball courts across Bengaluru by name, area or amenity, filter by distance from where you are, and book a 1-hour slot in a few taps. Demo data, demo payments.",
  keywords: [
    "pickleball",
    "Bengaluru",
    "Bangalore",
    "court booking",
    "pickleball courts",
  ],
  openGraph: {
    title: "PicklePad — Find & book pickleball courts in Bengaluru",
    description:
      "46 courts across 18 localities. Search, filter by radius, book the next free hour.",
    type: "website",
  },
};

export const viewport: Viewport = {
  themeColor: "#05070a",
  width: "device-width",
  initialScale: 1,
};

export default function RootLayout({
  children,
}: Readonly<{ children: React.ReactNode }>) {
  return (
    <html lang="en">
      <head>
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="" />
        <link
          href="https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700;800&display=swap"
          rel="stylesheet"
        />
      </head>
      <body>
        <StoreProvider>{children}</StoreProvider>
      </body>
    </html>
  );
}
