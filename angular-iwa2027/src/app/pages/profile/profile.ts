import { CommonModule } from '@angular/common';
import { Component, inject } from '@angular/core';

import { AuthService } from '../../auth/auth.service';
import { StatusBadge } from '../../shared/status-badge';

@Component({
  selector: 'app-profile',
  imports: [CommonModule, StatusBadge],
  templateUrl: './profile.html',
  styleUrl: './profile.css',
})
export class Profile {
  protected readonly auth = inject(AuthService);

  protected tokenPreview(): string {
    const token = this.auth.session().token;
    if (!token) {
      return 'No token stored';
    }

    if (token.length <= 24) {
      return token;
    }

    return `${token.slice(0, 16)}...${token.slice(-8)}`;
  }
}

