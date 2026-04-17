import { Routes } from '@angular/router';

const routes: Routes = [
  {
    path: '',
    loadComponent: () =>
      import('./reservations-page.component').then((m) => m.ReservationsPageComponent),
  },
  {
    path: 'new',
    loadComponent: () =>
      import('./reservation-manual-create.component').then((m) => m.ReservationManualCreateComponent),
  },
];

export default routes;
