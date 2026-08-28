using Microsoft.EntityFrameworkCore;
using Microsoft.EntityFrameworkCore.Metadata.Builders;
using Persistence.Entities;

namespace Persistence.Configurations;

public class ScheduleSlotConfiguration : IEntityTypeConfiguration<ScheduleSlot>
{
    public void Configure(EntityTypeBuilder<ScheduleSlot> builder)
    {
        builder.ToTable("ScheduleSlot");

        builder.HasKey(ss => ss.Id);

        builder.Property(ss => ss.Id)
            .HasColumnName("ScheduleSlotId")
            .ValueGeneratedOnAdd();

        builder.Property(ss => ss.SlotType)
            .HasConversion<string>()
            .HasMaxLength(30)
            .IsRequired();

        builder.Property(ss => ss.Date)
            .IsRequired();

        builder.Property(ss => ss.StartTime)
            .IsRequired();

        builder.Property(ss => ss.DurationMinutes)
            .IsRequired();

        builder.Property(ss => ss.Title)
            .IsRequired()
            .HasMaxLength(200);

        builder.Property(ss => ss.Note)
            .HasMaxLength(1000);

        builder.HasOne(ss => ss.Competition)
            .WithMany(c => c.ScheduleSlots)
            .HasForeignKey(ss => ss.CompetitionId)
            .OnDelete(DeleteBehavior.Cascade);

        builder.HasOne(ss => ss.Project)
            .WithMany(p => p.ScheduleSlots)
            .HasForeignKey(ss => ss.ProjectId)
            .OnDelete(DeleteBehavior.SetNull);
    }
}
