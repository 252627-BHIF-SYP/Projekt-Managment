using System;
using System.Collections.Generic;
using System.Linq;
using System.Text;
using System.Threading.Tasks;
namespace Core.Entities;

public class ProjectStudent
{
    public int ProjectId { get; set; }
    public Project Project { get; set; } = null!;

    public int HistoryId { get; set; }
    public StudentClassHistory StudentClassHistory { get; set; } = null!;

    public string Role { get; set; } = "";
}
