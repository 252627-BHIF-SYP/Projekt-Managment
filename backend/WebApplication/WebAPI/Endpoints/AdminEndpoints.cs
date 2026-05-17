using Services.Interfaces;

namespace WebAPI.Endpoints;

public static class AdminEndpoints
{
    public static void MapAdminEndpoints(this IEndpointRouteBuilder app, bool useAuth)
    {
        var group = app.MapGroup("/api/Admin")
            .WithTags("Admin");

        if (useAuth)
        {
            group.RequireAuthorization("AdminAccess");
        }

        group.MapGet("Stats", async (IAdminService service) =>
                TypedResults.Ok(await service.GetStatsAsync()))
            .WithName("GetAdminStats")
            .Produces<AdminStatsDto>();
    }
}
