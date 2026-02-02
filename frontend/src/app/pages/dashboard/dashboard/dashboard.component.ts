import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { MatCardModule } from '@angular/material/card';
import { MatIconModule } from '@angular/material/icon';
import { MatButtonModule } from '@angular/material/button';
import { RouterModule } from '@angular/router';
import { Observable } from 'rxjs';
import { AuthService } from '../../../core/services/auth.service';
import { ProjectService } from '../../services/project.service';
import { User, Project } from '../../../core/models';
import { Role } from '../../../core/models/user.model';

@Component({
  selector: 'app-dashboard',
  standalone: true,
  imports: [CommonModule, MatCardModule, MatIconModule, MatButtonModule, RouterModule],
  templateUrl: './dashboard.component.html',
  styleUrl: './dashboard.component.scss'
})
export class DashboardComponent implements OnInit {
  currentUser$!: Observable<User>;
  projects$!: Observable<Project[]>;

  constructor(
    private authService: AuthService,
    private projectService: ProjectService
  ) {}

  ngOnInit(): void {
    this.currentUser$ = this.authService.currentUser$;
    this.projects$ = this.projectService.getProjects();
  }

  getInProgressCount(): number {
    // TODO: Implement in progress count
    return 5;
  }

  getCompletedCount(): number {
    // TODO: Implement completed count
    return 8;
  }

  canCreateProject(): boolean {
    // TODO: Check if user has permission to create projects
    return true;
  }

  canImport(): boolean {
    // TODO: Check if user is admin or AV
    return true;
  }
}
