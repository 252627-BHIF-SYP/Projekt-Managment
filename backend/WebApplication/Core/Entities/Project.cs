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

        public ICollection<ProjectSupervisor>? ProjectSupervisors { get; set; }
        public ICollection<ProjectStudent>? ProjectStudents { get; set; }

        public int SchoolYearId { get; set; }
        public SchoolYear? SchoolYear { get; set; }

        public required string Title { get; set; }
        
        public required string Description { get; set; }

        public required string GithubUrl { get; set; }

        public required string LogoUrl { get; set; }

        public ProjectStatus Status { get; set; }

        public required string Technology { get; set; }
    }
}
