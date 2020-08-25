import { Component } from '@angular/core';
import { ElectronService } from './electron.service';

@Component({
  selector: 'app-root',
  templateUrl: './app.component.html',
  styleUrls: ['./app.component.scss']
})
export class AppComponent {
  constructor(private electron: ElectronService) {
    let ipcfg = localStorage.getItem('ip');
    if (!ipcfg) {
      localStorage.setItem('ip', ipcfg='10.132.21.162');
    }
    this.electron.setIpcfg(ipcfg);
  }
}
