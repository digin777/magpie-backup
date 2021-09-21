import { Injectable } from '@angular/core';
import { HttpClient, HttpHeaders } from '@angular/common/http';
import 'rxjs/add/operator/map';
import { environment } from './../../../../src/environments/environment';
import 'rxjs/add/observable/of';

var server_url = environment.server_url;
var site_url = environment.site_url;
var package_url = environment.package_url;


@Injectable()
export class SubsectionService {
  result: any;
  constructor(private http: HttpClient) { }
  sessionStorageUserData() {
    return {
      name: sessionStorage.getItem("session_storage_user['name']"),
      roles_id: sessionStorage.getItem("session_storage_user['roles_id']"),
      users_id: sessionStorage.getItem("session_storage_user['users_id']"),
      image: sessionStorage.getItem("session_storage_user['image']"),
      role_name: sessionStorage.getItem("session_storage_user['role_name']"),
      email: sessionStorage.getItem("session_storage_user['email']"),
    };
  }

  checkLogin = (data) => {
    const uri = server_url + 'users/checkLogin';
    const obj = {
      email: data.email,
      password: data.password
    };
    return this
      .http
      .post(uri, obj)
      .map(res => {
        return res;
      });
  }

  userDetailsFromToken = (callback) => {
    let httpOptions = {
      headers: new HttpHeaders({ 'Authorization': sessionStorage.getItem("session_storage_user['jwtToken']") })
    };
    const uri = server_url + 'users/userDetailsFromToken';
    const obj = {};
    this.http.post(uri, obj, httpOptions)
      .subscribe(
        response => {
          callback(response);
        },
      );
  }

  decodeToken = (current_route, callback) => {
    let httpOptions = {
      headers: new HttpHeaders({ 'Authorization': sessionStorage.getItem("session_storage_user['jwtToken']") })
    };
    const uri = server_url + 'users/decodeToken';
    var data = current_route.split('/');
    const obj = { 'token': decodeURIComponent(data[3]), 'date': decodeURIComponent(data[4]) };
    this.http.post(uri, obj, httpOptions)
      .subscribe(
        response => {
          callback(response);
        },
      );
  }

  logout = () => {
    let httpOptions = {
      headers: new HttpHeaders({ 'Authorization': sessionStorage.getItem("session_storage_user['jwtToken']") })
    };
    const uri = server_url + 'users/logout';
    const obj = {
      token: sessionStorage.getItem("session_storage_user['jwtToken']"),
      autologin_users: localStorage.getItem("autologin"),
      users_id: sessionStorage.getItem("session_storage_user['users_id']")
    };
    return this
      .http
      .post(uri, obj, httpOptions)
      .map(res => {
        return res;
      });
  }

  autoLoginAs = (current_route, id, callback) => {
    let httpOptions = {
      headers: new HttpHeaders({ 'Authorization': sessionStorage.getItem("session_storage_user['jwtToken']") })
    };
    var section = current_route.split('/')[2];
    var obj = {
      id: id,
      roles_id: sessionStorage.getItem("session_storage_user['roles_id']")
    }
    const uri = server_url + section + '/autologin';
    return this.http.post(uri, obj, httpOptions)
      .subscribe(
        response => {
          callback(response);
        },
      );
  }

  sectionConfig = (section) => {
    let httpOptions = {
      headers: new HttpHeaders({ 'Authorization': sessionStorage.getItem("session_storage_user['jwtToken']") })
    };
    // var section = current_route.split('/')[2];
    const uri = server_url + section + '/getConfig';
    return this.http.get(uri, httpOptions)
      .map(res => {
        return res;
      });
  }

  customRoute = (section, from) => {
    let httpOptions = {
      headers: new HttpHeaders({ 'Authorization': sessionStorage.getItem("session_storage_user['jwtToken']") })
    };
    // var section = current_route.split('/')[2];
    const uri = server_url + 'magpie_custom/' + from;
    const obj = { "role_id": sessionStorage.getItem("session_storage_user['roles_id']") };
    return this.http.post(uri, obj, httpOptions)
      .map(res => {
        return res;
      });
  }

