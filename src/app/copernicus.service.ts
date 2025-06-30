import { Injectable } from '@angular/core';
import { HttpClient, HttpHeaders } from '@angular/common/http';
import { AuthService } from './auth.service';

@Injectable({
  providedIn: 'root'
})
export class CopernicusService {

  private readonly PROCESS_URL = 'https://sh.dataspace.copernicus.eu/api/v1/process';
  private readonly EVALSCRIPT = `
    //VERSION=3
    function setup() {
      return {
        input: ["B02", "B03", "B04"],
        output: { bands: 3 }
      };
    }
    function evaluatePixel(s) {
      return [2.5 * s.B04, 2.5 * s.B03, 2.5 * s.B02];
    }
    `;

  constructor(private http: HttpClient, private authService: AuthService) {}

  async fetchImageForBBox(
    bbox: [number,number,number,number],
    width: number,
    height: number
  ): Promise<Blob> {
    const token = await this.authService.getAccessToken();
    const payload = {
      input: {
        bounds: {
          bbox,
          properties: { crs: 'http://www.opengis.net/def/crs/OGC/1.3/CRS84' }
        },
        data: [{ 
          type: 'sentinel-2-l2a',
          dataFilter: {
            timeRange: {
              from: "2025-06-05T00:00:00Z",   // Adjust the date range as needed
              to: "2025-06-05T23:59:59Z"
            }
          }
        }]
      },
      output: {
        width, height,
        responses: [{ identifier: 'default', format: { type: 'image/png' }}]
      },
      evalscript: this.EVALSCRIPT
    };
    const headers = new HttpHeaders({
      Authorization: `Bearer ${token}`,
      'Content-Type':  'application/json',
      'Accept':        'image/png'
    });
    return this.http
      .post(this.PROCESS_URL, payload, { headers, responseType: 'blob' })
      .toPromise() as Promise<Blob>;
  }


}