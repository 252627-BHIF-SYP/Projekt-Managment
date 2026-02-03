using System;
using System.Collections.Generic;
using System.Linq;
using System.Text;
using System.Threading.Tasks;
namespace Core.Entities;

public class Professor
{
    public int ProfessorId { get; set; }
    public string FirstName { get; set; } = "";
    public string LastName { get; set; } = "";

    public List<ProjectSupervisor> ProjectSupervisors { get; set; } = new List<ProjectSupervisor>();
}
