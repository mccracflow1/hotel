import { TestBed } from '@angular/core/testing';
import { HttpClientTestingModule, HttpTestingController } from '@angular/common/http/testing';
import { API_URL } from '../../core/tokens';
import { IdempotencyService } from '../../core/idempotency/idempotency.service';
import { InventoryService } from './inventory.service';

describe('InventoryService', () => {
  let service: InventoryService;
  let httpMock: HttpTestingController;

  beforeEach(() => {
    TestBed.configureTestingModule({
      imports: [HttpClientTestingModule],
      providers: [
        InventoryService,
        { provide: API_URL, useValue: '/api/v1' },
        { provide: IdempotencyService, useValue: { nextKey: () => 'idem-test-key' } },
      ],
    });
    service = TestBed.inject(InventoryService);
    httpMock = TestBed.inject(HttpTestingController);
  });

  afterEach(() => {
    httpMock.verify();
  });

  it('postMovement envía Idempotency-Key', () => {
    service
      .postMovement({
        item_id: '00000000-0000-4000-8000-000000000001',
        type: 'ENTRY',
        quantity: 2,
      })
      .subscribe();
    const req = httpMock.expectOne('/api/v1/inventory/movements');
    expect(req.request.method).toBe('POST');
    expect(req.request.headers.get('Idempotency-Key')).toBe('idem-test-key');
    req.flush({ data: {} });
  });
});
