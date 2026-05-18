import { Component, inject, OnInit, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { MatCardModule } from '@angular/material/card';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatIconModule } from '@angular/material/icon';
import { MatListModule } from '@angular/material/list';
import { User } from '../../core/models';
import { UserService } from '../../services/user.service';

@Component({
  selector: 'app-professors',
  standalone: true,
  imports: [
    CommonModule,
    FormsModule,
    MatCardModule,
    MatFormFieldModule,
    MatInputModule,
    MatIconModule,
    MatListModule
  ],
  templateUrl: './professors.component.html',
  styleUrl: './professors.component.scss'
})
export class ProfessorsComponent implements OnInit {
  private readonly userService = inject(UserService);

  professors = signal<User[]>([]);
  filteredProfessors = signal<User[]>([]);
  searchTerm = '';

  ngOnInit(): void {
    this.userService.getSupervisors().subscribe(professors => {
      this.professors.set(professors);
      this.applyFilter();
    });
  }

  applyFilter(): void {
    const term = this.searchTerm.trim().toLowerCase();
    const filtered = this.professors().filter(professor => {
      if (!term) {
        return true;
      }

      const haystack = `${professor.firstName} ${professor.lastName} ${professor.username} ${professor.email}`.toLowerCase();
      return haystack.includes(term);
    });

    this.filteredProfessors.set(filtered);
  }
}
