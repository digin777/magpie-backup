import { Component, Input, ChangeDetectorRef } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { ActivatedRoute, Router, NavigationEnd } from '@angular/router';
import { FormGroup, FormBuilder, Validators, AbstractControl } from '@angular/forms';
import { SectionService } from './../../../../../system/src/services/admin/section.service';
import { ImageValidator } from './../../../../../system/src/validators/image.validators'
import { Ng4LoadingSpinnerService } from 'ng4-loading-spinner';
import { environment } from './../../../../../src/environments/environment';
declare var notifier: any;
import 'rxjs/add/operator/map';
import 'rxjs/add/observable/of';

const loading_img_url = environment.loading_image;
@Component({
  selector: 'app-login',
  templateUrl: './profile-edit.component.html',
  styleUrls: ['./profile-edit.component.css']
})
export class MagpieProfileEditComponent {
  @Input()
  section_data: any;
  change_password_data: any = { current_password: '', new_password: '', confirm_password: '' };
  columns: any;
  file_inputs: any[];
  duplicates: any = {};
  duplicateItemExist: any = false;
  profileEditForm: FormGroup;
  changePasswordForm: FormGroup;
  navigationSubscription: any;
  field_length: any;
  showPassword: any = { current: false, new: false, confirm: false };
  template: string = '<img class="custom-spinner-template" src="' + loading_img_url + '">';
  pageLoad: boolean = false;
  isImgLoaded: any = false;
  constructor(public route: ActivatedRoute, public router: Router, public fb: FormBuilder, public http: HttpClient, public section_service: SectionService, public ref: ChangeDetectorRef, public spinnerService: Ng4LoadingSpinnerService, ) {
    this.pageLoad = true;
    this.spinnerService.show();
    this.profileEditForm = this.fb.group({});
    this.section_service.sectionConfig('/admin/users').subscribe(res => {
      var column_config = JSON.parse(res[0].section_config).column;
      var column_validation = {};
      this.field_length = column_config.length;
      column_config.forEach(function (value, key) {
        var validation_array = [];
        if (column_config[key]['field'] != 'roles_id' && column_config[key]['field'] != 'status') {
          if (column_config[key]['type'] == 'email')
            validation_array.push(Validators.pattern('^[a-z0-9._%+-]+@[a-z0-9.-]+\.[a-z]{2,4}$'));
          if (column_config[key]['validations'][0]['required'] == 'true')
            validation_array.push(Validators.required);
          if (typeof column_config[key]['validations'][0]['file_type'] !== "undefined")
            validation_array.push(ImageValidator.imageExtensionValidator(["image/jpeg", "image/jpg", "image/png"]));
          if (typeof column_config[key]['validations'][0]['file_size'] !== "undefined")
            validation_array.push(ImageValidator.imageSizeValidator(column_config[key]['validations'][0]['file_size']));
          if (typeof column_config[key]['validations'][0]['pattern'] !== "undefined")
            validation_array.push(Validators.pattern(column_config[key]['validations'][0]['pattern']));
          column_validation[column_config[key]['field']] = ['', validation_array];
        }
      });
      this.profileEditForm = this.fb.group(column_validation);
      this.ref.detectChanges();
    });
    this.changePasswordForm = this.fb.group({
      current_password: ['', Validators.required],
      new_password: ['', Validators.required],
      confirm_password: ['', Validators.required]
    }, {
      validator: this.MatchPassword
    });
    this.navigationSubscription = this.router.events.subscribe((e: any) => {
      if (e instanceof NavigationEnd) {
        if (this.router.url == '/admin/account')
          this.init();
      }
    });
  }

  ngOnDestroy() {
    if (this.navigationSubscription) {
      this.navigationSubscription.unsubscribe();
    }
  }

  MatchPassword(AC: AbstractControl) {
    let password = AC.get('new_password').value;
    let confirmPassword = AC.get('confirm_password').value;
    if (password != confirmPassword) {
      AC.get('confirm_password').setErrors({ MatchPassword: true })
    } else {
      return null
    }
  }

  onFileChangeEvent = (fileInput: any, field) => {
    var files = [];
    for (var index = 0; index < fileInput.target.files.length; index++) {
      files.push(fileInput.target.files[index]);
    }
    this.section_data[field] = files;
    this.ref.detectChanges();
  }

  duplicateExist = (item, field) => {
    if (item != '') {
      this.section_service.checkDuplicateExist(item, field, this.section_data.users_id).subscribe(res => {
        if (Object.keys(res).length > 0)
          this.duplicates[field] = true;
        else
          this.duplicates[field] = false;
        this.ref.detectChanges();
        const noOfDuplicates = Object.keys(this.duplicates).filter(x => this.duplicates[x] == true);
        this.duplicateItemExist = noOfDuplicates.length == 0 ? false : true;
      });
    }
  }

  accountUpdate = () => {
    this.spinnerService.show();
    this.section_data['file_fields'] = this.file_inputs;
    this.section_service.update(this.section_data, '/admin/users/').subscribe(res => {
      localStorage.setItem("userDetails['email']", this.section_data.email);
      localStorage.setItem("userDetails['name']", this.section_data.name);
      localStorage.setItem("userDetails['image']", res['data'].image);
      sessionStorage.setItem("session_storage_user['name']", this.section_data.name);
      sessionStorage.setItem("session_storage_user['email']", this.section_data.email);
      sessionStorage.setItem("session_storage_user['image']", res['data'].image);
      this.router.navigated = false;
      this.init();
      new notifier({ title: "Update! ", message: "Account has been updated.", icon: 'fa fa-check', type: "success" });
    });
  }

  changePassword = () => {
    this.spinnerService.show();
    this.section_service.changePassword(this.change_password_data, '/admin/users/').subscribe(res => {
      if (res['success'] == true) {
        this.changePasswordForm.reset();
        this.spinnerService.hide();
        new notifier({ title: "", message: res['msg'], icon: 'fa fa-check', type: "success" });
      } else {
        this.spinnerService.hide();
        new notifier({ title: "", message: res['msg'], icon: 'fa fa-times', type: "danger" });
      }
    })
  }

  init = () => {
    const th = this;
    this.section_service.sectionConfig('/admin/users').subscribe(res => {
      var config_columns = JSON.parse(res[0].section_config).column;
      var th_files = [];
      config_columns.forEach(function (rowItem) {
        if ((rowItem.type == 'selectbox') && rowItem.source_type == 'dynamic') {
          th.section_service.customRoute('/admin/roles/', rowItem.source_from).subscribe(res1 => {
            rowItem.source = res1;
          });
        }
        if (rowItem.type == 'image')
          th_files.push(rowItem.field);
      });
      this.file_inputs = th_files;
      th.section_service.getProfile(localStorage.getItem("userDetails['users_id']")).subscribe(res2 => {
        th.section_data = res2;
        th.columns = config_columns;
        localStorage.setItem("userDetails['image']", th.section_data.image);
        th.pageLoad = false;
        th.spinnerService.hide();
      });
    });
  }
}