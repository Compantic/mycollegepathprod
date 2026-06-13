import { StylesheetLinks } from "@/components/StylesheetLinks";

/**
 * Some standalone/static builds can emit a fragment-like HTML shell for public pages
 * (starts with scripts instead of <!DOCTYPE><html>), which breaks CSS boot in Safari/CDN paths.
 * Force dynamic rendering so public routes always stream a full document shell.
 */
export const dynamic = "force-dynamic";

export default function PublicLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <>
      <StylesheetLinks />
      {children}
    </>
  );
}

