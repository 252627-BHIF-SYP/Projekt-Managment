using System.Globalization;
using Microsoft.EntityFrameworkCore;
using Persistence;
using Persistence.Entities;

namespace WebAPI.SeedData;

public static class DemoDataSeeder
{
    private const string CurrentSchoolYear = "2025/26";
    private static readonly string[] SchoolYears = ["2023/24", "2024/25", CurrentSchoolYear];
    private static readonly string CsvFileName = Path.Combine("SeedData", "2025-11-Tadeot-Assignments.csv");

    private static readonly DemoProfessor[] DemoProfessors =
    [
        new("bschroedt", "Barbara", "Schrödt"),
        new("dmayer", "Daniel", "Mayer"),
        new("mhofer", "Martin", "Hofer"),
        new("skern", "Sabine", "Kern"),
        new("tleitner", "Thomas", "Leitner"),
        new("jberger", "Julia", "Berger"),
        new("cgruber", "Christoph", "Gruber"),
        new("awagner", "Anna", "Wagner")
    ];

    private static readonly DemoProject[] DemoProjects =
    [
        new("HTL Project Management Platform", "Webplattform zur Verwaltung von SYP-Projekten, Teammitgliedern, Betreuern und Projektstatus.", "C#, ASP.NET Core, Angular, PostgreSQL", ProjectStatus.OnGoing, ProjectType.SYP, CurrentSchoolYear),
        new("Tage der offenen Tür Guide App", "Mobile Web-App mit Stationen, Raumplan, Live-Informationen und Feedback für Besucherinnen und Besucher.", "Angular, TypeScript, REST API", ProjectStatus.Pending, ProjectType.SYP, CurrentSchoolYear),
        new("AI Study Buddy", "Lernassistent für Schüler mit Karteikarten, Quizfragen und KI-gestützten Erklärungen.", "C#, Python, OpenAI API, PostgreSQL", ProjectStatus.New, ProjectType.Diplomarbeit, CurrentSchoolYear),
        new("VR Campus Tour", "Interaktive 3D-Tour durch Werkstätten, Labore und Medientechnik-Räume der Schule.", "Unity, Blender, C#", ProjectStatus.OnGoing, ProjectType.Diplomarbeit, CurrentSchoolYear),
        new("Digital Signage System", "Zentrales System zur Anzeige von Stundenplanänderungen, Events und Projektinformationen auf Schulmonitoren.", "Angular, ASP.NET Core, Docker", ProjectStatus.New, ProjectType.SYP, CurrentSchoolYear),
        new("Media Asset Manager", "Webbasierte Verwaltung von Fotos, Videos und Audio-Dateien für Medientechnik-Projekte.", "Angular, .NET, PostgreSQL, FFmpeg", ProjectStatus.Pending, ProjectType.SYP, CurrentSchoolYear),
        new("Smart Lab Booking", "Reservierungssystem für Labore, Geräte und Workshop-Plätze mit Rollen- und Rechteverwaltung.", "ASP.NET Core, Entity Framework Core, Angular", ProjectStatus.OnGoing, ProjectType.SYP, "2024/25"),
        new("Green School Monitor", "Dashboard für Energieverbrauch, Raumklima und Nachhaltigkeitsdaten der Schule.", "C#, MQTT, PostgreSQL, Angular", ProjectStatus.Completed, ProjectType.ProjectAward, "2024/25"),
        new("Robotics Control Dashboard", "Browserbasiertes Dashboard zur Steuerung und Überwachung von Robotik-Demos.", "C#, SignalR, TypeScript", ProjectStatus.Completed, ProjectType.SYP, "2023/24"),
        new("Event Check-in System", "QR-Code-basierte Anmeldung für Schulveranstaltungen mit Statistik-Auswertung.", "ASP.NET Core, Angular, PostgreSQL", ProjectStatus.Archived, ProjectType.SYP, "2023/24")
    ];

