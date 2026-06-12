import { CommonModule } from '@angular/common';
import { Component, OnInit, inject, signal } from '@angular/core';
import { ActivatedRoute, RouterLink } from '@angular/router';

import { AuthService } from '../../auth/auth.service';
import { extractHttpErrorMessage } from '../../core/http-error';
import { SubscriptionGroup } from '../../core/models';
import { SubscriptionApiService } from '../../core/subscription-api.service';
import { StatusBadge } from '../../shared/status-badge';

@Component({
  selector: 'app-group-details',
  imports: [CommonModule, RouterLink, StatusBadge],
  templateUrl: './group-details.html',
  styleUrl: './group-details.css',
})
export class GroupDetails implements OnInit {
  private readonly api = inject(SubscriptionApiService);
  private readonly route = inject(ActivatedRoute);
  protected readonly auth = inject(AuthService);

  readonly group = signal<SubscriptionGroup | null>(null);
  readonly loading = signal(true);
  readonly errorMessage = signal<string | null>(null);
  readonly actionMessage = signal<string | null>(null);
  readonly actionLoading = signal(false);

  private groupId = 0;

  ngOnInit(): void {
    this.groupId = Number(this.route.snapshot.paramMap.get('id'));
    if (Number.isNaN(this.groupId) || this.groupId <= 0) {
      this.loading.set(false);
      this.errorMessage.set('Invalid group identifier.');
      return;
    }

    this.loadGroup();
  }

  apply(): void {
    this.actionMessage.set(null);
    this.actionLoading.set(true);

    this.api.applyToGroup(this.groupId).subscribe({
      next: () => {
        this.actionLoading.set(false);
        this.actionMessage.set('Application submitted successfully.');
      },
      error: (error) => {
        this.actionLoading.set(false);
        this.actionMessage.set(extractHttpErrorMessage(error, 'Could not apply to the group.'));
      },
    });
  }

  protected availableSlots(group: SubscriptionGroup | null): number {
    if (!group) {
      return 0;
    }

    return Math.max(0, group.totalSlots - group.occupiedSlots);
  }

  protected canApply(group: SubscriptionGroup | null): boolean {
    return Boolean(group) && group!.status === 'OPEN' && this.availableSlots(group) > 0 && !this.isOwner(group);
  }

  protected isOwner(group: SubscriptionGroup | null): boolean {
    if (!group?.owner?.identifier || !this.auth.identifier()) {
      return false;
    }

    return group.owner.identifier === this.auth.identifier();
  }

  private loadGroup(): void {
    this.loading.set(true);
    this.api.getGroup(this.groupId).subscribe({
      next: (group) => {
        this.loading.set(false);
        this.group.set(group);
      },
      error: (error) => {
        this.loading.set(false);
        this.errorMessage.set(extractHttpErrorMessage(error, 'Could not load group details.'));
      },
    });
  }
}
