import { Routes } from '@angular/router';

const routes: Routes = [
  {
    path: '',
    loadComponent: () => import('./rooms-list.component').then((m) => m.RoomsListComponent),
  },
  {
    path: 'new',
    loadComponent: () => import('./room-form.component').then((m) => m.RoomFormComponent),
  },
  {
    path: ':id/edit',
    loadComponent: () => import('./room-form.component').then((m) => m.RoomFormComponent),
  },
];

export default routes;
