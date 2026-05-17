import { Component, OnInit } from '@angular/core';
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
import { Project, SchoolYear, User, StudentProfile, ProjectStatus, StudentStatus } from '../../core/models';

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
  project: Partial<Project> = {
    title: '',
    description: '',
    githubUrl: '',
    status: ProjectStatus.NEW
  };

  schoolYears: SchoolYear[] = [];
  supervisors: User[] = [];
  selectedStudents: StudentProfile[] = [];
  primarySupervisorId = '';
  additionalSupervisors: string[] = [];
  selectedStudentIds: string[] = [];
  saving = false;
  isEditMode = false;
  projectId?: string;
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

  constructor(
    private route: ActivatedRoute,
    private projectService: ProjectService,
    private schoolYearService: SchoolYearService,
    private userService: UserService,
    private router: Router,
    private snackBar: MatSnackBar
  ) {}

  ngOnInit(): void {
    this.projectId = this.route.snapshot.paramMap.get('id') || undefined;
    this.isEditMode = !!this.projectId;

    if (!this.isEditMode) {
      const preselected = this.schoolYearService.getSelectedSchoolYear();
      if (preselected) {
        this.project.schoolYearId = preselected.id;
        this.project.schoolYearIds = [preselected.id];
      }
    }

    this.loadData();

    if (this.isEditMode && this.projectId) {
      this.loadProjectForEdit(this.projectId);
    }
  }

  loadData(): void {
    this.schoolYearService.getSchoolYears().subscribe({
      next: (years) => {
        this.schoolYears = years || [];
        if (!this.isEditMode && this.schoolYears.length > 0 && (!this.project.schoolYearIds || this.project.schoolYearIds.length === 0)) {
          this.onSchoolYearsChange([this.schoolYears[0].id]);
        }
      },
      error: (error) => {
        console.error('Error loading school years:', error);
      }
    });

    this.userService.getSupervisors().subscribe(supervisors => {
      this.supervisors = supervisors;
    });
  }

  loadProjectForEdit(id: string): void {
    this.projectService.getProjectById(id).subscribe({
      next: (project) => {
        this.project = {
          ...project,
          schoolYearIds: project.schoolYearIds || [],
          schoolYearId: project.schoolYearIds?.[0] || project.schoolYearId
        };
        this.technologiesText = project.technologies?.join(', ') || '';

        const primarySupervisor = project.supervisors?.find(supervisor => supervisor.isPrimary) || project.supervisors?.[0];
        this.primarySupervisorId = primarySupervisor?.supervisorId || '';
        this.additionalSupervisors = project.supervisors
          ?.filter(supervisor => supervisor.supervisorId !== this.primarySupervisorId)
          .map(supervisor => supervisor.supervisorId) || [];

        this.selectedStudentIds = project.students?.map(student => student.studentId) || [];
        this.selectedStudents = project.students?.map(student => ({
          id: student.studentId,
          userId: student.studentId,
          studentNumber: student.studentId,
          firstName: student.firstName || student.studentName?.split(' ')[0] || '',
          lastName: student.lastName || student.studentName?.split(' ').slice(1).join(' ') || '',
          email: student.studentEmail || `${student.studentId.toLowerCase()}@school.at`,
          classId: '',
          className: student.className,
          schoolYearId: this.project.schoolYearId || '',
          status: StudentStatus.ASSIGNED,
          historyId: student.historyId,
          histories: student.historyId ? [{
            historyId: student.historyId,
            classId: 0,
            className: student.className || '',
            branch: '',
            schoolYearId: Number(this.project.schoolYearId || 0),
            schoolYear: this.project.schoolYear || ''
          }] : [],
          createdAt: new Date(),
          updatedAt: new Date()
        })) || [];
      },
      error: (error) => {
        console.error('Error loading project:', error);
        this.snackBar.open('Failed to load project.', 'Close', {
          duration: 5000
        });
        this.router.navigate(['/projects']);
      }
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
    this.selectedStudents = students;
  }

  onSchoolYearsChange(ids: string[]): void {
    this.project.schoolYearIds = ids;
    this.project.schoolYearId = ids[0] || '';
  }

  get teamSize(): number {
    return this.selectedStudents.length;
  }

  getSupervisorName(id: string): string {
    const supervisor = this.supervisors.find(s => s.id === id);
    return supervisor ? `${supervisor.firstName} ${supervisor.lastName}` : '';
  }

  get additionalSupervisorOptions(): User[] {
    return this.supervisors.filter(supervisor => supervisor.id !== this.primarySupervisorId);
  }

  get selectedAdditionalSupervisorIds(): string[] {
    return [...new Set(this.additionalSupervisors.filter(id => !!id && id !== this.primarySupervisorId))];
  }

  getAdditionalSupervisorNames(): string {
    return this.selectedAdditionalSupervisorIds
      .map(id => this.getSupervisorName(id))
      .join(', ');
  }

  onPrimarySupervisorChange(): void {
    this.additionalSupervisors = this.selectedAdditionalSupervisorIds;
  }

  onAdditionalSupervisorsChange(ids: string[]): void {
    this.additionalSupervisors = [...new Set((ids || []).filter(id => !!id && id !== this.primarySupervisorId))];
  }

  saveProject(): void {
    this.saving = true;

    if (this.technologiesText) {
      this.project.technologies = this.technologiesText
        .split(/[,;]/)
        .map(t => t.trim())
        .filter(t => t.length > 0);
    }

    const selectedSchoolYearIds = this.project.schoolYearIds || [];
    const students = this.selectedStudents
      .map(student => {
        const matchingHistory = student.histories?.find(history =>
          selectedSchoolYearIds.includes(String(history.schoolYearId)));
        const historyId = matchingHistory?.historyId ?? student.historyId;
        return historyId ? { historyId, role: 'Member' } : undefined;
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

    console.debug(`[ProjectCreate] Final payload:`, payload);

    const request = this.isEditMode && this.projectId
      ? this.projectService.updateProject(this.projectId, payload)
      : this.projectService.createProject(payload);

    request.subscribe({
      next: (savedProject) => {
        this.snackBar.open(this.isEditMode ? 'Project updated successfully!' : 'Project created successfully!', 'Close', {
          duration: 3000
        });
        this.router.navigate(this.isEditMode ? ['/projects', savedProject.id] : ['/projects']);
      },
      error: (error) => {
        console.error('Error saving project:', error);
        this.snackBar.open('Failed to save project. Please try again.', 'Close', {
          duration: 5000
        });
        this.saving = false;
      }
    });
  }

  goBack(): void {
    this.router.navigate(['/projects']);
  }
}

