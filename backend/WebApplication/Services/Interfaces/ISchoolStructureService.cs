using Services.Results;

namespace Services.Interfaces;

public record CreateSchoolYearDto(string Year);

public record CreateStudentClassDto(string Name, string Branch);

public interface ISchoolStructureService
{
    Task<IReadOnlyList<SchoolYearDto>> GetSchoolYearsAsync();
    Task<SchoolYearDto?> GetSchoolYearByIdAsync(int id);
    Task<ServiceResult<SchoolYearDto>> CreateSchoolYearAsync(CreateSchoolYearDto dto);
    Task<int> CountSchoolYearsAsync();
    Task<IReadOnlyList<StudentClassDto>> GetStudentClassesAsync();
    Task<StudentClassDto?> GetStudentClassByIdAsync(int id);
    Task<ServiceResult<StudentClassDto>> CreateStudentClassAsync(CreateStudentClassDto dto);
    Task<int> CountStudentClassesAsync();
}
