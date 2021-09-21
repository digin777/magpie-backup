import { Routes } from '@angular/router';
import { AuthGuard } from './../../system/src/services/admin/auth-guard.service';
import { DashboardComponent } from './../../src/app/admin/components/dashboard/dashboard.component';
import { UsersIndexComponent } from './../../src/app/admin/components/users/index/index.component';
import { RolesViewComponent } from './../../src/app/admin/components/roles/view/view.component';
import { HomeComponent } from './../../src/app/site/components/home/home.component';
import { ProjectIndexComponent } from './admin/components/project/index/index.component';
import { ModuleIndexComponent } from './admin/components/module/index/index.component';
import { ModuleCreateComponent } from './admin/components/module/create/create.component';
import { ModuleEditComponent } from './admin/components/module/edit/edit.component';
import { ModuleViewComponent } from './admin/components/module/view/view.component';
import { TaskIndexComponent } from './admin/components/task/index/index.component';
import { TaskCreateComponent } from './admin/components/task/create/create.component';
import { TaskEditComponent } from './admin/components/task/edit/edit.component';
import { TaskViewComponent } from './admin/components/task/view/view.component';
import { TimeSheetIndexComponent } from './admin/components/timesheet/index/index.component';
import { TimeSheetCreateComponent } from './admin/components/timesheet/create/create.component';
import {TimeSheetEditComponent} from './admin/components/timesheet/edit/edit.component';
import {TimeSheetViewComponent} from './admin/components/timesheet/view/view.component';


const routes: Routes = [
  {
    path: 'admin',
    children: [
      {
        path: 'dashboard',
        component: DashboardComponent,
        canActivate: [AuthGuard],
        runGuardsAndResolvers: 'always',
      },
      {
        path: 'users',
        component: UsersIndexComponent,
        canActivate: [AuthGuard],
        runGuardsAndResolvers: 'always',
      },
      {
        path: 'roles/view/:id',
        component: RolesViewComponent,
        canActivate: [AuthGuard],
        runGuardsAndResolvers: 'always',
      },
      {
        path: 'project',
        component: ProjectIndexComponent,
        canActivate: [AuthGuard],
        runGuardsAndResolvers: 'always',
      },
      {
        path: 'project/:id/module',
        component: ModuleIndexComponent,
        canActivate: [AuthGuard],
        runGuardsAndResolvers: 'always',
      },
      {
        path: 'project/:id/module/create',
        component: ModuleCreateComponent,
        canActivate: [AuthGuard],
        runGuardsAndResolvers: 'always',
      },
      {
        path: 'project/:id/module/edit/:id',
        component: ModuleEditComponent,
        canActivate: [AuthGuard],
        runGuardsAndResolvers: 'always',
      },
      {
        path: 'project/:id/module/view/:id',
        component: ModuleViewComponent,
        canActivate: [AuthGuard],
        runGuardsAndResolvers: 'always',
      },
      {
        path: 'project/:id/module/:id/task',
        component: TaskIndexComponent,
        canActivate: [AuthGuard],
        runGuardsAndResolvers: 'always',
      },
      {
        path: 'project/:id/module/:id/task/create',
        component: TaskCreateComponent,
        canActivate: [AuthGuard],
        runGuardsAndResolvers: 'always',
      },
      {
        path: 'project/:id/module/:id/task/edit/:id',
        component: TaskEditComponent,
        canActivate: [AuthGuard],
        runGuardsAndResolvers: 'always',
      },
      {
        path: 'project/:id/module/:id/task/view/:id',
        component: TaskViewComponent,
        canActivate: [AuthGuard],
        runGuardsAndResolvers: 'always',
      },
      {
        path: 'project/:id/timesheet',
        component: TimeSheetIndexComponent,
        canActivate: [AuthGuard],
        runGuardsAndResolvers: 'always',
      },
       {
        path: 'project/:id/timesheet/create',
        component: TimeSheetCreateComponent,
        canActivate: [AuthGuard],
        runGuardsAndResolvers: 'always',
      },
      {
        path: 'project/:id/timesheet/edit/:id',
        component: TimeSheetEditComponent,
        canActivate: [AuthGuard],
        runGuardsAndResolvers: 'always',
      },
       {
        path: 'project/:id/timesheet/view/:id',
        component: TimeSheetViewComponent,
        canActivate: [AuthGuard],
        runGuardsAndResolvers: 'always',
      },
    ]
  },
  {
    path: '',
    redirectTo: '/admin/login',
    pathMatch: "full"
  }
];
export const customRoutes: Routes = routes;
