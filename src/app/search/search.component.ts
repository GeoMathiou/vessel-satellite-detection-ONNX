import { Component } from '@angular/core';
import { CopernicusService } from '../copernicus.service';

@Component({
  selector: 'app-search',
  templateUrl: './search.component.html',
  styleUrls: ['./search.component.scss']
})
export class SearchComponent {

  constructor(private copernicusService: CopernicusService) {}

}