    public static async Task SeedAsync(IServiceProvider serviceProvider, IWebHostEnvironment environment, IConfiguration configuration)
    {
        var seedEnabled = configuration.GetValue("DemoData:SeedOnStartup", environment.IsDevelopment());
        if (!seedEnabled)
        {
            return;
        }

        using var scope = serviceProvider.CreateScope();
        var context = scope.ServiceProvider.GetRequiredService<ApplicationDbContext>();

        var csvPath = Path.Combine(environment.ContentRootPath, CsvFileName);
        if (!File.Exists(csvPath))
        {
            return;
        }

        var students = await ReadStudentRowsAsync(csvPath);
        if (students.Count == 0)
        {
            return;
        }

        await SeedSchoolYearsAsync(context);
        await SeedStudentClassesAsync(context, students);
        await SeedStudentsAsync(context, students);
        await SeedStudentClassHistoriesAsync(context, students);
        await SeedProfessorsAsync(context);
        await SeedProjectsAsync(context, students);
        await SeedCompetitionsAsync(context);
    }

    private static async Task<IReadOnlyList<StudentSeedRow>> ReadStudentRowsAsync(string csvPath)
    {
        var lines = await File.ReadAllLinesAsync(csvPath);
        if (lines.Length <= 1)
        {
            return [];
        }

        var headers = SplitCsvLine(lines[0], ';')
            .Select(h => h.Replace("\uFEFF", string.Empty).Trim())
            .ToList();

        var rows = new List<StudentSeedRow>();
        foreach (var line in lines.Skip(1).Where(l => !string.IsNullOrWhiteSpace(l)))
        {
            var values = SplitCsvLine(line, ';');
            var row = headers
                .Select((header, index) => new
                {
                    Header = header,
                    Value = index < values.Count ? values[index].Trim() : string.Empty
                })
                .ToDictionary(x => x.Header, x => x.Value);

            var department = GetValue(row, "Abteilung");
            var className = GetValue(row, "Klasse");
            var userName = GetValue(row, "EdufsUsername");
            var firstName = GetValue(row, "Vorname");
            var lastName = GetValue(row, "Nachname");

            if (!IsRelevantDepartment(department) || !IsRelevantClass(className))
            {
                continue;
            }

            if (string.IsNullOrWhiteSpace(userName) || string.IsNullOrWhiteSpace(firstName) || string.IsNullOrWhiteSpace(lastName))
            {
                continue;
            }

            rows.Add(new StudentSeedRow(
                department,
                className,
                userName,
                firstName,
                lastName));
        }

        return rows
            .DistinctBy(r => r.UserName, StringComparer.OrdinalIgnoreCase)
            .OrderBy(r => r.ClassName)
            .ThenBy(r => r.LastName)
            .ThenBy(r => r.FirstName)
            .ToList();
    }

    private static async Task SeedSchoolYearsAsync(ApplicationDbContext context)
    {
        var existingYears = await context.SchoolYears
            .Select(y => y.Year)
            .ToListAsync();

        var missingYears = SchoolYears
            .Where(year => !existingYears.Contains(year, StringComparer.OrdinalIgnoreCase))
            .Select(year => new SchoolYear { Year = year })
            .ToList();

        context.SchoolYears.AddRange(missingYears);
        await context.SaveChangesAsync();
    }

    private static async Task SeedStudentClassesAsync(ApplicationDbContext context, IReadOnlyList<StudentSeedRow> students)
    {
        var classCandidates = students
            .SelectMany(BuildClassHistoryCandidates)
            .DistinctBy(c => ClassKey(c.ClassName, c.Branch))
            .ToList();

        var existingClasses = await context.StudentClasses.ToListAsync();
        var existingKeys = existingClasses
            .Select(c => ClassKey(c.Name, c.Branch))
            .ToHashSet(StringComparer.OrdinalIgnoreCase);

        var newClasses = classCandidates
            .Where(c => !existingKeys.Contains(ClassKey(c.ClassName, c.Branch)))
            .Select(c => new StudentClass { Name = c.ClassName, Branch = c.Branch })
            .ToList();

        context.StudentClasses.AddRange(newClasses);
        await context.SaveChangesAsync();
    }

