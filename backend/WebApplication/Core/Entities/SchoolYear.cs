using System;
using System.Collections.Generic;
using System.Linq;
using System.Text;
using System.Threading.Tasks;
namespace Core.Entities;

public class SchoolYear
{
    public int SchoolYearId { get; set; }
    public string Label { get; set; } = "";

    public List<StudentClassHistory> StudentClassHistories { get; set; } = new List<StudentClassHistory>();
    public List<Project> Projects { get; set; } = new List<Project>();
}