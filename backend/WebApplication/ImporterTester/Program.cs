using Persistence.Import;

internal class Program
{
    private static void Main(string[] args)
    {
        var parser = new StudentCsvParser();

        using var fs = File.OpenRead("students_template.csv");

        var (rows, report) = parser.Parse(fs);

        Console.WriteLine($"TotalRows: {report.TotalRows}");
        Console.WriteLine($"Imported: {report.ImportedCount}");
        Console.WriteLine($"Skipped: {report.SkippedCount}");

        foreach (var r in report.Rows)
        {
            Console.WriteLine($"{r.RowNumber}: {r.Status} | {r.IfName} | {r.Reason}");
        }
    }
}