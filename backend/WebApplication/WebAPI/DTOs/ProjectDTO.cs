using Core.Enums;

namespace WebAPI.DTOs
{
    public record ProjectDTO(string title, string description, string githubURL, string logoURL, int schoolYearId, string projectStatus, string technologies, string projectType, ProjectStudentDTO[] students, ProjectSupervisorDTO[] supervisors);
}