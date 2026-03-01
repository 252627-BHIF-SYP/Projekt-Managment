using System;
using System.Collections.Generic;
using System.ComponentModel.DataAnnotations;
using System.Linq;
using System.Text;
using System.Threading.Tasks;

namespace Core.Entities
{
    public class StudentClass
    {
        [Key]
        public int ClassId { get; set; }

        public required string Name { get; set; } = string.Empty;

        public required string Branch { get; set; } = string.Empty;

        public ICollection<StudentClassHistory>? StudentClassHistory { get; set; }
    }
}
