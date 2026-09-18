import { Component, Input } from '@angular/core';
import { CommonModule } from '@angular/common';

export type BadgeColor = 'yellow' | 'blue' | 'green' | 'red' | 'default';

@Component({
  selector: 'tellerapp-badge',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './badge.component.html',
  styleUrl: './badge.component.scss',
})
export class BadgeComponent {
  /**
   * Màu sắc của badge: 'yellow' | 'blue' | 'green' | 'red' | 'default'
   */
  @Input() color: BadgeColor = 'default';
  /**
   * Kích thước của badge: 'sm' (Table) | 'md' (Header)
   */
  @Input() size: 'sm' | 'md' = 'sm';
}
