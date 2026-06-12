import { CommonModule } from '@angular/common';
import { Component, OnInit, inject, signal } from '@angular/core';
import { forkJoin } from 'rxjs';

import { AuthService } from '../../auth/auth.service';
import { extractHttpErrorMessage } from '../../core/http-error';
import { GroupApplication } from '../../core/models';
import { SubscriptionApiService } from '../../core/subscription-api.service';
import { StatusBadge } from '../../shared/status-badge';

@Component({
  selector: 'app-my-applications',
  imports: [CommonModule, StatusBadge],
  templateUrl: './my-applications.html',
  styleUrl: './my-applications.css',
})
export class MyApplications implements OnInit {
  private readonly api = inject(SubscriptionApiService);
  protected readonly auth = inject(AuthService);

  readonly applications = signal<GroupApplication[]>([]);
  readonly loading = signal(true);
  readonly errorMessage = signal<string | null>(null);
  readonly actionMessage = signal<string | null>(null);
  readonly actionLoading = signal<number | null>(null);

  ngOnInit(): void {
    this.loadApplications();
  }

  pay(application: GroupApplication): void {
    this.actionMessage.set(null);
    this.actionLoading.set(application.id);

    this.api.payApplication(application.id).subscribe({
      next: () => {
        this.actionLoading.set(null);
        this.actionMessage.set('Payment recorded successfully.');
        this.loadApplications();
      },
      error: (error) => {
        this.actionLoading.set(null);
        this.actionMessage.set(extractHttpErrorMessage(error, 'Could not record payment.'));
      },
    });
  }

  withdraw(application: GroupApplication): void {
    this.actionMessage.set(null);
    this.actionLoading.set(application.id);

    this.api.withdraw(application.id).subscribe({
      next: () => this.reloadAfterWithdraw(),
      error: (error) => {
        this.actionLoading.set(null);
        this.actionMessage.set(extractHttpErrorMessage(error, 'Could not withdraw.'));
      },
    });
  }

  confirm(application: GroupApplication): void {
    this.actionMessage.set(null);
    this.actionLoading.set(application.id);

    this.api.confirmAccess(application.id).subscribe({
      next: () => {
        this.actionLoading.set(null);
        this.actionMessage.set('Access confirmed.');
        this.loadApplications();
      },
      error: (error) => {
        this.actionLoading.set(null);
        this.actionMessage.set(extractHttpErrorMessage(error, 'Could not confirm access.'));
      },
    });
  }

  protected canWithdraw(application: GroupApplication): boolean {
    if (['CANCELLED', 'LEFT', 'REFUNDED', 'REJECTED'].includes(application.status)) {
      return false;
    }

    if (this.hasAccess(application)) {
      return true;
    }

    if (application.group?.paymentConfirmedAt) {
      return false;
    }

    return ['PENDING', 'APPROVED'].includes(application.status);
  }

  protected shouldShowWithdraw(application: GroupApplication): boolean {
    if (['CANCELLED', 'LEFT', 'REFUNDED', 'REJECTED'].includes(application.status)) {
      return false;
    }

    return this.hasAccess(application) || ['PENDING', 'APPROVED'].includes(application.status);
  }

  protected withdrawLabel(application: GroupApplication): string {
    if (this.actionLoading() === application.id) {
      return 'Withdrawing...';
    }

    if (application.group?.paymentConfirmedAt && !this.hasAccess(application)) {
      return 'Withdraw frozen';
    }

    return 'Withdraw';
  }

  protected canPay(application: GroupApplication): boolean {
    return application.status === 'APPROVED' && !application.guestPaidAt && !application.group?.paymentConfirmedAt;
  }

  protected paymentLabel(application: GroupApplication): string {
    return application.guestPaidAt ? `Paid: ${application.guestPaidAt}` : 'Paid: not yet';
  }

  protected canConfirm(application: GroupApplication): boolean {
    return application.status === 'ACCESS_GRANTED';
  }

  private hasAccess(application: GroupApplication): boolean {
    return ['ACCESS_GRANTED', 'CONFIRMED'].includes(application.status) || Boolean(application.adminPayoutAt);
  }

  private loadApplications(): void {
    this.loading.set(true);
    this.api.getMyApplications().subscribe({
      next: (applications) => {
        this.loading.set(false);
        this.applications.set(applications);
      },
      error: (error) => {
        this.loading.set(false);
        this.errorMessage.set(extractHttpErrorMessage(error, 'Could not load your applications.'));
      },
    });
  }

  private reloadAfterWithdraw(): void {
    forkJoin({
      applications: this.api.getMyApplications(),
      publicGroups: this.api.listGroups(),
    }).subscribe({
      next: ({ applications }) => {
        this.actionLoading.set(null);
        this.applications.set(applications);
        this.actionMessage.set('Withdrawal requested successfully.');
      },
      error: (error) => {
        this.actionLoading.set(null);
        this.actionMessage.set(extractHttpErrorMessage(error, 'Withdrawal succeeded, but refreshed data could not be loaded.'));
      },
    });
  }
}
