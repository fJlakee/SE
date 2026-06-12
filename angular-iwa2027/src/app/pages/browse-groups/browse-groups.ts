import { CommonModule } from '@angular/common';
import { Component, OnInit, inject, signal } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { RouterLink } from '@angular/router';

import { AuthService } from '../../auth/auth.service';
import { extractHttpErrorMessage } from '../../core/http-error';
import { SearchGroupsParams, SubscriptionGroup, SubscriptionService } from '../../core/models';
import { SubscriptionApiService } from '../../core/subscription-api.service';
import { StatusBadge } from '../../shared/status-badge';

@Component({
  selector: 'app-browse-groups',
  imports: [CommonModule, FormsModule, RouterLink, StatusBadge],
  templateUrl: './browse-groups.html',
  styleUrl: './browse-groups.css',
})
export class BrowseGroups implements OnInit {
  private readonly api = inject(SubscriptionApiService);
  protected readonly auth = inject(AuthService);

  readonly services = signal<SubscriptionService[]>([]);
  readonly groups = signal<SubscriptionGroup[]>([]);
  readonly searchResults = signal<SubscriptionGroup[]>([]);
  readonly loadingServices = signal(false);
  readonly loadingGroups = signal(false);
  readonly loadingSearch = signal(false);
  readonly errorMessage = signal<string | null>(null);
  readonly searchMessage = signal<string | null>(null);
  readonly searchActive = signal(false);

  readonly filters = {
    serviceName: '',
    minAvailableSlots: '',
    maxPrice: '',
  };

  ngOnInit(): void {
    this.loadServices();
    this.loadGroups();
  }

  search(): void {
    this.errorMessage.set(null);
    this.searchMessage.set(null);

    const minAvailableSlots = this.parseOptionalInteger(this.filters.minAvailableSlots);
    const maxPrice = this.parseOptionalNumber(this.filters.maxPrice);

    if (!this.filters.serviceName.trim() && minAvailableSlots === undefined && maxPrice === undefined) {
      this.searchActive.set(false);
      this.searchResults.set([]);
      this.searchMessage.set('Showing the latest open groups.');
      return;
    }

    this.loadingSearch.set(true);
    this.api.searchGroups({
      serviceName: this.filters.serviceName.trim() || undefined,
      minAvailableSlots,
      maxPrice,
    }).subscribe({
      next: (groups) => {
        this.loadingSearch.set(false);
        this.searchActive.set(true);
        this.searchResults.set(groups);
        this.searchMessage.set(groups.length > 0 ? `Found ${groups.length} matching groups.` : 'No groups matched the current filters.');
      },
      error: (error) => {
        this.loadingSearch.set(false);
        this.errorMessage.set(extractHttpErrorMessage(error, 'Search failed.'));
      },
    });
  }

  resetSearch(): void {
    this.filters.serviceName = '';
    this.filters.minAvailableSlots = '';
    this.filters.maxPrice = '';
    this.searchActive.set(false);
    this.searchResults.set([]);
    this.searchMessage.set('Showing the latest open groups.');
  }

  private loadServices(): void {
    this.loadingServices.set(true);
    this.api.listServices().subscribe({
      next: (services) => {
        this.loadingServices.set(false);
        this.services.set(services);
      },
      error: (error) => {
        this.loadingServices.set(false);
        this.errorMessage.set(extractHttpErrorMessage(error, 'Could not load services.'));
      },
    });
  }

  private loadGroups(): void {
    this.loadingGroups.set(true);
    this.api.listGroups().subscribe({
      next: (groups) => {
        this.loadingGroups.set(false);
        this.groups.set(groups);
        if (!this.searchActive()) {
          this.searchMessage.set('Showing the latest open groups.');
        }
      },
      error: (error) => {
        this.loadingGroups.set(false);
        this.errorMessage.set(extractHttpErrorMessage(error, 'Could not load groups.'));
      },
    });
  }

  protected availableSlots(group: SubscriptionGroup): number {
    return Math.max(0, group.totalSlots - group.occupiedSlots);
  }

  protected visibleGroups(): SubscriptionGroup[] {
    return this.searchActive() ? this.searchResults() : this.groups();
  }

  private parseOptionalInteger(value: string): number | undefined {
    if (!value.trim()) {
      return undefined;
    }

    const parsed = Number.parseInt(value, 10);
    return Number.isNaN(parsed) ? undefined : parsed;
  }

  private parseOptionalNumber(value: string): number | undefined {
    if (!value.trim()) {
      return undefined;
    }

    const parsed = Number.parseFloat(value);
    return Number.isNaN(parsed) ? undefined : parsed;
  }
}

