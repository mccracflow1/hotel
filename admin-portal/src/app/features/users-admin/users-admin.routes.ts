import { Routes } from '@angular/router';

const routes: Routes = [
  {
    path: '',
    loadComponent: () => import('./users-list.component').then((m) => m.UsersListComponent),
  },
];

export default routes;
