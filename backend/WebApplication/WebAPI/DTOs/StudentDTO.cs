namespace WebAPI.DTOs
{
    public record StudentCreateDTO(string StudentID, string FirstName, string LastName, int ClassId, int SchoolYearId);
}
