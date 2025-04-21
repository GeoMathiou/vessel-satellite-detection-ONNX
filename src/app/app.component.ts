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


}