using Microsoft.EntityFrameworkCore;
using Microsoft.EntityFrameworkCore.Metadata.Builders;
using Persistence.Entities;

namespace Persistence.Configurations;

public class CompetitionProjectConfiguration : IEntityTypeConfiguration<CompetitionProject>
{
    public void Configure(EntityTypeBuilder<CompetitionProject> builder)
    {
        builder.ToTable("CompetitionProject");

        builder.HasKey(cp => new { cp.CompetitionId, cp.ProjectId });

        builder.Property(cp => cp.JoinedAtUtc)
            .IsRequired();

        builder.Property(cp => cp.Note)
            .HasMaxLength(500);

        builder.HasOne(cp => cp.Competition)
            .WithMany(c => c.CompetitionProjects)
            .HasForeignKey(cp => cp.CompetitionId)
            .OnDelete(DeleteBehavior.Cascade);

        builder.HasOne(cp => cp.Project)
            .WithMany(p => p.CompetitionProjects)
            .HasForeignKey(cp => cp.ProjectId)
            .OnDelete(DeleteBehavior.Cascade);
    }
}
