import { Component, OnInit, OnDestroy, ChangeDetectionStrategy, ChangeDetectorRef } from '@angular/core';
import { AuthService } from '../auth.service';
import { Router } from '@angular/router';
import {DomSanitizer} from '@angular/platform-browser';
import {MatIconRegistry} from '@angular/material/icon';
import { MatSnackBar } from '@angular/material/snack-bar';
import { ElectronService } from '../electron.service';
import { Subscription } from 'rxjs';

@Component({
  selector: 'app-home',
  templateUrl: './home.component.html',
  styleUrls: ['./home.component.scss'],
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class HomeComponent implements OnInit, OnDestroy {

  cons: Array<{
    name: string,
    code: number,
    user: number
  }> = [];

  device: number;
  usercode: number = 0;
  private stopWatchDevs: Subscription;
  private stopWatchChange: Subscription;

  constructor(
    private authService: AuthService,
    private router: Router,
    private snackBar: MatSnackBar,
    private electron: ElectronService,
    private cdf: ChangeDetectorRef,
    iconRegistry: MatIconRegistry,
    sanitizer: DomSanitizer
  ) {
    iconRegistry.addSvgIcon(
      'delete',
      sanitizer.bypassSecurityTrustResourceUrl('assets/delete.svg'));
    iconRegistry.addSvgIcon(
      'zdopen',
      sanitizer.bypassSecurityTrustResourceUrl('assets/zd2.svg'));
    iconRegistry.addSvgIcon(
      'zdclose',
      sanitizer.bypassSecurityTrustResourceUrl('assets/zd1.svg'));
    let userinfo = this.authService.getToken();
    this.electron.login(userinfo.user, userinfo.passwd).subscribe(code => {
      if (code !== 0) {
        this.authService.clearToken();
        this.router.navigate(['/login']);
      } else {
        this.usercode = userinfo.user;
      }
    });
  }

  connect(code) {
    let item;
    if (item = this.cons.find(con => con.code === code)) {
      if (!item.user || item.user === this.usercode) {
        this.electron.connect(code).subscribe((data) => {
          this.device = data.code;
        });
      }
    }
  }

  kickout(code) {
    this.electron.kickout(code).subscribe(data => {
      data.result || this.snackBar.open(`端口${code}设备剔除失败`, null, {
        duration: 2500
      });
    });
  }

  close() {
    this.electron.close();
  }

  logout() {
    this.electron.logout();
    this.authService.clearToken();
    this.router.navigate(['/login']);
  }

  getDevName(code) {
    return code ? this.cons.find(con => con.code === code).name : 'Welcome';
  }

  ngOnInit(): void {
    this.stopWatchDevs = this.electron.join().subscribe(devices => {
      this.cons = devices.map(device => ({
        name: device.name,
        code: device.code,
        user: device.user || 0
      }));
      this.cdf.markForCheck();
      this.cdf.detectChanges();
    });
    this.stopWatchChange = this.electron.termExit.subscribe(code => {
      if (this.device === code) {
        this.device = null;
        this.cdf.markForCheck();
        this.cdf.detectChanges();
      }
    });
  }

  ngOnDestroy(): void {
    this.stopWatchDevs.unsubscribe();
    this.stopWatchChange.unsubscribe();
  }

}
