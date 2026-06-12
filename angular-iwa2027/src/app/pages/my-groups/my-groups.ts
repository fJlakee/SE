import { CommonModule } from '@angular/common';
import { Component, OnInit, inject, signal } from '@angular/core';
import { RouterLink } from '@angular/router';

import { extractHttpErrorMessage } from '../../core/http-error';
import { SubscriptionGroup } from '../../core/models';
import { SubscriptionApiService } from '../../core/subscription-api.service';
import { StatusBadge } from '../../shared/status-badge';

@Component({
  selector: 'app-my-groups',
  imports: [CommonModule, RouterLink, StatusBadge],
  templateUrl: './my-groups.html',
  styleUrl: './my-groups.css',
})
export class MyGroups implements OnInit {
  private readonly api = inject(SubscriptionApiService);

  readonly groups = signal<SubscriptionGroup[]>([]);
  readonly loading = signal(true);
  readonly errorMessage = signal<string | null>(null);

  ngOnInit(): void {
    this.api.getMyGroups().subscribe({
      next: (groups) => {
        this.loading.set(false);
        this.groups.set(groups);
      },
      error: (error) => {
        this.loading.set(false);
        this.errorMessage.set(extractHttpErrorMessage(error, 'Could not load your groups.'));
      },
    });
  }

  protected availableSlots(group: SubscriptionGroup): number {
    return Math.max(0, group.totalSlots - group.occupiedSlots);
  }
}
