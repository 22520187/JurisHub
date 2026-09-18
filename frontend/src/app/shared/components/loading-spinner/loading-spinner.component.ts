import { Component, Input } from '@angular/core';
import { CommonModule } from '@angular/common';

@Component({
  selector: 'app-loading-spinner, tellerapp-loading-spinner',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './loading-spinner.component.html',
  styleUrl: './loading-spinner.component.scss',
})
export class LoadingSpinnerComponent {
  @Input() visible = false;
  @Input() inline = false;
  @Input() size = 56;
  @Input() message = '';
  @Input() brandText = 'JurisHub';
}
