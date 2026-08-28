using Services.Interfaces;
using Services.Results;

namespace WebAPI.Endpoints;

public static class EvaluationEndpoints
{
    public static void MapEvaluationEndpoints(this IEndpointRouteBuilder app, bool useAuth)
    {
        var jurorGroup = app.MapGroup("/api/Competition")
            .WithTags("Juror Portal");

        if (useAuth)
        {
            jurorGroup.RequireAuthorization("ProjectAccess");
        }

        jurorGroup.MapGet("MyJurorCompetitions", GetMyJurorCompetitions)
            .WithName(nameof(GetMyJurorCompetitions))
            .Produces<IEnumerable<JurorCompetitionDto>>();

        var group = app.MapGroup("/api/Competition/{competitionId:int}")
            .WithTags("Competition Evaluations & Jury");

        if (useAuth)
        {
            group.RequireAuthorization("ProjectAccess");
        }

        // Criteria
        group.MapGet("Criteria", GetCriteria)
            .WithName(nameof(GetCriteria))
            .Produces<IEnumerable<EvaluationCriterionDto>>();

        group.MapPost("Criteria", CreateCriterion)
            .WithName(nameof(CreateCriterion))
            .Produces<EvaluationCriterionDto>(StatusCodes.Status201Created)
            .Produces(StatusCodes.Status400BadRequest)
            .Produces(StatusCodes.Status404NotFound);

        group.MapPut("Criteria/{criterionId:int}", UpdateCriterion)
            .WithName(nameof(UpdateCriterion))
            .Produces<EvaluationCriterionDto>()
            .Produces(StatusCodes.Status400BadRequest)
            .Produces(StatusCodes.Status404NotFound);

        group.MapDelete("Criteria/{criterionId:int}", DeleteCriterion)
            .WithName(nameof(DeleteCriterion))
            .Produces(StatusCodes.Status204NoContent)
            .Produces(StatusCodes.Status404NotFound);

        // Jury
        group.MapGet("Jury", GetJuryMembers)
            .WithName(nameof(GetJuryMembers))
            .Produces<IEnumerable<JuryMemberDto>>();

        group.MapPost("Jury", AddJuryMember)
            .WithName(nameof(AddJuryMember))
            .Produces<JuryMemberDto>(StatusCodes.Status201Created)
            .Produces(StatusCodes.Status400BadRequest)
            .Produces(StatusCodes.Status404NotFound);

        group.MapDelete("Jury/{juryMemberId:int}", RemoveJuryMember)
            .WithName(nameof(RemoveJuryMember))
            .Produces(StatusCodes.Status204NoContent)
            .Produces(StatusCodes.Status404NotFound);

        // Evaluations
        group.MapGet("Evaluations", GetEvaluations)
            .WithName(nameof(GetEvaluations))
            .Produces<IEnumerable<ProjectEvaluationDto>>();

        group.MapPost("Evaluations", SubmitEvaluation)
            .WithName(nameof(SubmitEvaluation))
            .Produces<ProjectEvaluationDto>()
            .Produces(StatusCodes.Status400BadRequest)
            .Produces(StatusCodes.Status404NotFound);

        group.MapPost("Evaluations/Batch", BatchSubmitEvaluations)
            .WithName(nameof(BatchSubmitEvaluations))
            .Produces(StatusCodes.Status204NoContent)
            .Produces(StatusCodes.Status400BadRequest)
            .Produces(StatusCodes.Status404NotFound);

        // Leaderboard
        group.MapGet("Leaderboard", GetLeaderboard)
            .WithName(nameof(GetLeaderboard))
            .Produces<LeaderboardDto>()
            .Produces(StatusCodes.Status404NotFound);

        // Awards
        group.MapGet("Awards", GetAwards)
            .WithName(nameof(GetAwards))
            .Produces<IEnumerable<CompetitionAwardDto>>();

        group.MapPost("Awards", CreateAward)
            .WithName(nameof(CreateAward))
            .Produces<CompetitionAwardDto>(StatusCodes.Status201Created)
            .Produces(StatusCodes.Status400BadRequest)
            .Produces(StatusCodes.Status404NotFound);

        group.MapDelete("Awards/{awardId:int}", DeleteAward)
            .WithName(nameof(DeleteAward))
            .Produces(StatusCodes.Status204NoContent)
            .Produces(StatusCodes.Status404NotFound);

        group.MapPut("Awards/{awardId:int}/Winner", AssignAwardWinner)
            .WithName(nameof(AssignAwardWinner))
            .Produces<CompetitionAwardDto>()
            .Produces(StatusCodes.Status400BadRequest)
            .Produces(StatusCodes.Status404NotFound);

        // Status
        group.MapPut("Status", UpdateStatus)
            .WithName(nameof(UpdateStatus))
            .Produces(StatusCodes.Status204NoContent)
            .Produces(StatusCodes.Status400BadRequest)
            .Produces(StatusCodes.Status404NotFound);
    }

    private static async Task<IResult> GetCriteria(IEvaluationService service, int competitionId)
    {
        var criteria = await service.GetCriteriaAsync(competitionId);
        return TypedResults.Ok(criteria);
    }

