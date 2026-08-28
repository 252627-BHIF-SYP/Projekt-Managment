using Microsoft.EntityFrameworkCore;
using Microsoft.EntityFrameworkCore.Metadata.Builders;
using Persistence.Entities;

namespace Persistence.Configurations;

public class EvaluationCriterionConfiguration : IEntityTypeConfiguration<EvaluationCriterion>
{
    public void Configure(EntityTypeBuilder<EvaluationCriterion> builder)
    {
        builder.ToTable("EvaluationCriterion");

        builder.HasKey(c => c.Id);

        builder.Property(c => c.Id)
            .HasColumnName("CriterionId")
            .ValueGeneratedOnAdd();

        builder.Property(c => c.Name)
            .IsRequired()
            .HasMaxLength(150);

        builder.Property(c => c.Description)
            .HasMaxLength(500);

        builder.Property(c => c.MinScore)
            .IsRequired();

        builder.Property(c => c.MaxScore)
            .IsRequired();

        builder.Property(c => c.Weight)
            .IsRequired();

        builder.Property(c => c.OrderIndex)
            .IsRequired();

        builder.HasOne(c => c.Competition)
            .WithMany(comp => comp.EvaluationCriteria)
            .HasForeignKey(c => c.CompetitionId)
            .OnDelete(DeleteBehavior.Cascade);
    }
}
