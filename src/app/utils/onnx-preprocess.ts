// -------------------------------------------------
// This function does exactly what YOLOv5’s letterbox does:
//  1. Scale the source image to fit in 640×640 while preserving aspect ratio.
//  2. Pad the remaining area (centering image) so the final “patch” is exactly 640×640.
//  3. Normalize pixels to [0,1], reorder channel dimension as [1,3,640,640] (NCHW).
//
// Returns:
//   tensor: Float32Array of length 1*3*640*640 (RGB normalized)
//   ratio: the scale factor used to resize (min of width/height ratios)
//   padX, padY: the amount of padding on left/right and top/bottom (in pixels on the 640×640 patch).
//
export function letterboxImage(
  imgEl: HTMLImageElement,
  targetW: number,
  targetH: number
): {
  tensor: Float32Array;
  ratio: number;
  padX: number;
  padY: number;
} {
  const canvas = document.createElement('canvas');
  const ctx = canvas.getContext('2d')!;
  const origW = imgEl.naturalWidth;
  const origH = imgEl.naturalHeight;

  // Compute scale factor
  const ratio = Math.min(targetW / origW, targetH / origH);
  const newW = Math.round(origW * ratio);
  const newH = Math.round(origH * ratio);

  // Calculate padding to center
  const padX = Math.floor((targetW - newW) / 2);
  const padY = Math.floor((targetH - newH) / 2);

  // Resize + pad
  canvas.width = targetW;
  canvas.height = targetH;
  // Fill with gray (or black)
  ctx.fillStyle = 'rgb(114, 114, 114)'; // same default seen in YOLOv5
  ctx.fillRect(0, 0, targetW, targetH);
  // Draw the resized image in the center
  ctx.drawImage(imgEl, 0, 0, origW, origH, padX, padY, newW, newH);

  // Extract pixel data
  const imageData = ctx.getImageData(0, 0, targetW, targetH).data; // Uint8ClampedArray

  // Create a Float32Array in [1,3,640,640], normalized to [0,1]
  const tensor = new Float32Array(1 * 3 * targetH * targetW);
  let offset = 0;
  // ONNX Runtime web expects data in row‐major NCHW order
  // We iterate over each pixel, convert to float, divide by 255, and write into R, G, B channels separately.

  // First fill R channel
  for (let y = 0; y < targetH; y++) {
    for (let x = 0; x < targetW; x++) {
      const i = (y * targetW + x) * 4; // index in imageData
      tensor[offset++] = imageData[i] / 255.0; // R
    }
  }
  // Then fill G channel
  for (let y = 0; y < targetH; y++) {
    for (let x = 0; x < targetW; x++) {
      const i = (y * targetW + x) * 4 + 1;
      tensor[offset++] = imageData[i] / 255.0; // G
    }
  }
  // Then fill B channel
  for (let y = 0; y < targetH; y++) {
    for (let x = 0; x < targetW; x++) {
      const i = (y * targetW + x) * 4 + 2;
      tensor[offset++] = imageData[i] / 255.0; // B
    }
  }

  return { tensor, ratio, padX, padY };
}
