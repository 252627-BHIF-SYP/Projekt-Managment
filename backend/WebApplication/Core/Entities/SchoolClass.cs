using System;
using System.Collections.Generic;
using System.Linq;
using System.Text;
using System.Threading.Tasks;
namespace Core.Entities;

public class SchoolClass
{
    public int ClassId { get; set; }
    public string Name { get; set; } = "";
    public int YearLevel { get; set; }
    public string Branch { get; set; } = "";

    public List<StudentClassHistory> StudentClassHistories { get; set; } = new List<StudentClassHistory>();
}