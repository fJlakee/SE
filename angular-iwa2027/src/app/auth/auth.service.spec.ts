import { TestBed } from '@angular/core/testing';
import { provideHttpClient } from '@angular/common/http';
import { HttpTestingController, provideHttpClientTesting } from '@angular/common/http/testing';

import { AuthService } from './auth.service';

describe('AuthService', () => {
  let service: AuthService;
  let httpMock: HttpTestingController;

  beforeEach(() => {
    localStorage.clear();
    sessionStorage.clear();

    TestBed.configureTestingModule({
      providers: [
        provideHttpClient(),
        provideHttpClientTesting(),
      ],
    });

    service = TestBed.inject(AuthService);
    httpMock = TestBed.inject(HttpTestingController);
  });

  afterEach(() => {
    httpMock.verify();
    localStorage.clear();
    sessionStorage.clear();
  });

  it('should store token after login', () => {
    service.login('admin', 'password').subscribe();

    const request = httpMock.expectOne('http://localhost:8080/auth/signin');
    expect(request.request.method).toBe('POST');
    request.flush({
      token: 'abc',
      type: 'Bearer',
      identifier: 'ADMIN-0001',
      fullName: 'Admin User',
      blocked: false,
      roles: 'ROLE_ADMIN',
    });

    expect(service.isLoggedIn()).toBe(true);
    expect(service.authorizationHeader()).toBe('Bearer abc');
    expect(service.identifier()).toBe('ADMIN-0001');
    expect(service.fullName()).toBe('Admin User');
    expect(service.roles()).toEqual(['ROLE_ADMIN']);
    expect(service.isAdmin()).toBe(true);
  });

  it('should register a user', () => {
    service.register({
      fullName: 'User One',
      passportNumber: 'AA123456',
      phoneNumber: '+48100100100',
      password: 'password',
    }).subscribe((response) => {
      expect(response.message).toContain('registered');
    });

    const request = httpMock.expectOne('http://localhost:8080/auth/signup');
    expect(request.request.method).toBe('POST');
    expect(request.request.body).toEqual({
      fullName: 'User One',
      passportNumber: 'AA123456',
      phoneNumber: '+48100100100',
      password: 'password',
    });
    request.flush({ message: 'User registered successfully.' });
  });
});
