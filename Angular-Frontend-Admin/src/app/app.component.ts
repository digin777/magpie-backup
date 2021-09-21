import { MagpieComponent } from './../../system/src/magpie.component';
import { Component } from '@angular/core';
import { ActivatedRoute, Router, NavigationEnd } from '@angular/router';
import { HttpClient } from '@angular/common/http';
import { SectionService } from './../../system/src/services/admin/section.service';
import { WebsocketService } from './../../system/src/services/admin/websocket.service';
import { Title } from '@angular/platform-browser';
import { AuthGuard } from './../../system/src/services/admin/auth-guard.service';
declare var getStarted: any;
declare var $: any;
declare var notifier: any;
@Component({
  selector: 'app-root',
  templateUrl: './app.component.html',
  styleUrls: ['./app.component.css']
})


export class AppComponent extends MagpieComponent {
  admin_part: any = false;
  package_installer: any = false;
  menuRow: any;
  navigationSubscription: any;
  get user_data() { return this.section_service.sessionStorageUserData(); };
  constructor(router: Router, route: ActivatedRoute, http: HttpClient, section_service: SectionService, authguard: AuthGuard, private titleService: Title, private webSocketService: WebsocketService) {
    super(route, router, http, section_service, authguard);
    this.webSocketService.createItemMessageReceived().subscribe(data => {
      new notifier({ title: "Success! ", message: data.message, icon: 'fa fa-check', type: "success" });
    });
    this.webSocketService.updateItemMessageReceived().subscribe(data => {
      new notifier({ title: "Success! ", message: data.message, icon: 'fa fa-check', type: "success" });
    });
    this.webSocketService.deleteItemMessageReceived().subscribe(data => {
      new notifier({ title: "Success! ", message: data.message, icon: 'fa fa-check', type: "success" });
    });
  }