  adminCustomRoute = (section, from) => {
    let httpOptions = {
      headers: new HttpHeaders({ 'Authorization': sessionStorage.getItem("session_storage_user['jwtToken']") })
    };
    // var section = current_route.split('/')[2];
    const uri = server_url + 'admin_custom/' + from;
    const obj = { "role_id": sessionStorage.getItem("session_storage_user['roles_id']") };
    return this.http.post(uri, obj, httpOptions)
      .map(res => {
        return res;
      });
  }

  add = (data, section, callback) => {
    let httpOptions = {
      headers: new HttpHeaders({ 'Accept': 'application/json', 'enctype': 'multipart/form-data', 'Authorization': sessionStorage.getItem("session_storage_user['jwtToken']") })
    };
    let formData = new FormData();
    Object.keys(data).forEach(k => {
      if (data.file_fields.indexOf(k) != -1) {
        if ((typeof data[k] == "object")) {
          for (let i = 0; i < data[k].length; i++) {
            formData.append(k, data[k][i], data[k][i]['name']);
          }
        }
      } else
        formData.append(k, data[k]);
    });
    // var section = current_route.split('/')[2];
    const uri = server_url + section + '/add';
    const obj = formData;
    this.http.post(uri, obj, httpOptions)
      .subscribe(
        response => {
          callback(response);
        },
      );
  }

  search = (value, searchable_fields, order_by, sortable_field, relation, current_page, per_page, section,filter) => {
    let httpOptions = {
      headers: new HttpHeaders({ 'Authorization': sessionStorage.getItem("session_storage_user['jwtToken']") })
    };
    // var section = current_route.split('/')[2];
    // const uri = server_url + section + '/search';
    const uri =server_url+'subsecton/search';
    const obj = { 'search': value, 'searchable': searchable_fields, 'sort_order': order_by, 'sort_orderBy': sortable_field, 'relation': relation, 'current_page': current_page, 'per_page': per_page, 'role_id': sessionStorage.getItem("session_storage_user['roles_id']"),'section':section,'filter':filter };
    return this
      .http
      .post(uri, obj, httpOptions)
      .map(res => {
        return res;
      });
  }

  subChangeStatus(id,feild,value,section){
      let httpOptions = {
      headers: new HttpHeaders({ 'Authorization': sessionStorage.getItem("session_storage_user['jwtToken']") })
    };
    const uri =server_url+'subsecton/subChnagestatus';
    const obj = { 'id':id,'feild':feild,'value':value,'role_id': sessionStorage.getItem("session_storage_user['roles_id']"),"section":section };
    return this
      .http
      .post(uri, obj, httpOptions)
      .map(res => {
        return res;
      });
  }

  export = (value, searchable_fields, order_by, sortable_field, relation, current_route, columns) => {
    let httpOptions = {
      headers: new HttpHeaders({ 'Authorization': sessionStorage.getItem("session_storage_user['jwtToken']") })
    };
    var section = current_route.split('/')[2];
    const uri = server_url + section + '/export';
    const obj = { 'search': value, 'searchable': searchable_fields, 'sort_order': order_by, 'sort_orderBy': sortable_field, 'relation': relation, 'role_id': sessionStorage.getItem("session_storage_user['roles_id']"), 'columns': columns };
    return this
      .http
      .post(uri, obj, httpOptions)
      .map(res => {
        return res;
      });

  }

  import = (data, columns_array, import_unique_field, section) => {
    let httpOptions = {
      headers: new HttpHeaders({ 'Accept': 'application/json', 'enctype': 'multipart/form-data', 'Authorization': sessionStorage.getItem("session_storage_user['jwtToken']") })
    };
    let formData = new FormData();
    formData.append('csv_import', data, data['name']);
    formData.append('columns', columns_array);
    formData.append('import_unique_field', import_unique_field);
    // var section = current_route.split('/')[2];
    const uri = server_url + section + '/import';
    const obj = formData;
    return this.http.post(uri, obj, httpOptions)
      .map(res => console.log('Done'));
  }


