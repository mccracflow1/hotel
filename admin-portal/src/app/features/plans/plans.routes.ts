import { Routes } from '@angular/router';
import { PlansListComponent } from './plans-list.component';
import { PlanFormComponent } from './plan-form.component';

const routes: Routes = [
  { path: '', component: PlansListComponent },
  { path: 'new', component: PlanFormComponent },
  { path: ':id/edit', component: PlanFormComponent },
];

export default routes;