    private static async Task SeedStudentsAsync(ApplicationDbContext context, IReadOnlyList<StudentSeedRow> students)
    {
        var ids = students.Select(s => s.UserName).ToList();
        var existingIds = await context.Students
            .Where(s => ids.Contains(s.Id))
            .Select(s => s.Id)
            .ToListAsync();

        var existingIdSet = existingIds.ToHashSet(StringComparer.OrdinalIgnoreCase);
        var newStudents = students
            .Where(s => !existingIdSet.Contains(s.UserName))
            .Select(s => new Student
            {
                Id = s.UserName,
                FirstName = s.FirstName,
                LastName = s.LastName
            })
            .ToList();

        context.Students.AddRange(newStudents);
        await context.SaveChangesAsync();
    }

    private static async Task SeedStudentClassHistoriesAsync(ApplicationDbContext context, IReadOnlyList<StudentSeedRow> students)
    {
        var schoolYearList = await context.SchoolYears.ToListAsync();
        var schoolYears = schoolYearList.ToDictionary(y => y.Year, StringComparer.OrdinalIgnoreCase);
        var classes = await context.StudentClasses.ToListAsync();
        var classesByKey = classes.ToDictionary(c => ClassKey(c.Name, c.Branch), StringComparer.OrdinalIgnoreCase);
        var existingHistoryKeys = await context.StudentClassHistories
            .Select(h => new { h.StudentId, h.ClassId, h.SchoolYearId })
            .ToListAsync();

        var existingKeys = existingHistoryKeys
            .Select(h => HistoryKey(h.StudentId, h.ClassId, h.SchoolYearId))
            .ToHashSet(StringComparer.OrdinalIgnoreCase);

        var histories = new List<StudentClassHistory>();
        foreach (var student in students)
        {
            foreach (var candidate in BuildClassHistoryCandidates(student))
            {
                if (!schoolYears.TryGetValue(candidate.SchoolYear, out var schoolYear))
                {
                    continue;
                }

                if (!classesByKey.TryGetValue(ClassKey(candidate.ClassName, candidate.Branch), out var studentClass))
                {
                    continue;
                }

                var key = HistoryKey(student.UserName, studentClass.Id, schoolYear.Id);
                if (existingKeys.Contains(key))
                {
                    continue;
                }

                histories.Add(new StudentClassHistory
                {
                    StudentId = student.UserName,
                    ClassId = studentClass.Id,
                    SchoolYearId = schoolYear.Id
                });
                existingKeys.Add(key);
            }
        }

        context.StudentClassHistories.AddRange(histories);
        await context.SaveChangesAsync();
    }

    private static async Task SeedProfessorsAsync(ApplicationDbContext context)
    {
        var ids = DemoProfessors.Select(p => p.Id).ToList();
        var existingIds = await context.Professors
            .Where(p => ids.Contains(p.Id))
            .Select(p => p.Id)
            .ToListAsync();

        var existingIdSet = existingIds.ToHashSet(StringComparer.OrdinalIgnoreCase);
        var newProfessors = DemoProfessors
            .Where(p => !existingIdSet.Contains(p.Id))
            .Select(p => new Professor
            {
                Id = p.Id,
                FirstName = p.FirstName,
                LastName = p.LastName
            })
            .ToList();

        context.Professors.AddRange(newProfessors);
        await context.SaveChangesAsync();
    }

