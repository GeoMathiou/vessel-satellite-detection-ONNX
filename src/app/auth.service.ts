import { Injectable } from '@angular/core';
import { HttpClient, HttpHeaders, HttpParams } from '@angular/common/http';
import { environment } from '../environments/environment';
import { env } from 'onnxruntime-web';

interface TokenResponse {
  access_token: string;
  refresh_token: string;
  expires_in: number;
}

@Injectable({ providedIn: 'root' })
export class AuthService {
  private readonly TOKEN_URL = '/auth-proxy/auth/realms/CDSE/protocol/openid-connect/token';
  private accessToken: string | null = null;
  private expTime: number = 0; 

  constructor(private http: HttpClient) {}

  async getAccessToken(): Promise<string> {
    if (this.accessToken && Date.now() < this.expTime) {
      return this.accessToken;
    }
  
    const body = new HttpParams()
      .set('grant_type', 'password')
      .set('username', environment.copernicus.username)
      .set('password', environment.copernicus.password)
      .set('client_id', environment.copernicus.clientId);
  
    const headers = new HttpHeaders({
      'Content-Type': 'application/x-www-form-urlencoded'
    });
  
    try {
      const resp = await this.http
        .post<TokenResponse>(
          environment.authTokenUrl || this.TOKEN_URL, // use environment variable or default URL
          body.toString(), 
          { headers }
        )
        .toPromise();
  
      this.accessToken = resp!.access_token;
      this.expTime = Date.now() + resp!.expires_in * 1000 * 0.9;
      return this.accessToken!;
    } catch (error) {
      console.error('Token request failed:', error);
      throw error;
    }
  }
  
}
