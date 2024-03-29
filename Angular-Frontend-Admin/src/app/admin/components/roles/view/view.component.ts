import { Component } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { ActivatedRoute, Router } from '@angular/router';
import { FormBuilder } from '@angular/forms';
import { SectionService } from '../../../../../../system/src/services/admin/section.service';
import { MagpieViewComponent } from '../../../../../../system/src/components/admin/view/view.component';
import { Ng4LoadingSpinnerService } from 'ng4-loading-spinner';
import 'rxjs/add/operator/map';
import 'rxjs/add/observable/of';


@Component({
  selector: 'app-view',
  templateUrl: './view.component.html',
  styleUrls: ['./view.component.css']
})
export class RolesViewComponent extends MagpieViewComponent {
  permissionsArray: any = [];
  constructor(route: ActivatedRoute, router: Router, fb: FormBuilder, http: HttpClient, section_service: SectionService, public spinnerService: Ng4LoadingSpinnerService) {
    super(route, router, fb, http, section_service, spinnerService);
  }

  init = () => {
    var th_service = this.section_service;
    var th_router = this.router;
    this.section_service.getCurrentRolePermissionMenus('roles', localStorage.getItem("userDetails['roles_id']")).subscribe(res1 => {
      var current_route = this.router.url.split('/')[2].split("-").join(" ");
      current_route = current_route.toLowerCase().replace(/\b[a-z]/g, function (letter) {
        return letter.toUpperCase();
      });
      var current_module = JSON.parse(res1[0].permissions).sections.filter(itm => itm.name == current_route);
      var menus_actions = [];
      current_module[0].actions.forEach(function (menuItem) {
        menus_actions.push(menuItem.label);
        menus_actions[menuItem['label']] = menuItem.perm == 'true' ? true : false;
      });
      if (menus_actions['View']) {
        this.route.params.subscribe(params => {
          this.section_service.sectionConfig(this.router.url).subscribe(res => {
            this.section_service.getRolePermissionMenus('menus').subscribe(res1 => {
              var config_columns = JSON.parse(res[0].section_config).column;
              config_columns.forEach(function (rowItem) {
                if ((rowItem.type == 'tags' || rowItem.type == 'selectbox' || rowItem.type == 'checkbox' || rowItem.type == 'radio') && rowItem.source_type == 'dynamic') {
                  if (th_router.url.split('/')[2] == 'users' || th_router.url.split('/')[2] == 'roles' || th_router.url.split('/')[2] == 'menus' || th_router.url.split('/')[2] == 'sections')
                    th_service.customRoute(th_router.url, rowItem.source_from).subscribe(res => {
                      rowItem.source = res;
                    });
                  else
                    th_service.adminCustomRoute(th_router.url, rowItem.source_from).subscribe(res => {
                      rowItem.source = res;
                    });
                }
              });
              this.title = res[0].section_name;
              this.section_alias = res[0].section_alias;
              this.section_service.view(params['id'], this.router.url).subscribe(res => {
                this.section_data = res;
                var permissions = JSON.parse(this.section_data.permissions).sections;
                Object.keys(permissions).forEach(k => {
                  var sectionPermission = [];
                  Object.keys(permissions[k].actions).forEach(j => {
                    if (permissions[k].actions[j].perm == "true") {
                      sectionPermission.push(permissions[k].actions[j].label);
                    }
                  })
                  if (sectionPermission.length != 0) {
                    var newPermission = { section: permissions[k].name, permissions: sectionPermission, permissionCount: sectionPermission.length };
                    this.permissionsArray.push(newPermission);
                  }
                })
                this.columns = config_columns;
                this.getAllMenus = res1;
                this.spinnerService.hide();
                this.pageLoad = false;
              });
            });
          });
        });
      } else
        this.router.navigate(['/admin/dashboard']);
    });
  }
}
