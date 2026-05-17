using Microsoft.EntityFrameworkCore;
using Persistence.Entities;

namespace Persistence;

public class ApplicationDbContext(DbContextOptions<ApplicationDbContext> options) : DbContext(options)
{
    public DbSet<SchoolYear> SchoolYears => Set<SchoolYear>();
    public DbSet<Person> People => Set<Person>();
    public DbSet<Student> Students => Set<Student>();
    public DbSet<Professor> Professors => Set<Professor>();
    public DbSet<StudentClass> StudentClasses => Set<StudentClass>();
    public DbSet<StudentClassHistory> StudentClassHistories => Set<StudentClassHistory>();
    public DbSet<Project> Projects => Set<Project>();
    public DbSet<ProjectStudent> ProjectStudents => Set<ProjectStudent>();
    public DbSet<ProjectSupervisor> ProjectSupervisors => Set<ProjectSupervisor>();
    public DbSet<SchoolYearProject> SchoolYearProjects => Set<SchoolYearProject>();

    protected override void OnModelCreating(ModelBuilder modelBuilder)
    {
        modelBuilder.ApplyConfigurationsFromAssembly(typeof(ApplicationDbContext).Assembly);
    }
}
