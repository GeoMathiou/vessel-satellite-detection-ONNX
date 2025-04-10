import { HttpClient, HttpHeaders } from '@angular/common/http';
import { Injectable } from '@angular/core';
import { Observable } from 'rxjs';

@Injectable({
  providedIn: 'root'
})
export class CopernicusService {
  private API_URL = 'https://scihub.copernicus.eu/dhus/odata/v1/Products';
  private credentials = {
    username: 'YOUR_COPERNICUS_USERNAME',
    password: 'YOUR_COPERNICUS_PASSWORD'
  };

  constructor(private http: HttpClient) {}

  // Fetch Sentinel-2 images by WKT polygon and date
  getImagesByArea(wktPolygon: string, startDate: string, endDate: string): Observable<any> {
    const headers = new HttpHeaders({
      Authorization: 'Basic ' + btoa(`${this.credentials.username}:${this.credentials.password}`)
    });

    const params = {
      $filter: `
        Contains(ContentGeometry, geography'${wktPolygon}') and
        ContentDate/Start gt ${startDate} and
        ContentDate/Start lt ${endDate} and
        ProductType eq 'S2MSI1C'
      `,
      $format: 'json'
    };

    return this.http.get(this.API_URL, { headers, params });
  }

  // Get Quicklook (preview) URL for a product ID
  getQuicklookUrl(productId: string): string {
    return `${this.API_URL}('${productId}')/Products('Quicklook')/$value`;
  }
}