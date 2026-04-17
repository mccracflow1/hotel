import { ChangeDetectionStrategy, Component, inject } from '@angular/core';
import { MatToolbarModule } from '@angular/material/toolbar';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { AuthService } from '../auth/auth.service';

@Component({
  selector: 'app-topbar',
  standalone: true,
  imports: [MatToolbarModule, MatButtonModule, MatIconModule],
  template: `
    <mat-toolbar color="primary">
      <span class="spacer"></span>
      @if (auth.user(); as u) {
        <span class="meta">{{ u.email }} · {{ u.role }}</span>
      }
      <button
        mat-icon-button
        type="button"
        aria-label="Cerrar sesión"
        (click)="onLogout()"
      >
        <mat-icon>logout</mat-icon>
      </button>
    </mat-toolbar>
  `,
  styles: `
    .spacer {
      flex: 1;
    }
    .meta {
      margin-right: 0.5rem;
      font-size: 0.85rem;
      opacity: 0.95;
    }
  `,
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class TopbarComponent {
  readonly auth = inject(AuthService);

  onLogout(): void {
    this.auth.logout().subscribe();
  }
}
