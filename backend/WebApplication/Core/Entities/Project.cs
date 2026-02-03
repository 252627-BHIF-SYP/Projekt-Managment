using System;
using System.Collections.Generic;
using System.Linq;
using System.Text;
using System.Threading.Tasks;
namespace Core.Entities;

public class Project
{
    public int ProjectId { get; set; }

    public int SchoolYearId { get; set; }
    public SchoolYear SchoolYear { get; set; } = null!;

    public string Title { get; set; } = "";
    public string Description { get; set; } = "";
    public string GithubUrl { get; set; } = "";
    public string LogoUrl { get; set; } = "";
    public string Status { get; set; } = "";
    public string Technology { get; set; } = "";

    public List<ProjectStudent> ProjectStudents { get; set; } = new List<ProjectStudent>();
    public List<ProjectSupervisor> ProjectSupervisors { get; set; } = new List<ProjectSupervisor>();
}
