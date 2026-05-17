using Microsoft.EntityFrameworkCore;
using Microsoft.EntityFrameworkCore.Metadata.Builders;
using Persistence.Entities;

namespace Persistence.Configurations;

public class SchoolYearConfiguration : IEntityTypeConfiguration<SchoolYear>
{
    public void Configure(EntityTypeBuilder<SchoolYear> builder)
    {
        builder.ToTable("SchoolYear");

        builder.HasKey(s => s.Id);

        builder.Property(s => s.Id)
            .HasColumnName("SchoolYearId")
            .ValueGeneratedOnAdd();

        builder.Property(s => s.Year)
            .IsRequired()
            .HasMaxLength(20);

        builder.HasIndex(s => s.Year)
            .IsUnique();
    }
}
