import { ChangeDetectionStrategy, Component, signal } from '@angular/core';
import { MatSidenavModule } from '@angular/material/sidenav';
import { ReservationsListComponent } from './reservations-list.component';
import { ReservationDetailDrawerComponent } from './reservation-detail-drawer.component';

@Component({
  selector: 'app-reservations-page',
  standalone: true,
  imports: [MatSidenavModule, ReservationsListComponent, ReservationDetailDrawerComponent],
  template: `
    <mat-drawer-container class="reservations-shell" autosize>
      <mat-drawer-content>
        <app-reservations-list (detailOpened)="selectedId.set($event)" />
      </mat-drawer-content>
      <mat-drawer mode="over" position="end" [opened]="!!selectedId()" (closed)="selectedId.set(null)">
        @if (selectedId(); as id) {
          <app-reservation-detail-drawer [reservationId]="id" (close)="selectedId.set(null)" />
        }
      </mat-drawer>
    </mat-drawer-container>
  `,
  styles: `
    .reservations-shell {
      min-height: calc(100vh - 120px);
    }
  `,
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class ReservationsPageComponent {
  readonly selectedId = signal<string | null>(null);
}
