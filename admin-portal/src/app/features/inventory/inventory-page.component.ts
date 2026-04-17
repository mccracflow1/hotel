import { ChangeDetectionStrategy, Component } from '@angular/core';
import { MatCardModule } from '@angular/material/card';
import { MatTabsModule } from '@angular/material/tabs';
import { InventoryListComponent } from './inventory-list.component';
import { InventoryMovementFormComponent } from './inventory-movement-form.component';
import { InventoryMovementsHistoryComponent } from './inventory-movements-history.component';
import { SuppliersListComponent } from '../suppliers/suppliers-list.component';

@Component({
  selector: 'app-inventory-page',
  standalone: true,
  imports: [
    MatCardModule,
    MatTabsModule,
    InventoryListComponent,
    InventoryMovementFormComponent,
    InventoryMovementsHistoryComponent,
    SuppliersListComponent,
  ],
  template: `
    <mat-card>
      <mat-card-header>
        <mat-card-title>Inventario</mat-card-title>
      </mat-card-header>
      <mat-card-content>
        <mat-tab-group>
          <mat-tab label="Ítems">
            <app-inventory-list />
          </mat-tab>
          <mat-tab label="Movimiento">
            <app-inventory-movement-form />
          </mat-tab>
          <mat-tab label="Historial">
            <app-inventory-movements-history />
          </mat-tab>
          <mat-tab label="Proveedores">
            <app-suppliers-list />
          </mat-tab>
        </mat-tab-group>
      </mat-card-content>
    </mat-card>
  `,
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class InventoryPageComponent {}
