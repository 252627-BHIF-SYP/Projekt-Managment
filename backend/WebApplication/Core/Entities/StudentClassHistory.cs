using System;
using System.Collections.Generic;
using System.Linq;
using System.Text;
using System.Threading.Tasks;
namespace Core.Entities;

public class StudentClassHistory
{
    public int HistoryId { get; set; }

    public int StudentId { get; set; }
    public Student Student { get; set; } = null!;

    public int ClassId { get; set; }
    public SchoolClass Class { get; set; } = null!;

    public int SchoolYearId { get; set; }
    public SchoolYear SchoolYear { get; set; } = null!;

    public List<ProjectStudent> ProjectStudents { get; set; } = new List<ProjectStudent>();
}
