import { NgModule } from '@angular/core';
import { RouterModule, Routes } from '@angular/router';
import { Placeholder } from './shared/placeholder/placeholder';
import { Dashboard } from './dashboard/dashboard/dashboard';

const routes: Routes = [
  { path: '', pathMatch: 'full', redirectTo: 'dashboard' },
  { path: 'dashboard', component: Dashboard, data: { title: 'Dashboard' } },
  { path: 'register', component: Placeholder, data: { title: 'Register' } },
  { path: 'products', component: Placeholder, data: { title: 'Products' } },
  { path: 'inventory', component: Placeholder, data: { title: 'Inventory' } },
  { path: 'reports', component: Placeholder, data: { title: 'Sales Reports' } },
  { path: 'roles', component: Placeholder, data: { title: 'Roles' } },
  { path: 'settings', component: Placeholder, data: { title: 'Settings' } },
];

@NgModule({
  imports: [RouterModule.forRoot(routes)],
  exports: [RouterModule],
})
export class AppRoutingModule {}
