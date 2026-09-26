import { Routes } from '@angular/router';
import { MainLayoutComponent } from './core/layouts/main-layout/main-layout.component';
import { HomeComponent } from './features/home/home.component';
import { ForumComponent } from './features/forum/forum.component';
import { LoginComponent } from './features/auth/login/login.component';
import { RegisterComponent } from './features/auth/register/register.component';
import { ChatComponent } from './features/chatbot/chat.component';
import { ChatPdfComponent } from './features/chat-pdf/chat-pdf.component';
import { ProfileComponent } from './features/profile/profile.component';
import { PostComponent } from './features/post/post.component';
import { CreatePostComponent } from './features/post/create-post/create-post.component';

export const routes: Routes = [
  {
    path: '',
    component: MainLayoutComponent,
    children: [
      { path: '', component: HomeComponent },
      { path: 'home', component: HomeComponent },
      { path: 'forum', component: ForumComponent },
      { path: 'forum/create', component: CreatePostComponent },
      { path: 'chat', component: ChatComponent },
      { path: 'chatbot', component: ChatComponent },
      { path: 'chat-pdf', component: ChatPdfComponent },
      { path: 'profile', component: ProfileComponent },
      { path: 'post', component: PostComponent },
      { path: 'post/create', component: CreatePostComponent },
      { path: 'my-posts', redirectTo: 'post' },
    ]
  },
  { path: 'login', component: LoginComponent },
  { path: 'register', component: RegisterComponent },
  { path: '**', redirectTo: '' }
];


