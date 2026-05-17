using Microsoft.EntityFrameworkCore;
using Npgsql;
using Persistence;
using Persistence.Entities;
using Services.Interfaces;
using Services.Results;

namespace Services.Implementations;

public class PersonService(ApplicationDbContext context) : IPersonService
{
    private readonly ApplicationDbContext _context = context;

    public async Task<IReadOnlyList<StudentDto>> GetStudentsAsync()
    {
        var students = await StudentGraph()
            .AsNoTracking()
            .OrderBy(s => s.LastName)
            .ThenBy(s => s.FirstName)
            .ToListAsync();

        return students.Select(ToDto).ToList();
    }

    public async Task<StudentDto?> GetStudentByIdAsync(string id)
    {
        var student = await StudentGraph()
            .AsNoTracking()
            .FirstOrDefaultAsync(s => s.Id == id);

        return student == null ? null : ToDto(student);
    }

    public async Task<ServiceResult<StudentDto>> CreateStudentAsync(PersonCreateDto dto)
    {
        if (dto.PersonType != PersonType.Student)
        {
            return ServiceResult<StudentDto>.ValidationError("Person type must be Student.");
        }

        if (dto.ClassId.HasValue != dto.SchoolYearId.HasValue)
        {
            return ServiceResult<StudentDto>.ValidationError("Class and school year must be provided together.");
        }

        if (dto.ClassId.HasValue &&
            !await _context.StudentClasses.AnyAsync(c => c.Id == dto.ClassId.Value))
        {
            return ServiceResult<StudentDto>.ValidationError("Selected class does not exist.");
        }

        if (dto.SchoolYearId.HasValue &&
            !await _context.SchoolYears.AnyAsync(y => y.Id == dto.SchoolYearId.Value))
        {
            return ServiceResult<StudentDto>.ValidationError("Selected school year does not exist.");
        }

        var student = new Student
        {
            Id = dto.Id.Trim(),
            FirstName = dto.FirstName.Trim(),
            LastName = dto.LastName.Trim()
        };

        if (dto.ClassId.HasValue && dto.SchoolYearId.HasValue)
        {
            student.StudentClassHistories.Add(new StudentClassHistory
            {
                StudentId = student.Id,
                ClassId = dto.ClassId.Value,
                SchoolYearId = dto.SchoolYearId.Value
            });
        }

        _context.Students.Add(student);

        try
        {
            await _context.SaveChangesAsync();
            return ServiceResult<StudentDto>.Success((await GetStudentByIdAsync(student.Id))!);
        }
        catch (DbUpdateException ex) when (IsUniqueConstraintViolation(ex))
        {
            return ServiceResult<StudentDto>.Conflict($"Student with id '{student.Id}' already exists.");
        }
        catch (DbUpdateException ex)
        {
            return ServiceResult<StudentDto>.DatabaseError(ex.InnerException?.Message ?? ex.Message);
        }
    }

    public async Task<IReadOnlyList<ProfessorDto>> GetProfessorsAsync()
    {
        return await _context.Professors
            .AsNoTracking()
            .OrderBy(p => p.LastName)
            .ThenBy(p => p.FirstName)
            .Select(p => new ProfessorDto(p.Id, p.FirstName, p.LastName))
            .ToListAsync();
    }

    public async Task<ProfessorDto?> GetProfessorByIdAsync(string id)
    {
        return await _context.Professors
            .AsNoTracking()
            .Where(p => p.Id == id)
            .Select(p => new ProfessorDto(p.Id, p.FirstName, p.LastName))
            .FirstOrDefaultAsync();
    }

    public async Task<ServiceResult<ProfessorDto>> CreateProfessorAsync(PersonCreateDto dto)
    {
        if (dto.PersonType != PersonType.Professor)
        {
            return ServiceResult<ProfessorDto>.ValidationError("Person type must be Professor.");
        }

        var professor = new Professor
        {
            Id = dto.Id.Trim(),
            FirstName = dto.FirstName.Trim(),
            LastName = dto.LastName.Trim()
        };

        _context.Professors.Add(professor);

        try
        {
            await _context.SaveChangesAsync();
            return ServiceResult<ProfessorDto>.Success(new ProfessorDto(professor.Id, professor.FirstName, professor.LastName));
        }
        catch (DbUpdateException ex) when (IsUniqueConstraintViolation(ex))
        {
            return ServiceResult<ProfessorDto>.Conflict($"Professor with id '{professor.Id}' already exists.");
        }
        catch (DbUpdateException ex)
        {
            return ServiceResult<ProfessorDto>.DatabaseError(ex.InnerException?.Message ?? ex.Message);
        }
    }

    public async Task<int?> GetStudentHistoryIdAsync(string studentId, int? schoolYearId)
    {
        var query = _context.StudentClassHistories
            .AsNoTracking()
            .Where(h => h.StudentId == studentId);

        if (schoolYearId.HasValue)
        {
            query = query.Where(h => h.SchoolYearId == schoolYearId.Value);
        }

        return await query
            .OrderByDescending(h => h.SchoolYearId)
            .Select(h => (int?)h.Id)
            .FirstOrDefaultAsync();
    }

    public Task<int> CountStudentsAsync() => _context.Students.CountAsync();

    public Task<int> CountProfessorsAsync() => _context.Professors.CountAsync();

    public async Task<IReadOnlyList<StudentCountPerYearDto>> GetStudentCountPerYearAsync()
    {
        return await _context.StudentClassHistories
            .AsNoTracking()
            .GroupBy(h => new { h.SchoolYearId, h.SchoolYear!.Year })
            .OrderBy(g => g.Key.Year)
            .Select(g => new StudentCountPerYearDto(g.Key.SchoolYearId, g.Key.Year, g.Select(h => h.StudentId).Distinct().Count()))
            .ToListAsync();
    }

    private IQueryable<Student> StudentGraph() =>
        _context.Students
            .Include(s => s.StudentClassHistories)
            .ThenInclude(h => h.StudentClass)
            .Include(s => s.StudentClassHistories)
            .ThenInclude(h => h.SchoolYear);

    private static StudentDto ToDto(Student student) => new(
        student.Id,
        student.FirstName,
        student.LastName,
        student.StudentClassHistories
            .Where(h => h.StudentClass != null && h.SchoolYear != null)
            .OrderByDescending(h => h.SchoolYear!.Year)
            .Select(h => new StudentClassHistoryDto(
                h.Id,
                h.ClassId,
                h.StudentClass!.Name,
                h.StudentClass.Branch,
                h.SchoolYearId,
                h.SchoolYear!.Year))
            .ToList());

    private static bool IsUniqueConstraintViolation(DbUpdateException ex) =>
        ex.InnerException is PostgresException { SqlState: PostgresErrorCodes.UniqueViolation };
}
