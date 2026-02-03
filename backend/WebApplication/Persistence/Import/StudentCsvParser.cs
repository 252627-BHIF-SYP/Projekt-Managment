using System;
using System.Collections.Generic;
using System.Linq;
using System.Text;
using System.Threading.Tasks;
using Core.Import;
using System.Globalization;

namespace Persistence.Import;

public class StudentCsvParser
{
    public (List<StudentCsvRow> Rows, ImportReport Report) Parse(Stream csvStream)
    {
        var rows = new List<StudentCsvRow>();
        var report = new ImportReport();

        using var reader = new StreamReader(csvStream, leaveOpen: true);

        var headerLine = reader.ReadLine();
        if (headerLine == null)
        {
            report.TotalRows = 0;
            return (rows, report);
        }

        var headers = Split(headerLine);
        var headerIndex = BuildHeaderIndex(headers);

        var required = new[] { "first_name", "last_name", "if_name", "schoolyear", "branch", "class", "year_level" };
        foreach (var req in required)
        {
            if (!headerIndex.ContainsKey(req))
            {
                report.TotalRows = 0;
                report.SkippedCount = 1;
                report.Rows.Add(new ImportRowResult
                {
                    RowNumber = 1,
                    Status = ImportRowStatus.Skipped,
                    Reason = $"Missing required header: {req}"
                });
                return (rows, report);
            }
        }

        var rowNumber = 1;
        var seenIfNames = new HashSet<string>(StringComparer.OrdinalIgnoreCase);

        while (!reader.EndOfStream)
        {
            var line = reader.ReadLine();
            rowNumber++;

            if (line == null || string.IsNullOrWhiteSpace(line))
            {
                report.Rows.Add(new ImportRowResult
                {
                    RowNumber = rowNumber,
                    Status = ImportRowStatus.Skipped,
                    Reason = "Empty line"
                });
                continue;
            }

            var parts = Split(line);

            var firstName = Get(parts, headerIndex, "first_name");
            var lastName = Get(parts, headerIndex, "last_name");
            var ifName = Get(parts, headerIndex, "if_name");
            var schoolYear = Get(parts, headerIndex, "schoolyear");
            var branch = Get(parts, headerIndex, "branch");
            var className = Get(parts, headerIndex, "class");
            var yearLevelRaw = Get(parts, headerIndex, "year_level");

            var missing = MissingRequired(firstName, lastName, ifName, schoolYear, branch, className, yearLevelRaw);
            if (missing)
            {
                report.Rows.Add(new ImportRowResult
                {
                    RowNumber = rowNumber,
                    Status = ImportRowStatus.Skipped,
                    Reason = "Missing required value(s)",
                    IfName = string.IsNullOrWhiteSpace(ifName) ? null : ifName
                });
                continue;
            }

            if (!seenIfNames.Add(ifName))
            {
                report.Rows.Add(new ImportRowResult
                {
                    RowNumber = rowNumber,
                    Status = ImportRowStatus.Skipped,
                    Reason = "Duplicate if_name in CSV",
                    IfName = ifName
                });
                continue;
            }

            if (!int.TryParse(yearLevelRaw, NumberStyles.Integer, CultureInfo.InvariantCulture, out var yearLevel))
            {
                report.Rows.Add(new ImportRowResult
                {
                    RowNumber = rowNumber,
                    Status = ImportRowStatus.Skipped,
                    Reason = "Invalid year_level",
                    IfName = ifName
                });
                continue;
            }

            rows.Add(new StudentCsvRow
            {
                FirstName = firstName,
                LastName = lastName,
                IfName = ifName,
                SchoolYear = schoolYear,
                Branch = branch,
                ClassName = className,
                YearLevel = yearLevel
            });

            report.Rows.Add(new ImportRowResult
            {
                RowNumber = rowNumber,
                Status = ImportRowStatus.Imported,
                Reason = "Parsed",
                IfName = ifName
            });
        }

        report.TotalRows = report.Rows.Count;
        report.ImportedCount = report.Rows.Count(r => r.Status == ImportRowStatus.Imported);
        report.SkippedCount = report.Rows.Count(r => r.Status == ImportRowStatus.Skipped);

        return (rows, report);
    }

    private static string[] Split(string line)
    {
        return line.Split(';');
    }

    private static Dictionary<string, int> BuildHeaderIndex(string[] headers)
    {
        var map = new Dictionary<string, int>(StringComparer.OrdinalIgnoreCase);

        for (var i = 0; i < headers.Length; i++)
        {
            var key = headers[i].Trim();
            if (!string.IsNullOrWhiteSpace(key) && !map.ContainsKey(key))
            {
                map[key] = i;
            }
        }

        return map;
    }

    private static string Get(string[] parts, Dictionary<string, int> headerIndex, string key)
    {
        var idx = headerIndex[key];
        if (idx < 0 || idx >= parts.Length) return "";
        return parts[idx].Trim();
    }

    private static bool MissingRequired(params string[] values)
    {
        foreach (var v in values)
        {
            if (string.IsNullOrWhiteSpace(v)) return true;
        }
        return false;
    }
}