  get = (current_page, per_page, sortable_field, order_by, section,filter) => {
    let httpOptions = {
      headers: new HttpHeaders({ 'Authorization': sessionStorage.getItem("session_storage_user['jwtToken']") })
    };
    // var section = current_route.split('/')[2];
    // const uri = server_url + section;
    const uri =server_url+'subsecton/getlist';
    const obj = { 'current_page': current_page, 'per_page': per_page, 'sort_orderBy': sortable_field, sort_order: order_by, 'role_id': sessionStorage.getItem("session_storage_user['roles_id']"),'filter':filter ,'section':section};
    return this
      .http
      .post(uri, obj, httpOptions)
      .map(res => {
        return res;
      });
  }

  edit = (id, section) => {
    let httpOptions = {
      headers: new HttpHeaders({ 'Authorization': sessionStorage.getItem("session_storage_user['jwtToken']") })
    };
    // var section = current_route.split('/')[2];
    const uri = server_url + section + '/edit_details/' + id;
    return this
      .http
      .get(uri, httpOptions)
      .map(res => {
        return res;
      });
  }

  view = (id, section) => {
    let httpOptions = {
      headers: new HttpHeaders({ 'Authorization': sessionStorage.getItem("session_storage_user['jwtToken']") })
    };
    // var section = current_route.split('/')[2];
    const uri = server_url + section + '/view_details/' + id;
    return this
      .http
      .get(uri, httpOptions)
      .map(res => {
        return res;
      });
  }

  getUserRole = (role_id) => {
    let httpOptions = {
      headers: new HttpHeaders({ 'Authorization': sessionStorage.getItem("session_storage_user['jwtToken']") })
    };
    const uri = server_url + 'roles/getUserRole/' + parseInt(role_id);
    return this
      .http
      .get(uri, httpOptions)
      .map(res => {
        return res;
      });
  }

  update = (data, section) => {
    let httpOptions = {
      headers: new HttpHeaders({ 'Accept': 'application/json', 'enctype': 'multipart/form-data', 'Authorization': sessionStorage.getItem("session_storage_user['jwtToken']") })
    };
    let formData = new FormData();
    Object.keys(data).forEach(k => {
      if (data.file_fields.indexOf(k) != -1) {
        if ((typeof data[k] == "object")) {
          for (let i = 0; i < data[k].length; i++) {
            formData.append(k, data[k][i], data[k][i]['name']);
          }
        } else
          formData.append(k, data[k]);
      } else
        formData.append(k, data[k]);
    });
    // var section = current_route.split('/')[2];
    const uri = server_url + section + '/update/' + data._id;
    const obj = formData;
    return this
      .http
      .post(uri, obj, httpOptions)
      .map(res => {
        return res;
      });
  }


  delete = (id, section) => {
    let httpOptions = {
      headers: new HttpHeaders({ 'Authorization': sessionStorage.getItem("session_storage_user['jwtToken']") })
    };
    // var section = current_route.split('/')[2];
    const uri = server_url + section + '/delete/' + id;
    return this
      .http
      .get(uri, httpOptions)
      .map(res => {
        return res;
      });
  }

  bulkDelete = (ids, section) => {
    let httpOptions = {
      headers: new HttpHeaders({ 'Authorization': sessionStorage.getItem("session_storage_user['jwtToken']") })
    };
    // var section = current_route.split('/')[2];
    console.log(section);
    const uri = server_url + section + '/bulk-delete';
    var obj = { 'ids': ids };
    return this
      .http
      .post(uri, obj, httpOptions)
      .map(res => {
        return res;
      });
  }

  getImage = (id, current_route) => {
    let httpOptions = {
      headers: new HttpHeaders({ 'Authorization': sessionStorage.getItem("session_storage_user['jwtToken']") })
    };
    var section = current_route.split('/')[2];
    const uri = server_url + section + '/getImage/' + id;
    return this
      .http
      .get(uri, httpOptions)
      .map(res => {
        return res;
      });
  }

