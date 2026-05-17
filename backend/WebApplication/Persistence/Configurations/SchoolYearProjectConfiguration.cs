using Microsoft.EntityFrameworkCore;
using Microsoft.EntityFrameworkCore.Metadata.Builders;
using Persistence.Entities;

namespace Persistence.Configurations;

public class SchoolYearProjectConfiguration : IEntityTypeConfiguration<SchoolYearProject>
{
    public void Configure(EntityTypeBuilder<SchoolYearProject> builder)
    {
        builder.ToTable("SchoolYearProject");

        builder.HasKey(s => s.Id);

        builder.Property(s => s.Id)
            .HasColumnName("SchoolYearProjectId")
            .ValueGeneratedOnAdd();

        builder.HasIndex(s => new { s.ProjectId, s.SchoolYearId })
            .IsUnique();

        builder.HasOne(s => s.Project)
            .WithMany(p => p.SchoolYearProjects)
            .HasForeignKey(s => s.ProjectId)
            .OnDelete(DeleteBehavior.Cascade);

        builder.HasOne(s => s.SchoolYear)
            .WithMany(y => y.SchoolYearProjects)
            .HasForeignKey(s => s.SchoolYearId)
            .OnDelete(DeleteBehavior.Cascade);
    }
}
