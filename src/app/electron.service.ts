import { Injectable } from '@angular/core';
import { fromEvent, Observable, from } from 'rxjs';
import { map, take } from 'rxjs/operators';

declare const electron: any;

interface TermData {
  code: number,
  data: any
}

@Injectable({
  providedIn: 'root'
})
export class ElectronService {

  constructor() { }

  setIpcfg(ip) {
    electron.ipcRenderer.send('action', {
      type: 'ip',
      data: ip
    });
  }

  close() {
    electron.ipcRenderer.send('action', {
      type: 'close'
    });
  }

  termResize({ cols, rows }: { cols: number, rows: number }) {
    electron.ipcRenderer.send('termsize', {
      cols, rows
    });
  }

  termRead(): Observable<TermData> {
    return fromEvent(electron.ipcRenderer, 'termdata').pipe(
      map(([event, data]) => ({
        code: data.code,
        data: window.atob(data.data)
      })));
  }

  termWrite({ code, data }) {
    electron.ipcRenderer.send('termdata', {
      code: code,
      data: window.btoa(data)
    });
  }

  private loginsource = fromEvent(electron.ipcRenderer, 'login').pipe(take(1), map(([event, data]) => data.code));

  login(user, passwd) {
    electron.ipcRenderer.send('login', {
      user, passwd
    });
    return this.loginsource;
  }

  logout() {
    electron.ipcRenderer.send('logout');
  }

  private devicesource = fromEvent(electron.ipcRenderer, 'devices').pipe(map(([event, data]) => data));

  join() {
    electron.ipcRenderer.send('join');
    return this.devicesource;
  }

  private kickoutesource = fromEvent(electron.ipcRenderer, 'kickout').pipe(take(1), map(([event, data]) => data));

  kickout(code) {
    electron.ipcRenderer.send('kickout', {
      code
    });
    return this.kickoutesource;
  }

  private connectsource = fromEvent(electron.ipcRenderer, 'connect').pipe(take(1), map(([event, data]) => data));

  connect(code) {
    electron.ipcRenderer.send('connect', {
      code
    });
    return this.connectsource;
  }

  termExit = fromEvent(electron.ipcRenderer, 'termExit').pipe(map(([event, data]) => data.code));
}
