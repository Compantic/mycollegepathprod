/**
 * Extract text from a PDF file in the browser. Requires pdfjs-dist.
 * Returns plain text or throws.
 */
export async function extractTextFromPdf(file: File): Promise<string> {
  let pdfjsLib: typeof import("pdfjs-dist");
  try {
    pdfjsLib = await import("pdfjs-dist");
  } catch {
    throw new Error("PDF support is not loaded. Use a .txt file or paste your text.");
  }
  const version = (pdfjsLib as { version?: string }).version || "4.0.379";
  (pdfjsLib as { GlobalWorkerOptions?: { workerSrc: string } }).GlobalWorkerOptions = {
    workerSrc: `https://cdnjs.cloudflare.com/ajax/libs/pdf.js/${version}/pdf.worker.min.mjs`,
  };

  const arrayBuffer = await file.arrayBuffer();
  const pdf = await pdfjsLib.getDocument({ data: arrayBuffer }).promise;
  const numPages = pdf.numPages;
  const parts: string[] = [];

  for (let i = 1; i <= numPages; i++) {
    const page = await pdf.getPage(i);
    const content = await page.getTextContent();
    const text = content.items
      .map((item) => ("str" in item ? item.str : ""))
      .join(" ");
    parts.push(text);
  }

  return parts.join("\n\n").replace(/\s+/g, " ").trim();
}
