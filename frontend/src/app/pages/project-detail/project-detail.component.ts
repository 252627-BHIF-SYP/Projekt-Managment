import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ActivatedRoute, Router } from '@angular/router';
import { MatTabsModule } from '@angular/material/tabs';
import { MatCardModule } from '@angular/material/card';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatChipsModule } from '@angular/material/chips';
import { MatListModule } from '@angular/material/list';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { ChangeRequestListComponent } from '../../shared/components/change-request-list/change-request-list.component';
import { ProjectService } from '../../services/project.service';
import { ChangeRequestService } from '../../services/change-request.service';
import { Project, ChangeRequest } from '../../core/models';

/**
 * Project detail page
 */
@Component({
  selector: 'app-project-detail',
  standalone: true,
  imports: [
    CommonModule,
    MatTabsModule,
    MatCardModule,
    MatButtonModule,
    MatIconModule,
    MatChipsModule,
    MatListModule,
    MatProgressSpinnerModule,
    ChangeRequestListComponent
  ],
  templateUrl: './project-detail.component.html',
  styleUrl: './project-detail.component.scss'
})
export class ProjectDetailComponent implements OnInit {
  project?: Project;
  changeRequests: ChangeRequest[] = [];
  loading = true;
  projectId?: string;

  constructor(
    private route: ActivatedRoute,
    private router: Router,
    private projectService: ProjectService,
    private changeRequestService: ChangeRequestService
  ) {}

  ngOnInit(): void {
    this.route.params.subscribe(params => {
      this.projectId = params['id'];
      if (this.projectId) {
        this.loadProject(this.projectId);
      }
    });
  }

  loadProject(id: string): void {
    this.loading = true;

    Promise.all([
      this.projectService.getProjectById(id).toPromise(),
      this.changeRequestService.getChangeRequestsByProject(id).toPromise()
    ]).then(([project, changeRequests]) => {
      this.project = project;
      this.changeRequests = changeRequests || [];
      this.loading = false;
    }).catch(error => {
      console.error('Error loading project:', error);
      this.loading = false;
    });
  }

  goBack(): void {
    this.router.navigate(['/projects']);
  }
}

