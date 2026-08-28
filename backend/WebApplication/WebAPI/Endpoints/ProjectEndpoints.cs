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

        // Workflow Endpoints
        group.MapPost("{id:int}/Submit", SubmitForApproval)
            .WithName(nameof(SubmitForApproval))
            .Produces<ProjectDto>()
            .Produces(StatusCodes.Status403Forbidden)
            .Produces(StatusCodes.Status404NotFound);

        group.MapPost("{id:int}/Approve", ApproveProject)
            .WithName(nameof(ApproveProject))
            .Produces<ProjectDto>()
            .Produces(StatusCodes.Status403Forbidden)
            .Produces(StatusCodes.Status404NotFound);

        group.MapPost("{id:int}/Reject", RejectProject)
            .WithName(nameof(RejectProject))
            .Produces<ProjectDto>()
            .Produces(StatusCodes.Status403Forbidden)
            .Produces(StatusCodes.Status404NotFound);

        group.MapPost("{id:int}/Publish", PublishProject)
            .WithName(nameof(PublishProject))
            .Produces<ProjectDto>()
            .Produces(StatusCodes.Status403Forbidden)
            .Produces(StatusCodes.Status404NotFound);

        group.MapGet("PendingApprovals", GetPendingApprovals)
            .WithName(nameof(GetPendingApprovals))
            .Produces<IEnumerable<ProjectDto>>();

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
        HttpContext httpContext,
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
            CreateActor(httpContext));

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
        HttpContext httpContext,
        int id,
        UpdateProjectDto dto)
    {
        var result = await service.UpdateProjectAsync(id, dto, CreateActor(httpContext));

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
        HttpContext httpContext,
        int id)
    {
        var result = await service.DeleteProjectAsync(id, CreateActor(httpContext));

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
        HttpContext httpContext,
        int id)
    {
        var result = await service.GetProjectPermissionsAsync(id, CreateActor(httpContext));

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

    private static async Task<IResult> SubmitForApproval(
        IProjectService service,
        HttpContext httpContext,
        int id)
    {
        var result = await service.SubmitForApprovalAsync(id, CreateActor(httpContext));
        if (result.Status == ServiceResultStatus.Success && result.Value != null)
        {
            return TypedResults.Ok(result.Value);
        }

        if (result.Status == ServiceResultStatus.Forbidden)
        {
            return TypedResults.Forbid();
        }

        if (result.Status == ServiceResultStatus.NotFound)
        {
            return TypedResults.NotFound();
        }

        return TypedResults.Problem(detail: result.Message);
    }

    private static async Task<IResult> ApproveProject(
        IProjectService service,
        HttpContext httpContext,
        int id,
        ProjectApprovalDto? dto)
    {
        var result = await service.ApproveProjectAsync(id, dto ?? new ProjectApprovalDto(null), CreateActor(httpContext));
        if (result.Status == ServiceResultStatus.Success && result.Value != null)
        {
            return TypedResults.Ok(result.Value);
        }

        if (result.Status == ServiceResultStatus.Forbidden)
        {
            return TypedResults.Forbid();
        }

        if (result.Status == ServiceResultStatus.NotFound)
        {
            return TypedResults.NotFound();
        }

        return TypedResults.Problem(detail: result.Message);
    }

    private static async Task<IResult> RejectProject(
        IProjectService service,
        HttpContext httpContext,
        int id,
        ProjectApprovalDto? dto)
    {
        var result = await service.RejectProjectAsync(id, dto ?? new ProjectApprovalDto(null), CreateActor(httpContext));
        if (result.Status == ServiceResultStatus.Success && result.Value != null)
        {
            return TypedResults.Ok(result.Value);
        }

        if (result.Status == ServiceResultStatus.Forbidden)
        {
            return TypedResults.Forbid();
        }

        if (result.Status == ServiceResultStatus.NotFound)
        {
            return TypedResults.NotFound();
        }

        return TypedResults.Problem(detail: result.Message);
    }

    private static async Task<IResult> PublishProject(
        IProjectService service,
        HttpContext httpContext,
        int id,
        ProjectApprovalDto? dto)
    {
        var result = await service.PublishProjectAsync(id, dto ?? new ProjectApprovalDto(null), CreateActor(httpContext));
        if (result.Status == ServiceResultStatus.Success && result.Value != null)
        {
            return TypedResults.Ok(result.Value);
        }

        if (result.Status == ServiceResultStatus.Forbidden)
        {
            return TypedResults.Forbid();
        }

        if (result.Status == ServiceResultStatus.NotFound)
        {
            return TypedResults.NotFound();
        }

        return TypedResults.Problem(detail: result.Message);
    }

    private static async Task<IResult> GetPendingApprovals(
        IProjectService service,
        HttpContext httpContext,
        string? searchTerm,
        int? schoolYearId,
        int? classId,
        string? supervisorId,
        ProjectType? projectType)
    {
        var filter = new ProjectFilterDto(searchTerm, schoolYearId, classId, supervisorId, projectType, ProjectStatus.Pending);
        var projects = await service.GetPendingApprovalsAsync(filter, CreateActor(httpContext));
        return TypedResults.Ok(projects);
    }

    private static ProjectActorDto CreateActor(HttpContext httpContext)
    {
        var user = httpContext.User;
        var username = user.FindFirst("db_user_id")?.Value ??
                       user.Identity?.Name ??
                       user.FindFirst("preferred_username")?.Value ??
                       user.FindFirst(ClaimTypes.NameIdentifier)?.Value;

        if (user.Identity?.IsAuthenticated == true)
        {
            return new ProjectActorDto(
                username,
                AuthRoles.CanAdministrate(user),
                AuthRoles.IsProfessor(user),
                AuthRoles.IsStudent(user),
                true);
        }

        var mockUsername = httpContext.Request.Headers["X-Mock-Username"].FirstOrDefault();
        var mockRoleHeader = httpContext.Request.Headers["X-Mock-Roles"].ToString();
        var mockRoles = mockRoleHeader
            .Split(',', StringSplitOptions.RemoveEmptyEntries | StringSplitOptions.TrimEntries)
            .ToList();

        return new ProjectActorDto(
            mockUsername,
            AuthRoles.HasAnyRole(mockRoles, AuthRoles.AdminRoles),
            AuthRoles.HasAnyRole(mockRoles, AuthRoles.ProfessorRoles),
            AuthRoles.HasAnyRole(mockRoles, AuthRoles.StudentRoles),
            !string.IsNullOrWhiteSpace(mockUsername));
    }
}
