import { Component, inject, signal } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { ActivatedRoute, Router, RouterLink } from '@angular/router';

import { extractHttpErrorMessage } from '../../core/http-error';
import { AuthService } from '../auth.service';

@Component({
  selector: 'app-login',
  imports: [FormsModule, RouterLink],
  templateUrl: './login.html',
  styleUrl: './login.css',
})
export class Login {
  private readonly auth = inject(AuthService);
  private readonly router = inject(Router);
  private readonly route = inject(ActivatedRoute);

  identifier = '';
  password = '';
  readonly errorMessage = signal<string | null>(null);
  readonly loading = signal(false);

  login(): void {
    this.errorMessage.set(null);

    if (!this.identifier.trim() || !this.password) {
      this.errorMessage.set('Passport number or phone number and password are required.');
      return;
    }

    this.loading.set(true);
    this.auth.login(this.identifier.trim(), this.password).subscribe({
      next: () => {
        this.loading.set(false);
        const redirectTo = this.route.snapshot.queryParamMap.get('redirectTo') || '/profile';
        this.router.navigateByUrl(redirectTo);
      },
      error: (error) => {
        this.loading.set(false);
        this.errorMessage.set(extractHttpErrorMessage(error, 'Login failed. Check identifier and password.'));
      },
    });
  }
}

