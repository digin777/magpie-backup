import { Component } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { ActivatedRoute, Router } from '@angular/router';
import { FormBuilder } from '@angular/forms';
import { MagpieDashboardComponent } from './../../../../../system/src/components/admin/dashboard/dashboard.component';
import { SectionService } from './../../../../../system/src/services/admin/section.service';
import { DashboardService } from './../../../../../src/app/admin/services/dashboard.service';
import { Ng4LoadingSpinnerService } from 'ng4-loading-spinner';


@Component({
  selector: 'admin-dashboard',
  templateUrl: './dashboard.component.html',
  styleUrls: ['./dashboard.component.css']
})
export class DashboardComponent extends MagpieDashboardComponent {
  users_count: any;
  dashboard_config: any;
  constructor(route: ActivatedRoute, router: Router, fb: FormBuilder, http: HttpClient, section_service: SectionService, private dashboard_service: DashboardService, public spinnerService: Ng4LoadingSpinnerService) {
    super(route, router, fb, http, section_service);
    this.spinnerService.show();
    this.dashboard_service.getDashboardConfig(localStorage.getItem("userDetails['roles_id']")).subscribe(res => {
      Object.keys(res).forEach((v) => {
        res[v]['entity_config'] = JSON.parse(res[v]['entity_config']);
        if (res[v]['entity_config']['source_type'] == 'dynamic') {
          this.dashboard_service.dashboardCustomRoute(res[v]['entity_config']['routes'], res[v]['entity_config']['value'], res[v]['entity_type'] == 'list' ? (res[v]['entity_config']['per_page'] ? res[v]['entity_config']['per_page'] : '10') : '').subscribe(res1 => {
            res[v]['entity_config']['value'] = res1;
          });
        }
        res[v]['menus_actions'] = {};
        if (res[v]['entity_type'] == 'list') {
          this.section_service.getCurrentRolePermissionMenus('roles', localStorage.getItem("userDetails['roles_id']")).subscribe(res1 => {
            var current_route = res[v]['entity_config']['routes'];
            current_route = current_route.toLowerCase().replace(/\b[a-z]/g, function (letter) {
              return letter.toUpperCase();
            });
            var current_module = JSON.parse(res1[0].permissions).sections.filter(itm => itm.name == current_route);
            var menus_actions = [];
            var i = 1;
            current_module[0].actions.forEach(function (menuItem) {
              menus_actions[menuItem['label']] = menuItem.perm == 'true' ? true : false;
            });
            res[v]['menus_actions'] = menus_actions;
          });
        }
        if ((parseInt(v) + 1) == Object.keys(res).length) {
          var th = this;
          setTimeout(function () {
            th.dashboard_config = res;
            th.spinnerService.hide();
          }, 1000)
        }
      })
    });
  }
}