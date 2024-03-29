import { Component, OnInit, Input, OnDestroy, ChangeDetectorRef, AfterViewInit, AfterContentInit } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { ActivatedRoute, Router, NavigationEnd } from '@angular/router';
import { FormGroup, FormBuilder, Validators } from '@angular/forms';
import { SectionService } from './../../../../../system/src/services/admin/section.service';
import { WebsocketService } from './../../../../../system/src/services/admin/websocket.service';
import { ImageValidator } from './../../../../../system/src/validators/image.validators'
import { LatLngLiteral } from '@agm/core';
import { Ng4LoadingSpinnerService } from 'ng4-loading-spinner';
import 'rxjs/add/operator/map';
import 'rxjs/add/observable/of';
import { environment } from './../../../../../src/environments/environment';
declare var notifier: any;



var loading_img_url = environment.loading_image;
@Component({
  selector: 'app-edit',
  templateUrl: './edit.component.html',
  styleUrls: ['./edit.component.css']
})
export class MagpieEditComponent implements OnInit, OnDestroy {
  @Input()
  section_data: any;
  columns: any;
  section_alias: any;
  title: any;
  sectionForm: FormGroup;
  edit_action: any;
  actions: any;
  column_config: any;
  custom: any[];
  file_inputs: any[];
  tagsElement: any;
  public tagConfig: Select2Options;
  public autocompleteConfig: Select2Options;
  getAllMenus: any;
  navigationSubscription: any;
  date_format: String = "dd/mm/yyyy";
  lat: number = 51.678418;
  lng: number = 7.809007;
  geo_address = "";
  duplicates: any = {};
  duplicateItemExist: any = false;
  field_length: any;
  map: any;
  button: any;
  paths: Array<LatLngLiteral> = [];
  cordArray = [];
  geofence = [];
  pageLoad: boolean = false;
  template: string = '<img class="custom-spinner-template" src="' + loading_img_url + '">';
  constructor(public route: ActivatedRoute, public router: Router, public fb: FormBuilder, public http: HttpClient, public section_service: SectionService, public ref: ChangeDetectorRef, public spinnerService: Ng4LoadingSpinnerService, public webSocketService: WebsocketService) {
    this.webSocketService.updateItemMessageReceived().subscribe(data => {
      this.init();
    });
    this.navigationSubscription = this.router.events.subscribe((e: any) => {
      if (e instanceof NavigationEnd) {
        this.spinnerService.show();
        this.sectionForm = this.fb.group({});
        this.section_service.sectionConfig(this.router.url).subscribe(res => {
          var column_config = JSON.parse(res[0].section_config).column;
          this.field_length = column_config.length;
          var column_validation = {};
          column_config.forEach(function (value, key) {
            var validation_array = [];
            if (column_config[key]['type'] == 'email')
              validation_array.push(Validators.pattern('^[a-z0-9._%+-]+@[a-z0-9.-]+\.[a-z]{2,4}$'));
            if (typeof column_config[key]['validations'][0]['min_length'] !== "undefined")
              validation_array.push(Validators.minLength(column_config[key]['validations'][0]['min_length']));
            if (typeof column_config[key]['validations'][0]['file_type'] !== "undefined")
              validation_array.push(ImageValidator.imageExtensionValidator(column_config[key]['validations'][0]['file_type']));
            if (typeof column_config[key]['validations'][0]['file_size'] !== "undefined")
              validation_array.push(ImageValidator.imageSizeValidator(column_config[key]['validations'][0]['file_size']));
            if (column_config[key]['validations'][0]['required'] == 'true')
              validation_array.push(Validators.required);
            if (typeof column_config[key]['validations'][0]['pattern'] !== "undefined")
              validation_array.push(Validators.pattern(column_config[key]['validations'][0]['pattern']));
            column_validation[column_config[key]['field']] = ['', validation_array];
          });
          this.sectionForm = this.fb.group(column_validation);
        });
      }
    });
  }

  ngOnDestroy() {
    if (this.navigationSubscription) {
      this.navigationSubscription.unsubscribe();
    }
  }

  ngOnInit() {
    this.spinnerService.show();
    this.pageLoad = true;
    this.init();
  }

