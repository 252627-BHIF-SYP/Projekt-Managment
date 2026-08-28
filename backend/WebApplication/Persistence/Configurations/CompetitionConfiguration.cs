using Microsoft.EntityFrameworkCore;
using Microsoft.EntityFrameworkCore.Metadata.Builders;
using Persistence.Entities;

namespace Persistence.Configurations;

public class CompetitionConfiguration : IEntityTypeConfiguration<Competition>
{
    public void Configure(EntityTypeBuilder<Competition> builder)
    {
        builder.ToTable("Competition");

        builder.HasKey(c => c.Id);

        builder.Property(c => c.Id)
            .HasColumnName("CompetitionId")
            .ValueGeneratedOnAdd();

        builder.Property(c => c.Name)
            .IsRequired()
            .HasMaxLength(200);

        builder.Property(c => c.CompetitionType)
            .HasConversion<string>()
            .HasMaxLength(50)
            .IsRequired();

        builder.Property(c => c.Status)
            .HasConversion<string>()
            .HasMaxLength(50)
            .IsRequired();

        builder.Property(c => c.StartDate)
            .IsRequired();

        builder.Property(c => c.EndDate);

        builder.Property(c => c.PresentationDurationMinutes)
            .IsRequired();

        builder.Property(c => c.BreakDurationMinutes)
            .IsRequired();

        builder.Property(c => c.AllowedClassTypes)
            .HasMaxLength(100)
            .IsRequired();

        builder.Property(c => c.CreatedAtUtc)
            .IsRequired();
    }
}
