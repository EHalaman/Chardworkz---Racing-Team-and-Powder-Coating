import { provideHttpClient, withInterceptors } from '@angular/common/http';
import { NgModule, provideBrowserGlobalErrorListeners } from '@angular/core';
import { BrowserModule } from '@angular/platform-browser';
import { provideCharts, withDefaultRegisterables } from 'ng2-charts';
import { authInterceptor } from './core/auth-interceptor';
import { AppRoutingModule } from './app-routing-module';
import { App } from './app';
import { LayoutModule } from './layout/layout-module';
import { SharedModule } from './shared/shared-module';
import { DashboardModule } from './dashboard/dashboard-module';
import { AuthModule } from './auth/auth-module';
import { RegisterModule } from './register/register-module';
import { RolesModule } from './roles/roles-module';
import { ProductsModule } from './products/products-module';
import { InventoryModule } from './inventory/inventory-module';

@NgModule({
  declarations: [App],
  imports: [
    BrowserModule,
    AppRoutingModule,
    LayoutModule,
    SharedModule,
    DashboardModule,
    AuthModule,
    RegisterModule,
    RolesModule,
    ProductsModule,
    InventoryModule,
  ],
  providers: [
    provideBrowserGlobalErrorListeners(),
    provideCharts(withDefaultRegisterables()),
    provideHttpClient(withInterceptors([authInterceptor])),
  ],
  bootstrap: [App],
})
export class AppModule {}