  deleteFile = (id, column, rowId, current_route) => {
    let httpOptions = {
      headers: new HttpHeaders({ 'Authorization': sessionStorage.getItem("session_storage_user['jwtToken']") })
    };
    var section = current_route.split('/')[2];
    const uri = server_url + section + '/deleteFile/' + rowId;;
    const obj = { 'file_id': id, 'column': column };
    return this
      .http
      .post(uri, obj, httpOptions)
      .map(res => {
        return res;
      });
  }


  getRolePermissionMenus = (section) => {
    let httpOptions = {
      headers: new HttpHeaders({ 'Authorization': sessionStorage.getItem("session_storage_user['jwtToken']") })
    };
    const uri = server_url + section + '/getRolePermissionMenus';
    const obj = { 'role_id': sessionStorage.getItem("session_storage_user['roles_id']") };
    return this
      .http
      .post(uri, obj, httpOptions)
      .map(res => {
        return res;
      });
  }

  getAllMenus = (section) => {
    let httpOptions = {
      headers: new HttpHeaders({ 'Authorization': sessionStorage.getItem("session_storage_user['jwtToken']") })
    };
    const uri = server_url + section + '/getAllMenus';
    return this
      .http
      .get(uri, httpOptions)
      .map(res => {
        return res;
      });
  }



  getSettings = (current_route) => {
    let httpOptions = {
      headers: new HttpHeaders({ 'Authorization': sessionStorage.getItem("session_storage_user['jwtToken']") })
    };
    var section = current_route.split('/')[2];
    const uri = server_url + section + '/getSettings';
    return this
      .http
      .get(uri, httpOptions)
      .map(res => {
        return res;
      });
  }

  updateSettings = (data, current_route) => {
    let httpOptions = {
      headers: new HttpHeaders({ 'Accept': 'application/json', 'enctype': 'multipart/form-data', 'Authorization': sessionStorage.getItem("session_storage_user['jwtToken']") })
    };
    let formData = new FormData();
    Object.keys(data).forEach(k => {
      if (data.file_fields.indexOf(k) != -1) {
        if ((typeof data[k] == "object")) {
          for (let i = 0; i < data[k].length; i++) {
            formData.append(k, data[k][i], data[k][i]['name']);
          }
        } else
          formData.append(k, data[k]);
      } else {
        formData.append(k, data[k]);
      }
    });
    var section = current_route.split('/')[2];
    const obj = formData;
    const uri = server_url + section + '/updateSettings';
    return this
      .http
      .post(uri, obj, httpOptions)
      .map(res => {
        return res;
      });
  }


  getMenuNameFromUrl = (section, url) => {
    let httpOptions = {
      headers: new HttpHeaders({ 'Authorization': sessionStorage.getItem("session_storage_user['jwtToken']") })
    };
    const uri = server_url + section + '/getMenuNameFromUrl';
    let obj = { "url": url }
    return this
      .http
      .post(uri, obj, httpOptions)
      .map(res => {
        return res;
      });
  }

  changeStatus = (current_route, id, value, field, source) => {
    var obj = "";
    Object.keys(source).forEach((v) => {
      if (source[v].value != value)
        obj = source[v].value;
    });
    let httpOptions = {
      headers: new HttpHeaders({ 'Authorization': sessionStorage.getItem("session_storage_user['jwtToken']") })
    };
    var section = current_route.split('/')[2];
    const uri = server_url + section + '/changeStatus/' + id;
    return this
      .http
      .post(uri, { 'status': obj, 'field': field }, httpOptions)
      .map(res => {
        return res;
      });
  }

  getUsers = (current_route) => {
    let httpOptions = {
      headers: new HttpHeaders({ 'Authorization': sessionStorage.getItem("session_storage_user['jwtToken']") })
    };
    var section = current_route.split('/')[2];
    const uri = server_url + section + '/getUsers';
    return this
      .http
      .get(uri, httpOptions)
      .map(res => {
        return res;
      });
  }

}