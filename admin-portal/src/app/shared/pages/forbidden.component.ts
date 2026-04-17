import { ChangeDetectionStrategy, Component } from '@angular/core';
import { RouterLink } from '@angular/router';
import { MatCardModule } from '@angular/material/card';
import { MatButtonModule } from '@angular/material/button';

@Component({
  selector: 'app-forbidden',
  standalone: true,
  imports: [MatCardModule, MatButtonModule, RouterLink],
  template: `
    <div class="wrap">
      <mat-card>
        <mat-card-header>
          <mat-card-title>Acceso denegado</mat-card-title>
          <mat-card-subtitle>No tenés permiso para ver esta sección.</mat-card-subtitle>
        </mat-card-header>
        <mat-card-actions>
          <a mat-button routerLink="/admin/dashboard">Volver al tablero</a>
        </mat-card-actions>
      </mat-card>
    </div>
  `,
  styles: `
    .wrap {
      padding: 2rem;
      max-width: 480px;
      margin: 0 auto;
    }
  `,
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class ForbiddenComponent {}
