import { Component, OnInit, Input, OnDestroy } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { ActivatedRoute, Router, NavigationEnd } from '@angular/router';
import { FormGroup, FormBuilder } from '@angular/forms';
import { SectionService } from '../../../../../../system/src/services/admin/section.service';
import { Ng4LoadingSpinnerService } from 'ng4-loading-spinner';
import { environment } from '../../../../../../src/environments/environment';
import {MagpieViewComponent} from '../../../../../../system/src/components/admin/view/view.component';
import 'rxjs/add/operator/map';
import 'rxjs/add/observable/of';
import { SubsectionService } from '../../../services/subsection.service'
const loading_img_url = environment.loading_image;
@Component({
  selector: 'app-view',
  templateUrl: './view.component.html',
  styleUrls: ['./view.component.css']
})
export class ModuleViewComponent extends MagpieViewComponent {
  @Input()
  section_data: any;
  columns: any;
  section_alias: any;
  title: any;
  sectionForm: FormGroup;
  actions: any;
  column_config: any;
  custom: any[];
  file_inputs: any[];
  tagsElement: any;
  public options: Select2Options;
  getAllMenus: any;
  navigationSubscription: any;
  pageLoad: boolean = false;
  current_section:string;
  parent_uri:string;
  template: string = '<img class="custom-spinner-template" src="' + loading_img_url + '">';
  constructor(public route: ActivatedRoute, public router: Router, public fb: FormBuilder, public http: HttpClient, public section_service: SectionService, public spinnerService: Ng4LoadingSpinnerService,public subsectionService: SubsectionService) {
    super(route,router,fb,http,section_service,spinnerService);
    this.current_section='module';
    this.parent_uri= this.router.url.split('view')[0];
  }

  ngOnInit() {
    this.spinnerService.show();
    this.pageLoad = true;
    this.init();
  }

  init = () => {
    var th_service = this.subsectionService;
    var th_router = this.router;
    var th =this;
    this.section_service.getCurrentRolePermissionMenus('roles', localStorage.getItem("userDetails['roles_id']")).subscribe(res1 => {
      var current_route = this.router.url.split('/')[2].split("-").join(" ");
      current_route = current_route.toLowerCase().replace(/\b[a-z]/g, function (letter) {
        return letter.toUpperCase();
      });
      // current_route=
      var current_module = JSON.parse(res1[0].permissions).sections.filter(itm => itm.name == current_route);
      var menus_actions = [];
      current_module[0].actions.forEach(function (menuItem) {
        menus_actions.push(menuItem.label);
        menus_actions[menuItem['label']] = menuItem.perm == 'true' ? true : false;
      });
      if (menus_actions['View']) {
        this.route.params.subscribe(params => {
          this.subsectionService.sectionConfig(this.current_section).subscribe(res => {
            this.section_service.getRolePermissionMenus('menus').subscribe(res1 => {
              var config_columns = JSON.parse(res[0].section_config).column;
              config_columns.forEach(function (rowItem) {
                if ((rowItem.type == 'tags' || rowItem.type == 'selectbox' || rowItem.type == 'checkbox' || rowItem.type == 'radio' || rowItem.type == 'autocomplete') && rowItem.source_type == 'dynamic') {
                  if (th_router.url.split('/')[2] == 'users' || th_router.url.split('/')[2] == 'roles' || th_router.url.split('/')[2] == 'menus' || th_router.url.split('/')[2] == 'sections')
                    th_service.customRoute(th.current_section, rowItem.source_from).subscribe(res => {
                      rowItem.source = res;
                    });
                  else
                    th_service.adminCustomRoute(th.current_section, rowItem.source_from).subscribe(res => {
                      rowItem.source = res;
                    });
                }
              });
              this.title = res[0].section_name;
              this.section_alias = res[0].section_alias;
              this.subsectionService.view(params['id'], this.current_section).subscribe(res => {
                this.section_data = res;
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