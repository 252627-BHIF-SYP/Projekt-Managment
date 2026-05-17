using Microsoft.EntityFrameworkCore;
using Persistence;
using Persistence.Entities;
using Services.Interfaces;

namespace Services.Implementations;

public class ImportService(ApplicationDbContext context) : IImportService
{
    private readonly ApplicationDbContext _context = context;

    public async Task<ImportResultDto> ImportStudentsAsync(string csvText)
    {
        var parsed = ParseCsv(csvText);
        var importRows = parsed.Rows.Select(ToStudentImportRow).ToList();
        var validRows = importRows.Where(r => r.HasPersonData).ToList();
        var rowsWithHistory = validRows.Where(r => r.HasHistoryData).ToList();

        var studentIds = validRows
            .Select(r => r.Id)
            .Distinct(StringComparer.OrdinalIgnoreCase)
            .ToList();

        var existingStudents = await _context.Students
            .Include(s => s.StudentClassHistories)
            .Where(s => studentIds.Contains(s.Id))
            .ToListAsync();

        var existingStudentsById = existingStudents.ToDictionary(s => s.Id, StringComparer.OrdinalIgnoreCase);
        var newStudentGroups = validRows
            .GroupBy(r => r.Id, StringComparer.OrdinalIgnoreCase)
            .Where(g => !existingStudentsById.ContainsKey(g.Key))
            .ToList();

        var newStudents = newStudentGroups
            .Select(g => new Student
            {
                Id = g.Key,
                FirstName = g.First().FirstName,
                LastName = g.First().LastName
            })
            .ToList();

        var schoolYearsByYear = await GetOrCreateSchoolYearsAsync(rowsWithHistory.Select(r => r.SchoolYear));
        var classesByKey = await GetOrCreateStudentClassesAsync(rowsWithHistory.Select(r => new StudentClassImportKey(r.ClassName, r.Branch)));

        _context.Students.AddRange(newStudents);
        await _context.SaveChangesAsync();

        var studentsById = existingStudents.Concat(newStudents).ToDictionary(s => s.Id, StringComparer.OrdinalIgnoreCase);
        var existingHistoryKeys = studentsById.Values
            .SelectMany(s => s.StudentClassHistories)
            .Select(h => HistoryKey(h.StudentId, h.ClassId, h.SchoolYearId))
            .ToHashSet(StringComparer.OrdinalIgnoreCase);

        var historyCandidates = rowsWithHistory
            .Select(r => new StudentHistoryImportCandidate(
                r,
                schoolYearsByYear[r.SchoolYear],
                classesByKey[ClassKey(r.ClassName, r.Branch)]))
            .ToList();

        var newHistoryGroups = historyCandidates
            .GroupBy(c => HistoryKey(c.Row.Id, c.StudentClass.Id, c.SchoolYear.Id), StringComparer.OrdinalIgnoreCase)
            .Where(g => !existingHistoryKeys.Contains(g.Key))
            .ToList();

        var newHistories = newHistoryGroups
            .Select(g => g.First())
            .Select(c => new StudentClassHistory
            {
                StudentId = c.Row.Id,
                ClassId = c.StudentClass.Id,
                SchoolYearId = c.SchoolYear.Id
            })
            .ToList();

        _context.StudentClassHistories.AddRange(newHistories);
        await _context.SaveChangesAsync();

        var importedRowNumbers = newHistoryGroups
            .Select(g => g.Min(c => c.Row.RowNumber))
            .Concat(newStudentGroups.Select(g => g.Min(r => r.RowNumber)))
            .ToHashSet();

        var resultRows = importRows
            .Select(row => ToStudentImportResult(row, importedRowNumbers))
            .OrderBy(r => r.RowNumber)
            .ToList();

        return new ImportResultDto(
            parsed.Rows.Count,
            resultRows.Count(r => r.Status == ImportRowStatus.Imported),
            resultRows.Count(r => r.Status == ImportRowStatus.Skipped),
            resultRows.Count(r => r.Status == ImportRowStatus.Failed),
            resultRows);
    }

    public async Task<ImportResultDto> ImportProfessorsAsync(string csvText)
    {
        var parsed = ParseCsv(csvText);
        var importRows = parsed.Rows.Select(ToProfessorImportRow).ToList();
        var validRows = importRows.Where(r => r.HasPersonData).ToList();
        var professorIds = validRows
            .Select(r => r.Id)
            .Distinct(StringComparer.OrdinalIgnoreCase)
            .ToList();

        var existingProfessorIds = await _context.Professors
            .Where(p => professorIds.Contains(p.Id))
            .Select(p => p.Id)
            .ToListAsync();

        var existingProfessorIdSet = existingProfessorIds.ToHashSet(StringComparer.OrdinalIgnoreCase);
        var newProfessorGroups = validRows
            .GroupBy(r => r.Id, StringComparer.OrdinalIgnoreCase)
            .Where(g => !existingProfessorIdSet.Contains(g.Key))
            .ToList();

        var newProfessors = newProfessorGroups
            .Select(g => new Professor
            {
                Id = g.Key,
                FirstName = g.First().FirstName,
                LastName = g.First().LastName
            })
            .ToList();

        _context.Professors.AddRange(newProfessors);
        await _context.SaveChangesAsync();

        var importedRowNumbers = newProfessorGroups
            .Select(g => g.Min(r => r.RowNumber))
            .ToHashSet();

        var resultRows = importRows
            .Select(row => ToProfessorImportResult(row, importedRowNumbers))
            .OrderBy(r => r.RowNumber)
            .ToList();

        return new ImportResultDto(
            parsed.Rows.Count,
            resultRows.Count(r => r.Status == ImportRowStatus.Imported),
            resultRows.Count(r => r.Status == ImportRowStatus.Skipped),
            resultRows.Count(r => r.Status == ImportRowStatus.Failed),
            resultRows);
    }

