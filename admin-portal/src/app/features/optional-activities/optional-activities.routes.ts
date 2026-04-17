import { Routes } from '@angular/router';
import { OptionalActivitiesListComponent } from './optional-activities-list.component';
import { OptionalActivityFormComponent } from './optional-activity-form.component';

const routes: Routes = [
  { path: '', component: OptionalActivitiesListComponent },
  { path: 'new', component: OptionalActivityFormComponent },
  { path: ':id/edit', component: OptionalActivityFormComponent },
];

export default routes;
