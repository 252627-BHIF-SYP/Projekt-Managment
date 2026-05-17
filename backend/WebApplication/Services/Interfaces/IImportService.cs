namespace Services.Interfaces;

public enum ImportRowStatus
{
    Imported,
    Skipped,
    Failed
}

public record ImportRowResult(int RowNumber, ImportRowStatus Status, string? Identifier, string? Reason);

public record ImportResultDto(
    int TotalRows,
    int ImportedCount,
    int SkippedCount,
    int FailedCount,
    IReadOnlyList<ImportRowResult> Rows);

public interface IImportService
{
    Task<ImportResultDto> ImportStudentsAsync(string csvText);
    Task<ImportResultDto> ImportProfessorsAsync(string csvText);
}
