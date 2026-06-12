import { Component, Input } from '@angular/core';

@Component({
  selector: 'app-status-badge',
  imports: [],
  templateUrl: './status-badge.html',
  styleUrl: './status-badge.css',
})
export class StatusBadge {
  @Input() value = '';
  @Input() kind: 'group' | 'application' | 'auth' | 'service' = 'group';

  protected get cssClass(): string {
    const normalized = this.value.toUpperCase();
    const tone =
      normalized === 'BLOCKED' ? 'danger' :
      normalized === 'REFUNDED' || normalized === 'REJECTED' || normalized === 'CANCELLED' ? 'danger' :
      normalized === 'ACTIVE' || normalized === 'APPROVED' || normalized === 'CONFIRMED' || normalized === 'ACCESS_GRANTED' ? 'success' :
      normalized === 'OPEN' || normalized === 'PENDING' ? 'warning' :
      normalized === 'FULL' || normalized === 'SETTLED' || normalized === 'LEFT' ? 'neutral' :
      normalized === 'ROLE_ADMIN' ? 'primary' :
      normalized === 'ROLE_USER' ? 'muted' :
      normalized === 'TRUE' ? 'success' :
      normalized === 'FALSE' ? 'danger' :
      this.kind === 'service' && normalized === 'INACTIVE' ? 'neutral' :
      this.kind === 'service' && normalized === 'ACTIVE' ? 'success' :
      'neutral';

    return `badge badge--${tone}`;
  }

  protected get label(): string {
    return this.value.replaceAll('_', ' ');
  }
}
