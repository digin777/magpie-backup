import { Injectable } from '@angular/core';
import { HttpClient, HttpHeaders } from '@angular/common/http';
import 'rxjs/add/operator/map';
import { environment } from './../../../../src/environments/environment';
import 'rxjs/add/observable/of';
var server_url = environment.server_url;
var site_url = environment.site_url;
var package_url = environment.package_url;


@Injectable()
export class IndexpmsService {
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
    moduleCount = (project_id) => {
        let httpOptions = {
            headers: new HttpHeaders({ 'Authorization': sessionStorage.getItem("session_storage_user['jwtToken']") })
        };
        // var section = current_route.split('/')[2];
        
        const uri = server_url + 'admin_custom/' + 'getModuleCount';
        const obj = { 'project_id': project_id };
        return this
            .http
            .post(uri, obj, httpOptions)
            .map(res => {
                return res;
            });
    }
    getSubCount(section,sec_id,child_coln){
        let httpOptions = {
            headers: new HttpHeaders({ 'Authorization': sessionStorage.getItem("session_storage_user['jwtToken']") })
        };
        const uri = server_url + 'admin_custom/' + 'getSectionCount';
        const obj = { sec_id,section,child_coln };
        return this
            .http
            .post(uri, obj, httpOptions)
            .map(res => {
                return res;
            });
    }
}
