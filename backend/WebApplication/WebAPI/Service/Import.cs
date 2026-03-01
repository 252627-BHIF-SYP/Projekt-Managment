using Core.Entities;
using Microsoft.EntityFrameworkCore;
using Persistence;

namespace WebAPI.Service
{
    public class Import(ApplicationDbContext context)
    {
        private ApplicationDbContext Context => context;

        public async void ImportStudents(string filePath)
        {
            var lines = await File.ReadAllLinesAsync(filePath);

            lines.Skip(1);

            // Um zu verhindern Schuljahre und Klassen doppelt in die Datenbank zu speichern
            var schoolYearsFromDB = await Context.SchoolYear.Select(l => l.Year).ToListAsync();
            var schoolYearsFromCsv = lines.Select(l => l.Split(";"))
                .Select(l => l[4])
                .Distinct()
                .Where(l => !schoolYearsFromDB.Contains(l))
                .Select(l => new SchoolYear
                {
                    Year = l,
                }).ToList();

            await Context.SchoolYear.AddRangeAsync(schoolYearsFromCsv);

            var studentClassFromDB = await Context.StudentClass.Select(s => s.Name).ToListAsync();
            var studentClassFromCsv = lines.Select(l => l.Split(";"))
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
            var studentsFromCsv = lines.Select(l => l.Split(";"))
                .DistinctBy(l => l[0])
                .Select(l => new Student {
                    StudentId  = l[0],
                    FirstName = l[1],
                    LastName = l[2],                        
                }).Where(l => !studentsFromDB.Contains(l)).ToList();

            await Context.Student.AddRangeAsync(studentsFromCsv);

            var newSchoolYearsFromDB = await Context.SchoolYear.ToListAsync();
            var newStudentClassFromDB = await Context.StudentClass.ToListAsync();
            var newStudentFromDB = await Context.Student.ToListAsync();

            var studentClassHistoryFromDB = await Context.StudentClassHistory.ToListAsync();
            var studentClassHistoryFromCsv = lines.Select(l => l.Split(';')).DistinctBy(l => l[0])
                .Select(l => new StudentClassHistory
                {
                    ClassId = newStudentClassFromDB.Single(c => c.Name == l[3] && c.Branch == l[5]).ClassId,
                    StudentId = newStudentFromDB.Single(s => s.StudentId == l[0]).StudentId,
                    SchoolYearId = newSchoolYearsFromDB.Single(y => y.Year == l[4]).SchoolYearId
                }).ToList();

            await Context.StudentClassHistory.AddRangeAsync(studentClassHistoryFromCsv);
            await Context.SaveChangesAsync();
        }

        public async void ImportProfessors(string filePath)
        {
            var lines = await File.ReadAllLinesAsync(filePath);

            lines.Skip(1);

            var professorsFromDB = await Context.Professor.ToListAsync();
            var professorsFromCSV = lines.Select(l => l.Split(";"))
                .Select(l => new Professor {
                    FirstName = l[0],
                    LastName = l[1],
                }).Distinct().Where(p => !professorsFromDB.Exists(d => d.FirstName == p.FirstName && d.LastName == p.LastName)).ToList();

            await Context.AddRangeAsync(professorsFromCSV);

            await Context.SaveChangesAsync();
        }

        public async void ImportProject()
        {

        }
    }
}
