using System.Globalization;
using System.Text;
using Persistence.Entities;

namespace Services.Implementations;

public static class SchedulePdfBuilder
{
    private const double PageWidth = 595;
    private const double PageHeight = 842;
    private const double Margin = 46;
    private const double LineHeight = 16;

    public static byte[] Build(Competition competition)
    {
        var pages = BuildPages(competition);
        return WritePdf(pages);
    }

    public static string BuildFileName(Competition competition)
    {
        var safeName = NormalizeText(competition.Name)
            .ToLowerInvariant()
            .Replace(' ', '-');

        var builder = new StringBuilder();
        foreach (var character in safeName)
        {
            if (char.IsLetterOrDigit(character) || character == '-')
            {
                builder.Append(character);
            }
        }

        return $"zeitplan-{builder}-{competition.StartDate:yyyy-MM-dd}.pdf";
    }

    private static List<List<PdfLine>> BuildPages(Competition competition)
    {
        var pages = new List<List<PdfLine>>();
        var currentPage = new List<PdfLine>();
        var y = PageHeight - Margin;

        void NewPage()
        {
            if (currentPage.Count > 0)
            {
                pages.Add(currentPage);
            }

            currentPage = [];
            y = PageHeight - Margin;
        }

        void AddLine(string text, int size = 10, bool bold = false, double extraSpace = 0)
        {
            if (y < Margin + LineHeight)
            {
                NewPage();
            }

            currentPage.Add(new PdfLine(NormalizeText(text), size, bold, y));
            y -= LineHeight + extraSpace;
        }

        AddLine("Zeitplan", 24, true, 8);
        AddLine(competition.Name, 16, true, 8);
        AddLine($"Art: {CompetitionTypeLabel(competition.CompetitionType)}");
        AddLine($"Zeitraum: {competition.StartDate:dd.MM.yyyy}" +
                (competition.EndDate is null ? "" : $" bis {competition.EndDate:dd.MM.yyyy}"));
        AddLine($"Klassenarten: {competition.AllowedClassTypes}");
        AddLine($"Standarddauer: {competition.PresentationDurationMinutes} min Praesentation, {competition.BreakDurationMinutes} min Pause", 10, false, 12);

        AddLine("Teilnehmende Projekte", 14, true, 4);
        var projects = competition.CompetitionProjects
            .Select(item => item.Project)
            .OrderBy(project => project.Title)
            .ToList();

        if (projects.Count == 0)
        {
            AddLine("Noch keine Projekte zugeordnet.", 10, false, 10);
        }
        else
        {
            foreach (var project in projects)
            {
                var supervisors = project.ProjectSupervisors
                    .Where(s => s.Professor != null)
                    .Select(s => $"{s.Professor!.FirstName} {s.Professor!.LastName}")
                    .ToList();
                var supervisorText = supervisors.Count > 0 ? string.Join(", ", supervisors) : "Kein Betreuer";

                AddWrappedLine($"- {project.Title} ({project.ProjectType}) - Betreuer: {supervisorText}", AddLine);
            }

            y -= 8;
        }

        AddLine("Programm", 14, true, 4);
        var slots = competition.ScheduleSlots
            .OrderBy(slot => slot.Date)
            .ThenBy(slot => slot.StartTime)
            .ToList();

        if (slots.Count == 0)
        {
            AddLine("Noch keine Zeitplan-Eintraege vorhanden.");
        }
        else
        {
            DateOnly? currentDate = null;
            foreach (var slot in slots)
            {
                if (currentDate != slot.Date)
                {
                    currentDate = slot.Date;
                    AddLine(slot.Date.ToString("dddd, dd.MM.yyyy", CultureInfo.GetCultureInfo("de-AT")), 12, true, 4);
                }

                var endTime = slot.StartTime.AddMinutes(slot.DurationMinutes);
                var title = slot.SlotType == ScheduleSlotType.Presentation && slot.Project is not null
                    ? slot.Project.Title
                    : slot.Title;

                var projectDetails = "";
                if (slot.Project is not null)
                {
                    var supervisors = slot.Project.ProjectSupervisors
                        .Where(s => s.Professor != null)
                        .Select(s => $"{s.Professor!.LastName}")
                        .ToList();
                    var supervisorText = supervisors.Count > 0 ? string.Join(", ", supervisors) : "";
                    projectDetails = string.IsNullOrEmpty(supervisorText) ? $" | {slot.Project.ProjectType}" : $" | {slot.Project.ProjectType} ({supervisorText})";
                }

                var note = string.IsNullOrWhiteSpace(slot.Note) ? "" : $" | {slot.Note}";

                AddWrappedLine(
                    $"{slot.StartTime:HH\\:mm}-{endTime:HH\\:mm} | {SlotTypeLabel(slot.SlotType)} | {title}{projectDetails}{note}",
                    AddLine);
            }
        }

        if (currentPage.Count > 0)
        {
            pages.Add(currentPage);
        }

        return pages;
    }