  ngOnInit() {
    if (localStorage.getItem("current_segment") == 'admin') {
      this.navigationSubscription = this.router.events.subscribe(event => {
        if (event instanceof NavigationEnd) {
          if (typeof localStorage.getItem('jwtToken') != undefined && localStorage.getItem('jwtToken') != null && event.urlAfterRedirects != '/admin/login' && event.urlAfterRedirects.split('/')[2] != 'autologin' && event.urlAfterRedirects.split('?')[0] != '/admin/reset-password') {
            var session_data = [];
            session_data['jwtToken'] = sessionStorage.getItem("session_storage_user['jwtToken']") != null ? sessionStorage.getItem("session_storage_user['jwtToken']") : localStorage.getItem("jwtToken");
            session_data['todays_date'] = sessionStorage.getItem("session_storage_user['todays_date']") != null ? sessionStorage.getItem("session_storage_user['todays_date']") : localStorage.getItem("todays_date");
            session_data['email'] = sessionStorage.getItem("session_storage_user['email']") != null ? sessionStorage.getItem("session_storage_user['email']") : localStorage.getItem("userDetails['email']");
            session_data['name'] = sessionStorage.getItem("session_storage_user['name']") != null ? sessionStorage.getItem("session_storage_user['name']") : localStorage.getItem("userDetails['name']");
            session_data['users_id'] = sessionStorage.getItem("session_storage_user['users_id']") != null ? sessionStorage.getItem("session_storage_user['users_id']") : localStorage.getItem("userDetails['users_id']");
            session_data['roles_id'] = sessionStorage.getItem("session_storage_user['roles_id']") != null ? sessionStorage.getItem("session_storage_user['roles_id']") : localStorage.getItem("userDetails['roles_id']");
            session_data['role_name'] = sessionStorage.getItem("session_storage_user['role_name']") != null ? sessionStorage.getItem("session_storage_user['role_name']") : localStorage.getItem("userDetails['role_name']");
            session_data['image'] = sessionStorage.getItem("session_storage_user['image']") != null ? sessionStorage.getItem("session_storage_user['image']") : localStorage.getItem("userDetails['image']");
            this.authguard.setSessions(session_data);
            if (localStorage.getItem('jwtToken') == null) {
              this.authguard.setSessions(session_data);
              this.router.navigate(['/admin/login']);
            }
            this.section_service.userDetailsFromToken((data) => {
              if (data['success']) {
                if (data['result'].roles_id != localStorage.getItem("userDetails['roles_id']") || data['result'].users_id != localStorage.getItem("userDetails['users_id']")) {
                  this.authguard.setSessions(session_data);
                  this.router.navigate(['/admin/login']);
                }
              }
            });
            this.showNav = true;
            this.login_id = this.user_data["users_id"];
            this.isLoggedIn().subscribe(res => {
              this.roles_menu = res;
            });
            this.package_installer = localStorage.getItem("userDetails['roles_id']") == '1' ? true : false;
            this.section_service.getUserRole(localStorage.getItem("userDetails['roles_id']")).subscribe(res => {
              this.login_role = res['name'];
            });
          } else {
            this.showNav = false;
          }
          if (typeof sessionStorage.getItem('jwtToken') != undefined && localStorage.getItem('jwtToken') != null && event.urlAfterRedirects != '/admin/login' && event.urlAfterRedirects.split('?')[0] != '/admin/reset-password') {
            this.authguard.setSessions(session_data);
          }
          if (event.urlAfterRedirects == '/admin/dashboard') {
            setTimeout(() => {
              new getStarted([
                {
                  'element': "#profile-logo",
                  'title': "Profile Info",
                  "description": "Profile Name,Role",
                  "position": "right"
                },
                {
                  'element': "#Dashboard",
                  'title': "Dashboard page",
                  "description": "Welcome to magpie",
                  "position": "right"
                }]);
            }, 1000);
          }
          if (event.url.split('/')[1] == 'admin' && event.urlAfterRedirects != '/admin/login' && event.urlAfterRedirects.split('?')[0] != '/admin/reset-password') {
            this.section_service.getAllModules().subscribe(res1 => {
              var current_modules = ['login', 'dashboard', 'reset-password', 'account', 'settings', 'package-installer', '404', 'autologin'];
              if (typeof res1 == 'object') {
                Object.keys(res1).forEach(key => {
                  current_modules.push(res1[key]['url'].split('/')[1]);
                });
              }
              if (current_modules.indexOf(event.url.split('/')[2]) < 0) {
                this.router.navigate(['/admin/404']);
              }
            });
          }
          if (event.urlAfterRedirects == '/admin/login') {
            if (typeof localStorage.getItem('jwtToken') != undefined)
              this.authguard.removeLocalStorageSessions();
            this.authguard.removeSessionStorageSessions();
            this.showNav = false;
            if (this.website_name)
              this.titleService.setTitle(this.website_name + ' | Login');
          } else {
            var newUrl = event.url.split("?");
            if (newUrl[0] == '/admin/reset-password') {
              this.showNav = false;
            } else {
              var url = event.urlAfterRedirects.split("/");
              var custom_url = url[1] + "/" + url[2];
              this.showNavMethod = event.urlAfterRedirects.split('/')[3] != undefined && event.urlAfterRedirects.split('/')[3].split('?')[0] ? event.urlAfterRedirects.split('/')[3].split('?')[0] : event.urlAfterRedirects.split('/')[3];
              this.showBeadcrumb = event.urlAfterRedirects.split('/')[2] === 'autologin' ? false : true;
              this.getMenuNameFromUrl(custom_url).subscribe(res => {
                if (res != null) {
                  this.menuRow = res;
                  this.showNavDisplayTitle = this.menuRow.display_name;
                  if (this.website_name)
                    this.titleService.setTitle(this.website_name + ' | ' + this.showNavDisplayTitle);
                  if (this.showNavDisplayTitle != 'Dashboard')
                    this.showNavTitle = this.menuRow.name.replace(" ", "-");
                  else
                    this.showNavTitle = undefined;
                } else {
                  this.showNavDisplayTitle = event.urlAfterRedirects.split('/')[2];
                  if (this.website_name)
                    this.titleService.setTitle(this.website_name + ' | ' + this.showNavDisplayTitle.replace("-", " "));
                  this.showNavTitle = event.urlAfterRedirects.split('/')[2].replace(' ', '-');
                }
              });
            }
          }
        }
      });
      this.admin_part = true;
      this.section_service.getThemeColorSettings().subscribe(res => {
        $("body").css({ "--some-color-dark": this.colorLuminance(res[0].value, -0.3), "--some-color": this.colorLuminance(res[0].value, 0), "--some-hovercolor": this.colorLuminance(res[0].value, -0.2) });
      });
      this.section_service.getWebsiteNameSettings().subscribe(res => {
        this.website_name = res[0].value;
        this.titleService.setTitle(this.website_name);
      });
    }
  }

  ngOnDestroy() {
    if (this.navigationSubscription) {
      this.navigationSubscription.unsubscribe();
    }
  }

  colorLuminance = (hex, lum) => {
    hex = String(hex).replace(/[^0-9a-f]/gi, '');
    if (hex.length < 6) {
      hex = hex[0] + hex[0] + hex[1] + hex[1] + hex[2] + hex[2];
    }
    lum = lum || 0;
    var rgb = "#", c, i;
    for (i = 0; i < 3; i++) {
      c = parseInt(hex.substr(i * 2, 2), 16);
      c = Math.round(Math.min(Math.max(0, c + (c * lum)), 255)).toString(16);
      rgb += ("00" + c).substr(c.length);
    }
    return rgb;
  }
}

