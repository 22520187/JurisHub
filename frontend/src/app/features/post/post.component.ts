import { Component, inject, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Router, RouterModule } from '@angular/router';
import { ButtonComponent } from '../../shared/components/button/button.component';
import { BadgeComponent } from '../../shared/components/badge/badge.component';
import { ForumService, ForumPostItem } from '../../core/services/forum.service';

@Component({
  selector: 'app-post',
  standalone: true,
  imports: [
    CommonModule,
    RouterModule,
    ButtonComponent,
    BadgeComponent
  ],
  templateUrl: './post.component.html',
  styleUrl: './post.component.scss'
})
export class PostComponent implements OnInit {
  private readonly router = inject(Router);
  private readonly forumService = inject(ForumService);

  activeTab: 'my-posts' | 'saved' = 'my-posts';

  myPosts: ForumPostItem[] = [];
  savedPosts: ForumPostItem[] = [];

  ngOnInit(): void {
    this.loadPosts();
  }

  loadPosts(): void {
    this.myPosts = this.forumService.getMyPosts();
    this.savedPosts = this.forumService.getSavedPosts();
  }

  setActiveTab(tab: 'my-posts' | 'saved'): void {
    this.activeTab = tab;
  }

  navigateToCreatePost(): void {
    this.router.navigate(['/post/create']);
  }
}
