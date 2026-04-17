import { TestBed } from '@angular/core/testing';
import { HttpClientTestingModule, HttpTestingController } from '@angular/common/http/testing';
import { API_URL } from '../../core/tokens';
import { ReservationsService } from './reservations.service';

describe('ReservationsService', () => {
  let service: ReservationsService;
  let httpMock: HttpTestingController;

  beforeEach(() => {
    TestBed.configureTestingModule({
      imports: [HttpClientTestingModule],
      providers: [ReservationsService, { provide: API_URL, useValue: '/api/v1' }],
    });
    service = TestBed.inject(ReservationsService);
    httpMock = TestBed.inject(HttpTestingController);
  });

  afterEach(() => {
    httpMock.verify();
  });

  it('listReservations envía filtros como query params', () => {
    service
      .listReservations({ page: 2, limit: 10, status: 'CONFIRMED', q: 'pérez' })
      .subscribe();
    const req = httpMock.expectOne(
      (r) => r.url === '/api/v1/reservations' && r.params.get('status') === 'CONFIRMED',
    );
    expect(req.request.method).toBe('GET');
    expect(req.request.params.get('page')).toBe('2');
    expect(req.request.params.get('limit')).toBe('10');
    expect(req.request.params.get('q')).toBe('pérez');
    req.flush({ data: [], meta: { page: 2, limit: 10, total: 0 } });
  });

  it('createReservation envía Idempotency-Key', () => {
    service.createReservation({}).subscribe();
    const req = httpMock.expectOne('/api/v1/reservations');
    expect(req.request.headers.get('Idempotency-Key')).toBeTruthy();
    req.flush({ data: {} });
  });

  it('updateReservationDates envía Idempotency-Key', () => {
    service.updateReservationDates('rid', { date_start: '2026-01-01' }).subscribe();
    const req = httpMock.expectOne('/api/v1/reservations/rid');
    expect(req.request.method).toBe('PUT');
    expect(req.request.headers.get('Idempotency-Key')).toBeTruthy();
    req.flush({ data: {} });
  });

  it('cancelReservation envía Idempotency-Key', () => {
    service.cancelReservation('rid', { cancellation_reason: 'x' }).subscribe();
    const req = httpMock.expectOne('/api/v1/reservations/rid');
    expect(req.request.method).toBe('DELETE');
    expect(req.request.headers.get('Idempotency-Key')).toBeTruthy();
    req.flush({ data: {} });
  });

  it('addOptionalToReservation envía Idempotency-Key', () => {
    service.addOptionalToReservation('rid', { optional_activity_id: 'oid', quantity: 1 }).subscribe();
    const req = httpMock.expectOne('/api/v1/reservations/rid/optional-activities');
    expect(req.request.headers.get('Idempotency-Key')).toBeTruthy();
    req.flush({ data: {} });
  });
});
