import { Component, inject, OnInit, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { ActivatedRoute, Router } from '@angular/router';
import { MatCardModule } from '@angular/material/card';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatSelectModule } from '@angular/material/select';
import { MatOptionModule } from '@angular/material/core';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatStepperModule } from '@angular/material/stepper';
import { MatListModule } from '@angular/material/list';
import { MatSnackBar, MatSnackBarModule } from '@angular/material/snack-bar';
import { StudentPickerComponent } from '../../shared/components/student-picker/student-picker.component';
import { ProjectService } from '../../services/project.service';
import { SchoolYearService } from '../../services/schoolyear.service';
import { UserService } from '../../services/user.service';
import { Project, SchoolYear, User, StudentProfile, ProjectStatus } from '../../core/models';

/**
 * Create project page
 */
@Component({
  selector: 'app-project-create',
  standalone: true,
  imports: [
    CommonModule,
    FormsModule,
    MatCardModule,
    MatFormFieldModule,
    MatInputModule,
    MatSelectModule,
    MatOptionModule,
    MatButtonModule,
    MatIconModule,
    MatStepperModule,
    MatListModule,
    MatSnackBarModule,
    StudentPickerComponent
  ],
  templateUrl: './project-create.component.html',
  styleUrl: './project-create.component.scss'
})
export class ProjectCreateComponent implements OnInit {
  private readonly projectService = inject(ProjectService);
  private readonly schoolYearService = inject(SchoolYearService);
  private readonly userService = inject(UserService);
  private readonly route = inject(ActivatedRoute);
  private readonly router = inject(Router);
  private readonly snackBar = inject(MatSnackBar);

  project: Partial<Project> = {
    title: '',
    description: '',
    githubUrl: '',
    status: ProjectStatus.NEW
  };

  schoolYears = signal<SchoolYear[]>([]);
  supervisors = signal<User[]>([]);
  selectedStudents = signal<StudentProfile[]>([]);
  primarySupervisorId = '';
  additionalSupervisors: string[] = [];
  selectedStudentIds: string[] = [];
  projectId?: string;
  isEditMode = signal(false);
  saving = signal(false);
  ProjectStatus = ProjectStatus;
  projectStatuses: ProjectStatus[] = [
    ProjectStatus.NEW,
    ProjectStatus.PENDING,
    ProjectStatus.ON_GOING,
    ProjectStatus.COMPLETED,
    ProjectStatus.ARCHIVED
  ];
  projectTypes = [
    { value: 'SYP', label: 'SYP-Projekt' },
    { value: 'Diplomarbeit', label: 'DA' },
    { value: 'ProjectAward', label: 'Project Award' },
    { value: 'Others', label: 'Sonstiges' }
  ];
  technologiesText = '';

  ngOnInit(): void {
    const id = this.route.snapshot.paramMap.get('id');
    if (id) {
      this.projectId = id;
      this.isEditMode.set(true);
      this.loadProject(id);
    } else {
      const preselected = this.schoolYearService.getSelectedSchoolYear();
      if (preselected) {
        this.project.schoolYearId = preselected.id;
        this.project.schoolYearIds = [preselected.id];
      }
    }

    this.loadData();
  }

  loadProject(id: string): void {
    this.projectService.getProjectById(id).subscribe({
      next: project => this.fillForm(project),
      error: error => {
        console.error('Error loading project:', error);
        this.snackBar.open('Project could not be loaded.', 'Close', {
          duration: 5000
        });
        this.router.navigate(['/projects']);
      }
    });
  }

  loadData(): void {
    this.schoolYearService.getSchoolYears().subscribe({
      next: (years) => {
        const loadedYears = years || [];
        this.schoolYears.set(loadedYears);
        if (loadedYears.length > 0 && (!this.project.schoolYearIds || this.project.schoolYearIds.length === 0)) {
          this.onSchoolYearsChange([loadedYears[0].id]);
        }
      },
      error: (error) => {
        console.error('Error loading school years:', error);
      }
    });

    this.userService.getSupervisors().subscribe(supervisors => {
      this.supervisors.set(supervisors);
    });
  }

  isBasicInfoComplete(): boolean {
    return !!(
      this.project.title &&
      this.project.description &&
      this.project.schoolYearIds &&
      this.project.schoolYearIds.length > 0 &&
      this.project.status &&
      this.project.projectType
    );
  }

  onStudentsSelected(students: StudentProfile[]): void {
    this.selectedStudents.set(students);
    const nextStudentIds = students.map(student => student.studentNumber || student.id);
    if (!this.hasSameIds(this.selectedStudentIds, nextStudentIds)) {
      this.selectedStudentIds = nextStudentIds;
    }
  }

  onSchoolYearsChange(ids: string[]): void {
    this.project.schoolYearIds = ids;
    this.project.schoolYearId = ids[0] || '';
  }

  get teamSize(): number {
    return this.selectedStudents().length;
  }

  getSupervisorName(id: string): string {
    const supervisor = this.supervisors().find(s => this.compareIds(s.id, id));
    return supervisor ? `${supervisor.firstName} ${supervisor.lastName}` : '';
  }

