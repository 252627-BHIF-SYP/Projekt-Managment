using System.Security.Claims;

namespace WebAPI.Endpoints;

public static class AuthRoles
{
    public const string Admin = "admin";
    public const string SysAdmin = "sys-admin";
    public const string Av = "av";
    public const string Professor = "professor";
    public const string Student = "student";

    public static bool CanManageProjects(ClaimsPrincipal user) =>
        CanAdministrate(user);

    public static bool CanAdministrate(ClaimsPrincipal user) =>
        HasAnyRole(user, Admin, SysAdmin, Av);

    public static bool IsStudent(ClaimsPrincipal user) =>
        HasAnyRole(user, Student);

    public static bool HasAnyRole(ClaimsPrincipal user, params string[] roles) =>
        roles.Any(role => user.IsInRole(role));
}