    private static async Task SeedProjectsAsync(ApplicationDbContext context, IReadOnlyList<StudentSeedRow> students)
    {
        var existingProjectTitles = await context.Projects
            .Select(p => p.Title)
            .ToListAsync();

        var existingTitleSet = existingProjectTitles.ToHashSet(StringComparer.OrdinalIgnoreCase);
        var newProjects = DemoProjects
            .Where(p => !existingTitleSet.Contains(p.Title))
            .Select(p => new Project
            {
                Title = p.Title,
                Description = p.Description,
                Technology = p.Technology,
                Status = p.Status,
                ProjectType = p.ProjectType
            })
            .ToList();

        context.Projects.AddRange(newProjects);
        await context.SaveChangesAsync();

        var projectTitles = DemoProjects.Select(d => d.Title).ToList();
        var projects = await context.Projects
            .Where(p => projectTitles.Contains(p.Title))
            .ToListAsync();
        var projectsByTitle = projects.ToDictionary(p => p.Title, StringComparer.OrdinalIgnoreCase);
        var schoolYearList = await context.SchoolYears.ToListAsync();
        var schoolYears = schoolYearList.ToDictionary(y => y.Year, StringComparer.OrdinalIgnoreCase);

        await SeedSchoolYearProjectsAsync(context, projectsByTitle, schoolYears);
        await SeedProjectSupervisorsAsync(context, projectsByTitle);
        await SeedProjectStudentsAsync(context, projectsByTitle, students);
    }

    private static async Task SeedSchoolYearProjectsAsync(
        ApplicationDbContext context,
        IReadOnlyDictionary<string, Project> projectsByTitle,
        IReadOnlyDictionary<string, SchoolYear> schoolYears)
    {
        var existingKeys = await context.SchoolYearProjects
            .Select(p => new { p.ProjectId, p.SchoolYearId })
            .ToListAsync();

        var existingKeySet = existingKeys
            .Select(p => SchoolYearProjectKey(p.ProjectId, p.SchoolYearId))
            .ToHashSet(StringComparer.OrdinalIgnoreCase);

        var schoolYearProjects = DemoProjects
            .Where(p => projectsByTitle.ContainsKey(p.Title) && schoolYears.ContainsKey(p.SchoolYear))
            .Select(p => new
            {
                Project = projectsByTitle[p.Title],
                SchoolYear = schoolYears[p.SchoolYear]
            })
            .Where(p => !existingKeySet.Contains(SchoolYearProjectKey(p.Project.Id, p.SchoolYear.Id)))
            .Select(p => new SchoolYearProject
            {
                ProjectId = p.Project.Id,
                SchoolYearId = p.SchoolYear.Id
            })
            .ToList();

        context.SchoolYearProjects.AddRange(schoolYearProjects);
        await context.SaveChangesAsync();
    }

    private static async Task SeedProjectSupervisorsAsync(ApplicationDbContext context, IReadOnlyDictionary<string, Project> projectsByTitle)
    {
        var existingKeys = await context.ProjectSupervisors
            .Select(p => new { p.ProjectId, p.ProfessorId })
            .ToListAsync();

        var existingKeySet = existingKeys
            .Select(p => ProjectSupervisorKey(p.ProjectId, p.ProfessorId))
            .ToHashSet(StringComparer.OrdinalIgnoreCase);

        var supervisors = new List<ProjectSupervisor>();
        for (var i = 0; i < DemoProjects.Length; i++)
        {
            var projectSeed = DemoProjects[i];
            if (!projectsByTitle.TryGetValue(projectSeed.Title, out var project))
            {
                continue;
            }

            var mainProfessor = DemoProfessors[i % DemoProfessors.Length];
            var secondProfessor = DemoProfessors[(i + 3) % DemoProfessors.Length];

            AddSupervisor(supervisors, existingKeySet, project.Id, mainProfessor.Id, "Main supervisor");
            AddSupervisor(supervisors, existingKeySet, project.Id, secondProfessor.Id, "Co-supervisor");
        }

        context.ProjectSupervisors.AddRange(supervisors);
        await context.SaveChangesAsync();
    }

