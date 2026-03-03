using System;
using System.Collections.Generic;
using System.Linq;
using System.Text;
using System.Threading.Tasks;

namespace Core.Entities
{
    public class SchoolYearProject
    {
        public int SchoolYearProjectId { get; set; }

        public int SchoolYearId { get; set; }
        public SchoolYear? SchoolYear { get; set; }

        public int ProjectId { get; set; }
        public Project? Project { get; set; }
    }
}
