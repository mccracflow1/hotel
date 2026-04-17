import { inject, Injectable, Type } from '@angular/core';
import { MatDialog, MatDialogConfig, MatDialogRef } from '@angular/material/dialog';

@Injectable({ providedIn: 'root' })
export class DialogService {
  private readonly dialog = inject(MatDialog);

  open<C, D = unknown, R = unknown>(
    component: Type<C>,
    config?: MatDialogConfig<D>,
  ): MatDialogRef<C, R> {
    return this.dialog.open(component, config) as MatDialogRef<C, R>;
  }
}
