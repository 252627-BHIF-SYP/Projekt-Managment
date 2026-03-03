using System;
using Core.Enums;
using System.Collections.Generic;
using System.ComponentModel.DataAnnotations;
using System.Linq;
using System.Text;
using System.Threading.Tasks;

namespace Core.Entities
{
    public class SchoolYear
    {
        [Key]
        public int SchoolYearId { get; set; }

        public required string Year { get; set; }

        public ICollection<Project>? Projects { get; init; } = [];
        public ICollection<StudentClassHistory>? StudentClassHistory { get; set; }
    }
}