    private static async Task<IResult> CreateCriterion(
        IEvaluationService service,
        int competitionId,
        CreateEvaluationCriterionDto dto)
    {
        var result = await service.CreateCriterionAsync(competitionId, dto);
        if (result.Status == ServiceResultStatus.Success && result.Value != null)
        {
            return TypedResults.Created(
                $"/api/Competition/{competitionId}/Criteria/{result.Value.CriterionId}",
                result.Value);
        }

        return MapResult(result);
    }

    private static async Task<IResult> UpdateCriterion(
        IEvaluationService service,
        int competitionId,
        int criterionId,
        UpdateEvaluationCriterionDto dto)
    {
        var result = await service.UpdateCriterionAsync(competitionId, criterionId, dto);
        return MapResult(result);
    }

    private static async Task<IResult> DeleteCriterion(
        IEvaluationService service,
        int competitionId,
        int criterionId)
    {
        var result = await service.DeleteCriterionAsync(competitionId, criterionId);
        return MapResult(result);
    }

    private static async Task<IResult> GetJuryMembers(IEvaluationService service, int competitionId)
    {
        var jury = await service.GetJuryMembersAsync(competitionId);
        return TypedResults.Ok(jury);
    }

    private static async Task<IResult> AddJuryMember(
        IEvaluationService service,
        int competitionId,
        AddJuryMemberDto dto)
    {
        var result = await service.AddJuryMemberAsync(competitionId, dto);
        if (result.Status == ServiceResultStatus.Success && result.Value != null)
        {
            return TypedResults.Created(
                $"/api/Competition/{competitionId}/Jury/{result.Value.JuryMemberId}",
                result.Value);
        }

        return MapResult(result);
    }

    private static async Task<IResult> RemoveJuryMember(
        IEvaluationService service,
        int competitionId,
        int juryMemberId)
    {
        var result = await service.RemoveJuryMemberAsync(competitionId, juryMemberId);
        return MapResult(result);
    }

    private static async Task<IResult> GetEvaluations(
        IEvaluationService service,
        int competitionId,
        int? juryMemberId,
        int? projectId)
    {
        var evaluations = await service.GetEvaluationsAsync(competitionId, juryMemberId, projectId);
        return TypedResults.Ok(evaluations);
    }

    private static async Task<IResult> SubmitEvaluation(
        IEvaluationService service,
        int competitionId,
        SubmitEvaluationDto dto)
    {
        var result = await service.SubmitEvaluationAsync(competitionId, dto);
        return MapResult(result);
    }

    private static async Task<IResult> BatchSubmitEvaluations(
        IEvaluationService service,
        int competitionId,
        BatchSubmitProjectEvaluationDto dto)
    {
        var result = await service.BatchSubmitProjectEvaluationsAsync(competitionId, dto);
        return MapResult(result);
    }

    private static async Task<IResult> GetLeaderboard(IEvaluationService service, int competitionId)
    {
        var result = await service.GetLeaderboardAsync(competitionId);
        return MapResult(result);
    }

    private static async Task<IResult> GetAwards(IEvaluationService service, int competitionId)
    {
        var awards = await service.GetAwardsAsync(competitionId);
        return TypedResults.Ok(awards);
    }

    private static async Task<IResult> CreateAward(
        IEvaluationService service,
        int competitionId,
        CreateAwardDto dto)
    {
        var result = await service.CreateAwardAsync(competitionId, dto);
        if (result.Status == ServiceResultStatus.Success && result.Value != null)
        {
            return TypedResults.Created(
                $"/api/Competition/{competitionId}/Awards/{result.Value.AwardId}",
                result.Value);
        }

        return MapResult(result);
    }

    private static async Task<IResult> DeleteAward(
        IEvaluationService service,
        int competitionId,
        int awardId)
    {
        var result = await service.DeleteAwardAsync(competitionId, awardId);
        return MapResult(result);
    }

    private static async Task<IResult> AssignAwardWinner(
        IEvaluationService service,
        int competitionId,
        int awardId,
        AssignAwardWinnerDto dto)
    {
        var result = await service.AssignAwardWinnerAsync(competitionId, awardId, dto);
        return MapResult(result);
    }

    private static async Task<IResult> UpdateStatus(
        IEvaluationService service,
        int competitionId,
        UpdateCompetitionStatusDto dto)
    {
        var result = await service.UpdateStatusAsync(competitionId, dto);
        return MapResult(result);
    }

    private static async Task<IResult> GetMyJurorCompetitions(
        IEvaluationService service,
        HttpContext httpContext)
    {
        var user = httpContext.User;
        var username = user.FindFirst("db_user_id")?.Value ??
                       user.Identity?.Name ??
                       user.FindFirst("preferred_username")?.Value ??
                       httpContext.Request.Headers["X-Mock-Username"].FirstOrDefault();

        var email = user.FindFirst(System.Security.Claims.ClaimTypes.Email)?.Value;

        var list = await service.GetMyJurorCompetitionsAsync(username, email);
        return TypedResults.Ok(list);
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
