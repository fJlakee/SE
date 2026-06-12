import { Component, inject, signal } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { RouterLink } from '@angular/router';

import { extractHttpErrorMessage } from '../../core/http-error';
import { AuthService } from '../auth.service';

@Component({
  selector: 'app-register',
  imports: [FormsModule, RouterLink],
  templateUrl: './register.html',
  styleUrl: './register.css',
})
export class Register {
  private readonly auth = inject(AuthService);

  fullName = '';
  passportNumber = '';
  phoneNumber = '';
  password = '';
  readonly errorMessage = signal<string | null>(null);
  readonly successMessage = signal<string | null>(null);
  readonly loading = signal(false);

  register(): void {
    this.errorMessage.set(null);
    this.successMessage.set(null);

    if (!this.fullName.trim() || !this.passportNumber.trim() || !this.phoneNumber.trim() || this.password.length < 6) {
      this.errorMessage.set('Full name, passport number, phone number, and a 6+ character password are required.');
      return;
    }

    this.loading.set(true);
    this.auth.register({
      fullName: this.fullName.trim(),
      passportNumber: this.passportNumber.trim(),
      phoneNumber: this.phoneNumber.trim(),
      password: this.password,
    }).subscribe({
      next: (response) => {
        this.loading.set(false);
        this.successMessage.set(response.message || 'User registered successfully.');
        this.password = '';
      },
      error: (error) => {
        this.loading.set(false);
        this.errorMessage.set(extractHttpErrorMessage(error, 'Registration failed. Check the submitted data.'));
      },
    });
  }
}

