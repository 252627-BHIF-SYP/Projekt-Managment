using Persistence.Entities;
using Services.Interfaces;
using Services.Results;
using WebAPI.Filters;

namespace WebAPI.Endpoints;

public static class CompetitionEndpoints
{
    public static void MapCompetitionEndpoints(this IEndpointRouteBuilder app, bool useAuth)
    {
        var group = app.MapGroup("/api/Competition")
            .WithTags("Competitions");

        if (useAuth)
        {
            group.RequireAuthorization("ProjectAccess");
        }

        group.MapGet("", GetCompetitions)
            .WithName(nameof(GetCompetitions))
            .Produces<IEnumerable<CompetitionSummaryDto>>();

        group.MapGet("{id:int}", GetCompetitionById)
            .WithName(nameof(GetCompetitionById))
            .Produces<CompetitionDto>()
            .Produces(StatusCodes.Status404NotFound);

        group.MapPost("", CreateCompetition)
            .WithName(nameof(CreateCompetition))
            .AddEndpointFilter<FluentValidationFilter<CreateCompetitionDto>>()
            .Produces<CompetitionDto>(StatusCodes.Status201Created)
            .Produces(StatusCodes.Status400BadRequest);

        group.MapPut("{id:int}", UpdateCompetition)
            .WithName(nameof(UpdateCompetition))
            .AddEndpointFilter<FluentValidationFilter<UpdateCompetitionDto>>()
            .Produces<CompetitionDto>()
            .Produces(StatusCodes.Status400BadRequest)
            .Produces(StatusCodes.Status404NotFound);

        group.MapDelete("{id:int}", DeleteCompetition)
            .WithName(nameof(DeleteCompetition))
            .Produces(StatusCodes.Status204NoContent)
            .Produces(StatusCodes.Status404NotFound);

        group.MapPut("{id:int}/Projects", SetCompetitionProjects)
            .WithName(nameof(SetCompetitionProjects))
            .AddEndpointFilter<FluentValidationFilter<SetCompetitionProjectsDto>>()
            .Produces(StatusCodes.Status204NoContent)
            .Produces(StatusCodes.Status400BadRequest)
            .Produces(StatusCodes.Status404NotFound);

        group.MapPost("{id:int}/ScheduleSlots", CreateScheduleSlot)
            .WithName(nameof(CreateScheduleSlot))
            .AddEndpointFilter<FluentValidationFilter<CreateScheduleSlotDto>>()
            .Produces<ScheduleSlotDto>(StatusCodes.Status201Created)
            .Produces(StatusCodes.Status400BadRequest)
            .Produces(StatusCodes.Status404NotFound);

        group.MapPut("{id:int}/ScheduleSlots/{slotId:int}", UpdateScheduleSlot)
            .WithName(nameof(UpdateScheduleSlot))
            .AddEndpointFilter<FluentValidationFilter<UpdateScheduleSlotDto>>()
            .Produces<ScheduleSlotDto>()
            .Produces(StatusCodes.Status400BadRequest)
            .Produces(StatusCodes.Status404NotFound);

        group.MapDelete("{id:int}/ScheduleSlots/{slotId:int}", DeleteScheduleSlot)
            .WithName(nameof(DeleteScheduleSlot))
            .Produces(StatusCodes.Status204NoContent)
            .Produces(StatusCodes.Status404NotFound);

        group.MapGet("{id:int}/Schedule.pdf", DownloadSchedulePdf)
            .WithName(nameof(DownloadSchedulePdf))
            .Produces(StatusCodes.Status200OK, contentType: "application/pdf")
            .Produces(StatusCodes.Status404NotFound);

        group.MapGet("Types", () => TypedResults.Ok(Enum.GetNames<CompetitionType>()))
            .WithName("GetCompetitionTypes");

        group.MapGet("SlotTypes", () => TypedResults.Ok(Enum.GetNames<ScheduleSlotType>()))
            .WithName("GetScheduleSlotTypes");
    }

    private static async Task<IResult> GetCompetitions(
        ICompetitionService service,
        CompetitionType? type,
        DateOnly? fromDate)
    {
        var competitions = await service.GetCompetitionsAsync(type, fromDate);
        return TypedResults.Ok(competitions);
    }

    private static async Task<IResult> GetCompetitionById(ICompetitionService service, int id)
    {
        var competition = await service.GetCompetitionByIdAsync(id);
        if (competition is null)
        {
            return TypedResults.NotFound();
        }

        return TypedResults.Ok(competition);
    }

    private static async Task<IResult> CreateCompetition(
        ICompetitionService service,
        CreateCompetitionDto dto)
    {
        var result = await service.CreateCompetitionAsync(dto);
        if (result.Status == ServiceResultStatus.Success && result.Value != null)
        {
            return TypedResults.Created($"/api/Competition/{result.Value.CompetitionId}", result.Value);
        }

        return MapServiceResult(result);
    }

    private static async Task<IResult> UpdateCompetition(
        ICompetitionService service,
        int id,
        UpdateCompetitionDto dto)
    {
        var result = await service.UpdateCompetitionAsync(id, dto);
        return MapServiceResult(result);
    }

    private static async Task<IResult> DeleteCompetition(ICompetitionService service, int id)
    {
        var result = await service.DeleteCompetitionAsync(id);
        return MapServiceResult(result);
    }

    private static async Task<IResult> SetCompetitionProjects(
        ICompetitionService service,
        int id,
        SetCompetitionProjectsDto dto)
    {
        var result = await service.SetCompetitionProjectsAsync(id, dto);
        return MapServiceResult(result);
    }

    private static async Task<IResult> CreateScheduleSlot(
        ICompetitionService service,
        int id,
        CreateScheduleSlotDto dto)
    {
        var result = await service.CreateScheduleSlotAsync(id, dto);
        if (result.Status == ServiceResultStatus.Success && result.Value != null)
        {
            return TypedResults.Created(
                $"/api/Competition/{id}/ScheduleSlots/{result.Value.ScheduleSlotId}",
                result.Value);
        }

        return MapServiceResult(result);
    }

    private static async Task<IResult> UpdateScheduleSlot(
        ICompetitionService service,
        int id,
        int slotId,
        UpdateScheduleSlotDto dto)
    {
        var result = await service.UpdateScheduleSlotAsync(id, slotId, dto);
        return MapServiceResult(result);
    }

    private static async Task<IResult> DeleteScheduleSlot(
        ICompetitionService service,
        int id,
        int slotId)
    {
        var result = await service.DeleteScheduleSlotAsync(id, slotId);
        return MapServiceResult(result);
    }

    private static async Task<IResult> DownloadSchedulePdf(
        ICompetitionService service,
        int id)
    {
        var result = await service.GenerateSchedulePdfAsync(id);
        if (result.Status == ServiceResultStatus.NotFound)
        {
            return TypedResults.NotFound();
        }

        if (result.Status == ServiceResultStatus.Success && result.Value != null)
        {
            return Results.File(
                result.Value.Bytes,
                result.Value.ContentType,
                result.Value.FileName);
        }

        return Results.Problem(result.Message, statusCode: StatusCodes.Status500InternalServerError);
    }

    private static IResult MapServiceResult<T>(ServiceResult<T> result) => result.Status switch
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

    private static IResult MapServiceResult(ServiceResult result) => result.Status switch
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
