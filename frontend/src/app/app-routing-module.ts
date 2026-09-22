import { NgModule } from '@angular/core';
import { RouterModule, Routes } from '@angular/router';
import { authGuard } from './core/auth-guard';
import { productsPermissionGuard } from './core/products-permission-guard';
import { roleGuard } from './core/role-guard';
import { Dashboard } from './dashboard/dashboard/dashboard';
import { Login } from './auth/login/login';
import { Layout } from './layout/layout/layout';
import { Register } from './register/register/register';
import { Roles } from './roles/roles/roles';
import { Products } from './products/products/products';
import { Inventory } from './inventory/inventory/inventory';
import { Reports } from './reports/reports/reports';
import { Settings } from './settings/settings/settings';
import { Activities } from './activities/activities/activities';
import { ActivityLog } from './activity-log/activity-log/activity-log';
import { Home } from './customer_home/home/home/home';
import { Services } from './customer_home/services/service_page/services';

const routes: Routes = [
  { path: '', component: Home, data: { title: 'ChardWorkz' } },
  { path: 'services', component: Services, data: { title: 'Services' } },
  { path: 'admin/login', component: Login, data: { title: 'Login' } },
  {
    path: 'admin',
    component: Layout,
    canActivate: [authGuard],
    canActivateChild: [roleGuard],
    children: [
      { path: '', pathMatch: 'full', redirectTo: 'dashboard' },
      { path: 'dashboard', component: Dashboard, data: { title: 'Dashboard' } },
      { path: 'register', component: Register, data: { title: 'Register' } },
      {
        path: 'products',
        component: Products,
        canActivate: [productsPermissionGuard],
        data: { title: 'Products' },
      },
      {
        path: 'products/archived',
        component: Products,
        canActivate: [productsPermissionGuard],
        data: { title: 'Archived Products', archived: true },
      },
      { path: 'inventory', component: Inventory, data: { title: 'Inventory' } },
      { path: 'reports', component: Reports, data: { title: 'Sales Reports' } },
      { path: 'roles', component: Roles, data: { title: 'Roles' } },
      { path: 'settings', component: Settings, data: { title: 'Settings' } },
      { path: 'activities', component: Activities, data: { title: 'Activity History' } },
      { path: 'activity-log', component: ActivityLog, data: { title: 'Activity Log' } },
    ],
  },
];

@NgModule({
  imports: [RouterModule.forRoot(routes)],
  exports: [RouterModule],
})
export class AppRoutingModule {}
