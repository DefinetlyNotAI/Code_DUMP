import { NgModule } from '@angular/core';
import { RouterModule, Routes } from '@angular/router';
import { PatientListComponent } from './components/patient-list/patient-list.component';

const routes: Routes = [
  { path: 'patients', component: PatientListComponent },
  { path: '', redirectTo: '/patients', pathMatch: 'full' }
];

@NgModule({
  imports: [RouterModule.forRoot(routes)],
  exports: [RouterModule]
})
export class AppRoutingModule { }
