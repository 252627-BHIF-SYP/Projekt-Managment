using FluentValidation;
using Services.Interfaces;

namespace WebAPI.Validators;

public class CreateProjectDtoValidator : AbstractValidator<CreateProjectDto>
{
    public CreateProjectDtoValidator()
    {
        RuleFor(p => p.Title)
            .NotEmpty()
            .MaximumLength(200);

        RuleFor(p => p.Description)
            .NotEmpty();

        RuleFor(p => p.GithubUrl)
            .MaximumLength(500)
            .When(p => !string.IsNullOrWhiteSpace(p.GithubUrl));

        RuleFor(p => p.LogoUrl)
            .MaximumLength(500)
            .When(p => !string.IsNullOrWhiteSpace(p.LogoUrl));

        RuleFor(p => p.Technology)
            .MaximumLength(500)
            .When(p => !string.IsNullOrWhiteSpace(p.Technology));

        RuleFor(p => p.SchoolYearIds)
            .NotEmpty()
            .WithMessage("At least one school year is required.");

        RuleForEach(p => p.SchoolYearIds)
            .GreaterThan(0);

        RuleForEach(p => p.Students)
            .SetValidator(new ProjectStudentWriteDtoValidator());

        RuleForEach(p => p.Supervisors)
            .SetValidator(new ProjectSupervisorWriteDtoValidator());
    }
}

public class UpdateProjectDtoValidator : AbstractValidator<UpdateProjectDto>
{
    public UpdateProjectDtoValidator()
    {
        RuleFor(p => p.Title)
            .NotEmpty()
            .MaximumLength(200);

        RuleFor(p => p.Description)
            .NotEmpty();

        RuleFor(p => p.GithubUrl)
            .MaximumLength(500)
            .When(p => !string.IsNullOrWhiteSpace(p.GithubUrl));

        RuleFor(p => p.LogoUrl)
            .MaximumLength(500)
            .When(p => !string.IsNullOrWhiteSpace(p.LogoUrl));

        RuleFor(p => p.Technology)
            .MaximumLength(500)
            .When(p => !string.IsNullOrWhiteSpace(p.Technology));

        RuleFor(p => p.SchoolYearIds)
            .NotEmpty()
            .WithMessage("At least one school year is required.");

        RuleForEach(p => p.SchoolYearIds)
            .GreaterThan(0);

        RuleForEach(p => p.Students)
            .SetValidator(new ProjectStudentWriteDtoValidator());

        RuleForEach(p => p.Supervisors)
            .SetValidator(new ProjectSupervisorWriteDtoValidator());
    }
}

public class ProjectStudentWriteDtoValidator : AbstractValidator<ProjectStudentWriteDto>
{
    public ProjectStudentWriteDtoValidator()
    {
        RuleFor(s => s.HistoryId)
            .GreaterThan(0);

        RuleFor(s => s.Role)
            .MaximumLength(100)
            .When(s => !string.IsNullOrWhiteSpace(s.Role));
    }
}

public class ProjectSupervisorWriteDtoValidator : AbstractValidator<ProjectSupervisorWriteDto>
{
    public ProjectSupervisorWriteDtoValidator()
    {
        RuleFor(s => s.ProfessorId)
            .NotEmpty()
            .MaximumLength(128);

        RuleFor(s => s.Role)
            .MaximumLength(100)
            .When(s => !string.IsNullOrWhiteSpace(s.Role));
    }
}
