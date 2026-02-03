using System;
using System.Collections.Generic;
using System.Linq;
using System.Text;
using System.Threading.Tasks;
namespace Core.Entities;

public class Student
{
    public int StudentId { get; set; }
    public string FirstName { get; set; } = "";
    public string LastName { get; set; } = "";
    public string IfName { get; set; } = "";

    public List<StudentClassHistory> StudentClassHistories { get; set; } = new List<StudentClassHistory>();
}
