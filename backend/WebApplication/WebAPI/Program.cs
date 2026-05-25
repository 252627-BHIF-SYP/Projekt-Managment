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
                OnTokenValidated = context =>
                {
                    if (context.Principal?.Identity is ClaimsIdentity identity &&
                        context.SecurityToken is Microsoft.IdentityModel.JsonWebTokens.JsonWebToken token)
                    {
                        AddKeycloakRoles(identity, token);
                    }

                    return Task.CompletedTask;
                }
            };
        });

    builder.Services.AddAuthorization(options =>
    {
        options.AddPolicy("ProjectAccess", policy =>
            policy.RequireRole(
                AuthRoles.Admin,
                AuthRoles.SysAdmin,
                AuthRoles.Av,
                AuthRoles.Professor,
                AuthRoles.Student));

        options.AddPolicy("AdminAccess", policy =>
            policy.RequireRole(AuthRoles.Admin, AuthRoles.SysAdmin, AuthRoles.Av));
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

public partial class Program;
