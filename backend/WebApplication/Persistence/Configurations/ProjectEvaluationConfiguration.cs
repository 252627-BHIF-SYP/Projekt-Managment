using Microsoft.EntityFrameworkCore;
using Microsoft.EntityFrameworkCore.Metadata.Builders;
using Persistence.Entities;

namespace Persistence.Configurations;

public class ProjectEvaluationConfiguration : IEntityTypeConfiguration<ProjectEvaluation>
{
    public void Configure(EntityTypeBuilder<ProjectEvaluation> builder)
    {
        builder.ToTable("ProjectEvaluation");

        builder.HasKey(e => e.Id);

        builder.Property(e => e.Id)
            .HasColumnName("EvaluationId")
            .ValueGeneratedOnAdd();

        builder.Property(e => e.Score)
            .IsRequired();

        builder.Property(e => e.Note)
            .HasMaxLength(2000);

        builder.Property(e => e.UpdatedAtUtc)
            .IsRequired();

        builder.HasOne(e => e.Competition)
            .WithMany(c => c.Evaluations)
            .HasForeignKey(e => e.CompetitionId)
            .OnDelete(DeleteBehavior.Cascade);

        builder.HasOne(e => e.Project)
            .WithMany()
            .HasForeignKey(e => e.ProjectId)
            .OnDelete(DeleteBehavior.Cascade);

        builder.HasOne(e => e.JuryMember)
            .WithMany(j => j.Evaluations)
            .HasForeignKey(e => e.JuryMemberId)
            .OnDelete(DeleteBehavior.Cascade);

        builder.HasOne(e => e.Criterion)
            .WithMany(c => c.Evaluations)
            .HasForeignKey(e => e.CriterionId)
            .OnDelete(DeleteBehavior.Cascade);

        builder.HasIndex(e => new { e.CompetitionId, e.ProjectId, e.JuryMemberId, e.CriterionId })
            .IsUnique();
    }
}
