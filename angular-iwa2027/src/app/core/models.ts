export interface AuthSession {
  token: string;
  tokenType: string;
  identifier: string;
  fullName: string;
  blocked: boolean;
  roles: string[];
}

export interface LoginResponse {
  token: string;
  type?: string;
  identifier: string;
  fullName: string;
  blocked: boolean;
  roles?: string | string[] | Array<string | { authority?: string; role?: string }>;
  authorities?: string | string[] | Array<string | { authority?: string; role?: string }>;
}

export interface RegisterRequest {
  fullName: string;
  passportNumber: string;
  phoneNumber: string;
  password: string;
}

export interface RegisterResponse {
  message: string;
}

export interface SubscriptionService {
  id: number;
  name: string;
  category: string | null;
  active: boolean;
}

export interface UserSummary {
  id?: number;
  fullName?: string;
  identifier?: string;
  blocked?: boolean;
  roles?: string[];
}

export interface GroupApplication {
  id: number;
  group?: SubscriptionGroup;
  applicant?: UserSummary;
  status: string;
  reservedAmount?: number;
  requestedAt?: string;
  approvedAt?: string;
  guestPaidAt?: string;
  accessGrantedAt?: string;
  confirmedAt?: string;
  refundedAt?: string;
  freezeUntil?: string;
  adminPayoutAt?: string;
  withdrawReason?: string;
}

export interface SubscriptionGroup {
  id: number;
  title: string;
  service: SubscriptionService;
  owner?: UserSummary;
  totalSlots: number;
  occupiedSlots: number;
  monthlyPrice: number;
  currency: string;
  status: string;
  createdAt?: string;
  paymentConfirmedAt?: string;
  freezeUntil?: string;
  applications?: GroupApplication[];
}

export interface CreateServiceRequest {
  name: string;
  category: string;
}

export interface CreateGroupRequest {
  serviceId: number;
  title: string;
  totalSlots: number;
  monthlyPrice: number;
}

export interface SearchGroupsParams {
  serviceName?: string;
  minAvailableSlots?: number;
  maxPrice?: number;
}
