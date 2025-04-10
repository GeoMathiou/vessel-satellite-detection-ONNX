import { Component } from '@angular/core';
import { CopernicusService } from '../copernicus.service';

@Component({
  selector: 'app-search',
  templateUrl: './search.component.html',
  styleUrls: ['./search.component.scss']
})
export class SearchComponent {
  latitude!: number;
  longitude!: number;
  startDate!: string;
  endDate!: string;
  imageUrl!: string;
  bounds!: [[number, number], [number, number]];

  constructor(private copernicusService: CopernicusService) {}

  onSubmit() {
    // Create a WKT polygon (adjust the buffer as needed)
    const buffer = 0.1; // ~11 km around the point
    const wktPolygon = `POLYGON((
      ${this.longitude - buffer} ${this.latitude - buffer},
      ${this.longitude + buffer} ${this.latitude - buffer},
      ${this.longitude + buffer} ${this.latitude + buffer},
      ${this.longitude - buffer} ${this.latitude + buffer},
      ${this.longitude - buffer} ${this.latitude - buffer}
    ))`;

    this.copernicusService.getImagesByArea(wktPolygon, this.startDate, this.endDate)
      .subscribe((response: any) => {
        const products = response?.d?.results;
        if (products && products.length > 0) {
          const latestProduct = products[0];
          this.imageUrl = this.copernicusService.getQuicklookUrl(latestProduct.Id);
          this.bounds = [
            [this.latitude - buffer, this.longitude - buffer],
            [this.latitude + buffer, this.longitude + buffer]
          ];
        }
      });
  }
}
