using Persistence.Entities;
using Services.Interfaces;
using Services.Results;
using WebAPI.Filters;

namespace WebAPI.Endpoints;

public static class PersonEndpoints
{
    public static void MapPersonEndpoints(this IEndpointRouteBuilder app, bool useAuth)
    {
        var students = app.MapGroup("/api/Student")
            .WithTags("Students");

        var professors = app.MapGroup("/api/Professor")
            .WithTags("Professors");

        var studentHistory = app.MapGroup("/api/StudentClassHistory")
            .WithTags("StudentClassHistory");

        if (useAuth)
        {
            students.RequireAuthorization("ProjectAccess");
            professors.RequireAuthorization("ProjectAccess");
            studentHistory.RequireAuthorization("ProjectAccess");
        }

        students.MapGet("All", async (IPersonService service) => TypedResults.Ok(await service.GetStudentsAsync()))
            .WithName("GetStudents")
            .Produces<IEnumerable<StudentDto>>();

        students.MapGet("{id}", GetStudentById)
            .WithName("GetStudentById")
            .Produces<StudentDto>()
            .Produces(StatusCodes.Status404NotFound);

        students.MapGet("{id}/historyId", GetStudentHistoryId)
            .WithName("GetStudentHistoryId");

        var createStudent = students.MapPost("Add", CreateStudent)
            .WithName("CreateStudent")
            .AddEndpointFilter<FluentValidationFilter<PersonCreateRequest>>();

        var importStudents = students.MapPost("Import", ImportStudents)
            .WithName("ImportStudents")
            .DisableAntiforgery();

        students.MapGet("Count", async (IPersonService service) => TypedResults.Ok(await service.CountStudentsAsync()))
            .WithName("GetStudentCount");

        professors.MapGet("All", async (IPersonService service) => TypedResults.Ok(await service.GetProfessorsAsync()))
            .WithName("GetProfessors")
            .Produces<IEnumerable<ProfessorDto>>();

        professors.MapGet("{id}", GetProfessorById)
            .WithName("GetProfessorById")
            .Produces<ProfessorDto>()
            .Produces(StatusCodes.Status404NotFound);

        var createProfessor = professors.MapPost("Add", CreateProfessor)
            .WithName("CreateProfessor")
            .AddEndpointFilter<FluentValidationFilter<PersonCreateRequest>>();

        var importProfessors = professors.MapPost("Import", ImportProfessors)
            .WithName("ImportProfessors")
            .DisableAntiforgery();

        professors.MapGet("Count", async (IPersonService service) => TypedResults.Ok(await service.CountProfessorsAsync()))
            .WithName("GetProfessorCount");

        studentHistory.MapGet("StudentCountPerYear", async (IPersonService service) =>
                TypedResults.Ok(await service.GetStudentCountPerYearAsync()))
            .WithName("GetStudentCountPerYear");

        if (useAuth)
        {
            createStudent.RequireAuthorization("AdminAccess");
            importStudents.RequireAuthorization("AdminAccess");
            createProfessor.RequireAuthorization("AdminAccess");
            importProfessors.RequireAuthorization("AdminAccess");
        }
    }

    private static async Task<IResult> ImportStudents(IImportService service, IFormFile file)
    {
        if (file.Length == 0)
        {
            return TypedResults.Problem(
                statusCode: StatusCodes.Status400BadRequest,
                title: "Validation Error",
                detail: "CSV file is empty.");
        }

        using var reader = new StreamReader(file.OpenReadStream());
        var csvText = await reader.ReadToEndAsync();
        var result = await service.ImportStudentsAsync(csvText);
        return TypedResults.Ok(result);
    }

