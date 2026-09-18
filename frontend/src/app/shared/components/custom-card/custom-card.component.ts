import { NgClass, NgStyle } from '@angular/common';
import { Component, HostListener, Input, OnInit } from '@angular/core';

@Component({
  selector: 'app-custom-card',
  standalone: true,
  imports: [NgStyle, NgClass],
  templateUrl: './custom-card.component.html',
  styleUrls: ['./custom-card.component.scss'],
})
export class CustomCardComponent implements OnInit {
  @Input() isCollapsed: boolean = false; // trạng thái nội dung ẩn/hiện
  @Input() style?: string;
  @Input() styleHeader?: { [key: string]: string };
  @Input() title?: string; // tiêu đề card
  @Input() collapsible: boolean = false; // có icon collapse không
  @Input() spacing!: number | string;
  @Input() spacingBottom!: number | string;
  @Input() upperCase: boolean = false;
  @Input() fullHeight: boolean = false;
  @Input() customHeight?: string;

  toggleCollapse() {
    if (this.collapsible) {
      this.isCollapsed = !this.isCollapsed;
    }
  }

  // Track window width to apply responsive height only on wide screens
  windowWidth: number = globalThis.window === undefined ? 0 : window.innerWidth;

  @HostListener('window:resize')
  onWindowResize() {
    this.windowWidth = window.innerWidth;
  }

  ngOnInit(): void {
    if (this.collapsible && this.isCollapsed === undefined) {
      this.isCollapsed = false;
    }
  }

  get cardStyle(): { [key: string]: string } {
    const marginTop =
      typeof this.spacing === 'number' ? `${this.spacing}px` : this.spacing || '0px';
    const marginBottom =
      typeof this.spacingBottom === 'number'
        ? `${this.spacingBottom}px`
        : this.spacingBottom || '0px';
    const styles: any = {
      'margin-top': marginTop,
      'margin-bottom': marginBottom,
    };

    const applyHeight = this.windowWidth >= 1400;

    if (applyHeight && this.customHeight) {
      styles.height = this.customHeight;
    }

    if (applyHeight && !this.customHeight && this.fullHeight) {
      styles.minHeight = 'calc(100vh - 160px)';
    }

    return styles;
  }

  formatTitle(str: string | undefined): string {
    if (!str) return '';
    return this.upperCase ? str.toUpperCase() : str;
  }
}
