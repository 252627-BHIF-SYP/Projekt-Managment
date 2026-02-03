using System;
using System.Collections.Generic;
using System.Linq;
using System.Reflection.Emit;
using System.Text;
using System.Threading.Tasks;
using Core.Entities;
using Microsoft.EntityFrameworkCore;

namespace Persistence;

public class AppDbContext : DbContext
{
    public AppDbContext(DbContextOptions<AppDbContext> options)
        : base(options)
    {
    }

    public DbSet<SchoolYear> SchoolYears => Set<SchoolYear>();
    public DbSet<SchoolClass> Classes => Set<SchoolClass>();
    public DbSet<Student> Students => Set<Student>();
    public DbSet<Professor> Professors => Set<Professor>();
    public DbSet<StudentClassHistory> StudentClassHistories => Set<StudentClassHistory>();
    public DbSet<Project> Projects => Set<Project>();
    public DbSet<ProjectStudent> ProjectStudents => Set<ProjectStudent>();
    public DbSet<ProjectSupervisor> ProjectSupervisors => Set<ProjectSupervisor>();

    protected override void OnModelCreating(ModelBuilder modelBuilder)
    {
        base.OnModelCreating(modelBuilder);

        ConfigureSchoolYear(modelBuilder);
        ConfigureSchoolClass(modelBuilder);
        ConfigureStudent(modelBuilder);
        ConfigureProfessor(modelBuilder);
        ConfigureStudentClassHistory(modelBuilder);
        ConfigureProject(modelBuilder);
        ConfigureProjectStudent(modelBuilder);
        ConfigureProjectSupervisor(modelBuilder);
    }

    private void ConfigureSchoolYear(ModelBuilder modelBuilder)
    {
        modelBuilder.Entity<SchoolYear>(entity =>
        {
            entity.ToTable("SchoolYear");
            entity.HasKey(e => e.SchoolYearId);

            entity.Property(e => e.Label)
                  .IsRequired()
                  .HasMaxLength(50);
        });
    }

    private void ConfigureSchoolClass(ModelBuilder modelBuilder)
    {
        modelBuilder.Entity<SchoolClass>(entity =>
        {
            entity.ToTable("Class");

            entity.HasKey(e => e.ClassId);

            entity.Property(e => e.Name)
                  .IsRequired()
                  .HasMaxLength(50);

            entity.Property(e => e.Branch)
                  .IsRequired()
                  .HasMaxLength(50);
        });
    }

    private void ConfigureStudent(ModelBuilder modelBuilder)
    {
        modelBuilder.Entity<Student>(entity =>
        {
            entity.ToTable("Student");

            entity.HasKey(e => e.StudentId);

            entity.Property(e => e.FirstName)
                  .IsRequired()
                  .HasMaxLength(100);

            entity.Property(e => e.LastName)
                  .IsRequired()
                  .HasMaxLength(100);

            entity.Property(e => e.IfName)
                  .IsRequired()
                  .HasMaxLength(50);
        });
    }

    private void ConfigureProfessor(ModelBuilder modelBuilder)
    {
        modelBuilder.Entity<Professor>(entity =>
        {
            entity.ToTable("Professor");

            entity.HasKey(e => e.ProfessorId);

            entity.Property(e => e.FirstName)
                  .IsRequired()
                  .HasMaxLength(100);

            entity.Property(e => e.LastName)
                  .IsRequired()
                  .HasMaxLength(100);
        });
    }

    private void ConfigureStudentClassHistory(ModelBuilder modelBuilder)
    {
        modelBuilder.Entity<StudentClassHistory>(entity =>
        {
            entity.ToTable("StudentClassHistory");

            entity.HasKey(e => e.HistoryId);

            entity.HasOne(e => e.Student)
                  .WithMany(s => s.StudentClassHistories)
                  .HasForeignKey(e => e.StudentId);

            entity.HasOne(e => e.Class)
                  .WithMany(c => c.StudentClassHistories)
                  .HasForeignKey(e => e.ClassId);

            entity.HasOne(e => e.SchoolYear)
                  .WithMany(y => y.StudentClassHistories)
                  .HasForeignKey(e => e.SchoolYearId);
        });
    }

    private void ConfigureProject(ModelBuilder modelBuilder)
    {
        modelBuilder.Entity<Project>(entity =>
        {
            entity.ToTable("Project");

            entity.HasKey(e => e.ProjectId);

            entity.Property(e => e.Title)
                  .IsRequired()
                  .HasMaxLength(200);

            entity.Property(e => e.Status)
                  .IsRequired()
                  .HasMaxLength(50);

            entity.Property(e => e.Technology)
                  .HasMaxLength(200);

            entity.HasOne(e => e.SchoolYear)
                  .WithMany(y => y.Projects)
                  .HasForeignKey(e => e.SchoolYearId);
        });
    }

    private void ConfigureProjectStudent(ModelBuilder modelBuilder)
    {
        modelBuilder.Entity<ProjectStudent>(entity =>
        {
            entity.ToTable("ProjectStudent");

            entity.HasKey(e => new { e.ProjectId, e.HistoryId });

            entity.Property(e => e.Role)
                  .IsRequired()
                  .HasMaxLength(50);

            entity.HasOne(e => e.Project)
                  .WithMany(p => p.ProjectStudents)
                  .HasForeignKey(e => e.ProjectId);

            entity.HasOne(e => e.StudentClassHistory)
                  .WithMany(h => h.ProjectStudents)
                  .HasForeignKey(e => e.HistoryId);
        });
    }

    private void ConfigureProjectSupervisor(ModelBuilder modelBuilder)
    {
        modelBuilder.Entity<ProjectSupervisor>(entity =>
        {
            entity.ToTable("ProjectSupervisor");

            entity.HasKey(e => new { e.ProjectId, e.ProfessorId });

            entity.Property(e => e.Role)
                  .IsRequired()
                  .HasMaxLength(50);

            entity.HasOne(e => e.Project)
                  .WithMany(p => p.ProjectSupervisors)
                  .HasForeignKey(e => e.ProjectId);

            entity.HasOne(e => e.Professor)
                  .WithMany(p => p.ProjectSupervisors)
                  .HasForeignKey(e => e.ProfessorId);
        });
    }
}