    private static async Task<IResult> CreateStudent(IPersonService service, PersonCreateRequest request)
    {
        var dto = request.ToPersonCreateDto(PersonType.Student);
        var result = await service.CreateStudentAsync(dto);
        return result.Status switch
        {
            ServiceResultStatus.Success when result.Value != null => TypedResults.Created($"/api/Student/{result.Value.Id}", result.Value),
            ServiceResultStatus.ValidationError => TypedResults.Problem(
                statusCode: StatusCodes.Status400BadRequest,
                title: "Validation Error",
                detail: result.Message),
            ServiceResultStatus.Conflict => TypedResults.Problem(
                statusCode: StatusCodes.Status409Conflict,
                title: "Conflict",
                detail: result.Message),
            ServiceResultStatus.Forbidden => TypedResults.Problem(
                statusCode: StatusCodes.Status403Forbidden,
                title: "Forbidden",
                detail: result.Message),
            ServiceResultStatus.DatabaseError => TypedResults.Problem(
                statusCode: StatusCodes.Status500InternalServerError,
                title: "Database Error",
                detail: result.Message),
            ServiceResultStatus.NotFound => TypedResults.NotFound(),
            _ => TypedResults.Problem(detail: result.Message)
        };
    }

    private static async Task<IResult> CreateProfessor(IPersonService service, PersonCreateRequest request)
    {
        var dto = request.ToPersonCreateDto(PersonType.Professor);
        var result = await service.CreateProfessorAsync(dto);
        return result.Status switch
        {
            ServiceResultStatus.Success when result.Value != null => TypedResults.Created($"/api/Professor/{result.Value.Id}", result.Value),
            ServiceResultStatus.ValidationError => TypedResults.Problem(
                statusCode: StatusCodes.Status400BadRequest,
                title: "Validation Error",
                detail: result.Message),
            ServiceResultStatus.Conflict => TypedResults.Problem(
                statusCode: StatusCodes.Status409Conflict,
                title: "Conflict",
                detail: result.Message),
            ServiceResultStatus.Forbidden => TypedResults.Problem(
                statusCode: StatusCodes.Status403Forbidden,
                title: "Forbidden",
                detail: result.Message),
            ServiceResultStatus.DatabaseError => TypedResults.Problem(
                statusCode: StatusCodes.Status500InternalServerError,
                title: "Database Error",
                detail: result.Message),
            ServiceResultStatus.NotFound => TypedResults.NotFound(),
            _ => TypedResults.Problem(detail: result.Message)
        };
    }

    private static async Task<IResult> ImportProfessors(IImportService service, IFormFile file)
    {
        if (file.Length == 0)
        {
            return TypedResults.Problem(
                statusCode: StatusCodes.Status400BadRequest,
                title: "Validation Error",
                detail: "CSV file is empty.");
        }

        using var reader = new StreamReader(file.OpenReadStream());
        var csvText = await reader.ReadToEndAsync();
        var result = await service.ImportProfessorsAsync(csvText);
        return TypedResults.Ok(result);
    }

    private static async Task<IResult> GetStudentById(IPersonService service, string id)
    {
        var student = await service.GetStudentByIdAsync(id);
        if (student == null)
        {
            return TypedResults.NotFound();
        }

        return TypedResults.Ok(student);
    }

    private static async Task<IResult> GetStudentHistoryId(IPersonService service, string id, int? schoolYearId)
    {
        var historyId = await service.GetStudentHistoryIdAsync(id, schoolYearId);
        if (historyId == null)
        {
            return TypedResults.NotFound();
        }

        return TypedResults.Ok(historyId.Value);
    }

    private static async Task<IResult> GetProfessorById(IPersonService service, string id)
    {
        var professor = await service.GetProfessorByIdAsync(id);
        if (professor == null)
        {
            return TypedResults.NotFound();
        }

        return TypedResults.Ok(professor);
    }
}

public record PersonCreateRequest(
    string? Id,
    string? StudentId,
    string? ProfessorId,
    string FirstName,
    string LastName,
    int? ClassId,
    int? SchoolYearId)
{
    public PersonCreateDto ToPersonCreateDto(PersonType personType)
    {
        var id = Id ?? StudentId ?? ProfessorId ?? string.Empty;
        return new PersonCreateDto(id, FirstName, LastName, personType, ClassId, SchoolYearId);
    }
}
