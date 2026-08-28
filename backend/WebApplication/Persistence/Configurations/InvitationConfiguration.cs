using Microsoft.EntityFrameworkCore;
using Microsoft.EntityFrameworkCore.Metadata.Builders;
using Persistence.Entities;

namespace Persistence.Configurations;

public class InvitationConfiguration : IEntityTypeConfiguration<Invitation>
{
    public void Configure(EntityTypeBuilder<Invitation> builder)
    {
        builder.ToTable("Invitation");

        builder.HasKey(i => i.Id);
        builder.Property(i => i.Id).HasColumnName("InvitationId");

        builder.Property(i => i.Email)
            .IsRequired()
            .HasMaxLength(200);

        builder.Property(i => i.RecipientName)
            .IsRequired()
            .HasMaxLength(200);

        builder.Property(i => i.SchoolName)
            .HasMaxLength(200);

        builder.Property(i => i.TargetRole)
            .HasConversion<string>()
            .HasMaxLength(50)
            .IsRequired();

        builder.Property(i => i.Token)
            .IsRequired()
            .HasMaxLength(128);

        builder.HasIndex(i => i.Token)
            .IsUnique();

        builder.Property(i => i.Status)
            .HasConversion<string>()
            .HasMaxLength(50)
            .IsRequired();

        builder.Property(i => i.CreatedByUserId)
            .HasMaxLength(100);

        builder.HasOne(i => i.Competition)
            .WithMany()
            .HasForeignKey(i => i.CompetitionId)
            .OnDelete(DeleteBehavior.SetNull);

        builder.HasOne(i => i.Project)
            .WithMany()
            .HasForeignKey(i => i.ProjectId)
            .OnDelete(DeleteBehavior.SetNull);
    }
}
