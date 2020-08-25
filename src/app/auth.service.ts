import { Injectable } from '@angular/core';

const timeout = 20 * 60 * 1000;

@Injectable({
  providedIn: 'root'
})
export class AuthService {

  constructor() { }

  clearToken() {
    localStorage.removeItem('token');
  }

  setToken(user, passwd) {
    let now = new Date().getTime();
    let token = {
      user: user,
      passwd: passwd,
      time: now + timeout
    }
    localStorage.setItem('token', JSON.stringify(token));
  }

  getToken() {
    let now = new Date().getTime();
    let token: any = localStorage.getItem('token');
    if (token && now < (token = JSON.parse(token)).time) {
      this.setToken(token.user, token.passwd);
      return {
        user: token.user,
        passwd: token.passwd
      }
    }
  }

}
