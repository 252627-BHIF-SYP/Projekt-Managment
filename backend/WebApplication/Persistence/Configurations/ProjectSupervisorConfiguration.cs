using Microsoft.EntityFrameworkCore;
using Microsoft.EntityFrameworkCore.Metadata.Builders;
using Persistence.Entities;

namespace Persistence.Configurations;

public class ProjectSupervisorConfiguration : IEntityTypeConfiguration<ProjectSupervisor>
{
    public void Configure(EntityTypeBuilder<ProjectSupervisor> builder)
    {
        builder.ToTable("ProjectSupervisor");

        builder.HasKey(p => p.Id);

        builder.Property(p => p.Id)
            .HasColumnName("ProjectSupervisorId")
            .ValueGeneratedOnAdd();

        builder.Property(p => p.ProfessorId)
            .IsRequired()
            .HasMaxLength(128);

        builder.Property(p => p.Role)
            .IsRequired()
            .HasMaxLength(100);

        builder.HasIndex(p => new { p.ProjectId, p.ProfessorId })
            .IsUnique();

        builder.HasOne(p => p.Project)
            .WithMany(p => p.ProjectSupervisors)
            .HasForeignKey(p => p.ProjectId)
            .OnDelete(DeleteBehavior.Cascade);

        builder.HasOne(p => p.Professor)
            .WithMany(p => p.ProjectSupervisors)
            .HasForeignKey(p => p.ProfessorId)
            .OnDelete(DeleteBehavior.Cascade);
    }
}
