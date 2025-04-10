import { Component } from '@angular/core';
import { CopernicusService } from './copernicus.service';

@Component({
  selector: 'app-root',
  templateUrl: './app.component.html',
  styleUrls: ['./app.component.scss']
})
export class AppComponent {
  // Search form data
  latitude: number = 41.9028;  // Default: Rome
  longitude: number = 12.4964;
  startDate: string = new Date().toISOString().split('T')[0]; // Today
  endDate: string = this.startDate;

  // Map data
  imageUrl: string | null = null;
  bounds: [[number, number], [number, number]] | null = null;
  isLoading: boolean = false;
  error: string | null = null;

  constructor(private copernicusService: CopernicusService) {}

  onSubmit() {
    this.isLoading = true;
    this.error = null;
    this.imageUrl = null;

    // Create a WKT polygon (0.1 degree buffer around the point)
    const buffer = 0.1;
    const wktPolygon = `POLYGON((
      ${this.longitude - buffer} ${this.latitude - buffer},
      ${this.longitude + buffer} ${this.latitude - buffer},
      ${this.longitude + buffer} ${this.latitude + buffer},
      ${this.longitude - buffer} ${this.latitude + buffer},
      ${this.longitude - buffer} ${this.latitude - buffer}
    ))`;

    this.copernicusService.getImagesByArea(wktPolygon, this.startDate, this.endDate)
      .subscribe({
        next: (response: any) => {
          const products = response?.d?.results;
          if (products && products.length > 0) {
            const latestProduct = products[0];
            this.imageUrl = this.copernicusService.getQuicklookUrl(latestProduct.Id);
            this.bounds = [
              [this.latitude - buffer, this.longitude - buffer],
              [this.latitude + buffer, this.longitude + buffer]
            ];
          } else {
            this.error = 'No satellite images found for this area and date range.';
          }
          this.isLoading = false;
        },
        error: (err) => {
          this.error = 'Failed to fetch satellite data. Check your credentials or network.';
          this.isLoading = false;
          console.error(err);
        }
      });
  }
}