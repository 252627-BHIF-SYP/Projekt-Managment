using Microsoft.EntityFrameworkCore;
using Npgsql;
using Persistence;
using Persistence.Entities;
using Services.Interfaces;
using Services.Results;

namespace Services.Implementations;

public class SchoolStructureService(ApplicationDbContext context) : ISchoolStructureService
{
    private readonly ApplicationDbContext _context = context;

    public async Task<IReadOnlyList<SchoolYearDto>> GetSchoolYearsAsync()
    {
        return await _context.SchoolYears
            .AsNoTracking()
            .OrderByDescending(s => s.Year)
            .Select(s => new SchoolYearDto(s.Id, s.Year))
            .ToListAsync();
    }

    public async Task<SchoolYearDto?> GetSchoolYearByIdAsync(int id)
    {
        return await _context.SchoolYears
            .AsNoTracking()
            .Where(s => s.Id == id)
            .Select(s => new SchoolYearDto(s.Id, s.Year))
            .FirstOrDefaultAsync();
    }

    public async Task<ServiceResult<SchoolYearDto>> CreateSchoolYearAsync(CreateSchoolYearDto dto)
    {
        if (string.IsNullOrWhiteSpace(dto.Year))
        {
            return ServiceResult<SchoolYearDto>.ValidationError("School year is required.");
        }

        var schoolYear = new SchoolYear { Year = dto.Year.Trim() };
        _context.SchoolYears.Add(schoolYear);

        try
        {
            await _context.SaveChangesAsync();
            return ServiceResult<SchoolYearDto>.Success(new SchoolYearDto(schoolYear.Id, schoolYear.Year));
        }
        catch (DbUpdateException ex) when (IsUniqueConstraintViolation(ex))
        {
            return ServiceResult<SchoolYearDto>.Conflict($"School year '{schoolYear.Year}' already exists.");
        }
        catch (DbUpdateException ex)
        {
            return ServiceResult<SchoolYearDto>.DatabaseError(ex.InnerException?.Message ?? ex.Message);
        }
    }

    public Task<int> CountSchoolYearsAsync() => _context.SchoolYears.CountAsync();

    public async Task<IReadOnlyList<StudentClassDto>> GetStudentClassesAsync()
    {
        return await _context.StudentClasses
            .AsNoTracking()
            .OrderBy(c => c.Name)
            .ThenBy(c => c.Branch)
            .Select(c => new StudentClassDto(c.Id, c.Name, c.Branch))
            .ToListAsync();
    }

    public async Task<StudentClassDto?> GetStudentClassByIdAsync(int id)
    {
        return await _context.StudentClasses
            .AsNoTracking()
            .Where(c => c.Id == id)
            .Select(c => new StudentClassDto(c.Id, c.Name, c.Branch))
            .FirstOrDefaultAsync();
    }

    public async Task<ServiceResult<StudentClassDto>> CreateStudentClassAsync(CreateStudentClassDto dto)
    {
        if (string.IsNullOrWhiteSpace(dto.Name) || string.IsNullOrWhiteSpace(dto.Branch))
        {
            return ServiceResult<StudentClassDto>.ValidationError("Class name and branch are required.");
        }

        var studentClass = new StudentClass
        {
            Name = dto.Name.Trim(),
            Branch = dto.Branch.Trim()
        };

        _context.StudentClasses.Add(studentClass);

        try
        {
            await _context.SaveChangesAsync();
            return ServiceResult<StudentClassDto>.Success(new StudentClassDto(studentClass.Id, studentClass.Name, studentClass.Branch));
        }
        catch (DbUpdateException ex) when (IsUniqueConstraintViolation(ex))
        {
            return ServiceResult<StudentClassDto>.Conflict($"Class '{studentClass.Name}' in branch '{studentClass.Branch}' already exists.");
        }
        catch (DbUpdateException ex)
        {
            return ServiceResult<StudentClassDto>.DatabaseError(ex.InnerException?.Message ?? ex.Message);
        }
    }

    public Task<int> CountStudentClassesAsync() => _context.StudentClasses.CountAsync();

    private static bool IsUniqueConstraintViolation(DbUpdateException ex) =>
        ex.InnerException is PostgresException { SqlState: PostgresErrorCodes.UniqueViolation };
}
