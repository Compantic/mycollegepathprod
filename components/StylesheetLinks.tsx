/**
 * Include on segment layouts whose HTML streams without the root app/layout <head>
 * (Linux Docker + dynamic routes): otherwise no stylesheet references appear in the document.
 */
export function StylesheetLinks() {
  return (
    <>
      <link rel="stylesheet" href="/app-shell-layout.css" />
      <link rel="preconnect" href="https://fonts.googleapis.com" />
      <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="anonymous" />
      <link
        href="https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700&display=swap"
        rel="stylesheet"
      />
      <link rel="stylesheet" href="/compiled-styles.css" />
    </>
  );
}
