import { TestBed } from '@angular/core/testing';
import { HttpTestingController, provideHttpClientTesting } from '@angular/common/http/testing';
import { provideHttpClient } from '@angular/common/http';
import { MediaLibraryService } from './media-library.service';
import { API_URL } from '../../core/tokens';
import { IdempotencyService } from '../../core/idempotency/idempotency.service';

describe('MediaLibraryService', () => {
  let svc: MediaLibraryService;
  let http: HttpTestingController;

  beforeEach(() => {
    TestBed.configureTestingModule({
      providers: [
        provideHttpClient(),
        provideHttpClientTesting(),
        { provide: API_URL, useValue: '/api/v1' },
        { provide: IdempotencyService, useValue: { nextKey: () => 'test-idempotency-key' } },
      ],
    });
    svc = TestBed.inject(MediaLibraryService);
    http = TestBed.inject(HttpTestingController);
  });

  it('list GET /media con query', () => {
    svc.list({ q: 'x', page: 2 }).subscribe();
    const req = http.expectOne((r) => r.url.includes('/media') && r.params.get('q') === 'x');
    expect(req.request.method).toBe('GET');
    req.flush({ data: [], meta: { page: 2, limit: 50, total: 0 } });
  });

  afterEach(() => http.verify());
});
