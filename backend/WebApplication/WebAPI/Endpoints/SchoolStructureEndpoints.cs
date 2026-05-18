using Services.Interfaces;
using Services.Results;
using WebAPI.Filters;

namespace WebAPI.Endpoints;

public static class SchoolStructureEndpoints
{
    public static void MapSchoolStructureEndpoints(this IEndpointRouteBuilder app, bool useAuth)
    {
        var schoolYears = app.MapGroup("/api/SchoolYear")
            .WithTags("SchoolYears");

        var studentClasses = app.MapGroup("/api/StudentClass")
            .WithTags("StudentClasses");

        if (useAuth)
        {
            schoolYears.RequireAuthorization("ProjectAccess");
            studentClasses.RequireAuthorization("ProjectAccess");
        }

        schoolYears.MapGet("All", async (ISchoolStructureService service) =>
                TypedResults.Ok(await service.GetSchoolYearsAsync()))
            .WithName("GetSchoolYears")
            .Produces<IEnumerable<SchoolYearDto>>();

        schoolYears.MapGet("{id:int}", GetSchoolYearById)
            .WithName("GetSchoolYearById");

        schoolYears.MapPost("Add", CreateSchoolYear)
            .WithName("CreateSchoolYear")
            .AddEndpointFilter<FluentValidationFilter<CreateSchoolYearDto>>();

        schoolYears.MapGet("Count", async (ISchoolStructureService service) =>
                TypedResults.Ok(await service.CountSchoolYearsAsync()))
            .WithName("GetSchoolYearCount");

        studentClasses.MapGet("All", async (ISchoolStructureService service) =>
                TypedResults.Ok(await service.GetStudentClassesAsync()))
            .WithName("GetStudentClasses")
            .Produces<IEnumerable<StudentClassDto>>();

        studentClasses.MapGet("{id:int}", GetStudentClassById)
            .WithName("GetStudentClassById");

        studentClasses.MapPost("Add", CreateStudentClass)
            .WithName("CreateStudentClass")
            .AddEndpointFilter<FluentValidationFilter<CreateStudentClassDto>>();

        studentClasses.MapGet("Count", async (ISchoolStructureService service) =>
                TypedResults.Ok(await service.CountStudentClassesAsync()))
            .WithName("GetStudentClassCount");
    }

    private static async Task<IResult> GetSchoolYearById(ISchoolStructureService service, int id)
    {
        var schoolYear = await service.GetSchoolYearByIdAsync(id);
        if (schoolYear == null)
        {
            return TypedResults.NotFound();
        }

        return TypedResults.Ok(schoolYear);
    }

    private static async Task<IResult> CreateSchoolYear(ISchoolStructureService service, CreateSchoolYearDto dto)
    {
        var result = await service.CreateSchoolYearAsync(dto);

        if (result.Status == ServiceResultStatus.Success && result.Value != null)
        {
            return TypedResults.Created($"/api/SchoolYear/{result.Value.SchoolYearId}", result.Value);
        }

        if (result.Status == ServiceResultStatus.ValidationError)
        {
            return TypedResults.Problem(
                statusCode: StatusCodes.Status400BadRequest,
                title: "Validation Error",
                detail: result.Message);
        }

        if (result.Status == ServiceResultStatus.Conflict)
        {
            return TypedResults.Problem(
                statusCode: StatusCodes.Status409Conflict,
                title: "Conflict",
                detail: result.Message);
        }

        if (result.Status == ServiceResultStatus.Forbidden)
        {
            return TypedResults.Problem(
                statusCode: StatusCodes.Status403Forbidden,
                title: "Forbidden",
                detail: result.Message);
        }

        if (result.Status == ServiceResultStatus.DatabaseError)
        {
            return TypedResults.Problem(
                statusCode: StatusCodes.Status500InternalServerError,
                title: "Database Error",
                detail: result.Message);
        }

        if (result.Status == ServiceResultStatus.NotFound)
        {
            return TypedResults.NotFound();
        }

        return TypedResults.Problem(detail: result.Message);
    }

    private static async Task<IResult> CreateStudentClass(ISchoolStructureService service, CreateStudentClassDto dto)
    {
        var result = await service.CreateStudentClassAsync(dto);

        if (result.Status == ServiceResultStatus.Success && result.Value != null)
        {
            return TypedResults.Created($"/api/StudentClass/{result.Value.ClassId}", result.Value);
        }

        if (result.Status == ServiceResultStatus.ValidationError)
        {
            return TypedResults.Problem(
                statusCode: StatusCodes.Status400BadRequest,
                title: "Validation Error",
                detail: result.Message);
        }

        if (result.Status == ServiceResultStatus.Conflict)
        {
            return TypedResults.Problem(
                statusCode: StatusCodes.Status409Conflict,
                title: "Conflict",
                detail: result.Message);
        }

        if (result.Status == ServiceResultStatus.Forbidden)
        {
            return TypedResults.Problem(
                statusCode: StatusCodes.Status403Forbidden,
                title: "Forbidden",
                detail: result.Message);
        }

        if (result.Status == ServiceResultStatus.DatabaseError)
        {
            return TypedResults.Problem(
                statusCode: StatusCodes.Status500InternalServerError,
                title: "Database Error",
                detail: result.Message);
        }

        if (result.Status == ServiceResultStatus.NotFound)
        {
            return TypedResults.NotFound();
        }

        return TypedResults.Problem(detail: result.Message);
    }

    private static async Task<IResult> GetStudentClassById(ISchoolStructureService service, int id)
    {
        var studentClass = await service.GetStudentClassByIdAsync(id);
        if (studentClass == null)
        {
            return TypedResults.NotFound();
        }

        return TypedResults.Ok(studentClass);
    }
}
