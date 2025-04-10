import { Component, AfterViewInit, Input } from '@angular/core';
import * as L from 'leaflet';


@Component({
  selector: 'app-map',
  templateUrl: './map.component.html',
  styleUrls: ['./map.component.scss']
})
export class MapComponent implements AfterViewInit {
  @Input() imageUrl!: string;
  @Input() bounds!: L.LatLngBoundsExpression;
  private map!: L.Map;

  ngAfterViewInit(): void {
    this.initMap();
  }

  private initMap(): void {
    this.map = L.map('map').setView([0, 0], 2); // Default view

    L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
      attribution: '© OpenStreetMap'
    }).addTo(this.map);

    if (this.imageUrl && this.bounds) {
      L.imageOverlay(this.imageUrl, this.bounds).addTo(this.map);
      this.map.fitBounds(this.bounds);
    }
  }
}