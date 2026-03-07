using Core.Entities;
using Core.Enums;
using Microsoft.EntityFrameworkCore;
using Persistence;
using WebAPI.DTOs;

namespace WebAPI.Service
{
    public class ImportService(ApplicationDbContext context)
    {
        private ApplicationDbContext Context => context;

        public async Task ImportStudents(string text)
        {
            var lines = text.Split('\n');

            // Um zu verhindern Schuljahre und Klassen doppelt in die Datenbank zu speichern
            var schoolYearsFromDB = await Context.SchoolYear.Select(l => l.Year).ToListAsync();
            var schoolYearsFromCsv = lines.Skip(1).Select(l => l.Split(";"))
                .Select(l => l[4])
                .Distinct()
                .Where(l => !schoolYearsFromDB.Contains(l))
                .Select(l => new SchoolYear
                {
                    Year = l,
                }).ToList();

            await Context.SchoolYear.AddRangeAsync(schoolYearsFromCsv);

            var studentClassFromDB = await Context.StudentClass.Select(s => s.Name).ToListAsync();
            var studentClassFromCsv = lines.Skip(1).Select(l => l.Split(";"))
                .DistinctBy(l => l[3])
                .Where(l => !studentClassFromDB.Contains(l[3]))
                .Select(l => new StudentClass
                {
                    Name = l[3],
                    Branch = l[5]
                }).ToList();

            await Context.StudentClass.AddRangeAsync(studentClassFromCsv);

            // Man braucht IF Name weil man kann nicht nur mit Vor und Nachname unterscheiden kann
            var studentsFromDB = await Context.Student.ToListAsync();
            var studentsFromCsv = lines.Skip(1).Select(l => l.Split(";"))
                .DistinctBy(l => l[0])
                .Select(l => new Student
                {
                    Id = l[0],
                    FirstName = l[1],
                    LastName = l[2],
                }).Where(l => !studentsFromDB.Contains(l)).ToList();

            await Context.Student.AddRangeAsync(studentsFromCsv);

            await Context.SaveChangesAsync();

            var newSchoolYearsFromDB = await Context.SchoolYear.ToListAsync();
            var newStudentClassFromDB = await Context.StudentClass.ToListAsync();
            var newStudentFromDB = await Context.Student.ToListAsync();

            var studentClassHistoryFromDB = await Context.StudentClassHistory.ToListAsync();
            var studentClassHistoryFromCsv = lines.Skip(1).Select(l => l.Split(';')).DistinctBy(l => l[0])
                .Select(l => new StudentClassHistory
                {
                    ClassId = newStudentClassFromDB.Single(c => c.Name == l[3] && c.Branch == l[5]).ClassId,
                    StudentId = newStudentFromDB.Single(s => s.Id == l[0]).Id,
                    SchoolYearId = newSchoolYearsFromDB.Single(y => y.Year == l[4]).SchoolYearId
                }).ToList();

            await Context.StudentClassHistory.AddRangeAsync(studentClassHistoryFromCsv);

            await Context.SaveChangesAsync();
        }

        public async Task ImportProfessors(string text)
        {
            var lines = text.Split('\n');

            var professorsFromDB = await Context.Professor.ToListAsync();
            var professorsFromCSV = lines.Skip(1).Select(l => l.Split(";"))
                .Select(l => new Professor
                {
                    Id = l[0],
                    FirstName = l[1],
                    LastName = l[2],
                }).Distinct().Where(p => !professorsFromDB.Exists(d => d.FirstName == p.FirstName && d.LastName == p.LastName)).ToList();

            await Context.AddRangeAsync(professorsFromCSV);

            await Context.SaveChangesAsync();
        }

        public async Task ImportProject(ProjectDTO project)
        {
            var projectForDB = new Project()
            {
                Description = project.description,
                GithubUrl = project.githubURL,
                LogoUrl = project.logoURL,
                Technology = project.technologies,
                Title = project.title,
                Status = Enum.Parse<ProjectStatus>(project.projectStatus),
                ProjectType = project.projectType,
            };

            await Context.Project.AddAsync(projectForDB);

            await Context.SaveChangesAsync();

            var projectStudents = project.students.Select(s => new ProjectStudent
            {
                Role = s.role,
                HistoryId = s.historyId,
                ProjectId = projectForDB.ProjectId,
            }).ToList();

            await Context.AddRangeAsync(projectStudents);

            var projectSupervisors = project.supervisors.Select(s => new ProjectSupervisor
            {
                Role = s.role,
                ProfessorId = s.professorId,
                ProjectId = projectForDB.ProjectId,
            }).ToList();

            await Context.AddRangeAsync(projectSupervisors);

            var SchoolYearProject = new SchoolYearProject() {
                ProjectId = projectForDB.ProjectId ,
                SchoolYearId = project.schoolYearId,
            };

            await Context.AddAsync(SchoolYearProject);

            await Context.SaveChangesAsync();
        }

        public async Task<Boolean> ImportStudent(StudentDTO dto)
        {
            try
            {
                var student = new Student()
                {
                    Id = dto.StudentID,
                    FirstName = dto.FirstName,
                    LastName = dto.LastName
                };

                await Context.Student.AddAsync(student);
                await Context.SaveChangesAsync();

                return true;
            }
            catch (Exception ex)
            {
                return false;
            }
        }

        public async Task<Boolean> ImportProfessor(ProfessorDTO dto)
        {
            try
            {
                var professor = new Professor()
                {
                    Id = dto.ProfessorID,
                    FirstName = dto.FirstName,
                    LastName = dto.LastName
                };

                await Context.Professor.AddAsync(professor);
                await Context.SaveChangesAsync();

                return true;
            }
            catch (Exception ex)
            {
                return false;
            }
        }
    }
}