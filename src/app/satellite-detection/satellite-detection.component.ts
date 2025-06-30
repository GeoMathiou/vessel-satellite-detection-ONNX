import {
  Component,
  OnInit,
  OnDestroy,
  ViewChild,
  ElementRef
} from '@angular/core';
import * as ort from 'onnxruntime-web';
import { letterboxImage } from '../utils/onnx-preprocess';
import { CopernicusService } from '../copernicus.service';

interface Detection {
  x1: number;
  y1: number;
  x2: number;
  y2: number;
  confidence: number;
  classId: number;
  // If you also want “name,” you can add name: string; but single‐class → “ship.”
}

function nms(
  boxes: Array<[number, number, number, number]>,
  scores: number[],
  iouThreshold: number
): number[] {
  const picked: number[] = [];
  // Create an array of indices 0..N-1 sorted by decreasing score
  const idxs = scores
    .map((s, i) => ({ s, i }))
    .sort((a, b) => b.s - a.s)
    .map((pair) => pair.i);

  while (idxs.length > 0) {
    const i = idxs.shift()!; // take index with highest remaining score
    picked.push(i);

    const rem: number[] = [];
    for (const j of idxs) {
      // compute IoU between box i and box j
      const [x1i, y1i, x2i, y2i] = boxes[i];
      const [x1j, y1j, x2j, y2j] = boxes[j];

      const xx1 = Math.max(x1i, x1j);
      const yy1 = Math.max(y1i, y1j);
      const xx2 = Math.min(x2i, x2j);
      const yy2 = Math.min(y2i, y2j);
      const w = Math.max(0, xx2 - xx1);
      const h = Math.max(0, yy2 - yy1);
      const inter = w * h;

      const areaI = (x2i - x1i) * (y2i - y1i);
      const areaJ = (x2j - x1j) * (y2j - y1j);
      const union = areaI + areaJ - inter;

      const iou = union > 0 ? inter / union : 0;
      // Keep box j only if IoU < threshold
      if (iou < iouThreshold) {
        rem.push(j);
      }
    }
    // idxs = rem (all j that had IoU < threshold w.r.t. i)
    idxs.splice(0, idxs.length, ...rem);
  }

  return picked;
}

@Component({
  selector: 'app-satellite-detection',
  templateUrl: './satellite-detection.component.html',
  styleUrls: ['./satellite-detection.component.scss']
})

export class SatelliteDetectionComponent implements OnInit, OnDestroy {
  @ViewChild('imageEl', { static: false })
  imageEl!: ElementRef<HTMLImageElement>;

  @ViewChild('overlay', { static: false })
  overlay!: ElementRef<HTMLCanvasElement>;

  // Flags for UI
  modelReady = false;
  imageReady = false;
  detecting = false;
  error: string | null = null;
  confidenceThreshold = 0.44; // Minimum confidence to show a box

  public modelLoadTimeMs: number | null = null;
  public lastInferenceMs: number | null = null;

  // BBox for Copernicus service call (LonMin, LatMin, LonMax, LatMax)
  // bbox: [number, number, number, number] = [25.133, 35.340, 25.160, 35.354]; // Example: Heraklion
  bbox: [number, number, number, number] = [23.497181, 37.870788, 23.597946, 37.923347]; // Example: Salamina ~51km
  // bbox: [number, number, number, number] = [23.497181, 37.837581, 23.671246, 37.923347]; // Example: Salamina ~146km
  // bbox: [number, number, number, number] = [23.525162, 37.899646, 23.560696, 37.918201]; // Example: Salamina ~6.4 km

  // Where we store the loaded model
  private session: ort.InferenceSession | null = null;
  // The URL (ObjectURL) for the last‐loaded image blob
  private lastUrl: string | null = null;
  // The <img>’s src
  imageUrl: string | null = null;

  constructor(private copService: CopernicusService) { }

  async ngOnInit() {
    // 1) Configure ONNX WASM backend
    ort.env.wasm.wasmPaths = '/assets/ort/esm/'; // Your ONNX Runtime WASM location
    ort.env.wasm.numThreads = 2;                // Parallel threads if available
    try {
      const t0 = performance.now();
      // 2) Load the ONNX model from /assets/models
      this.session = await ort.InferenceSession.create('/assets/models/my_ship.onnx', {
        executionProviders: ['wasm']
      });
      const t1 = performance.now();
      this.modelLoadTimeMs = t1 - t0;
      console.log(`Model load time: ${this.modelLoadTimeMs.toFixed(1)} ms`);
      this.modelReady = true;

    } catch (e) {
      console.error('❌ Failed to load model', e);
      this.error = 'Could not load ONNX model';
    }
  }

