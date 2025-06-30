import { ComponentFixture, TestBed } from '@angular/core/testing';

import { SatelliteDetectionComponent } from './satellite-detection.component';

describe('SatelliteDetectionComponent', () => {
  let component: SatelliteDetectionComponent;
  let fixture: ComponentFixture<SatelliteDetectionComponent>;

  beforeEach(() => {
    TestBed.configureTestingModule({
      declarations: [SatelliteDetectionComponent]
    });
    fixture = TestBed.createComponent(SatelliteDetectionComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
