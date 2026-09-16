import QRCode from 'qrcode';

export interface QrRenderOptions {
  showLabel?: boolean;
  label?: string;
  width?: number;
  margin?: number;
}

/**
 * Generates a Data URL (base64 image) for a given text/URL.
 * If showLabel is true, uses an offscreen canvas to render the QR code
 * and draws the name centered beneath it with clean spacing.
 */
export const generateQrDataUrl = async (
  text: string,
  options: QrRenderOptions = {}
): Promise<string> => {
  const qrSize = options.width || 512;
  const margin = options.margin !== undefined ? options.margin : 2;

  // 1. Generate base QR code canvas
  const qrCanvas = document.createElement('canvas');
  await QRCode.toCanvas(qrCanvas, text, {
    width: qrSize,
    margin,
    color: {
      dark: '#000000',
      light: '#ffffff',
    },
    errorCorrectionLevel: 'H',
  });

  if (!options.showLabel || !options.label) {
    return qrCanvas.toDataURL('image/png');
  }

  // 2. Create extended canvas with label below
  const labelHeight = 80;
  const combinedCanvas = document.createElement('canvas');
  combinedCanvas.width = qrSize;
  combinedCanvas.height = qrSize + labelHeight;
  const ctx = combinedCanvas.getContext('2d');

  if (!ctx) {
    return qrCanvas.toDataURL('image/png');
  }

  // White background
  ctx.fillStyle = '#ffffff';
  ctx.fillRect(0, 0, combinedCanvas.width, combinedCanvas.height);

  // Draw QR code
  ctx.drawImage(qrCanvas, 0, 0);

  // Draw text below QR Code
  ctx.fillStyle = '#111111';
  ctx.font = 'bold 22px system-ui, -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif';
  ctx.textAlign = 'center';
  ctx.textBaseline = 'middle';

  // Truncate label if too long for the canvas
  let displayLabel = options.label.trim();
  const maxWidth = qrSize - 40;
  if (ctx.measureText(displayLabel).width > maxWidth) {
    while (ctx.measureText(displayLabel + '...').width > maxWidth && displayLabel.length > 0) {
      displayLabel = displayLabel.slice(0, -1);
    }
    displayLabel += '...';
  }

  ctx.fillText(displayLabel, qrSize / 2, qrSize + labelHeight / 2 - 4);

  return combinedCanvas.toDataURL('image/png');
};

/**
 * Generates an SVG string of the QR code.
 */
export const generateQrSvgString = async (text: string): Promise<string> => {
  return await QRCode.toString(text, {
    type: 'svg',
    margin: 2,
    color: {
      dark: '#000000',
      light: '#ffffff',
    },
    errorCorrectionLevel: 'H',
  });
};

/**
 * Triggers browser download of PNG file.
 */
export const downloadQrAsPng = async (
  text: string,
  filename: string,
  options: QrRenderOptions = {}
): Promise<void> => {
  const dataUrl = await generateQrDataUrl(text, { ...options, width: 1024 });
  const link = document.createElement('a');
  link.download = `${filename.replace(/[^a-zA-Z0-9_-]/g, '_')}.png`;
  link.href = dataUrl;
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
};

/**
 * Triggers browser download of SVG file.
 */
export const downloadQrAsSvg = async (text: string, filename: string): Promise<void> => {
  const svgString = await generateQrSvgString(text);
  const blob = new Blob([svgString], { type: 'image/svg+xml' });
  const url = URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.download = `${filename.replace(/[^a-zA-Z0-9_-]/g, '_')}.svg`;
  link.href = url;
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  URL.revokeObjectURL(url);
};
