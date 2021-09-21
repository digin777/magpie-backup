import { Component, OnInit } from '@angular/core';
import { HomeService } from './../../services/home.service';
import { environment } from './../../../environments/environment';
var server_url = environment.server_url;
@Component({
  selector: 'app-home',
  templateUrl: './home.component.html',
  styleUrls: ['./home.component.css']
})
export class HomeComponent implements OnInit {

  constructor(public homeService: HomeService) {
    console.log(server_url)

   }

  ngOnInit(): void {
  }

}
