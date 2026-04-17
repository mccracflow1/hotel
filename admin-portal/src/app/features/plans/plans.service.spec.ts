import { TestBed } from '@angular/core/testing';
import { HttpClientTestingModule, HttpTestingController } from '@angular/common/http/testing';
import { API_URL } from '../../core/tokens';
import { PlansService } from './plans.service';

describe('PlansService', () => {
  let service: PlansService;
  let httpMock: HttpTestingController;

  beforeEach(() => {
    TestBed.configureTestingModule({
      imports: [HttpClientTestingModule],
      providers: [PlansService, { provide: API_URL, useValue: '/api/v1' }],
    });
    service = TestBed.inject(PlansService);
    httpMock = TestBed.inject(HttpTestingController);
  });

  afterEach(() => {
    httpMock.verify();
  });

  it('listPlans hace GET /plans', () => {
    service.listPlans().subscribe();
    const req = httpMock.expectOne('/api/v1/plans');
    expect(req.request.method).toBe('GET');
    req.flush({ data: [] });
  });

  it('postClone envía body con name', () => {
    service.postClone('plan-1', 'Copia demo').subscribe();
    const req = httpMock.expectOne('/api/v1/plans/plan-1/clone');
    expect(req.request.method).toBe('POST');
    expect(req.request.body).toEqual({ name: 'Copia demo' });
    req.flush({ data: {} });
  });
});