    private static async Task SeedProjectStudentsAsync(
        ApplicationDbContext context,
        IReadOnlyDictionary<string, Project> projectsByTitle,
        IReadOnlyList<StudentSeedRow> students)
    {
        var currentSchoolYear = await context.SchoolYears.SingleAsync(y => y.Year == CurrentSchoolYear);
        var currentHistories = await context.StudentClassHistories
            .Include(h => h.StudentClass)
            .Where(h => h.SchoolYearId == currentSchoolYear.Id)
            .ToListAsync();

        var historyByStudentId = currentHistories.ToDictionary(h => h.StudentId, StringComparer.OrdinalIgnoreCase);
        var existingKeys = await context.ProjectStudents
            .Select(p => new { p.ProjectId, p.HistoryId })
            .ToListAsync();

        var existingKeySet = existingKeys
            .Select(p => ProjectStudentKey(p.ProjectId, p.HistoryId))
            .ToHashSet(StringComparer.OrdinalIgnoreCase);

        var assignmentProjects = DemoProjects
            .Where(p => p.SchoolYear == CurrentSchoolYear)
            .Where(p => projectsByTitle.ContainsKey(p.Title))
            .Select(p => projectsByTitle[p.Title])
            .ToList();

        if (assignmentProjects.Count == 0)
        {
            return;
        }

        var studentAssignments = students
            .Where(s => historyByStudentId.ContainsKey(s.UserName))
            .OrderBy(s => s.ClassName)
            .ThenBy(s => s.LastName)
            .ThenBy(s => s.FirstName)
            .Select((student, index) => new
            {
                Student = student,
                Project = assignmentProjects[index % assignmentProjects.Count]
            })
            .ToList();

        var projectStudents = new List<ProjectStudent>();
        foreach (var assignment in studentAssignments)
        {
            var history = historyByStudentId[assignment.Student.UserName];
            var key = ProjectStudentKey(assignment.Project.Id, history.Id);
            if (existingKeySet.Contains(key))
            {
                continue;
            }

            projectStudents.Add(new ProjectStudent
            {
                ProjectId = assignment.Project.Id,
                HistoryId = history.Id,
                Role = GetStudentRole(assignment.Student.ClassName)
            });
            existingKeySet.Add(key);
        }

        context.ProjectStudents.AddRange(projectStudents);
        await context.SaveChangesAsync();
    }

    private static IEnumerable<ClassHistoryCandidate> BuildClassHistoryCandidates(StudentSeedRow student)
    {
        var currentGrade = GetGrade(student.ClassName);
        if (currentGrade is null)
        {
            yield break;
        }

        var schoolYearsForStudent = SchoolYears.Reverse().ToList();
        for (var offset = 0; offset < schoolYearsForStudent.Count; offset++)
        {
            var grade = currentGrade.Value - offset;
            if (grade < 3)
            {
                break;
            }

            yield return new ClassHistoryCandidate(
                schoolYearsForStudent[offset],
                ReplaceGrade(student.ClassName, grade),
                student.Department);
        }
    }

    private static void AddSupervisor(
        List<ProjectSupervisor> supervisors,
        ISet<string> existingKeys,
        int projectId,
        string professorId,
        string role)
    {
        var key = ProjectSupervisorKey(projectId, professorId);
        if (existingKeys.Contains(key))
        {
            return;
        }

        supervisors.Add(new ProjectSupervisor
        {
            ProjectId = projectId,
            ProfessorId = professorId,
            Role = role
        });
        existingKeys.Add(key);
    }

    private static string GetStudentRole(string className)
    {
        var grade = GetGrade(className);
        return grade switch
        {
            5 => "Diploma project member",
            4 => "Project member",
            _ => "Junior project member"
        };
    }

    private static bool IsRelevantDepartment(string department) =>
        department.Equals("Informatik", StringComparison.OrdinalIgnoreCase) ||
        department.Equals("Medientechnik", StringComparison.OrdinalIgnoreCase);

    private static bool IsRelevantClass(string className)
    {
        var grade = GetGrade(className);
        return grade is >= 3 and <= 5 && !className.Contains("FS", StringComparison.OrdinalIgnoreCase);
    }

