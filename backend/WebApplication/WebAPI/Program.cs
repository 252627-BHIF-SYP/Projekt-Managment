using System.Security.Claims;
using System.Text.Json;
using System.Text.Json.Serialization;
using FluentValidation;
using Microsoft.AspNetCore.Authentication.JwtBearer;
using Microsoft.EntityFrameworkCore;
using Microsoft.IdentityModel.Tokens;
using Persistence;
using Services.Implementations;
using Services.Interfaces;
using WebAPI.Endpoints;
using WebAPI.SeedData;

var builder = WebApplication.CreateBuilder(args);

builder.Services.AddDbContext<ApplicationDbContext>(options =>
    options.UseNpgsql(builder.Configuration.GetConnectionString("DefaultConnection")));

builder.Services.AddScoped<IProjectService, ProjectService>();
builder.Services.AddScoped<IPersonService, PersonService>();
builder.Services.AddScoped<ISchoolStructureService, SchoolStructureService>();
builder.Services.AddScoped<IImportService, ImportService>();
builder.Services.AddScoped<IAdminService, AdminService>();
builder.Services.AddValidatorsFromAssemblyContaining<Program>();

builder.Services.ConfigureHttpJsonOptions(options =>
{
    options.SerializerOptions.Converters.Add(new JsonStringEnumConverter());
    options.SerializerOptions.PropertyNameCaseInsensitive = true;
});

builder.Services.AddCors(options =>
{
    var allowedOrigins = builder.Configuration
        .GetSection("Cors:AllowedOrigins")
        .Get<string[]>() ?? ["http://localhost:4200"];

    options.AddPolicy("Frontend", policy =>
    {
        policy.WithOrigins(allowedOrigins)
            .AllowAnyHeader()
            .AllowAnyMethod();
    });
});

var authority = builder.Configuration["Authentication:Authority"];
var audience = builder.Configuration["Authentication:Audience"];
var useAuth = !string.IsNullOrWhiteSpace(authority);

if (useAuth)
{
    builder.Services
        .AddAuthentication(JwtBearerDefaults.AuthenticationScheme)
        .AddJwtBearer(options =>
        {
            options.Authority = authority;
            options.Audience = audience;
            options.RequireHttpsMetadata = builder.Configuration.GetValue("Authentication:RequireHttpsMetadata", false);
            options.TokenValidationParameters = new TokenValidationParameters
            {
                ValidateIssuer = false,
                ValidateAudience = false,
                NameClaimType = "preferred_username",
                RoleClaimType = ClaimTypes.Role
            };
            options.Events = new JwtBearerEvents
            {
                OnTokenValidated = async context =>
                {
                    if (context.Principal?.Identity is ClaimsIdentity identity &&
                        context.SecurityToken is Microsoft.IdentityModel.JsonWebTokens.JsonWebToken token)
                    {
                        AddKeycloakRoles(identity, token);
                        await AddDatabaseRolesAsync(context.HttpContext, identity);
                    }
                }
            };
        });

    builder.Services.AddAuthorization(options =>
    {
        options.AddPolicy("ProjectAccess", policy =>
            policy.RequireAuthenticatedUser());

        options.AddPolicy("AdminAccess", policy =>
            policy.RequireRole(AuthRoles.AdminRoles));
    });
}

builder.Services.AddEndpointsApiExplorer();
builder.Services.AddSwaggerGen();

var app = builder.Build();

using (var scope = app.Services.CreateScope())
{
    var db = scope.ServiceProvider.GetRequiredService<ApplicationDbContext>();
    await db.Database.EnsureCreatedAsync();
}

await DemoDataSeeder.SeedAsync(app.Services, app.Environment, app.Configuration);

if (app.Environment.IsDevelopment())
{
    app.UseSwagger();
    app.UseSwaggerUI();
}

app.UseCors("Frontend");

if (useAuth)
{
    app.UseAuthentication();
    app.UseAuthorization();
}

app.MapGet("/api/health", () => TypedResults.Ok(new { status = "ok" }));
app.MapProjectEndpoints(useAuth);
app.MapPersonEndpoints(useAuth);
app.MapSchoolStructureEndpoints(useAuth);
app.MapAdminEndpoints(useAuth);

app.Run();

static void AddKeycloakRoles(ClaimsIdentity identity, Microsoft.IdentityModel.JsonWebTokens.JsonWebToken token)
{
    if (token.TryGetPayloadValue<JsonElement>("realm_access", out var realmAccess))
    {
        AddRolesFromElement(identity, realmAccess);
    }

    if (token.TryGetPayloadValue<JsonElement>("resource_access", out var resourceAccess))
    {
        AddRolesFromElement(identity, resourceAccess);
    }
}

static void AddRolesFromElement(ClaimsIdentity identity, JsonElement element)
{
    if (element.ValueKind == JsonValueKind.Object &&
        element.TryGetProperty("roles", out var roles) &&
        roles.ValueKind == JsonValueKind.Array)
    {
        foreach (var role in roles.EnumerateArray())
        {
            var value = role.GetString();
            if (!string.IsNullOrWhiteSpace(value))
            {
                identity.AddClaim(new Claim(ClaimTypes.Role, value));
            }
        }
    }

    if (element.ValueKind != JsonValueKind.Object)
    {
        return;
    }

    foreach (var property in element.EnumerateObject())
    {
        if (property.Value.ValueKind == JsonValueKind.Object)
        {
            AddRolesFromElement(identity, property.Value);
        }
    }
}

static async Task AddDatabaseRolesAsync(HttpContext httpContext, ClaimsIdentity identity)
{
    var userIds = GetPossibleUserIds(identity).ToList();
    if (userIds.Count == 0)
    {
        return;
    }

    var db = httpContext.RequestServices.GetRequiredService<ApplicationDbContext>();

    var studentId = await db.Students
        .Where(student => userIds.Contains(student.Id.ToLower()))
        .Select(student => student.Id)
        .FirstOrDefaultAsync();
    if (studentId != null)
    {
        AddRoleIfMissing(identity, AuthRoles.Student);
        AddClaimIfMissing(identity, "db_user_id", studentId);
    }

    var professorId = await db.Professors
        .Where(professor => userIds.Contains(professor.Id.ToLower()))
        .Select(professor => professor.Id)
        .FirstOrDefaultAsync();
    if (professorId != null)
    {
        AddRoleIfMissing(identity, AuthRoles.Professor);
        AddClaimIfMissing(identity, "db_user_id", professorId);
    }
}

static IEnumerable<string> GetPossibleUserIds(ClaimsIdentity identity)
{
    var values = new[]
    {
        identity.Name,
        identity.FindFirst("preferred_username")?.Value,
        identity.FindFirst("email")?.Value,
        identity.FindFirst(ClaimTypes.NameIdentifier)?.Value
    };

    return values
        .Where(value => !string.IsNullOrWhiteSpace(value))
        .SelectMany(value =>
        {
            var trimmed = value!.Trim().ToLower();
            var beforeAt = trimmed.Split('@')[0];
            return new[] { trimmed, beforeAt };
        })
        .Distinct();
}

static void AddRoleIfMissing(ClaimsIdentity identity, string role)
{
    if (!identity.HasClaim(ClaimTypes.Role, role))
    {
        identity.AddClaim(new Claim(ClaimTypes.Role, role));
    }
}

static void AddClaimIfMissing(ClaimsIdentity identity, string type, string value)
{
    if (!identity.HasClaim(type, value))
    {
        identity.AddClaim(new Claim(type, value));
    }
}

public partial class Program;
