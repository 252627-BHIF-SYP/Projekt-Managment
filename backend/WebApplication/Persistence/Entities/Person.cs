namespace Persistence.Entities;

public class Person
{
    public required string Id { get; set; }

    public required string FirstName { get; set; }

    public required string LastName { get; set; }

    public PersonType PersonType { get; protected set; } = PersonType.Other;
}