  ngOnDestroy() {
    // Revoke any existing Blob URL
    if (this.lastUrl) {
      URL.revokeObjectURL(this.lastUrl);
      this.lastUrl = null;
    }
  }

  /** Handle a local file being selected via <input type="file"> */
  onFileSelected(event: Event) {
    const input = event.target as HTMLInputElement;
    if (!input.files || input.files.length === 0) {
      return;
    }
    const file = input.files[0];
    if (!file.type.startsWith('image/')) {
      this.error = 'Please select a valid image file.';
      return;
    }
    this.error = null;
    this.imageReady = false;

    // Revoke any existing URL
    if (this.lastUrl) {
      URL.revokeObjectURL(this.lastUrl);
      this.lastUrl = null;
    }

    // Create a new URL for the selected file
    this.lastUrl = URL.createObjectURL(file);
    this.imageUrl = this.lastUrl;

    // Clear the <input> so selecting the same file again still triggers change
    input.value = '';
  }

  /**
   * Set a local “test” image from assets into the <img>.
   * Automatically revokes any previous Blob URL (if one existed).
   */
  useTestImage(path: string) {
    if (!this.modelReady) return;
    this.error = null;
    this.imageReady = false;

    // If there was a Blob URL previously, revoke it
    if (this.lastUrl) {
      URL.revokeObjectURL(this.lastUrl);
      this.lastUrl = null;
    }

    // Use direct asset path; Angular CLI will serve from /assets/
    this.imageUrl = path;
  }


  setBBox(coords: [number, number, number, number]): void {
  this.bbox = [...coords];
}

  /** 
   * 1) Uses CopernicusService to fetch a satellite tile for the given bbox at 1920×1080.
   * 2) Converts the Blob to an ObjectURL and sets it into imageUrl (for <img>).
   * 3) (Currently, as a fallback, it uses a local “assets/test2.jpg” if you comment out Copernicus call.)
   */
  async loadImage() {
    if (!this.modelReady) {
      this.error = 'Model not loaded yet';
      return;
    }
    this.error = null;
    this.imageReady = false;

    try {
      // Fetch from Copernicus (returns a Blob)
      const blob = await this.copService.fetchImageForBBox(
        this.bbox,
        1920,
        1080
      );

      // Revoke previous blob URL
      if (this.lastUrl) {
        URL.revokeObjectURL(this.lastUrl);
        this.lastUrl = null;
      }

      // Create a new ObjectURL
      this.lastUrl = URL.createObjectURL(blob);
      this.imageUrl = this.lastUrl;

      // If you prefer using a local test image instead:
      // this.imageUrl = 'assets/test2.jpg';
    } catch (err) {
      console.error('Image load error', err);
      this.error = 'Could not fetch satellite image';
    }
  }

  /** Fired when the <img> actually finishes loading. */
  onImageLoad() {
    this.imageReady = true;
    // Clear any previous drawings on the canvas
    const canvas = this.overlay.nativeElement;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;
    ctx.clearRect(0, 0, canvas.width, canvas.height);
  }

  /**
 * Given a Blob and a filename, trigger a browser download.
 */
  private downloadBlob(blob: Blob, filename: string) {
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = filename;
    // Append to the DOM, click, and then remove it
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    // Revoke after a short timeout to free memory
    setTimeout(() => URL.revokeObjectURL(url), 100);
  }

  async loadImageAndSave() {
    if (!this.modelReady) {
      this.error = 'Model not loaded';
      return;
    }
    this.error = null;
    this.imageReady = false;

    try {
      // 1) Fetch the satellite tile as a Blob
      const blob = await this.copService.fetchImageForBBox(this.bbox, 1920, 1080);

      // 2) Automatically prompt the user to download it as "satellite.png"
      this.downloadBlob(blob, 'satellite.png');

      // 3) Still display it in <img> so you can see it on‐screen
      if (this.lastUrl) {
        URL.revokeObjectURL(this.lastUrl);
        this.lastUrl = null;
      }
      this.lastUrl = URL.createObjectURL(blob);
      this.imageUrl = this.lastUrl;

    } catch (err) {
      console.error('Image fetch/download error', err);
      this.error = 'Could not fetch or save satellite image';
    }
  }



