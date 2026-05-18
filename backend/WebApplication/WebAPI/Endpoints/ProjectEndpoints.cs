using Persistence.Entities;
using Services.Interfaces;
using Services.Results;
using WebAPI.Filters;

namespace WebAPI.Endpoints;

public static class ProjectEndpoints
{
    public static void MapProjectEndpoints(this IEndpointRouteBuilder app, bool useAuth)
    {
        var group = app.MapGroup("/api/Project")
            .WithTags("Projects");

        if (useAuth)
        {
            group.RequireAuthorization("ProjectAccess");
        }

        group.MapGet("All", GetProjects)
            .WithName(nameof(GetProjects))
            .Produces<IEnumerable<ProjectDto>>();

        group.MapGet("", GetProjects)
            .Produces<IEnumerable<ProjectDto>>();

        group.MapGet("{id:int}", GetProjectById)
            .WithName(nameof(GetProjectById))
            .Produces<ProjectDto>()
            .Produces(StatusCodes.Status404NotFound);

        group.MapPost("Add", CreateProject)
            .WithName(nameof(CreateProject))
            .AddEndpointFilter<FluentValidationFilter<CreateProjectDto>>()
            .Produces<ProjectDto>(StatusCodes.Status201Created)
            .Produces(StatusCodes.Status400BadRequest)
            .Produces(StatusCodes.Status409Conflict);

        group.MapGet("Count", async (IProjectService service) => TypedResults.Ok(await service.CountProjectsAsync()))
            .WithName("GetProjectCount");

        group.MapGet("ProjectCountPerYear", async (IProjectService service) => TypedResults.Ok(await service.GetProjectCountPerYearAsync()))
            .WithName("GetProjectCountPerYear");

        group.MapGet("Types", () => TypedResults.Ok(Enum.GetNames<ProjectType>()))
            .WithName("GetProjectTypes");

        group.MapGet("Statuses", () => TypedResults.Ok(Enum.GetNames<ProjectStatus>()))
            .WithName("GetProjectStatuses");
    }

    private static async Task<IResult> GetProjects(
        IProjectService service,
        string? searchTerm,
        int? schoolYearId,
        int? classId,
        string? supervisorId,
        ProjectType? projectType,
        ProjectStatus? status)
    {
        var projects = await service.GetProjectsAsync(new ProjectFilterDto(
            searchTerm,
            schoolYearId,
            classId,
            supervisorId,
            projectType,
            status));

        return TypedResults.Ok(projects);
    }

    private static async Task<IResult> GetProjectById(IProjectService service, int id)
    {
        var project = await service.GetProjectByIdAsync(id);
        if (project == null)
        {
            return TypedResults.NotFound();
        }

        return TypedResults.Ok(project);
    }

    private static async Task<IResult> CreateProject(IProjectService service, CreateProjectDto dto)
    {
        var result = await service.CreateProjectAsync(dto);

        if (result.Status == ServiceResultStatus.Success && result.Value != null)
        {
            return TypedResults.Created($"/api/Project/{result.Value.ProjectId}", result.Value);
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

}
