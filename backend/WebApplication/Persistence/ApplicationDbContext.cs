using Core.Entities;
using Microsoft.EntityFrameworkCore;

namespace Persistence;

public class ApplicationDbContext : DbContext
{
    public ApplicationDbContext(DbContextOptions<ApplicationDbContext> options)
        : base(options)
    {
    }

    public DbSet<StudentClass> StudentClass => Set<StudentClass>();

    protected override void OnModelCreating(ModelBuilder modelBuilder)
    {
        base.OnModelCreating(modelBuilder);

        ConfigureSchoolYear(modelBuilder);
        ConfigureStudent(modelBuilder);
        ConfigureProfessor(modelBuilder);
        ConfigureStudentClass(modelBuilder);
        ConfigureStudentClassHistory(modelBuilder);
        ConfigureProject(modelBuilder);
        ConfigureProjectStudent(modelBuilder);
        ConfigureProjectSupervisor(modelBuilder);
    }

    private void ConfigureStudent(ModelBuilder modelBuilder)
    {
        modelBuilder.Entity<Student>().HasKey(s => s.StudentId);

        modelBuilder.Entity<Student>().Property(s => s.StudentId)
        .ValueGeneratedOnAdd();
    }

    private void ConfigureProfessor(ModelBuilder modelBuilder)
    {
        modelBuilder.Entity<Professor>().HasKey(p => p.ProfessorId);
    }

    private void ConfigureProject(ModelBuilder modelBuilder)
    {
        modelBuilder.Entity<Project>(entity =>
        {
            entity.HasKey(p => p.ProjectId);
            entity.HasOne(p => p.SchoolYear)
            .WithMany(p => p.Projects)
            .HasForeignKey(p => p.SchoolYearId)
            .OnDelete(DeleteBehavior.Cascade);

            entity.Property(p => p.ProjectId)
            .ValueGeneratedOnAdd();
        });
    }

    private void ConfigureProjectSupervisor(ModelBuilder modelBuilder)
    {
        modelBuilder.Entity<ProjectSupervisor>(entity =>
        {
            entity.HasKey(p => p.ProjectSupervisorId);
            entity.Property(p => p.ProjectSupervisorId)
            .ValueGeneratedOnAdd();

            entity.HasIndex(p => new {p.ProjectId, p.ProfessorId}).IsUnique();

            entity.HasOne(p => p.Professor)
            .WithMany(p => p.ProjectSupervisors)
            .HasForeignKey(p => p.ProfessorId)
            .OnDelete(DeleteBehavior.Cascade);

            entity.HasOne(p => p.Project)
            .WithMany(p => p.ProjectSupervisors)
            .HasForeignKey(p => p.ProjectId)
            .OnDelete(DeleteBehavior.Cascade);
        });
    }

    private void ConfigureSchoolYear(ModelBuilder modelBuilder)
    {
        modelBuilder.Entity<SchoolYear>(entity =>
        {
            entity.HasKey(s => s.SchoolYearId);

            entity.Property(s => s.SchoolYearId)
            .ValueGeneratedOnAdd();
        });
    }

    private void ConfigureStudentClass(ModelBuilder modelBuilder)
    {
        modelBuilder.Entity<StudentClass>(entity =>
        {
            entity.HasKey(s => s.ClassId);
            entity.Property(s => s.ClassId)
           .ValueGeneratedOnAdd();
        });
    }

    private void ConfigureStudentClassHistory(ModelBuilder modelBuilder)
    {
        modelBuilder.Entity<StudentClassHistory>(entity =>
        {
            entity.HasKey(s => s.HistoryId);
            entity.Property(s => s.HistoryId)
            .ValueGeneratedOnAdd();

            entity.HasIndex(s => new { s.StudentId, s.ClassId, s.SchoolYearId }).IsUnique();

            entity.HasOne(s => s.Student)
            .WithMany(s => s.StudentClassHistory)
            .HasForeignKey(s => s.StudentId)
            .OnDelete(DeleteBehavior.Cascade);

            entity.HasOne(sc => sc.StudentClass)
            .WithMany(sc => sc.StudentClassHistory)
            .HasForeignKey(sc => sc.ClassId)
            .OnDelete(DeleteBehavior.Cascade);

            entity.HasOne(sy => sy.SchoolYear)
            .WithMany(sy => sy.StudentClassHistory)
            .HasForeignKey(sy => sy.SchoolYearId)
            .OnDelete(DeleteBehavior.Cascade);
        });
    }

    private void ConfigureProjectStudent(ModelBuilder modelBuilder)
    {
        modelBuilder.Entity<ProjectStudent>(entity =>
        {
            entity.HasKey(p => p.ProjectStudentId);
            entity.Property(p => p.ProjectStudentId).ValueGeneratedOnAdd();

            entity.HasIndex(p => new { p.ProjectId, p.HistoryId }).IsUnique();

            entity.HasOne(p => p.Project)
            .WithMany(p => p.ProjectStudents)
            .HasForeignKey(p => p.ProjectId)
            .OnDelete(DeleteBehavior.Cascade);

            entity.HasOne(p => p.StudentClassHistory)
            .WithMany(p => p.ProjectStudents)
            .HasForeignKey(p => p.HistoryId)
            .OnDelete(DeleteBehavior.Cascade);
        });
    }
}