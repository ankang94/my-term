import { Component, OnInit, Inject } from '@angular/core';
import { FormControl, Validators, FormGroup } from '@angular/forms';
import { AuthService } from '../auth.service';
import { Router } from '@angular/router';
import { MatDialog, MatDialogRef, MAT_DIALOG_DATA } from '@angular/material/dialog';
import { MatSnackBar } from '@angular/material/snack-bar';
import { ElectronService } from '../electron.service';
import { Md5 } from 'ts-md5';

interface DialogData {
  ip: string;
}

@Component({
  selector: 'settings-dialog',
  templateUrl: './settings-dialog.html'
})
export class SettingsDialog {

  constructor(private dialogRef: MatDialogRef<SettingsDialog>, @Inject(MAT_DIALOG_DATA) public data: DialogData) {}

  onNoClick(): void {
    this.dialogRef.close();
  }

}

@Component({
  selector: 'app-auth',
  templateUrl: './auth.component.html',
  styleUrls: ['./auth.component.scss'],
})
export class AuthComponent implements OnInit {

  loginForm = new FormGroup({
    username: new FormControl('', [Validators.required, Validators.minLength(5), Validators.maxLength(6)]),
    password: new FormControl('', [Validators.required, Validators.minLength(5), Validators.maxLength(12)])
  });

  constructor(private authService: AuthService, private router: Router, private dialog: MatDialog, private snackBar: MatSnackBar, private electron :ElectronService) {}

  ip: string = localStorage.getItem('ip');

  openDialog(): void {
    const dialogRef = this.dialog.open(SettingsDialog, {
      width: '300px',
      data: {
        ip: this.ip
      }
    });

    dialogRef.afterClosed().subscribe(cfgip => {
      if (cfgip) {
        localStorage.setItem('ip', this.ip=cfgip);
        this.electron.setIpcfg(this.ip);
      }
    });
  }

  close() {
    this.electron.close();
  }

  onSubmit() {
    let userinfo = this.loginForm.value
    userinfo.password = Md5.hashStr(userinfo.password).toString();
    this.electron.login(userinfo.username, userinfo.password).subscribe(code => {
      if (code === 0) {
        this.authService.setToken(userinfo.username, userinfo.password);
        this.router.navigate(['/home']);
      } else {
        let message = '登录失败, ';
        if (code == 1) {
          message += '用户名或密码不正确。';
        } else {
          message += '未知错误。';
        }
        this.snackBar.open(message, 'x', {
          duration: 2500
        });
      }
    });
  }

  ngOnInit(): void {
    let can = document.querySelector(".login-bg") as HTMLCanvasElement;
    let ctx = can.getContext("2d");
    can.width = 1500;
    can.height = 700;
    let canWidth = can.width;
    let canHeight = can.height;
    //定义一个渐变色
    let gl = ctx.createLinearGradient(0, 0, canWidth, canHeight);
    gl.addColorStop(0, 'red');
    // gl.addColorStop(.25,'green');
    gl.addColorStop(.5, 'yellow');
    // gl.addColorStop(.75,'blue');
    gl.addColorStop(1, 'cyan');
 
    // 1  获取随机内容
    let str = '0123456789zxcvbnmasdfghjklqwertyuiop';
    // 2 设置基本通体 样式
    let fontSize = 16;
    ctx.font = fontSize + "px '宋体'";
    // 3 设置画的列数
    let column = canWidth / fontSize;
    // 4 创建一个数组用来存放每一列的数据  并且给数组的每一列设置初始值   （用来存放每一列自己的效果）
    let arr = [];
    for (let i = 0; i < column; i++) {
        arr[i] = 0;
    }
    //  业务逻辑    不一定相等  因为有可能 column是个小数
    // console.log( arr.length);
    // console.log(column );
    // console.log(column == arr.length);
    
    // 5定时器开始跑数字
    setInterval(draw, 50);

    function draw() {
      //设置样式 填充样式
      ctx.fillStyle = "rgba(0,0,0,0.07)";
      //绘制满屏填充效果
      ctx.fillRect(0, 0, canWidth, canHeight);
      //    设置每行的文本内容  一行写多少那？？？  就是那个列数
      //     ctx.fillStyle = "#0f0";
      ctx.fillStyle = gl;
      // for(let a = 0; a<column;a++){   //能行不？？？？？  但是里不严谨的情况下可以一样但是那 建议是用arr.length
      for (let a = 0; a < arr.length; a++) {
          ctx.fillText(str[Math.floor(Math.random() * str.length)], fontSize * a, fontSize * arr[a]);
          arr[a]++;
          //自己列数的状态自己判断  不在整体判断   && 后面表示随机掉落概率的判断
          if (arr[a] * fontSize > canHeight && Math.random() > 0.9) {
              arr[a] = 0;
          }
      }
      //  给每一个字 设置颜色 就需要在for 中设置 但是要注意一定要设置颜色前在添加个beginPath（） 不然颜色会显示最后一个
      //    ？？ 这个最后颜色指的是谁？？？
    }
  }
}
