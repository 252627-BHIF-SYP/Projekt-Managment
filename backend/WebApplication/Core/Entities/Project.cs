using Core.Enums;
using System;
using System.Collections.Generic;
using System.ComponentModel.DataAnnotations;
using System.Linq;
using System.Text;
using System.Threading.Tasks;

namespace Core.Entities
{
    public class Project
    {
        [Key]
        public int ProjectId { get; set; }

        public ICollection<ProjectSupervisor> ProjectSupervisors { get; init; } = [];

        public ICollection<ProjectStudent> ProjectStudents { get; init; } = [];

        public ICollection<SchoolYearProject> SchoolYearProjects { get; init; } = [];

        public required string Title { get; set; }
        
        public required string Description { get; set; }

        public required string GithubUrl { get; set; }

        public required string LogoUrl { get; set; }

        public ProjectStatus Status { get; set; }

        public required string Technology { get; set; }

        public required string ProjectType { get; set; }
    }
}
