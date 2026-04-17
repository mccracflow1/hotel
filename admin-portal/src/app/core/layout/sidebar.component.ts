import { ChangeDetectionStrategy, Component, computed, inject } from '@angular/core';
import { RouterLink, RouterLinkActive } from '@angular/router';
import { MatListModule } from '@angular/material/list';
import { MatIconModule } from '@angular/material/icon';
import { AuthService } from '../auth/auth.service';
import { navItemsForRole } from './nav.config';

@Component({
  selector: 'app-sidebar',
  standalone: true,
  imports: [RouterLink, RouterLinkActive, MatListModule, MatIconModule],
  template: `
    <div class="brand">Hotel — Admin</div>
    <mat-nav-list>
      @for (item of items(); track item.path) {
        <a mat-list-item [routerLink]="item.path" routerLinkActive="active-link">
          <mat-icon matListItemIcon>{{ item.icon }}</mat-icon>
          <span matListItemTitle>{{ item.label }}</span>
        </a>
      }
    </mat-nav-list>
  `,
  styles: `
    .brand {
      padding: 1rem 1rem 0.5rem;
      font-weight: 600;
      font-size: 0.95rem;
    }
    .active-link {
      background: color-mix(in srgb, var(--mat-sys-primary) 12%, transparent);
    }
  `,
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class SidebarComponent {
  private readonly auth = inject(AuthService);
  readonly items = computed(() => navItemsForRole(this.auth.user()?.role));
}
