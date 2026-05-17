using Microsoft.EntityFrameworkCore;
using Microsoft.EntityFrameworkCore.Metadata.Builders;
using Persistence.Entities;

namespace Persistence.Configurations;

public class PersonConfiguration : IEntityTypeConfiguration<Person>
{
    public void Configure(EntityTypeBuilder<Person> builder)
    {
        builder.ToTable("Person");

        builder.HasKey(p => p.Id);

        builder.Property(p => p.Id)
            .HasMaxLength(128);

        builder.Property(p => p.FirstName)
            .IsRequired()
            .HasMaxLength(100);

        builder.Property(p => p.LastName)
            .IsRequired()
            .HasMaxLength(100);

        builder.Property(p => p.PersonType)
            .HasConversion<string>()
            .HasMaxLength(20)
            .IsRequired();

        builder.HasDiscriminator(p => p.PersonType)
            .HasValue<Person>(PersonType.Other)
            .HasValue<Student>(PersonType.Student)
            .HasValue<Professor>(PersonType.Professor);
    }
}
