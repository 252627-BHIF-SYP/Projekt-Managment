using System;
using System.Collections.Generic;
using System.Linq;
using System.Text;
using System.Threading.Tasks;
namespace Core.Entities;

public class ProjectSupervisor
{
    public int ProjectId { get; set; }
    public Project Project { get; set; } = null!;

    public int ProfessorId { get; set; }
    public Professor Professor { get; set; } = null!;

    public string Role { get; set; } = "";
}
