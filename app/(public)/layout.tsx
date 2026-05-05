import { StylesheetLinks } from "@/components/StylesheetLinks";

/**
 * Public routes should stay static where possible and always emit stylesheet links.
 * In some standalone streaming responses, root <head> tags are omitted.
 */
export const dynamic = "force-static";

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

