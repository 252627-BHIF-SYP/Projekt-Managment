using Microsoft.EntityFrameworkCore;
using Microsoft.EntityFrameworkCore.Metadata.Builders;
using Persistence.Entities;

namespace Persistence.Configurations;

public class JuryMemberConfiguration : IEntityTypeConfiguration<JuryMember>
{
    public void Configure(EntityTypeBuilder<JuryMember> builder)
    {
        builder.ToTable("JuryMember");

        builder.HasKey(j => j.Id);

        builder.Property(j => j.Id)
            .HasColumnName("JuryMemberId")
            .ValueGeneratedOnAdd();

        builder.Property(j => j.ProfessorId)
            .HasMaxLength(128);

        builder.Property(j => j.ExternalName)
            .HasMaxLength(150);

        builder.Property(j => j.ExternalEmail)
            .HasMaxLength(150);

        builder.Property(j => j.Role)
            .IsRequired()
            .HasMaxLength(50);

        builder.Property(j => j.AddedAtUtc)
            .IsRequired();

        builder.HasOne(j => j.Competition)
            .WithMany(c => c.JuryMembers)
            .HasForeignKey(j => j.CompetitionId)
            .OnDelete(DeleteBehavior.Cascade);

        builder.HasOne(j => j.Professor)
            .WithMany()
            .HasForeignKey(j => j.ProfessorId)
            .OnDelete(DeleteBehavior.SetNull);
    }
}
