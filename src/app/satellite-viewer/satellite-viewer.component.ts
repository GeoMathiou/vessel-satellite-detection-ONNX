import { Component } from '@angular/core';
import { CopernicusService } from '../copernicus.service';

@Component({
  selector: 'app-satellite-viewer',
  templateUrl: './satellite-viewer.component.html',
  styleUrls: ['./satellite-viewer.component.scss']
})
export class SatelliteViewerComponent {
  imageUrl: string | null = null;
  loading = false;
  error: string | null = null;
  buttonPressed = false;
  bbox: [number, number, number, number] = [ 25.133,  35.340,  25.160,  35.354  ]; //Heraklion


  constructor(private copService: CopernicusService) {}

  async loadImage() {
    this.loading = true;
    this.error = null;
    this.imageUrl = null;

    try {
      const blob = await this.copService.fetchImageForBBox(this.bbox,1920,1080);
      this.imageUrl = URL.createObjectURL(blob);
    } catch (err: any) {
      this.error = err.message || 'Failed to load image';
    } finally {
      this.loading = false;
    }
  }

  ngOnDestroy() {
    if (this.imageUrl) {
      URL.revokeObjectURL(this.imageUrl);
    }
  }
}