    private async Task<IReadOnlyDictionary<string, SchoolYear>> GetOrCreateSchoolYearsAsync(IEnumerable<string> years)
    {
        var normalizedYears = years
            .Where(y => !string.IsNullOrWhiteSpace(y))
            .Distinct(StringComparer.OrdinalIgnoreCase)
            .ToList();

        var existing = await _context.SchoolYears
            .Where(y => normalizedYears.Contains(y.Year))
            .ToListAsync();

        var existingValues = existing.Select(y => y.Year).ToHashSet(StringComparer.OrdinalIgnoreCase);
        var created = normalizedYears
            .Where(year => !existingValues.Contains(year))
            .Select(year => new SchoolYear { Year = year })
            .ToList();

        _context.SchoolYears.AddRange(created);
        return existing.Concat(created).ToDictionary(y => y.Year, StringComparer.OrdinalIgnoreCase);
    }

    private async Task<IReadOnlyDictionary<string, StudentClass>> GetOrCreateStudentClassesAsync(IEnumerable<StudentClassImportKey> classes)
    {
        var normalizedClasses = classes
            .Where(c => !string.IsNullOrWhiteSpace(c.Name) && !string.IsNullOrWhiteSpace(c.Branch))
            .DistinctBy(c => ClassKey(c.Name, c.Branch))
            .ToList();

        var classNames = normalizedClasses.Select(c => c.Name).Distinct(StringComparer.OrdinalIgnoreCase).ToList();
        var branches = normalizedClasses.Select(c => c.Branch).Distinct(StringComparer.OrdinalIgnoreCase).ToList();
        var existing = await _context.StudentClasses
            .Where(c => classNames.Contains(c.Name) && branches.Contains(c.Branch))
            .ToListAsync();

        var existingKeys = existing.Select(c => ClassKey(c.Name, c.Branch)).ToHashSet(StringComparer.OrdinalIgnoreCase);
        var created = normalizedClasses
            .Where(c => !existingKeys.Contains(ClassKey(c.Name, c.Branch)))
            .Select(c => new StudentClass { Name = c.Name, Branch = c.Branch })
            .ToList();

        _context.StudentClasses.AddRange(created);
        return existing
            .Concat(created)
            .ToDictionary(c => ClassKey(c.Name, c.Branch), StringComparer.OrdinalIgnoreCase);
    }

    private static ImportRowResult ToStudentImportResult(StudentImportRow row, IReadOnlySet<int> importedRowNumbers)
    {
        if (!row.HasPersonData)
        {
            return new ImportRowResult(row.RowNumber, ImportRowStatus.Failed, row.Id, "Student requires IF-name, first name and last name.");
        }

        return importedRowNumbers.Contains(row.RowNumber)
            ? new ImportRowResult(row.RowNumber, ImportRowStatus.Imported, row.Id, null)
            : new ImportRowResult(row.RowNumber, ImportRowStatus.Skipped, row.Id, row.HasHistoryData ? "Student already exists with this class history." : "Student already exists.");
    }

    private static ImportRowResult ToProfessorImportResult(ProfessorImportRow row, IReadOnlySet<int> importedRowNumbers)
    {
        if (!row.HasPersonData)
        {
            return new ImportRowResult(row.RowNumber, ImportRowStatus.Failed, row.Id, "Professor requires first name and last name.");
        }

        return importedRowNumbers.Contains(row.RowNumber)
            ? new ImportRowResult(row.RowNumber, ImportRowStatus.Imported, row.Id, null)
            : new ImportRowResult(row.RowNumber, ImportRowStatus.Skipped, row.Id, "Professor already exists.");
    }

    private static StudentImportRow ToStudentImportRow(ParsedCsvRow row) => new(
        row.RowNumber,
        Normalize(Pick(row.Values, "if_name", "ifname", "if", "studentid", "student_id", "username")),
        Normalize(Pick(row.Values, "first_name", "firstname", "first name", "vorname")),
        Normalize(Pick(row.Values, "last_name", "lastname", "last name", "nachname")),
        Normalize(Pick(row.Values, "schoolyear", "school_year", "school year", "year", "jahr")),
        Normalize(Pick(row.Values, "branch", "abteilung")),
        Normalize(Pick(row.Values, "class", "klasse", "classname", "class_name")));

