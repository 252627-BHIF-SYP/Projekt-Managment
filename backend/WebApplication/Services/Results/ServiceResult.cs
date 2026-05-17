namespace Services.Results;

public enum ServiceResultStatus
{
    Success,
    NotFound,
    ValidationError,
    Conflict,
    DatabaseError,
    Forbidden
}

public record ServiceResult(ServiceResultStatus Status, string? Message = null)
{
    public bool IsSuccess => Status == ServiceResultStatus.Success;

    public static ServiceResult Success() => new(ServiceResultStatus.Success);
    public static ServiceResult NotFound(string message) => new(ServiceResultStatus.NotFound, message);
    public static ServiceResult ValidationError(string message) => new(ServiceResultStatus.ValidationError, message);
    public static ServiceResult Conflict(string message) => new(ServiceResultStatus.Conflict, message);
    public static ServiceResult DatabaseError(string message) => new(ServiceResultStatus.DatabaseError, message);
    public static ServiceResult Forbidden(string message) => new(ServiceResultStatus.Forbidden, message);
}

public record ServiceResult<T>(ServiceResultStatus Status, T? Value = default, string? Message = null)
{
    public bool IsSuccess => Status == ServiceResultStatus.Success;

    public static ServiceResult<T> Success(T value) => new(ServiceResultStatus.Success, value);
    public static ServiceResult<T> NotFound(string message) => new(ServiceResultStatus.NotFound, default, message);
    public static ServiceResult<T> ValidationError(string message) => new(ServiceResultStatus.ValidationError, default, message);
    public static ServiceResult<T> Conflict(string message) => new(ServiceResultStatus.Conflict, default, message);
    public static ServiceResult<T> DatabaseError(string message) => new(ServiceResultStatus.DatabaseError, default, message);
    public static ServiceResult<T> Forbidden(string message) => new(ServiceResultStatus.Forbidden, default, message);
}
