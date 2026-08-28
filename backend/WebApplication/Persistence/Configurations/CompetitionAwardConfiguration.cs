using Microsoft.EntityFrameworkCore;
using Microsoft.EntityFrameworkCore.Metadata.Builders;
using Persistence.Entities;

namespace Persistence.Configurations;

public class CompetitionAwardConfiguration : IEntityTypeConfiguration<CompetitionAward>
{
    public void Configure(EntityTypeBuilder<CompetitionAward> builder)
    {
        builder.ToTable("CompetitionAward");

        builder.HasKey(a => a.Id);

        builder.Property(a => a.Id)
            .HasColumnName("AwardId")
            .ValueGeneratedOnAdd();

        builder.Property(a => a.Name)
            .IsRequired()
            .HasMaxLength(150);

        builder.Property(a => a.PrizeDetails)
            .HasMaxLength(500);

        builder.HasOne(a => a.Competition)
            .WithMany(c => c.Awards)
            .HasForeignKey(a => a.CompetitionId)
            .OnDelete(DeleteBehavior.Cascade);

        builder.HasOne(a => a.WinningProject)
            .WithMany()
            .HasForeignKey(a => a.WinningProjectId)
            .OnDelete(DeleteBehavior.SetNull);
    }
}
