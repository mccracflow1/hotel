import { ChangeDetectionStrategy, Component, input, output } from '@angular/core';
import { MatPaginatorModule, PageEvent } from '@angular/material/paginator';
import { MatTableModule } from '@angular/material/table';

@Component({
  selector: 'app-data-table',
  standalone: true,
  imports: [MatTableModule, MatPaginatorModule],
  template: `
    <table mat-table [dataSource]="rows()" class="mat-elevation-z1">
      @for (col of columns(); track col) {
        <ng-container [matColumnDef]="col">
          <th mat-header-cell *matHeaderCellDef>{{ labels()[col] ?? col }}</th>
          <td mat-cell *matCellDef="let row">{{ row[col] }}</td>
        </ng-container>
      }
      <tr mat-header-row *matHeaderRowDef="columns()"></tr>
      <tr mat-row *matRowDef="let row; columns: columns()"></tr>
    </table>
    <mat-paginator
      [length]="total()"
      [pageIndex]="pageIndex()"
      [pageSize]="pageSize()"
      [pageSizeOptions]="pageSizeOptions()"
      (page)="pageChange.emit($event)"
      showFirstLastButtons
    />
  `,
  styles: `
    table {
      width: 100%;
    }
  `,
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class DataTableComponent {
  readonly columns = input.required<string[]>();
  readonly labels = input<Record<string, string>>({});
  readonly rows = input<Record<string, unknown>[]>([]);
  readonly total = input(0);
  readonly pageIndex = input(0);
  readonly pageSize = input(10);
  readonly pageSizeOptions = input<number[]>([5, 10, 25, 50]);
  readonly pageChange = output<PageEvent>();
}