    private static int? GetGrade(string className)
    {
        if (string.IsNullOrWhiteSpace(className) || !char.IsDigit(className[0]))
        {
            return null;
        }

        return int.Parse(className[0].ToString(), CultureInfo.InvariantCulture);
    }

    private static string ReplaceGrade(string className, int grade) =>
        className.Length == 0 ? className : $"{grade}{className[1..]}";

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

    private static string GetValue(IReadOnlyDictionary<string, string> row, string key) =>
        row.TryGetValue(key, out var value) ? value.Trim() : string.Empty;

    private static string ClassKey(string className, string branch) =>
        $"{className.Trim().ToUpperInvariant()}|{branch.Trim().ToUpperInvariant()}";

    private static string HistoryKey(string studentId, int classId, int schoolYearId) =>
        $"{studentId.Trim().ToUpperInvariant()}|{classId}|{schoolYearId}";

    private static string SchoolYearProjectKey(int projectId, int schoolYearId) =>
        $"{projectId}|{schoolYearId}";

    private static string ProjectSupervisorKey(int projectId, string professorId) =>
        $"{projectId}|{professorId.Trim().ToUpperInvariant()}";

    private static string ProjectStudentKey(int projectId, int historyId) =>
        $"{projectId}|{historyId}";

    private static async Task SeedCompetitionsAsync(ApplicationDbContext context)
    {
        if (await context.Competitions.AnyAsync())
        {
            return;
        }

        var today = DateOnly.FromDateTime(DateTime.Today);
        var projects = await context.Projects.Take(4).ToListAsync();

        var wmc3Competition = new Competition
        {
            Name = "WMC-3 Award 2026",
            CompetitionType = CompetitionType.Wmc3,
            StartDate = today.AddDays(14),
            EndDate = today.AddDays(14),
            PresentationDurationMinutes = 15,
            BreakDurationMinutes = 5,
            AllowedClassTypes = "3AHIF, 3BHIF, 3CHIF",
            CreatedAtUtc = DateTime.UtcNow
        };

        var diplCompetition = new Competition
        {
            Name = "Diplomarbeiten Präsentationen 2026",
            CompetitionType = CompetitionType.Dipl,
            StartDate = today.AddDays(30),
            EndDate = today.AddDays(31),
            PresentationDurationMinutes = 20,
            BreakDurationMinutes = 10,
            AllowedClassTypes = "5AHIF, 5BHIF",
            CreatedAtUtc = DateTime.UtcNow
        };

        context.Competitions.AddRange(wmc3Competition, diplCompetition);
        await context.SaveChangesAsync();

        if (projects.Count > 0)
        {
            var project1 = projects[0];
            var project2 = projects.Count > 1 ? projects[1] : null;

            context.CompetitionProjects.Add(new CompetitionProject
            {
                CompetitionId = wmc3Competition.Id,
                ProjectId = project1.Id,
                JoinedAtUtc = DateTime.UtcNow
            });

            if (project2 != null)
            {
                context.CompetitionProjects.Add(new CompetitionProject
                {
                    CompetitionId = wmc3Competition.Id,
                    ProjectId = project2.Id,
                    JoinedAtUtc = DateTime.UtcNow
                });
            }

            var startTime = new TimeOnly(8, 30);
            context.ScheduleSlots.AddRange(
                new ScheduleSlot
                {
                    CompetitionId = wmc3Competition.Id,
                    SlotType = ScheduleSlotType.Info,
                    Date = wmc3Competition.StartDate,
                    StartTime = startTime,
                    DurationMinutes = 15,
                    Title = "Begrüßung und Eröffnung",
                    Note = "Audimax"
                },
                new ScheduleSlot
                {
                    CompetitionId = wmc3Competition.Id,
                    ProjectId = project1.Id,
                    SlotType = ScheduleSlotType.Presentation,
                    Date = wmc3Competition.StartDate,
                    StartTime = startTime.AddMinutes(15),
                    DurationMinutes = 15,
                    Title = project1.Title,
                    Note = "Präsentation 1"
                },
                new ScheduleSlot
                {
                    CompetitionId = wmc3Competition.Id,
                    SlotType = ScheduleSlotType.Break,
                    Date = wmc3Competition.StartDate,
                    StartTime = startTime.AddMinutes(30),
                    DurationMinutes = 10,
                    Title = "Kaffeepause",
                    Note = "Foyer"
                }
            );

            if (project2 != null)
            {
                context.ScheduleSlots.Add(new ScheduleSlot
                {
                    CompetitionId = wmc3Competition.Id,
                    ProjectId = project2.Id,
                    SlotType = ScheduleSlotType.Presentation,
                    Date = wmc3Competition.StartDate,
                    StartTime = startTime.AddMinutes(40),
                    DurationMinutes = 15,
                    Title = project2.Title,
                    Note = "Präsentation 2"
                });
            }

            // Seed Evaluation Criteria
            var crit1 = new EvaluationCriterion
            {
                CompetitionId = wmc3Competition.Id,
                Name = "Idee & Originalität",
                Description = "Innovationsgrad, Zielgruppenfokus und Alleinstellungsmerkmal",
                MinScore = 0,
                MaxScore = 10,
                Weight = 1.0,
                OrderIndex = 1
            };
            var crit2 = new EvaluationCriterion
            {
                CompetitionId = wmc3Competition.Id,
                Name = "Technische Ausführung",
                Description = "Code-Qualität, Architektur, verwendete Technologien und Funktionalität",
                MinScore = 0,
                MaxScore = 10,
                Weight = 1.5,
                OrderIndex = 2
            };
            var crit3 = new EvaluationCriterion
            {
                CompetitionId = wmc3Competition.Id,
                Name = "Präsentation & Design",
                Description = "Auftreten, Rhetorik, UI/UX Design und Timekeeping",
                MinScore = 0,
                MaxScore = 10,
                Weight = 1.0,
                OrderIndex = 3
            };
            context.EvaluationCriteria.AddRange(crit1, crit2, crit3);
            await context.SaveChangesAsync();

            // Seed Jury Members
            var firstProf = await context.Professors.FirstOrDefaultAsync();
            var jury1 = new JuryMember
            {
                CompetitionId = wmc3Competition.Id,
                ProfessorId = firstProf?.Id,
                Role = "Hauptjuror",
                AddedAtUtc = DateTime.UtcNow
            };
            var jury2 = new JuryMember
            {
                CompetitionId = wmc3Competition.Id,
                ExternalName = "Dr. Markus Weber (Industrie-Partner)",
                ExternalEmail = "markus.weber@tech-partner.at",
                Role = "Gastjuror",
                AddedAtUtc = DateTime.UtcNow
            };
            context.JuryMembers.AddRange(jury1, jury2);
            await context.SaveChangesAsync();

            // Seed Awards
            var award1 = new CompetitionAward
            {
                CompetitionId = wmc3Competition.Id,
                Name = "1. Platz - Bester Gesamteindruck",
                Rank = 1,
                PrizeDetails = "Pokal & 150€ Sachgutschein",
                WinningProjectId = project1.Id,
                AwardedAtUtc = DateTime.UtcNow
            };
            var award2 = new CompetitionAward
            {
                CompetitionId = wmc3Competition.Id,
                Name = "2. Platz",
                Rank = 2,
                PrizeDetails = "Urkunde & 100€ Sachgutschein",
                WinningProjectId = project2?.Id,
                AwardedAtUtc = DateTime.UtcNow
            };
            var award3 = new CompetitionAward
            {
                CompetitionId = wmc3Competition.Id,
                Name = "Innovationspreis",
                Rank = 3,
                PrizeDetails = "Sonderurkunde",
                WinningProjectId = null,
                AwardedAtUtc = null
            };
            context.CompetitionAwards.AddRange(award1, award2, award3);

            // Seed Sample Evaluations
            context.ProjectEvaluations.AddRange(
                new ProjectEvaluation
                {
                    CompetitionId = wmc3Competition.Id,
                    ProjectId = project1.Id,
                    JuryMemberId = jury1.Id,
                    CriterionId = crit1.Id,
                    Score = 9,
                    Note = "Sehr innovative Idee, durchdachtes Konzept.",
                    UpdatedAtUtc = DateTime.UtcNow
                },
                new ProjectEvaluation
                {
                    CompetitionId = wmc3Competition.Id,
                    ProjectId = project1.Id,
                    JuryMemberId = jury1.Id,
                    CriterionId = crit2.Id,
                    Score = 8.5,
                    Note = "Saubere Architektur, gute Code-Trennung.",
                    UpdatedAtUtc = DateTime.UtcNow
                },
                new ProjectEvaluation
                {
                    CompetitionId = wmc3Competition.Id,
                    ProjectId = project1.Id,
                    JuryMemberId = jury1.Id,
                    CriterionId = crit3.Id,
                    Score = 9.5,
                    Note = "Exzellente Präsentation und starker Live-Pitch!",
                    UpdatedAtUtc = DateTime.UtcNow
                },
                new ProjectEvaluation
                {
                    CompetitionId = wmc3Competition.Id,
                    ProjectId = project1.Id,
                    JuryMemberId = jury2.Id,
                    CriterionId = crit1.Id,
                    Score = 8,
                    Note = "Solide Lösung für das Problem.",
                    UpdatedAtUtc = DateTime.UtcNow
                },
                new ProjectEvaluation
                {
                    CompetitionId = wmc3Competition.Id,
                    ProjectId = project1.Id,
                    JuryMemberId = jury2.Id,
                    CriterionId = crit2.Id,
                    Score = 9,
                    Note = "Praxistauglich und modern.",
                    UpdatedAtUtc = DateTime.UtcNow
                },
                new ProjectEvaluation
                {
                    CompetitionId = wmc3Competition.Id,
                    ProjectId = project1.Id,
                    JuryMemberId = jury2.Id,
                    CriterionId = crit3.Id,
                    Score = 8.5,
                    Note = "Gute Folien.",
                    UpdatedAtUtc = DateTime.UtcNow
                }
            );

            if (project2 != null)
            {
                context.ProjectEvaluations.AddRange(
                    new ProjectEvaluation
                    {
                        CompetitionId = wmc3Competition.Id,
                        ProjectId = project2.Id,
                        JuryMemberId = jury1.Id,
                        CriterionId = crit1.Id,
                        Score = 7.5,
                        Note = "Guter Ansatz.",
                        UpdatedAtUtc = DateTime.UtcNow
                    },
                    new ProjectEvaluation
                    {
                        CompetitionId = wmc3Competition.Id,
                        ProjectId = project2.Id,
                        JuryMemberId = jury1.Id,
                        CriterionId = crit2.Id,
                        Score = 8,
                        Note = "Gute Umsetzung.",
                        UpdatedAtUtc = DateTime.UtcNow
                    },
                    new ProjectEvaluation
                    {
                        CompetitionId = wmc3Competition.Id,
                        ProjectId = project2.Id,
                        JuryMemberId = jury1.Id,
                        CriterionId = crit3.Id,
                        Score = 8,
                        Note = "Angemessene Präsentation.",
                        UpdatedAtUtc = DateTime.UtcNow
                    }
                );
            }

            await context.SaveChangesAsync();
        }
    }

    private record StudentSeedRow(string Department, string ClassName, string UserName, string FirstName, string LastName);

    private record ClassHistoryCandidate(string SchoolYear, string ClassName, string Branch);

    private record DemoProfessor(string Id, string FirstName, string LastName);

    private record DemoProject(
        string Title,
        string Description,
        string Technology,
        ProjectStatus Status,
        ProjectType ProjectType,
        string SchoolYear);
}
