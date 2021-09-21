import { BrowserModule } from '@angular/platform-browser';
import { NgModule } from '@angular/core';
import { RouterModule,Routes,PreloadAllModules } from '@angular/router';

import { HttpClientModule } from '@angular/common/http';
import { ReactiveFormsModule } from '@angular/forms';
import { MagpieModule } from './../../system/src/magpie.module';
import { AppComponent } from './app.component';

import { DashboardComponent } from './../../src/app/admin/components/dashboard/dashboard.component';
import { UsersIndexComponent } from './../../src/app/admin/components/users/index/index.component';
import { RolesViewComponent } from './admin/components/roles/view/view.component';
import { HomeComponent } from './../../src/app/site/components/home/home.component';
import { DashboardService } from './../../src/app/admin/services/dashboard.service';
import { AuthGuard } from './../../system/src/services/admin/auth-guard.service';
import { ExportService } from './../../system/src/services/admin/export.service';
import { SectionService } from './../../system/src/services/admin/section.service';
import { Ng4LoadingSpinnerModule } from 'ng4-loading-spinner';
import { TagInputModule } from 'ngx-chips';
import { AgmCoreModule } from '@agm/core';
import { FormsModule } from '@angular/forms';
import { ProjectIndexComponent } from './admin/components/project/index/index.component';
import {IndexpmsService} from './admin/services/indexpms.service'
import { ModuleIndexComponent } from './admin/components/module/index/index.component';
import { SubsectionService } from './admin/services/subsection.service'
import { ModuleCreateComponent } from './admin/components/module/create/create.component';
import { Select2Module } from 'ng2-select2';
import {ModuleEditComponent} from './admin/components/module/edit/edit.component';
import {ModuleViewComponent} from './admin/components/module/view/view.component';
import {TaskIndexComponent} from './admin/components/task/index/index.component';
import { TaskCreateComponent } from './admin/components/task/create/create.component';
import {TaskEditComponent} from './admin/components/task/edit/edit.component';
import {TaskViewComponent} from './admin/components/task/view/view.component';
import {TimeSheetIndexComponent} from './admin/components/timesheet/index/index.component';
import { TimeSheetCreateComponent } from './admin/components/timesheet/create/create.component';
import {TimeSheetEditComponent} from './admin/components/timesheet/edit/edit.component';
import {TimeSheetViewComponent} from './admin/components/timesheet/view/view.component';

const appRoutes: Routes = [];

@NgModule({
  declarations: [
    AppComponent,
    DashboardComponent,
    UsersIndexComponent,
    RolesViewComponent,
    HomeComponent,
    ProjectIndexComponent,
    ModuleIndexComponent,
    ModuleCreateComponent,
    ModuleEditComponent,
    ModuleViewComponent,
    TaskIndexComponent,
    TaskCreateComponent,
    TaskEditComponent,
    TaskViewComponent,
    TimeSheetIndexComponent,
    TimeSheetCreateComponent,
    TimeSheetEditComponent,
    TimeSheetViewComponent
  ],
  imports: [
    BrowserModule,RouterModule.forRoot(appRoutes,{
      onSameUrlNavigation: 'reload',
      enableTracing: false ,
      preloadingStrategy: PreloadAllModules
      }), MagpieModule,HttpClientModule, ReactiveFormsModule,Ng4LoadingSpinnerModule.forRoot(),TagInputModule,
      AgmCoreModule.forRoot({
        apiKey: 'AIzaSyBcigPmyW-A993UDs9v6iejN4FB-h0Pi3k',
        libraries: ["places"]
      }),
      FormsModule
  ],
  providers: [DashboardService,AuthGuard,SectionService,ExportService,IndexpmsService,SubsectionService],
  exports: [RouterModule],
  bootstrap: [AppComponent]
})
export class AppModule  { }
