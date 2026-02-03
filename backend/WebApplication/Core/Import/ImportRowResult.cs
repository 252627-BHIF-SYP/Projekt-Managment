using System;
using System.Collections.Generic;
using System.Linq;
using System.Text;
using System.Threading.Tasks;
namespace Core.Import;

public class ImportRowResult
{
    public int RowNumber { get; set; }
    public ImportRowStatus Status { get; set; }
    public string Reason { get; set; } = "";
    public string? IfName { get; set; }
}
