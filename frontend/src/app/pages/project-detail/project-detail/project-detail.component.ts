import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { MatCardModule } from '@angular/material/card';
import { MatTabsModule } from '@angular/material/tabs';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatListModule } from '@angular/material/list';
import { MatChipsModule } from '@angular/material/chips';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { ActivatedRoute } from '@angular/router';
import { Location } from '@angular/common';
import { Project, ChangeRequest } from '../../../core/models';
import { ProjectService } from '../../services/project.service';
import { ChangeRequestService } from '../../services/change-request.service';
import { ChangeRequestListComponent } from '../../../shared/components/change-request-list/change-request-list/change-request-list.component';

@Component({
  selector: 'app-project-detail',
  standalone: true,
  imports: [
    CommonModule,
    MatCardModule,
    MatTabsModule,
    MatButtonModule,
    MatIconModule,
    MatListModule,
    MatChipsModule,
    MatProgressSpinnerModule,
    ChangeRequestListComponent
  ],
  templateUrl: './project-detail.component.html',
  styleUrl: './project-detail.component.scss'
})
export class ProjectDetailComponent implements OnInit {
  project: Project | null = null;
  changeRequests: ChangeRequest[] = [];
  loading = false;

  constructor(
    private projectService: ProjectService,
    private changeRequestService: ChangeRequestService,
    private route: ActivatedRoute,
    private location: Location
  ) {}

  ngOnInit(): void {
    this.loading = true;
    const projectId = this.route.snapshot.paramMap.get('id');

    if (projectId) {
      this.projectService.getProjectById(projectId).subscribe({
        next: (project) => {
          this.project = project;
          this.loading = false;
          this.loadChangeRequests(projectId);
        },
        error: () => {
          this.loading = false;
        }
      });
    }
  }

  loadChangeRequests(projectId: string): void {
    this.changeRequestService.getProjectChangeRequests(projectId).subscribe({
      next: (requests) => {
        this.changeRequests = requests;
      }
    });
  }

  goBack(): void {
    this.location.back();
  }
}
