import { CommonModule } from '@angular/common';
import { Component, OnInit, inject, signal } from '@angular/core';
import { Observable, forkJoin } from 'rxjs';

import { extractHttpErrorMessage } from '../../core/http-error';
import { GroupApplication, SubscriptionGroup } from '../../core/models';
import { SubscriptionApiService } from '../../core/subscription-api.service';
import { StatusBadge } from '../../shared/status-badge';

interface OwnerApplicationGroupView {
  group: SubscriptionGroup;
  applications: GroupApplication[];
}

@Component({
  selector: 'app-owner-applications',
  imports: [CommonModule, StatusBadge],
  templateUrl: './owner-applications.html',
  styleUrl: './owner-applications.css',
})
export class OwnerApplications implements OnInit {
  private readonly api = inject(SubscriptionApiService);

  readonly groups = signal<OwnerApplicationGroupView[]>([]);
  readonly loading = signal(true);
  readonly errorMessage = signal<string | null>(null);
  readonly actionMessage = signal<string | null>(null);
  readonly actionKey = signal<string | null>(null);

  ngOnInit(): void {
    this.loadApplications();
  }

  approve(groupId: number, applicationId: number): void {
    this.runAction(`approve-${applicationId}`, 'Approving application...', 'Application approved.', () =>
      this.api.approveApplication(groupId, applicationId)
    );
  }

  reject(groupId: number, applicationId: number): void {
    this.runAction(`reject-${applicationId}`, 'Rejecting application...', 'Application rejected.', () =>
      this.api.rejectApplication(groupId, applicationId)
    );
  }

  markAccess(groupId: number, applicationId: number): void {
    this.runAction(`access-${applicationId}`, 'Marking access as granted...', 'Access marked as granted.', () =>
      this.api.grantAccess(groupId, applicationId)
    );
  }

  confirmPayment(entry: OwnerApplicationGroupView): void {
    this.runAction(`payment-${entry.group.id}`, 'Confirming subscription payment...', 'Subscription marked as paid.', () =>
      this.api.confirmPayment(entry.group.id)
    );
  }

  protected canConfirmPayment(entry: OwnerApplicationGroupView): boolean {
    if (entry.group.paymentConfirmedAt || !this.isGroupFull(entry.group)) {
      return false;
    }

    const approvedApplications = entry.applications.filter((application) => application.status === 'APPROVED');
    return approvedApplications.length > 0 && approvedApplications.every((application) => Boolean(application.guestPaidAt));
  }

  protected subscriptionPaymentLabel(entry: OwnerApplicationGroupView): string {
    if (this.actionKey() === `payment-${entry.group.id}`) {
      return 'Confirming...';
    }

    if (entry.group.paymentConfirmedAt) {
      return 'Subscription paid';
    }

    if (this.canConfirmPayment(entry)) {
      return 'Subscription paid';
    }

    return 'Waiting for guest payments';
  }

  protected applicationActionState(application: GroupApplication): 'pending' | 'none' {
    if (application.status === 'PENDING') {
      return 'pending';
    }

    return 'none';
  }

  protected shouldShowMarkAccess(application: GroupApplication): boolean {
    return ['APPROVED', 'ACCESS_GRANTED', 'CONFIRMED'].includes(application.status) || Boolean(application.adminPayoutAt);
  }

  protected canMarkAccess(group: SubscriptionGroup, application: GroupApplication): boolean {
    return Boolean(group.paymentConfirmedAt)
      && application.status === 'APPROVED'
      && Boolean(application.guestPaidAt)
      && !application.adminPayoutAt;
  }

  protected markAccessLabel(group: SubscriptionGroup, application: GroupApplication): string {
    if (this.actionKey() === `access-${application.id}`) {
      return 'Marking access...';
    }

    if (application.status === 'ACCESS_GRANTED') {
      return 'Access granted';
    }

    if (application.status === 'CONFIRMED') {
      return 'Access confirmed';
    }

    if (application.adminPayoutAt) {
      return 'Payout completed';
    }

    if (!application.guestPaidAt) {
      return 'Waiting for guest payment';
    }

    if (!group.paymentConfirmedAt) {
      return 'Wait for subscription paid';
    }

    return 'Mark access granted';
  }

