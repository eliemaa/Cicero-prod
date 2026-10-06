import "@/css/site.css";
export default function SiteLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <>
      <link
        rel="stylesheet"
        href="https://fonts.googleapis.com/css2?family=Hanken+Grotesk:wght@300..600&family=Inter:wght@300;400;500;600&family=IBM+Plex+Sans+Arabic:wght@300;400;500;600&display=swap"
      />
      {children}
    </>
  );
}
