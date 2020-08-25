import { Component, ViewChild, ElementRef, AfterViewInit, ViewEncapsulation, ChangeDetectionStrategy, HostListener, Input } from '@angular/core';
import { Terminal } from 'xterm';
import { FitAddon } from 'xterm-addon-fit';
import { ElectronService } from '../electron.service';

let smooth = null;

@Component({
  selector: 'app-term',
  templateUrl: './term.component.html',
  styleUrls: ['./term.component.scss'],
  encapsulation: ViewEncapsulation.None,
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class TermComponent implements AfterViewInit {

  @ViewChild('terminal') terminalDiv: ElementRef;

  @HostListener('window:resize', [])
  onResize() {
    clearTimeout(smooth);
    smooth = setTimeout(() => {
      this.winChange();
    }, 500);
  }

  @Input('devcode') code: number;

  term: Terminal;
  fitAddon: FitAddon;

  constructor(private electron: ElectronService) {
    this.fitAddon = new FitAddon();
    this.term = new Terminal({
      theme: { background: '#424242' },
      cursorBlink: true
    });
    this.term.loadAddon(this.fitAddon);
    this.term.onData(data => {
      this.electron.termWrite({
        code: this.code,
        data: data
      });
    });
    this.electron.termRead().subscribe(data => {
      this.term.write(data.data);
    });
  }

  winChange() {
    if (this.fitAddon) {
      this.electron.termResize(this.fitAddon.proposeDimensions());
      this.fitAddon.fit();
    }
  }

  ngAfterViewInit() {
    this.electron.termResize(this.fitAddon.proposeDimensions());
    this.term.open(this.terminalDiv.nativeElement);
    this.fitAddon.fit();
  }

}
