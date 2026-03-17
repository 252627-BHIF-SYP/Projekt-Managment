import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Router } from '@angular/router';
import { MatCardModule } from '@angular/material/card';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatSelectModule } from '@angular/material/select';
import { MatOptionModule } from '@angular/material/core';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatStepperModule } from '@angular/material/stepper';
import { MatSnackBar, MatSnackBarModule } from '@angular/material/snack-bar';
import { forkJoin } from 'rxjs';
import { StudentPickerComponent } from '../../shared/components/student-picker/student-picker.component';
import { ProjectService } from '../../services/project.service';
import { SchoolYearService } from '../../services/schoolyear.service';
import { UserService } from '../../services/user.service';
import { StudentService } from '../../services/student.service';
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
  saving = false;
  ProjectStatus = ProjectStatus;
  projectStatuses: ProjectStatus[] = [
    ProjectStatus.NEW,
    ProjectStatus.PENDING,
    ProjectStatus.ON_GOING,
    ProjectStatus.COMPLETED,
    ProjectStatus.ARCHIVED
  ];
  projectTypes = [
    { value: 'SYP', label: 'SYP' },
    { value: 'Diplomarbeit', label: 'Diplomarbeit' },
    { value: 'ProjectAward', label: 'Project Award' },
    { value: 'Others', label: 'Others' }
  ];
  technologiesText = '';

  constructor(
    private projectService: ProjectService,
    private schoolYearService: SchoolYearService,
    private userService: UserService,
    private studentService: StudentService,
    private router: Router,
    private snackBar: MatSnackBar
  ) {}

  ngOnInit(): void {
    // Preselect currently selected/active year immediately (before async load)
    const preselected = this.schoolYearService.getSelectedSchoolYear();
    if (preselected) {
      this.project.schoolYearId = preselected.id;
    }
    this.loadData();
  }

  loadData(): void {
    this.schoolYearService.getSchoolYears().subscribe({
      next: (years) => {
        this.schoolYears = years || [];
        const activeYear = this.schoolYears.find(y => y.isActive);
        if (activeYear) {
          this.project.schoolYearId = activeYear.id;
        } else if (this.schoolYears.length > 0 && !this.project.schoolYearId) {
          this.project.schoolYearId = this.schoolYears[0].id;
        } else {
          // Fallback: try to fetch active year directly
          this.schoolYearService.getActiveSchoolYear().subscribe((sy) => {
            if (sy) {
              this.schoolYears = [sy];
              this.project.schoolYearId = sy.id;
            }
          });
        }
      },
      error: () => {
        // Final fallback: attempt active year, else leave empty
        this.schoolYearService.getActiveSchoolYear().subscribe((sy) => {
          if (sy) {
            this.schoolYears = [sy];
            this.project.schoolYearId = sy.id;
          }
        });
      }
    });

    this.userService.getSupervisors().subscribe(supervisors => {
      this.supervisors = supervisors;
    });
  }

  isBasicInfoComplete(): boolean {
    return !!(
      this.project.title &&
      this.project.description &&
      this.project.schoolYearId &&
      this.project.status &&
      this.project.projectType
    );
  }

  onStudentsSelected(students: StudentProfile[]): void {
    this.selectedStudents = students;
  }

  getSupervisorName(id: string): string {
    const supervisor = this.supervisors.find(s => s.id === id);
    return supervisor ? `${supervisor.firstName} ${supervisor.lastName}` : '';
  }

  getAdditionalSupervisorNames(): string {
    return this.additionalSupervisors
      .map(id => this.getSupervisorName(id))
      .join(', ');
  }

  addAdditionalSupervisor(): void {
    this.additionalSupervisors.push('');
  }

  removeAdditionalSupervisor(index: number): void {
    this.additionalSupervisors.splice(index, 1);
  }

  onAdditionalSupervisorChange(): void {
    // Placeholder for change detection
  }

  createProject(): void {
    this.saving = true;

    if (this.technologiesText) {
      this.project.technologies = this.technologiesText
        .split(/[,;]/)
        .map(t => t.trim())
        .filter(t => t.length > 0);
    }

    // If there are no selected students, create the project without them
    if (this.selectedStudents.length === 0) {
      console.debug(`[ProjectCreate] No students selected, creating project without students`);
      this.submitProject([]);
      return;
    }

    console.debug(`[ProjectCreate] Selected students:`, this.selectedStudents);

    // Fetch historyIds for all selected students in parallel
    // Use studentNumber (e.g., "IF200174") as the student identifier
    const historyIdRequests = this.selectedStudents.map(student => {
      console.debug(`[ProjectCreate] Mapping student - id: ${student.id}, studentNumber: ${student.studentNumber}, firstName: ${student.firstName}`);
      return this.studentService.getHistoryIdByStudentId(student.studentNumber);
    });

    forkJoin(historyIdRequests).subscribe({
      next: (historyIds: number[]) => {
        console.debug(`[ProjectCreate] Raw fetched historyIds:`, historyIds);
        
        // Build students array with fetched historyIds
        const students: { historyId: number; role: string }[] = [];
        
        historyIds.forEach((id, index) => {
          console.debug(`[ProjectCreate] Processing historyId ${index}: value=${id}, student=${this.selectedStudents[index].studentNumber}`);
          if (id > 0) {
            students.push({ historyId: id, role: 'Member' });
          } else {
            console.warn(`[ProjectCreate] Invalid historyId for student ${this.selectedStudents[index].studentNumber}: ${id}`);
          }
        });

        console.debug(`[ProjectCreate] Final students array (after filtering):`, students);
        this.submitProject(students);
      },
      error: (error) => {
        console.error('Error fetching history IDs:', error);
        this.snackBar.open('Failed to fetch student data. Please try again.', 'Close', {
          duration: 5000
        });
        this.saving = false;
      }
    });
  }

  private submitProject(students: { historyId: number; role: string }[]): void {
    const supervisors = [] as { professorId: string; role: string }[];
    if (this.primarySupervisorId) {
      supervisors.push({ professorId: this.primarySupervisorId, role: 'Primary' });
    }
    this.additionalSupervisors
      .filter(id => !!id)
      .forEach(id => supervisors.push({ professorId: id, role: 'Secondary' }));

    const payload = {
      title: this.project.title || '',
      description: this.project.description || '',
      githubURL: this.project.githubUrl || '',
      logoURL: this.project.logoUrl || '',
      schoolYearId: Number(this.project.schoolYearId || 0),
      projectStatus: this.project.status || ProjectStatus.NEW,
      technologies: (this.project.technologies || []).join(', '),
      projectType: this.project.projectType || 'Others',
      students,
      supervisors
    };

    console.debug(`[ProjectCreate] Final payload:`, payload);

    this.projectService.createProject(payload).subscribe({
      next: (createdProject) => {
        this.snackBar.open('Project created successfully!', 'Close', {
          duration: 3000
        });
        this.router.navigate(['/projects']);
      },
      error: (error) => {
        console.error('Error creating project:', error);
        this.snackBar.open('Failed to create project. Please try again.', 'Close', {
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