  protected paymentLabel(application: GroupApplication): string {
    return application.guestPaidAt ? `Paid: ${application.guestPaidAt}` : 'Paid: not yet';
  }

  private runAction(
    key: string,
    pendingMessage: string,
    successMessage: string,
    factory: () => Observable<unknown>
  ): void {
    this.actionMessage.set(pendingMessage);
    this.actionKey.set(key);

    factory().subscribe({
      next: () => {
        this.actionKey.set(null);
        this.actionMessage.set(successMessage);
        this.loadApplications();
      },
      error: (error) => {
        this.actionKey.set(null);
        this.actionMessage.set(extractHttpErrorMessage(error, 'Could not complete the action.'));
      },
    });
  }

  private loadApplications(): void {
    this.loading.set(true);
    forkJoin({
      ownedGroups: this.api.getMyGroups(),
      ownerApplications: this.api.getOwnerApplications(),
    }).subscribe({
      next: ({ ownedGroups, ownerApplications }) => {
        this.loading.set(false);
        this.groups.set(this.mergeGroupViews(ownedGroups, ownerApplications));
      },
      error: (error) => {
        this.loading.set(false);
        this.errorMessage.set(extractHttpErrorMessage(error, 'Could not load owner applications.'));
      },
    });
  }

  private mergeGroupViews(ownedGroupsPayload: unknown, ownerApplicationsPayload: unknown): OwnerApplicationGroupView[] {
    const groupsById = new Map<number, OwnerApplicationGroupView>();

    for (const item of this.flattenPayload(ownedGroupsPayload)) {
      this.addItem(groupsById, item);
    }

    for (const item of this.flattenPayload(ownerApplicationsPayload)) {
      this.addItem(groupsById, item);
    }

    return [...groupsById.values()];
  }

  private flattenPayload(payload: unknown): unknown[] {
    if (Array.isArray(payload)) {
      return payload;
    }

    if (!payload || typeof payload !== 'object') {
      return [];
    }

    const record = payload as Record<string, unknown>;
    const arrayKeys = ['content', 'items', 'data', 'groups', 'applications', 'results', 'payload'];
    const entries: unknown[] = [];

    for (const key of arrayKeys) {
      const value = record[key];
      if (Array.isArray(value)) {
        entries.push(...value);
      }
    }

    if (entries.length > 0) {
      return entries;
    }

    return [payload];
  }

  private addItem(groupsById: Map<number, OwnerApplicationGroupView>, item: unknown): void {
      if (!item || typeof item !== 'object') {
        return;
      }

      const record = item as Record<string, unknown>;

      if ('applications' in record && 'service' in record) {
        const group = item as SubscriptionGroup;
        const existing = groupsById.get(group.id);
        const applications = Array.isArray(group.applications) ? group.applications : [];
        if (existing) {
          existing.group = group;
          existing.applications = this.mergeApplications(existing.applications, applications);
        } else {
          groupsById.set(group.id, {
            group,
            applications,
          });
        }
        return;
      }

      const application = item as GroupApplication & { group?: SubscriptionGroup };
      if (!application.group) {
        return;
      }

      const existing = groupsById.get(application.group.id);
      if (existing) {
        existing.applications = this.mergeApplications(existing.applications, [application]);
      } else {
        groupsById.set(application.group.id, {
          group: application.group,
          applications: [application],
        });
      }
    }

  private mergeApplications(existing: GroupApplication[], incoming: GroupApplication[]): GroupApplication[] {
    const merged = new Map<number, GroupApplication>();

    for (const application of existing) {
      merged.set(application.id, application);
    }

    for (const application of incoming) {
      merged.set(application.id, application);
    }

    return [...merged.values()];
  }

  private isGroupFull(group: SubscriptionGroup): boolean {
    return group.status === 'FULL' || group.occupiedSlots >= group.totalSlots;
  }
}
