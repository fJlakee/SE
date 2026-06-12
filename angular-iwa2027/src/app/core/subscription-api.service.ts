import { HttpClient, HttpHeaders, HttpParams } from '@angular/common/http';
import { Injectable, inject } from '@angular/core';
import {
  CreateGroupRequest,
  CreateServiceRequest,
  GroupApplication,
  SearchGroupsParams,
  SubscriptionGroup,
  SubscriptionService,
} from './models';
import { AuthService } from '../auth/auth.service';

@Injectable({
  providedIn: 'root',
})
export class SubscriptionApiService {
  private readonly http = inject(HttpClient);
  private readonly auth = inject(AuthService);
  private readonly baseUrl = 'http://localhost:8080';

  listServices() {
    return this.http.get<SubscriptionService[]>(`${this.baseUrl}/services`);
  }

  createService(request: CreateServiceRequest) {
    return this.http.post<SubscriptionService>(`${this.baseUrl}/services`, request, this.authOptions());
  }

  listGroups() {
    return this.http.get<SubscriptionGroup[]>(`${this.baseUrl}/groups`);
  }

  searchGroups(filters: SearchGroupsParams) {
    let params = new HttpParams();

    if (filters.serviceName?.trim()) {
      params = params.set('serviceName', filters.serviceName.trim());
    }

    if (filters.minAvailableSlots !== undefined && filters.minAvailableSlots !== null && filters.minAvailableSlots !== 0) {
      params = params.set('minAvailableSlots', String(filters.minAvailableSlots));
    }

    if (filters.maxPrice !== undefined && filters.maxPrice !== null && filters.maxPrice !== 0) {
      params = params.set('maxPrice', String(filters.maxPrice));
    }

    return this.http.get<SubscriptionGroup[]>(`${this.baseUrl}/groups/search`, { params });
  }

  getGroup(groupId: number) {
    return this.http.get<SubscriptionGroup>(`${this.baseUrl}/groups/${groupId}`);
  }

  getMyGroups() {
    return this.http.get<SubscriptionGroup[]>(`${this.baseUrl}/groups/mine`, this.authOptions());
  }

  getMyApplications() {
    return this.http.get<GroupApplication[]>(`${this.baseUrl}/groups/applications/mine`, this.authOptions());
  }

  getOwnerApplications() {
    return this.http.get<unknown>(`${this.baseUrl}/groups/applications/owner`, this.authOptions());
  }

  createGroup(request: CreateGroupRequest) {
    return this.http.post<SubscriptionGroup>(`${this.baseUrl}/groups`, request, this.authOptions());
  }

  applyToGroup(groupId: number) {
    return this.http.post<void>(`${this.baseUrl}/groups/${groupId}/apply`, null, this.authOptions({ contentTypeJson: true }));
  }

  approveApplication(groupId: number, applicationId: number) {
    return this.http.post<void>(
      `${this.baseUrl}/groups/${groupId}/applications/${applicationId}/approve`,
      null,
      this.authOptions({ contentTypeJson: true })
    );
  }

  rejectApplication(groupId: number, applicationId: number) {
    return this.http.post<void>(
      `${this.baseUrl}/groups/${groupId}/applications/${applicationId}/reject`,
      null,
      this.authOptions({ contentTypeJson: true })
    );
  }

  payApplication(applicationId: number) {
    return this.http.post<GroupApplication>(
      `${this.baseUrl}/groups/applications/${applicationId}/pay`,
      null,
      this.authOptions({ contentTypeJson: true })
    );
  }

  confirmPayment(groupId: number) {
    return this.http.post<void>(
      `${this.baseUrl}/groups/${groupId}/payment/confirm`,
      null,
      this.authOptions({ contentTypeJson: true })
    );
  }

  grantAccess(groupId: number, applicationId: number) {
    return this.http.post<GroupApplication>(
      `${this.baseUrl}/groups/${groupId}/applications/${applicationId}/access`,
      null,
      this.authOptions({ contentTypeJson: true })
    );
  }

  confirmAccess(applicationId: number) {
    return this.http.post<void>(
      `${this.baseUrl}/groups/applications/${applicationId}/confirm`,
      null,
      this.authOptions({ contentTypeJson: true })
    );
  }

  withdraw(applicationId: number) {
    return this.http.post<void>(
      `${this.baseUrl}/groups/applications/${applicationId}/withdraw`,
      null,
      this.authOptions({ contentTypeJson: true })
    );
  }

  private authOptions(options: { contentTypeJson?: boolean } = {}) {
    const authorization = this.auth.authorizationHeader();
    let headers = new HttpHeaders();

    if (authorization) {
      headers = headers.set('Authorization', authorization);
    }

    if (options.contentTypeJson) {
      headers = headers.set('Content-Type', 'application/json');
    }

    return headers.keys().length > 0
      ? {
          headers,
        }
      : {};
  }
}
