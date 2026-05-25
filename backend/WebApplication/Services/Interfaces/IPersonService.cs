using Persistence.Entities;
using Services.Results;

namespace Services.Interfaces;

public record StudentClassDto(int ClassId, string Name, string Branch);

public record StudentClassHistoryDto(
    int HistoryId,
    int ClassId,
    string ClassName,
    string Branch,
    int SchoolYearId,
    string SchoolYear);

public record StudentDto(
    string Id,
    string FirstName,
    string LastName,
    IReadOnlyList<StudentClassHistoryDto> Histories);

public record StudentProfileDto(
    string Id,
    string Username,
    string FirstName,
    string LastName,
    IReadOnlyList<StudentClassHistoryDto> Histories,
    IReadOnlyList<ProjectDto> Projects);

public record ProfessorDto(string Id, string FirstName, string LastName);

public record PersonCreateDto(
    string Id,
    string FirstName,
    string LastName,
    PersonType PersonType,
    int? ClassId,
    int? SchoolYearId);

public record StudentCountPerYearDto(int SchoolYearId, string Year, int StudentCount);

public interface IPersonService
{
    Task<IReadOnlyList<StudentDto>> GetStudentsAsync();
    Task<StudentDto?> GetStudentByIdAsync(string id);
    Task<ServiceResult<StudentDto>> CreateStudentAsync(PersonCreateDto dto);
    Task<IReadOnlyList<ProfessorDto>> GetProfessorsAsync();
    Task<ProfessorDto?> GetProfessorByIdAsync(string id);
    Task<ServiceResult<ProfessorDto>> CreateProfessorAsync(PersonCreateDto dto);
    Task<int?> GetStudentHistoryIdAsync(string studentId, int? schoolYearId);
    Task<int> CountStudentsAsync();
    Task<int> CountProfessorsAsync();
    Task<IReadOnlyList<StudentCountPerYearDto>> GetStudentCountPerYearAsync();
}
