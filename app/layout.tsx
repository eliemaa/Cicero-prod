import type { Metadata } from "next";
export const metadata: Metadata = {
  title: { default: "Cicero", template: "%s · Cicero" },
};
export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en" suppressHydrationWarning>
      <body>{children}</body>
    </html>
  );
}
