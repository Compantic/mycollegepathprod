export default function PublicLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <>
      <link rel="stylesheet" href="/compiled-styles.css" />
      <style>{'@import url("/compiled-styles.css");'}</style>
      {children}
    </>
  );
}
