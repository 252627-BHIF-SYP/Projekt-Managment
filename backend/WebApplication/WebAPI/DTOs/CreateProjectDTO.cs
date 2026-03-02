using Core.Enums;

namespace WebAPI.DTOs
{
    public record CreateProjectDTO(string title, string description, string githubURL, string logoURL, int schoolYearId, string projectStatus, string technologies, ProjectStudentDTO[] students, ProjectSupervisorDTO[] supervisors);
}