import { Component, OnInit } from '@angular/core';
import { Router } from '@angular/router';
import { HttpClient, HttpHeaders } from '@angular/common/http';

@Component({
  selector: 'app-databases',
  templateUrl: './databases.component.html',
  styleUrls: ['./databases.component.css']
})
export class DatabasesComponent implements OnInit {
  databases: any;
  message: string = "Loading...";
  constructor(private router: Router, private http: HttpClient) { }

  ngOnInit() {
    if(sessionStorage.token == null)
      this.router.navigate(['/']);

    let httpOptions = {
      headers: new HttpHeaders({
        'token': sessionStorage.token
      })
    };
    this.http.get("/api/databases", httpOptions).subscribe(data => {
      this.databases = data;
      this.message = "";
    }, error => {
      this.message = "Error: " + error.error.error;
    });
  }


}
