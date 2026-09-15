import { NgModule } from '@angular/core';
import { RouterModule, Routes } from '@angular/router';
import { authGuard } from './core/auth-guard';
import { roleGuard } from './core/role-guard';
import { Placeholder } from './shared/placeholder/placeholder';
import { Dashboard } from './dashboard/dashboard/dashboard';
import { Login } from './auth/login/login';
import { Layout } from './layout/layout/layout';
import { Register } from './register/register/register';
import { Roles } from './roles/roles/roles';
import { Products } from './products/products/products';
import { Inventory } from './inventory/inventory/inventory';
import { Reports } from './reports/reports/reports';

const routes: Routes = [
  { path: 'login', component: Login, data: { title: 'Login' } },
  {
    path: '',
    component: Layout,
    canActivate: [authGuard],
    canActivateChild: [roleGuard],
    children: [
      { path: '', pathMatch: 'full', redirectTo: 'dashboard' },
      { path: 'dashboard', component: Dashboard, data: { title: 'Dashboard' } },
      { path: 'register', component: Register, data: { title: 'Register' } },
      { path: 'products', component: Products, data: { title: 'Products' } },
      { path: 'inventory', component: Inventory, data: { title: 'Inventory' } },
      { path: 'reports', component: Reports, data: { title: 'Sales Reports' } },
      { path: 'roles', component: Roles, data: { title: 'Roles' } },
      { path: 'settings', component: Placeholder, data: { title: 'Settings' } },
    ],
  },
];

@NgModule({
  imports: [RouterModule.forRoot(routes)],
  exports: [RouterModule],
})
export class AppRoutingModule {}
