using Microsoft.EntityFrameworkCore;
using Microsoft.EntityFrameworkCore.Metadata.Builders;
using Persistence.Entities;

namespace Persistence.Configurations;

public class StudentClassHistoryConfiguration : IEntityTypeConfiguration<StudentClassHistory>
{
    public void Configure(EntityTypeBuilder<StudentClassHistory> builder)
    {
        builder.ToTable("StudentClassHistory");

        builder.HasKey(h => h.Id);

        builder.Property(h => h.Id)
            .HasColumnName("HistoryId")
            .ValueGeneratedOnAdd();

        builder.HasIndex(h => new { h.StudentId, h.ClassId, h.SchoolYearId })
            .IsUnique();

        builder.HasOne(h => h.Student)
            .WithMany(s => s.StudentClassHistories)
            .HasForeignKey(h => h.StudentId)
            .OnDelete(DeleteBehavior.Cascade);

        builder.HasOne(h => h.StudentClass)
            .WithMany(c => c.StudentClassHistories)
            .HasForeignKey(h => h.ClassId)
            .OnDelete(DeleteBehavior.Cascade);

        builder.HasOne(h => h.SchoolYear)
            .WithMany(y => y.StudentClassHistories)
            .HasForeignKey(h => h.SchoolYearId)
            .OnDelete(DeleteBehavior.Cascade);
    }
}
