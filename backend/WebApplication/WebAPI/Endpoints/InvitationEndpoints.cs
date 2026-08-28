using Persistence.Entities;
using Services.Interfaces;
using Services.Results;

namespace WebAPI.Endpoints;

public static class InvitationEndpoints
{
    public static void MapInvitationEndpoints(this IEndpointRouteBuilder app, bool useAuth)
    {
        var group = app.MapGroup("/api/Invitation")
            .WithTags("Invitations & External Users");

        // Public token endpoints (no Keycloak auth needed)
        group.MapGet("validate/{token}", ValidateInvitationToken)
            .WithName(nameof(ValidateInvitationToken))
            .Produces<InvitationDto>()
            .Produces(StatusCodes.Status404NotFound)
            .Produces(StatusCodes.Status400BadRequest);

        group.MapPost("accept/{token}", AcceptInvitation)
            .WithName(nameof(AcceptInvitation))
            .Produces<InvitationDto>()
            .Produces(StatusCodes.Status404NotFound)
            .Produces(StatusCodes.Status400BadRequest);

        group.MapPost("submit-external-project", SubmitExternalProject)
            .WithName(nameof(SubmitExternalProject))
            .Produces<ProjectDto>()
            .Produces(StatusCodes.Status400BadRequest);

        group.MapPost("consent/{projectId:int}", ConfirmConsent)
            .WithName(nameof(ConfirmConsent))
            .Produces(StatusCodes.Status204NoContent)
            .Produces(StatusCodes.Status404NotFound);

        // Protected endpoints for teachers/competition owners
        var authGroup = group.MapGroup("");
        if (useAuth)
        {
            authGroup.RequireAuthorization("ProjectAccess");
        }

        authGroup.MapGet("", GetInvitations)
            .WithName(nameof(GetInvitations))
            .Produces<IEnumerable<InvitationDto>>();

        authGroup.MapPost("", CreateInvitation)
            .WithName(nameof(CreateInvitation))
            .Produces<InvitationDto>(StatusCodes.Status201Created)
            .Produces(StatusCodes.Status400BadRequest);

        authGroup.MapDelete("{id:int}", RevokeInvitation)
            .WithName(nameof(RevokeInvitation))
            .Produces(StatusCodes.Status204NoContent)
            .Produces(StatusCodes.Status404NotFound);
    }

    private static async Task<IResult> GetInvitations(
        IInvitationService service,
        int? competitionId,
        InvitationStatus? status)
    {
        var list = await service.GetInvitationsAsync(competitionId, status);
        return TypedResults.Ok(list);
    }

    private static async Task<IResult> CreateInvitation(
        IInvitationService service,
        HttpContext httpContext,
        CreateInvitationDto dto)
    {
        var user = httpContext.User;
        var userId = user.FindFirst("db_user_id")?.Value ??
                     user.Identity?.Name ??
                     httpContext.Request.Headers["X-Mock-Username"].FirstOrDefault();

        var result = await service.CreateInvitationAsync(dto, userId);
        if (result.Status == ServiceResultStatus.Success && result.Value != null)
        {
            return TypedResults.Created($"/api/Invitation/{result.Value.InvitationId}", result.Value);
        }

        return MapResult(result);
    }

    private static async Task<IResult> ValidateInvitationToken(
        IInvitationService service,
        string token)
    {
        var result = await service.GetInvitationByTokenAsync(token);
        return MapResult(result);
    }

    private static async Task<IResult> AcceptInvitation(
        IInvitationService service,
        string token,
        AcceptInvitationDto? dto)
    {
        var result = await service.AcceptInvitationAsync(token, dto ?? new AcceptInvitationDto(null));
        return MapResult(result);
    }

    private static async Task<IResult> RevokeInvitation(
        IInvitationService service,
        int id)
    {
        var result = await service.RevokeInvitationAsync(id);
        return MapResult(result);
    }

    private static async Task<IResult> SubmitExternalProject(
        IInvitationService service,
        CreateExternalProjectDto dto)
    {
        var result = await service.SubmitExternalProjectAsync(dto);
        return MapResult(result);
    }

    private static async Task<IResult> ConfirmConsent(
        IInvitationService service,
        int projectId,
        ConfirmConsentDto dto)
    {
        var result = await service.ConfirmProjectConsentAsync(projectId, dto);
        return MapResult(result);
    }

    private static IResult MapResult<T>(ServiceResult<T> result) => result.Status switch
    {
        ServiceResultStatus.Success => TypedResults.Ok(result.Value),
        ServiceResultStatus.NotFound => TypedResults.NotFound(),
        ServiceResultStatus.ValidationError => TypedResults.Problem(
            title: "Validation Error",
            detail: result.Message,
            statusCode: StatusCodes.Status400BadRequest),
        ServiceResultStatus.Forbidden => TypedResults.Forbid(),
        ServiceResultStatus.Conflict => TypedResults.Conflict(new { message = result.Message }),
        _ => TypedResults.Problem(
            title: "Internal Error",
            detail: result.Message,
            statusCode: StatusCodes.Status500InternalServerError)
    };

    private static IResult MapResult(ServiceResult result) => result.Status switch
    {
        ServiceResultStatus.Success => TypedResults.NoContent(),
        ServiceResultStatus.NotFound => TypedResults.NotFound(),
        ServiceResultStatus.ValidationError => TypedResults.Problem(
            title: "Validation Error",
            detail: result.Message,
            statusCode: StatusCodes.Status400BadRequest),
        ServiceResultStatus.Forbidden => TypedResults.Forbid(),
        ServiceResultStatus.Conflict => TypedResults.Conflict(new { message = result.Message }),
        _ => TypedResults.Problem(
            title: "Internal Error",
            detail: result.Message,
            statusCode: StatusCodes.Status500InternalServerError)
    };
}
