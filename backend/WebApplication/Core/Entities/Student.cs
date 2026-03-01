using System;
using System.Collections.Generic;
using System.ComponentModel.DataAnnotations;
using System.Linq;
using System.Text;
using System.Threading.Tasks;

namespace Core.Entities
{
    public class Student
    {
        [Key]
        public required string StudentId { get; set; }

        public required string FirstName { get; set; }

        public required string LastName { get; set; }

        public ICollection<StudentClassHistory>? StudentClassHistory { get; set; }
    }
}
