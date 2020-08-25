import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';

import { MatCardModule } from '@angular/material/card';
import { MatMenuModule } from '@angular/material/menu';
import { MatIconModule } from '@angular/material/icon';
import { MatSidenavModule } from '@angular/material/sidenav';
import { MatButtonModule } from '@angular/material/button';
import { MatListModule } from '@angular/material/list';
import { MatSnackBarModule } from '@angular/material/snack-bar';
import { HomeRoutingModule } from './home-routing.module';
import { HomeComponent } from './home.component';
import { TermComponent } from '../term/term.component';
import { UsernamePipe } from '../username.pipe';


@NgModule({
  declarations: [HomeComponent, TermComponent, UsernamePipe],
  imports: [
    CommonModule,
    MatCardModule,
    MatIconModule,
    MatMenuModule,
    MatSidenavModule,
    MatButtonModule,
    MatListModule,
    MatSnackBarModule,
    HomeRoutingModule
  ]
})
export class HomeModule { }
