using System.Security.Claims;
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

        group.MapGet("My", GetMyProjects)
            .WithName(nameof(GetMyProjects))
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

        group.MapPut("{id:int}", UpdateProject)
            .WithName(nameof(UpdateProject))
            .AddEndpointFilter<FluentValidationFilter<UpdateProjectDto>>()
            .Produces<ProjectDto>()
            .Produces(StatusCodes.Status400BadRequest)
            .Produces(StatusCodes.Status403Forbidden)
            .Produces(StatusCodes.Status404NotFound)
            .Produces(StatusCodes.Status409Conflict);

        group.MapDelete("{id:int}", DeleteProject)
            .WithName(nameof(DeleteProject))
            .Produces(StatusCodes.Status204NoContent)
            .Produces(StatusCodes.Status403Forbidden)
            .Produces(StatusCodes.Status404NotFound);

        group.MapGet("{id:int}/Permissions", GetProjectPermissions)
            .WithName(nameof(GetProjectPermissions))
            .Produces<ProjectPermissionDto>()
            .Produces(StatusCodes.Status404NotFound);

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

    private static async Task<IResult> GetMyProjects(
        IProjectService service,
        ClaimsPrincipal user,
        string? searchTerm,
        int? schoolYearId,
        ProjectType? projectType,
        ProjectStatus? status)
    {
        var projects = await service.GetAssignedProjectsAsync(
            new ProjectFilterDto(
                searchTerm,
                schoolYearId,
                null,
                null,
                projectType,
                status),
            CreateActor(user));

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

    private static async Task<IResult> UpdateProject(
        IProjectService service,
        ClaimsPrincipal user,
        int id,
        UpdateProjectDto dto)
    {
        var result = await service.UpdateProjectAsync(id, dto, CreateActor(user));

        if (result.Status == ServiceResultStatus.Success && result.Value != null)
        {
            return TypedResults.Ok(result.Value);
        }

        if (result.Status == ServiceResultStatus.ValidationError)
        {
            return TypedResults.Problem(
                statusCode: StatusCodes.Status400BadRequest,
                title: "Validation Error",
                detail: result.Message);
        }

        if (result.Status == ServiceResultStatus.Forbidden)
        {
            return TypedResults.Problem(
                statusCode: StatusCodes.Status403Forbidden,
                title: "Forbidden",
                detail: result.Message);
        }

        if (result.Status == ServiceResultStatus.NotFound)
        {
            return TypedResults.NotFound();
        }

        if (result.Status == ServiceResultStatus.Conflict)
        {
            return TypedResults.Problem(
                statusCode: StatusCodes.Status409Conflict,
                title: "Conflict",
                detail: result.Message);
        }

        if (result.Status == ServiceResultStatus.DatabaseError)
        {
            return TypedResults.Problem(
                statusCode: StatusCodes.Status500InternalServerError,
                title: "Database Error",
                detail: result.Message);
        }

        return TypedResults.Problem(detail: result.Message);
    }

    private static async Task<IResult> DeleteProject(
        IProjectService service,
        ClaimsPrincipal user,
        int id)
    {
        var result = await service.DeleteProjectAsync(id, CreateActor(user));

        if (result.Status == ServiceResultStatus.Success)
        {
            return TypedResults.NoContent();
        }

        if (result.Status == ServiceResultStatus.Forbidden)
        {
            return TypedResults.Problem(
                statusCode: StatusCodes.Status403Forbidden,
                title: "Forbidden",
                detail: result.Message);
        }

        if (result.Status == ServiceResultStatus.NotFound)
        {
            return TypedResults.NotFound();
        }

        if (result.Status == ServiceResultStatus.DatabaseError)
        {
            return TypedResults.Problem(
                statusCode: StatusCodes.Status500InternalServerError,
                title: "Database Error",
                detail: result.Message);
        }

        return TypedResults.Problem(detail: result.Message);
    }

    private static async Task<IResult> GetProjectPermissions(
        IProjectService service,
        ClaimsPrincipal user,
        int id)
    {
        var result = await service.GetProjectPermissionsAsync(id, CreateActor(user));

        if (result.Status == ServiceResultStatus.Success && result.Value != null)
        {
            return TypedResults.Ok(result.Value);
        }

        if (result.Status == ServiceResultStatus.NotFound)
        {
            return TypedResults.NotFound();
        }

        return TypedResults.Problem(detail: result.Message);
    }

    private static ProjectActorDto CreateActor(ClaimsPrincipal user)
    {
        var username = user.Identity?.Name ??
                       user.FindFirst("preferred_username")?.Value ??
                       user.FindFirst(ClaimTypes.NameIdentifier)?.Value;

        return new ProjectActorDto(
            username,
            AuthRoles.CanAdministrate(user),
            AuthRoles.HasAnyRole(user, AuthRoles.Professor),
            AuthRoles.HasAnyRole(user, AuthRoles.Student),
            user.Identity?.IsAuthenticated == true);
    }
}
