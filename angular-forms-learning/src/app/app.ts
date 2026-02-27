import { Component, signal } from '@angular/core';
import { RouterOutlet, RouterLink, RouterLinkActive } from '@angular/router';
import { MatToolbarModule } from '@angular/material/toolbar';
import { MatSidenavModule } from '@angular/material/sidenav';
import { MatListModule } from '@angular/material/list';
import { MatIconModule } from '@angular/material/icon';
import { MatButtonModule } from '@angular/material/button';

@Component({
  selector: 'app-root',
  imports: [
    RouterOutlet,
    RouterLink,
    RouterLinkActive,
    MatToolbarModule,
    MatSidenavModule,
    MatListModule,
    MatIconModule,
    MatButtonModule,
  ],
  templateUrl: './app.html',
  styleUrl: './app.scss',
})
export class App {
  protected readonly title = signal('Angular Forms 学習ツール');

  menuItems = [
    { path: '/form-control', label: 'FormControl', icon: 'edit' },
    { path: '/form-group', label: 'FormGroup', icon: 'folder' },
    { path: '/form-builder', label: 'FormBuilder', icon: 'build' },
    { path: '/validation', label: 'Validation', icon: 'check_circle' },
    { path: '/shared-form', label: 'フォーム値共有', icon: 'share' },
    { path: '/pattern-selector', label: 'パターン選択UI', icon: 'tune' },
  ];
}