    private static void AddWrappedLine(string text, Action<string, int, bool, double> addLine)
    {
        const int maxLength = 92;
        var remaining = text.Trim();

        while (remaining.Length > maxLength)
        {
            var splitAt = remaining.LastIndexOf(' ', maxLength);
            if (splitAt < 30)
            {
                splitAt = maxLength;
            }

            addLine(remaining[..splitAt], 10, false, 0);
            remaining = $"  {remaining[splitAt..].Trim()}";
        }

        addLine(remaining, 10, false, 2);
    }

    private static byte[] WritePdf(IReadOnlyList<List<PdfLine>> pages)
    {
        var objects = new List<byte[]>();
        var pageObjectIds = new List<int>();
        var fontObjectId = 3;

        objects.Add(Ascii("<< /Type /Catalog /Pages 2 0 R >>"));
        objects.Add([]);
        objects.Add(Ascii("<< /Type /Font /Subtype /Type1 /BaseFont /Helvetica >>"));

        foreach (var page in pages)
        {
            var content = BuildPageContent(page);
            var contentObjectId = objects.Count + 1;
            objects.Add(Ascii($"<< /Length {content.Length} >>\nstream\n{content}\nendstream"));

            var pageObjectId = objects.Count + 1;
            pageObjectIds.Add(pageObjectId);
            objects.Add(Ascii(
                $"<< /Type /Page /Parent 2 0 R /MediaBox [0 0 {PageWidth} {PageHeight}] " +
                $"/Resources << /Font << /F1 {fontObjectId} 0 R >> >> /Contents {contentObjectId} 0 R >>"));
        }

        var kids = string.Join(" ", pageObjectIds.Select(id => $"{id} 0 R"));
        objects[1] = Ascii($"<< /Type /Pages /Kids [{kids}] /Count {pageObjectIds.Count} >>");

        using var stream = new MemoryStream();
        Write(stream, "%PDF-1.4\n");
        var offsets = new List<long> { 0 };

        for (var index = 0; index < objects.Count; index++)
        {
            offsets.Add(stream.Position);
            Write(stream, $"{index + 1} 0 obj\n");
            stream.Write(objects[index]);
            Write(stream, "\nendobj\n");
        }

        var xrefPosition = stream.Position;
        Write(stream, $"xref\n0 {objects.Count + 1}\n");
        Write(stream, "0000000000 65535 f \n");
        foreach (var offset in offsets.Skip(1))
        {
            Write(stream, $"{offset:0000000000} 00000 n \n");
        }

        Write(stream, $"trailer\n<< /Size {objects.Count + 1} /Root 1 0 R >>\nstartxref\n{xrefPosition}\n%%EOF");
        return stream.ToArray();
    }

    private static string BuildPageContent(IReadOnlyList<PdfLine> lines)
    {
        var builder = new StringBuilder();
        foreach (var line in lines)
        {
            builder.Append("BT /F1 ")
                .Append(line.Size)
                .Append(" Tf ")
                .Append(Margin.ToString(CultureInfo.InvariantCulture))
                .Append(' ')
                .Append(line.Y.ToString(CultureInfo.InvariantCulture))
                .Append(" Td (")
                .Append(EscapePdfText(line.Text))
                .Append(") Tj ET\n");
        }

        return builder.ToString();
    }

    private static string EscapePdfText(string text) => text
        .Replace("\\", "\\\\")
        .Replace("(", "\\(")
        .Replace(")", "\\)");

    private static string NormalizeText(string text) => text
        .Replace("ä", "ae").Replace("Ä", "Ae")
        .Replace("ö", "oe").Replace("Ö", "Oe")
        .Replace("ü", "ue").Replace("Ü", "Ue")
        .Replace("ß", "ss")
        .Replace("–", "-").Replace("—", "-");

    private static string CompetitionTypeLabel(CompetitionType type) => type switch
    {
        CompetitionType.Itp => "ITP-Wettbewerb",
        CompetitionType.Wmc3 => "WMC-3 Wettbewerb",
        CompetitionType.ProjectAward => "Project Award",
        CompetitionType.Dipl => "DIPL-Vorstellungen",
        CompetitionType.Syp => "SYP-Vorstellungen",
        _ => type.ToString()
    };

    private static string SlotTypeLabel(ScheduleSlotType type) => type switch
    {
        ScheduleSlotType.Presentation => "Praesentation",
        ScheduleSlotType.Break => "Pause",
        ScheduleSlotType.Info => "Programmpunkt",
        _ => type.ToString()
    };

    private static byte[] Ascii(string value) => Encoding.ASCII.GetBytes(value);

    private static void Write(Stream stream, string value) => stream.Write(Ascii(value));

    private record PdfLine(string Text, int Size, bool Bold, double Y);
}
