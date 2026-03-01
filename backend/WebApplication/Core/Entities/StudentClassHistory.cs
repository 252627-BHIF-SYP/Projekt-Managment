using System;
using System.Collections.Generic;
using System.ComponentModel.DataAnnotations;
using System.Linq;
using System.Text;
using System.Threading.Tasks;

namespace Core.Entities
{
    public class StudentClassHistory
    {
        public int HistoryId {  get; set; }

        public required string StudentId { get; set; }
        public Student? Student { get; set; }

        public int ClassId { get; set; }
        public StudentClass? StudentClass { get; set; }

        public int SchoolYearId { get; set; }
        public SchoolYear? SchoolYear { get; set; }
        
        public ICollection<ProjectStudent>? ProjectStudents { get; set; }
    }
}
