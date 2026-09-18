import { Component, Input, OnInit, OnDestroy, NgZone, inject } from '@angular/core';
import { CommonModule } from '@angular/common';

@Component({
  selector: 'tellerapp-scroll-to-top',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './scroll-to-top.component.html',
  styleUrl: './scroll-to-top.component.scss',
})
export class ScrollToTopComponent implements OnInit, OnDestroy {
  private readonly ngZone = inject(NgZone);

  /**
   * Threshold in pixels from the top of the container before the button becomes visible.
   */
  @Input() threshold: number = 200;

  /**
   * Whether to scroll smoothly.
   */
  @Input() smooth: boolean = true;

  isVisible: boolean = false;
  private activeScrollContainer: HTMLElement | null = null;
  private readonly scrollListener = (event: Event) => this.handleScroll(event);

  ngOnInit(): void {
    // Run outside Angular to optimize performance and prevent excessive change detections during scrolling
    this.ngZone.runOutsideAngular(() => {
      window.addEventListener('scroll', this.scrollListener, true);
    });
  }

  ngOnDestroy(): void {
    window.removeEventListener('scroll', this.scrollListener, true);
  }

  private handleScroll(event: Event): void {
    const target = event.target as HTMLElement;
    if (!target) return;

    // Ignore tiny scrollable elements (e.g., small dialogs, dropdowns, etc.)
    const isLargeContainer = target.clientHeight > 200;

    let scrollTop = 0;
    if (target === document as any || target === document.documentElement || target === document.body) {
      scrollTop = window.pageYOffset || document.documentElement.scrollTop || document.body.scrollTop || 0;
    } else if (isLargeContainer && target.scrollTop !== undefined) {
      scrollTop = target.scrollTop;
      this.activeScrollContainer = target;
    } else {
      return;
    }

    const shouldShow = scrollTop > this.threshold;
    if (this.isVisible !== shouldShow) {
      this.ngZone.run(() => {
        this.isVisible = shouldShow;
      });
    }
  }

  scrollToTop(): void {
    // Scroll the captured scroll container
    if (this.activeScrollContainer) {
      this.activeScrollContainer.scrollTo({
        top: 0,
        behavior: this.smooth ? 'smooth' : 'auto'
      });
    }
    
    // Also scroll the window / document as a fallback
    window.scrollTo({
      top: 0,
      behavior: this.smooth ? 'smooth' : 'auto'
    });
  }
}
