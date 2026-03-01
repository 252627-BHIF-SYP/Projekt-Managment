using Core.Enums;

namespace WebAPI.DTOs
{
    public record ProjectDTO(string title, string description, string githubURL, string logoURL, string schoolYear, string projectStatus);
}
