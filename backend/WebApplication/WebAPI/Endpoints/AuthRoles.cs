using System.Security.Claims;

namespace WebAPI.Endpoints;

public static class AuthRoles
{
    public const string Admin = "admin";
    public const string SysAdmin = "sys-admin";
    public const string Av = "av";
    public const string Professor = "professor";
    public const string Teacher = "lehrer";
    public const string Student = "student";
    public const string StudentGerman = "schueler";
    public const string StudentGermanUmlaut = "sch\u00fcler";

    public static readonly string[] AdminRoles = [Admin, SysAdmin, Av];
    public static readonly string[] ProfessorRoles = [Professor, Teacher];
    public static readonly string[] StudentRoles = [Student, StudentGerman, StudentGermanUmlaut];
    public static readonly string[] ProjectAccessRoles =
    [
        Admin,
        SysAdmin,
        Av,
        Professor,
        Teacher,
        Student,
        StudentGerman,
        StudentGermanUmlaut
    ];

    public static bool CanManageProjects(ClaimsPrincipal user) =>
        CanAdministrate(user);

    public static bool CanAdministrate(ClaimsPrincipal user) =>
        HasAnyRole(user, AdminRoles);

    public static bool IsProfessor(ClaimsPrincipal user) =>
        HasAnyRole(user, ProfessorRoles);

    public static bool IsStudent(ClaimsPrincipal user) =>
        HasAnyRole(user, StudentRoles);

    public static bool HasAnyRole(ClaimsPrincipal user, params string[] roles) =>
        roles.Any(role => user.IsInRole(role));

    public static bool HasAnyRole(IEnumerable<string> userRoles, params string[] roles) =>
        userRoles.Any(userRole =>
            roles.Any(role => string.Equals(role, userRole, StringComparison.OrdinalIgnoreCase)));
}
