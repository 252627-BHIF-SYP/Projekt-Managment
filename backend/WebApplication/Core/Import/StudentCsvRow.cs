using System;
using System.Collections.Generic;
using System.Linq;
using System.Text;
using System.Threading.Tasks;
namespace Core.Import;

public class StudentCsvRow
{
    public string FirstName { get; set; } = "";
    public string LastName { get; set; } = "";
    public string IfName { get; set; } = "";
    public string SchoolYear { get; set; } = "";
    public string Branch { get; set; } = "";
    public string ClassName { get; set; } = "";
    public int YearLevel { get; set; }
}
