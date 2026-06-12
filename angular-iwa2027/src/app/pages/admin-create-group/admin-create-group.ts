import { CommonModule } from '@angular/common';
import { Component, OnInit, inject, signal } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { forkJoin, of, switchMap } from 'rxjs';

import { extractHttpErrorMessage } from '../../core/http-error';
import { CreateGroupRequest, SubscriptionGroup, SubscriptionService } from '../../core/models';
import { SubscriptionApiService } from '../../core/subscription-api.service';

@Component({
  selector: 'app-admin-create-group',
  imports: [CommonModule, FormsModule],
  templateUrl: './admin-create-group.html',
  styleUrl: './admin-create-group.css',
})
export class AdminCreateGroup implements OnInit {
  private readonly api = inject(SubscriptionApiService);

  readonly services = signal<SubscriptionService[]>([]);
  readonly loading = signal(true);
  readonly saving = signal(false);
  readonly errorMessage = signal<string | null>(null);
  readonly successMessage = signal<string | null>(null);

  readonly form = {
    serviceId: '',
    title: '',
    totalSlots: '5',
    monthlyPrice: '',
  };

  ngOnInit(): void {
    this.api.listServices().subscribe({
      next: (services) => {
        this.loading.set(false);
        this.services.set(services);
      },
      error: (error) => {
        this.loading.set(false);
        this.errorMessage.set(extractHttpErrorMessage(error, 'Could not load services.'));
      },
    });
  }

  create(): void {
    this.errorMessage.set(null);
    this.successMessage.set(null);

    const serviceId = Number(this.form.serviceId);
    const totalSlots = Number.parseInt(this.form.totalSlots, 10);
    const monthlyPrice = Number.parseFloat(this.form.monthlyPrice);

    if (!serviceId || !this.form.title.trim() || Number.isNaN(totalSlots) || Number.isNaN(monthlyPrice)) {
      this.errorMessage.set('Fill in service, title, slots, and price.');
      return;
    }

    const payload: CreateGroupRequest = {
      serviceId,
      title: this.form.title.trim(),
      totalSlots,
      monthlyPrice,
    };

    this.saving.set(true);
    this.api.createGroup(payload).pipe(
      switchMap((group) =>
        forkJoin({
          group: of(group),
          myGroups: this.api.getMyGroups(),
          publicGroups: this.api.listGroups(),
        })
      )
    ).subscribe({
      next: ({ group }: { group: SubscriptionGroup }) => {
        this.saving.set(false);
        this.successMessage.set(`Group "${group.title}" created successfully.`);
        this.form.title = '';
        this.form.monthlyPrice = '';
      },
      error: (error) => {
        this.saving.set(false);
        this.errorMessage.set(extractHttpErrorMessage(error, 'Could not create the group.'));
      },
    });
  }
}
