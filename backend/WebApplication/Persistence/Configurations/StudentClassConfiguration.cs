using Microsoft.EntityFrameworkCore;
using Microsoft.EntityFrameworkCore.Metadata.Builders;
using Persistence.Entities;

namespace Persistence.Configurations;

public class StudentClassConfiguration : IEntityTypeConfiguration<StudentClass>
{
    public void Configure(EntityTypeBuilder<StudentClass> builder)
    {
        builder.ToTable("StudentClass");

        builder.HasKey(c => c.Id);

        builder.Property(c => c.Id)
            .HasColumnName("ClassId")
            .ValueGeneratedOnAdd();

        builder.Property(c => c.Name)
            .IsRequired()
            .HasMaxLength(30);

        builder.Property(c => c.Branch)
            .IsRequired()
            .HasMaxLength(80);

        builder.HasIndex(c => new { c.Name, c.Branch })
            .IsUnique();
    }
}
