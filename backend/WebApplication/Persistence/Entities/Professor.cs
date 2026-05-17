namespace Persistence.Entities;

public class Professor : Person
{
    public Professor()
    {
        PersonType = PersonType.Professor;
    }

    public ICollection<ProjectSupervisor> ProjectSupervisors { get; init; } = [];
}