  duplicateExist = (item, field) => {
    if (item != '') {
      this.section_service.checkDuplicateExist(item, field, this.section_data.users_id).subscribe(res => {
        if (Object.keys(res).length > 0)
          this.duplicates[field] = true;
        else
          this.duplicates[field] = false;
        const noOfDuplicates = Object.keys(this.duplicates).filter(x => this.duplicates[x] == true);
        this.duplicateItemExist = noOfDuplicates.length == 0 ? false : true;
      });
    }
  }

  onMapKeyUpEvent = (event: any, field) => {
    if (event.target.value == '')
      this.section_data[field] = "";
  }

  onMapChangeEvent = (selectedData: any, field) => {
    if (selectedData.data != undefined) {
      this.lat = selectedData.data.geometry.location.lat;
      this.lng = selectedData.data.geometry.location.lng;
      this.geo_address = selectedData.data.formatted_address;
      this.section_data[field] = JSON.stringify({ "lat": this.lat, "lng": this.lng, "address": this.geo_address });
    } else {
      this.section_data[field] = "";
    }
  }

  onCheckboxChange = (field, value, checked) => {
    if (typeof this.section_data[field] !== 'undefined' && this.section_data[field] != '') {
      var obj = JSON.parse(this.section_data[field]);
      this.custom = Object.keys(obj).map(function (k) { return obj[k] })[0];
    }
    else
      this.custom = [];
    if (checked) {
      this.custom.push(value.toString());
      this.section_data[field] = JSON.stringify({ "selected_values": this.custom });
    } else {
      this.custom.splice(this.custom.indexOf(value.toString()), 1);
      if (this.custom.length > 0) {
        this.section_data[field] = JSON.stringify({ "selected_values": this.custom });
      }
      else
        this.section_data[field] = "";
    }
  }

  onTagsChange = (field, data: { value: string[] }) => {
    if (data.value != undefined && data.value.length > 0)
      this.section_data[field] = JSON.stringify({ "selected_values": data.value });
    else
      this.section_data[field] = "";
  }

  onAutocompleteChanges = (field, data) => {
    if (data != undefined)
      this.section_data[field] = data;
    else
      this.section_data[field] = "";
    this.ref.detectChanges();
  }

  deletePoly(field) {
    let pathArray = JSON.parse(this.section_data[field]);
    pathArray['geofence'] = [];
    this.paths = [];
    this.section_data[field] = JSON.stringify(pathArray);
    this.section_data['geofence'].coordinates = [];
  }

  public drawPolygon(evt, field) {
    let clickCrd = {
      lat: evt.coords.lat,
      lng: evt.coords.lng
    };
    this.paths.push(clickCrd);
    let coord = [evt.coords.lat, evt.coords.lng];
    this.cordArray.push(coord);
    let newArray = Array<LatLngLiteral>();
    this.paths.forEach((item) => {
      newArray.push(item);
    });
    this.paths = newArray;
    if (this.section_data[field] == undefined) {
      let json_array = {};
      json_array['geofence'] = this.paths;
      this.section_data[field] = JSON.stringify(json_array);
    } else {
      let json_array = JSON.parse(this.section_data[field]);
      json_array['geofence'] = this.paths;
      this.section_data[field] = JSON.stringify(json_array);
    }
  }

  update = () => {
    this.spinnerService.show();
    this.route.params.subscribe(params => {
      this.section_data['file_fields'] = this.file_inputs;
      this.section_service.update(this.section_data, this.router.url).subscribe(res => {
        this.router.navigated = false;
        this.router.navigate(['admin/' + this.section_alias]);
        this.spinnerService.hide();
        new notifier({ title: "Update! ", message: "Record has been updated.", icon: 'fa fa-check', type: "success" });
        this.webSocketService.updateItem({ module: this.section_alias, room: 1 });
      });
    });
  }

  deleteFile = (id, column) => {
    this.route.params.subscribe(params => {
      var th = this;
      this.section_service.deleteFile(id, column, this.section_data._id, this.router.url).subscribe(res => {
        th.section_service.edit(params['id'], th.router.url).subscribe(res => {
          var dt = res;
          th.section_data = dt;
        });
      });
      this.init();
      new notifier({ title: "Deleted! ", message: "File has been unlinked.", icon: 'fa fa-check', type: "success" });
    });
  }