    private static ProfessorImportRow ToProfessorImportRow(ParsedCsvRow row)
    {
        var firstName = Normalize(Pick(row.Values, "first_name", "firstname", "first name", "vorname"));
        var lastName = Normalize(Pick(row.Values, "last_name", "lastname", "last name", "nachname"));
        var id = Normalize(Pick(row.Values, "if_name", "ifname", "if", "professorid", "professor_id", "teacherid", "teacher_id", "username"));

        return new ProfessorImportRow(
            row.RowNumber,
            string.IsNullOrWhiteSpace(id) ? BuildIdentifier(firstName, lastName, row.RowNumber) : id,
            firstName,
            lastName);
    }

    private static ParsedCsv ParseCsv(string csvText)
    {
        var lines = csvText
            .Replace("\uFEFF", string.Empty)
            .Split(["\r\n", "\n"], StringSplitOptions.None)
            .Where(l => !string.IsNullOrWhiteSpace(l))
            .ToList();

        if (lines.Count == 0)
        {
            return new ParsedCsv([]);
        }

        var delimiter = lines[0].Count(c => c == ';') >= lines[0].Count(c => c == ',') ? ';' : ',';
        var headers = SplitCsvLine(lines[0], delimiter)
            .Select(h => h.Trim().ToLowerInvariant())
            .ToList();

        var rows = lines
            .Skip(1)
            .Select((line, index) =>
            {
                var values = SplitCsvLine(line, delimiter);
                var map = headers
                    .Select((header, headerIndex) => new
                    {
                        Header = header,
                        Value = headerIndex < values.Count ? values[headerIndex].Trim() : string.Empty
                    })
                    .ToDictionary(x => x.Header, x => x.Value);

                return new ParsedCsvRow(index + 2, map);
            })
            .ToList();

        return new ParsedCsv(rows);
    }

    private static List<string> SplitCsvLine(string line, char delimiter)
    {
        var result = new List<string>();
        var current = new List<char>();
        var inQuotes = false;

        for (var i = 0; i < line.Length; i++)
        {
            var c = line[i];
            if (c == '"')
            {
                if (inQuotes && i + 1 < line.Length && line[i + 1] == '"')
                {
                    current.Add('"');
                    i++;
                }
                else
                {
                    inQuotes = !inQuotes;
                }
            }
            else if (c == delimiter && !inQuotes)
            {
                result.Add(new string(current.ToArray()));
                current.Clear();
            }
            else
            {
                current.Add(c);
            }
        }

        result.Add(new string(current.ToArray()));
        return result;
    }

    private static string Pick(IReadOnlyDictionary<string, string> values, params string[] aliases) =>
        aliases
            .Select(alias => values.TryGetValue(alias, out var value) ? value : null)
            .FirstOrDefault(value => value is not null) ?? string.Empty;

    private static string BuildIdentifier(string firstName, string lastName, int rowNumber)
    {
        var baseText = $"{firstName.FirstOrDefault()}{lastName}".ToLowerInvariant();
        var cleaned = new string(baseText.Where(char.IsLetterOrDigit).ToArray());
        return string.IsNullOrWhiteSpace(cleaned) ? $"professor-{rowNumber}" : cleaned;
    }

    private static string Normalize(string value) => value.Trim();

    private static string ClassKey(string name, string branch) =>
        $"{name.Trim().ToUpperInvariant()}|{branch.Trim().ToUpperInvariant()}";

    private static string HistoryKey(string studentId, int classId, int schoolYearId) =>
        $"{studentId.Trim().ToUpperInvariant()}|{classId}|{schoolYearId}";

    private record ParsedCsv(IReadOnlyList<ParsedCsvRow> Rows);

    private record ParsedCsvRow(int RowNumber, IReadOnlyDictionary<string, string> Values);

    private record StudentClassImportKey(string Name, string Branch);

    private record StudentHistoryImportCandidate(StudentImportRow Row, SchoolYear SchoolYear, StudentClass StudentClass);

    private record StudentImportRow(
        int RowNumber,
        string Id,
        string FirstName,
        string LastName,
        string SchoolYear,
        string Branch,
        string ClassName)
    {
        public bool HasPersonData =>
            !string.IsNullOrWhiteSpace(Id) &&
            !string.IsNullOrWhiteSpace(FirstName) &&
            !string.IsNullOrWhiteSpace(LastName);

        public bool HasHistoryData =>
            !string.IsNullOrWhiteSpace(SchoolYear) &&
            !string.IsNullOrWhiteSpace(Branch) &&
            !string.IsNullOrWhiteSpace(ClassName);
    }

    private record ProfessorImportRow(int RowNumber, string Id, string FirstName, string LastName)
    {
        public bool HasPersonData =>
            !string.IsNullOrWhiteSpace(FirstName) &&
            !string.IsNullOrWhiteSpace(LastName);
    }
}
