import { TestBed } from '@angular/core/testing';
import { HttpTestingController, provideHttpClientTesting } from '@angular/common/http/testing';
import { provideHttpClient } from '@angular/common/http';
import { UsersAdminService } from './users-admin.service';
import { API_URL } from '../../core/tokens';

describe('UsersAdminService', () => {
  let svc: UsersAdminService;
  let http: HttpTestingController;

  beforeEach(() => {
    TestBed.configureTestingModule({
      providers: [provideHttpClient(), provideHttpClientTesting(), { provide: API_URL, useValue: '/api/v1' }],
    });
    svc = TestBed.inject(UsersAdminService);
    http = TestBed.inject(HttpTestingController);
  });

  it('patchStatus PATCH /users/:id/status', () => {
    svc.patchStatus('u1', false).subscribe();
    const req = http.expectOne('/api/v1/users/u1/status');
    expect(req.request.method).toBe('PATCH');
    expect(req.request.body).toEqual({ is_active: false });
    req.flush({ data: {} });
  });

  afterEach(() => http.verify());
});
