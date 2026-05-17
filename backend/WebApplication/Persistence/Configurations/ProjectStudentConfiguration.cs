using Microsoft.EntityFrameworkCore;
using Microsoft.EntityFrameworkCore.Metadata.Builders;
using Persistence.Entities;

namespace Persistence.Configurations;

public class ProjectStudentConfiguration : IEntityTypeConfiguration<ProjectStudent>
{
    public void Configure(EntityTypeBuilder<ProjectStudent> builder)
    {
        builder.ToTable("ProjectStudent");

        builder.HasKey(p => p.Id);

        builder.Property(p => p.Id)
            .HasColumnName("ProjectStudentId")
            .ValueGeneratedOnAdd();

        builder.Property(p => p.Role)
            .IsRequired()
            .HasMaxLength(100);

        builder.HasIndex(p => new { p.ProjectId, p.HistoryId })
            .IsUnique();

        builder.HasOne(p => p.Project)
            .WithMany(p => p.ProjectStudents)
            .HasForeignKey(p => p.ProjectId)
            .OnDelete(DeleteBehavior.Cascade);

        builder.HasOne(p => p.StudentClassHistory)
            .WithMany(h => h.ProjectStudents)
            .HasForeignKey(p => p.HistoryId)
            .OnDelete(DeleteBehavior.Cascade);
    }
}