  onFileChangeEvent = (fileInput: any, field) => {
    var files = [];
    for (var index = 0; index < fileInput.target.files.length; index++) {
      files.push(fileInput.target.files[index]);
    }
    this.section_data[field] = files;
    this.ref.detectChanges();
  }

  setEditColumnsData = (params_id, th_router, config_columns, res1, th_files, th_tags, res) => {
    this.section_service.edit(params_id, th_router).subscribe(res3 => {
      for (var k in th_tags) {
        var obj = JSON.parse(res3[th_tags[k]]);
        res3[th_tags[k] + '_tags'] = Object.keys(obj).map(function (k) { return obj[k] })[0];
      }
      this.section_data = res3;
      this.columns = config_columns;
      this.getAllMenus = res1;
      this.file_inputs = th_files;
      this.title = res[0].section_name;
      this.section_alias = res[0].section_alias;
      this.spinnerService.hide();
      this.pageLoad = false;
    });
  }

  init = () => {
    var th_service = this.section_service;
    var th_router = this.router;
    var th = this;
    this.section_service.getCurrentRolePermissionMenus('roles', localStorage.getItem("userDetails['roles_id']")).subscribe(res4 => {
      var current_route = this.router.url.split('/')[2].split("-").join(" ");
      current_route = current_route.toLowerCase().replace(/\b[a-z]/g, function (letter) {
        return letter.toUpperCase();
      });
      var current_module = JSON.parse(res4[0].permissions).sections.filter(itm => itm.name == current_route);
      var menus_actions = [];
      current_module[0].actions.forEach(function (menuItem) {
        menus_actions.push(menuItem.label);
        menus_actions[menuItem['label']] = menuItem.perm == 'true' ? true : false;
      });
      if (menus_actions['Edit']) {
        this.route.params.subscribe(params => {
          this.section_service.sectionConfig(this.router.url).subscribe(res => {
            this.section_service.getRolePermissionMenus('menus').subscribe(res1 => {
              var config_columns = JSON.parse(res[0].section_config).column;
              var th_tags = [];
              var th_files = [];
              config_columns.forEach(function (rowItem, key) {
                if ((rowItem.type == 'tags' || rowItem.type == 'selectbox' || rowItem.type == 'checkbox' || rowItem.type == 'radio' || rowItem.type == 'autocomplete') && rowItem.source_type == 'dynamic') {
                  if (th_router.url.split('/')[2] == 'users' || th_router.url.split('/')[2] == 'roles' || th_router.url.split('/')[2] == 'menus' || th_router.url.split('/')[2] == 'sections') {
                    th_service.customRoute(th_router.url, rowItem.source_from).subscribe(res2 => {
                      if (rowItem.type == 'tags') {
                        var data_tags = [];
                        for (var k in res2) {
                          data_tags.push({ 'id': res2[k].value, 'text': res2[k].label });
                        }
                        th_tags.push(rowItem.field);
                        rowItem.source = data_tags;
                        th.setEditColumnsData(params['id'], th_router.url, config_columns, res1, th_files, th_tags, res);
                      }
                      else
                        rowItem.source = res2;
                    });
                  } else {
                    th_service.adminCustomRoute(th_router.url, rowItem.source_from).subscribe(res2 => {
                      if (rowItem.type == 'tags') {
                        var data_tags = [];
                        for (var k in res2) {
                          data_tags.push({ 'id': res2[k].value, 'text': res2[k].label });
                        }
                        th_tags.push(rowItem.field);
                        rowItem.source = data_tags;
                        th.setEditColumnsData(params['id'], th_router.url, config_columns, res1, th_files, th_tags, res);
                      }
                      else
                        rowItem.source = res2;
                    });
                  }
                }
                if (rowItem.type == 'file' || rowItem.type == 'image')
                  th_files.push(rowItem.field);
              });
              th.setEditColumnsData(params['id'], th_router.url, config_columns, res1, th_files, th_tags, res);
            });
          });
        });
      } else
        this.router.navigate(['/admin/dashboard']);
    });
    this.tagConfig = { multiple: true };
    this.autocompleteConfig = { multiple: false };
  }
}