  /** Runs ONNX inference and draws bounding boxes. */
  async runDetection() {
    if (!this.session || !this.imageReady || this.detecting) return;
    this.detecting = true;
    this.error = null;

    const img = this.imageEl.nativeElement;
    const canvas = this.overlay.nativeElement;
    const ctx = canvas.getContext('2d')!;
    canvas.width = img.clientWidth;
    canvas.height = img.clientHeight;
    ctx.clearRect(0, 0, canvas.width, canvas.height);

    // 1) Letterbox + normalize into a 640×640 Float32Array
    const { tensor, ratio, padX, padY } = letterboxImage(img, 640, 640);
    const inputTensor = new ort.Tensor('float32', tensor, [1, 3, 640, 640]);

    // 2) Run ONNX inference
    let results: Record<string, ort.Tensor>;
    try {
      const infStart = performance.now();
      results = await this.session.run({ images: inputTensor });
      const infEnd = performance.now();
      this.lastInferenceMs = infEnd - infStart;
      console.log(`Inference time: ${this.lastInferenceMs.toFixed(1)} ms`);
    } catch (err) {
      console.error('ONNX inference error', err);
      this.error = 'Detection failed';
      this.detecting = false;
      return;
    }

    // 3) Post-process: extract raw boxes and confidences
    const output = results[Object.keys(results)[0]];
    const data = output.data as Float32Array;
    const [, N, D] = output.dims; // D = 6 (x, y, w, h, conf, class)
    const origW = img.naturalWidth;
    const origH = img.naturalHeight;

    // Prepare arrays to hold *unscaled* pixel boxes and confidences
    const rawBoxes: Array<[number, number, number, number]> = [];
    const rawScores: number[] = [];

    for (let i = 0; i < N; i++) {
      const o = i * D;
      const conf = data[o + 4];
      // Optional: use a higher confidence threshold here, e.g. 0.44
      if (conf < this.confidenceThreshold) continue;

      // YOLOv5 output is (centerX, centerY, width, height) on 640×640
      let cx = data[o + 0];
      let cy = data[o + 1];
      let w = data[o + 2];
      let h = data[o + 3];

      // Convert center→corner on patch
      let x1 = cx - w / 2;
      let y1 = cy - h / 2;
      let x2 = cx + w / 2;
      let y2 = cy + h / 2;

      // Remove letterbox padding, scale back to original image pixels
      x1 = (x1 - padX) / ratio;
      y1 = (y1 - padY) / ratio;
      x2 = (x2 - padX) / ratio;
      y2 = (y2 - padY) / ratio;

      // Clip to within [0, origW/origH] (optional but recommended)
      x1 = Math.max(0, Math.min(origW, x1));
      y1 = Math.max(0, Math.min(origH, y1));
      x2 = Math.max(0, Math.min(origW, x2));
      y2 = Math.max(0, Math.min(origH, y2));

      // Save this box and its confidence
      rawBoxes.push([x1, y1, x2, y2]);
      rawScores.push(conf);
    }

    // 4) Perform NMS on the *unscaled* pixel boxes
    const iouThreshold = 0.45; // standard YOLOv5 NMS IoU
    const keepIndices = nms(rawBoxes, rawScores, iouThreshold);

    // 5) Draw only the NMS-filtered boxes (scaled to CSS pixels)
    ctx.strokeStyle = 'red';
    ctx.lineWidth = 1;
    ctx.font = '14px sans-serif';
    ctx.fillStyle = 'red';

    let count = 0;
    for (const idx of keepIndices) {
      const [x1, y1, x2, y2] = rawBoxes[idx];
      const conf = rawScores[idx];

      // Map from original‐pixel to CSS‐pixel coords
      const sx = (x1 / origW) * img.clientWidth;
      const sy = (y1 / origH) * img.clientHeight;
      const sw = ((x2 - x1) / origW) * img.clientWidth;
      const sh = ((y2 - y1) / origH) * img.clientHeight;

      // Draw the box & confidence text
      ctx.strokeRect(sx, sy, sw, sh);
      const label = `${conf.toFixed(2)}`;
      ctx.fillText(label, sx + 2, sy + 14);
      count++;
    }

    // Optional: draw total ships detected
    ctx.fillStyle = 'rgba(255,0,0)';
    ctx.strokeStyle = 'red';
    ctx.lineWidth = 2;
    ctx.font = '18px sans-serif';
    ctx.fillText(`Ships: ${count}`, 10, 25);

    this.detecting = false;
  }



}
