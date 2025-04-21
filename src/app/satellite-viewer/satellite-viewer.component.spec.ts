import { ComponentFixture, TestBed } from '@angular/core/testing';

import { SatelliteViewerComponent } from './satellite-viewer.component';

describe('SatelliteViewerComponent', () => {
  let component: SatelliteViewerComponent;
  let fixture: ComponentFixture<SatelliteViewerComponent>;

  beforeEach(() => {
    TestBed.configureTestingModule({
      declarations: [SatelliteViewerComponent]
    });
    fixture = TestBed.createComponent(SatelliteViewerComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
