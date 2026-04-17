import { inject, Injectable } from '@angular/core';
import { MatSnackBar } from '@angular/material/snack-bar';

@Injectable({ providedIn: 'root' })
export class ToastService {
  private readonly snack = inject(MatSnackBar);

  success(message: string): void {
    this.snack.open(message, 'Cerrar', { duration: 4000, panelClass: ['snack-success'] });
  }

  error(message: string): void {
    this.snack.open(message, 'Cerrar', { duration: 6000, panelClass: ['snack-error'] });
  }
}