  get additionalSupervisorOptions(): User[] {
    return this.supervisors().filter(supervisor => !this.compareIds(supervisor.id, this.primarySupervisorId));
  }

  get selectedAdditionalSupervisorIds(): string[] {
    return [...new Set(this.additionalSupervisors.filter(id => !!id && !this.compareIds(id, this.primarySupervisorId)))];
  }

  getAdditionalSupervisorNames(): string {
    return this.selectedAdditionalSupervisorIds
      .map(id => this.getSupervisorName(id))
      .join(', ');
  }

  onPrimarySupervisorChange(): void {
    this.additionalSupervisors = this.selectedAdditionalSupervisorIds;
  }

  toggleAdditionalSupervisor(id: string): void {
    const selected = this.isAdditionalSupervisorSelected(id);

    if (selected) {
      this.additionalSupervisors = this.additionalSupervisors
        .filter(supervisorId => !this.compareIds(supervisorId, id));
      return;
    }

    if (!this.compareIds(id, this.primarySupervisorId)) {
      this.additionalSupervisors = [...this.additionalSupervisors, id];
    }
  }

  isAdditionalSupervisorSelected(id: string): boolean {
    return this.selectedAdditionalSupervisorIds.some(supervisorId => this.compareIds(supervisorId, id));
  }

  compareIds(first?: string, second?: string): boolean {
    const firstId = this.normalizeId(first);
    const secondId = this.normalizeId(second);

    return firstId.length > 0 && firstId === secondId;
  }

  saveProject(): void {
    this.saving.set(true);

    if (this.technologiesText) {
      this.project.technologies = this.technologiesText
        .split(/[,;]/)
        .map(t => t.trim())
        .filter(t => t.length > 0);
    }

    const selectedSchoolYearIds = this.project.schoolYearIds || [];
    const students = this.selectedStudents()
      .map(student => {
        const matchingHistory = student.histories?.find(history =>
          selectedSchoolYearIds.includes(String(history.schoolYearId)));
        const historyId = matchingHistory?.historyId ?? student.historyId;
        return historyId ? { historyId, role: 'Student' } : undefined;
      })
      .filter((student): student is { historyId: number; role: string } => !!student);

    this.submitProject(students);
  }

  private submitProject(students: { historyId: number; role: string }[]): void {
    const supervisors = [
      ...(this.primarySupervisorId ? [{ professorId: this.primarySupervisorId, role: 'Primary' }] : []),
      ...this.selectedAdditionalSupervisorIds.map(id => ({ professorId: id, role: 'Secondary' }))
    ];

    const payload = {
      title: this.project.title || '',
      description: this.project.description || '',
      githubUrl: this.project.githubUrl || '',
      logoUrl: this.project.logoUrl || '',
      schoolYearIds: (this.project.schoolYearIds || []).map(id => Number(id)),
      status: this.project.status || ProjectStatus.NEW,
      technology: (this.project.technologies || []).join(', '),
      projectType: this.project.projectType || 'Others',
      students,
      supervisors
    };

    const request = this.isEditMode() && this.projectId
      ? this.projectService.updateProject(this.projectId, payload)
      : this.projectService.createProject(payload);

    request.subscribe({
      next: (savedProject) => {
        const message = this.isEditMode()
          ? 'Project updated successfully!'
          : 'Project created successfully!';

        this.snackBar.open(message, 'Close', {
          duration: 3000
        });
        this.router.navigate(['/projects', savedProject.id]);
      },
      error: (error) => {
        console.error('Error saving project:', error);
        this.snackBar.open('Failed to save project. Please try again.', 'Close', {
          duration: 5000
        });
        this.saving.set(false);
      }
    });
  }

  goBack(): void {
    if (this.isEditMode() && this.projectId) {
      this.router.navigate(['/projects', this.projectId]);
      return;
    }

    this.router.navigate(['/projects']);
  }

  private fillForm(project: Project): void {
    this.project = {
      title: project.title,
      description: project.description,
      githubUrl: project.githubUrl || '',
      logoUrl: project.logoUrl || '',
      schoolYearId: project.schoolYearId,
      schoolYearIds: project.schoolYearIds || [],
      status: project.status,
      projectType: project.projectType || 'Others',
      technologies: project.technologies || []
    };

    this.technologiesText = (project.technologies || []).join(', ');
    this.selectedStudentIds = (project.students || []).map(student => student.studentId);

    const supervisors = project.supervisors || [];
    const primarySupervisor = supervisors.find(supervisor => supervisor.isPrimary) || supervisors[0];

    this.primarySupervisorId = primarySupervisor?.supervisorId || '';
    this.additionalSupervisors = supervisors
      .filter(supervisor => !this.compareIds(supervisor.supervisorId, this.primarySupervisorId))
      .map(supervisor => supervisor.supervisorId);
  }

  private normalizeId(id?: string): string {
    return (id || '').trim().toLowerCase();
  }

  private hasSameIds(first: string[], second: string[]): boolean {
    if (first.length !== second.length) {
      return false;
    }

    const firstIds = first.map(id => this.normalizeId(id)).sort();
    const secondIds = second.map(id => this.normalizeId(id)).sort();

    return firstIds.every((id, index) => id === secondIds[index]);
  }
}

