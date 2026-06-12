import { CommonModule } from '@angular/common';
import { Component, OnInit, inject, signal } from '@angular/core';
import { FormsModule } from '@angular/forms';

import { extractHttpErrorMessage } from '../../core/http-error';
import { CreateServiceRequest, SubscriptionService } from '../../core/models';
import { SubscriptionApiService } from '../../core/subscription-api.service';
import { StatusBadge } from '../../shared/status-badge';

@Component({
  selector: 'app-admin-services',
  imports: [CommonModule, FormsModule, StatusBadge],
  templateUrl: './admin-services.html',
  styleUrl: './admin-services.css',
})
export class AdminServices implements OnInit {
  private readonly api = inject(SubscriptionApiService);

  readonly services = signal<SubscriptionService[]>([]);
  readonly loading = signal(true);
  readonly saving = signal(false);
  readonly errorMessage = signal<string | null>(null);
  readonly successMessage = signal<string | null>(null);

  readonly form = {
    name: '',
    category: '',
  };

  ngOnInit(): void {
    this.loadServices();
  }

  create(): void {
    this.errorMessage.set(null);
    this.successMessage.set(null);

    if (!this.form.name.trim() || !this.form.category.trim()) {
      this.errorMessage.set('Service name and category are required.');
      return;
    }

    const payload: CreateServiceRequest = {
      name: this.form.name.trim(),
      category: this.form.category.trim(),
    };

    this.saving.set(true);
    this.api.createService(payload).subscribe({
      next: (service) => {
        this.saving.set(false);
        this.successMessage.set(`Service "${service.name}" created successfully.`);
        this.form.name = '';
        this.form.category = '';
        this.loadServices();
      },
      error: (error) => {
        this.saving.set(false);
        this.errorMessage.set(extractHttpErrorMessage(error, 'Could not create the service.'));
      },
    });
  }

  private loadServices(): void {
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
}

