import jsPDF from 'jspdf';
import html2canvas from 'html2canvas';

async function waitForRender(): Promise<void> {
  // Make sure every web font (KaTeX included) has actually finished
  // loading before we screenshot anything — otherwise a page captured
  // too early can silently fall back to a substitute font.
  if (document.fonts && document.fonts.ready) {
    await document.fonts.ready;
  }
  // Give the browser two paint frames to settle layout
  // (covers async image decode + React's last re-render).
  await new Promise<void>((resolve) => {
    requestAnimationFrame(() => requestAnimationFrame(() => resolve()));
  });
}

export async function downloadPaperAsPdf(filename: string): Promise<void> {
  const pageElements = document.querySelectorAll<HTMLElement>('.a4-page-sheet');
  if (!pageElements || pageElements.length === 0) {
    throw new Error("No A4 pages found to generate PDF");
  }

  await waitForRender();

  const pdf = new jsPDF({
    orientation: 'portrait',
    unit: 'mm',
    format: 'a4'
  });

  const pdfWidth = pdf.internal.pageSize.getWidth();   // 210mm
  const pdfHeight = pdf.internal.pageSize.getHeight(); // 297mm

  for (let i = 0; i < pageElements.length; i++) {
    const pageEl = pageElements[i];

    const canvas = await html2canvas(pageEl, {
      scale: 2.5,
      useCORS: true,
      logging: false,
      backgroundColor: '#ffffff'
    });

    const imgData = canvas.toDataURL('image/jpeg', 0.98);

    // Never force-stretch to a fixed box — derive height from the
    // canvas's real aspect ratio so nothing gets warped vs. preview.
    const imgWidthMm = pdfWidth;
    const imgHeightMm = (canvas.height * imgWidthMm) / canvas.width;

    if (i > 0) {
      pdf.addPage();
    }

    if (imgHeightMm > pdfHeight + 0.5) {
      // This page's real content is taller than one A4 sheet — that's
      // paginator.ts letting too much onto the page, not a rendering bug.
      console.warn(
        `Page ${i + 1} overflowed by ${(imgHeightMm - pdfHeight).toFixed(1)}mm — paginator.ts is undercounting this page.`
      );
    }

    pdf.addImage(imgData, 'JPEG', 0, 0, imgWidthMm, imgHeightMm);
  }

  pdf.save(`${filename}.pdf`);
}
