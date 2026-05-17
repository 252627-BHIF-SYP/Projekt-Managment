using FluentValidation;
using WebAPI.Endpoints;

namespace WebAPI.Validators;

public class PersonCreateRequestValidator : AbstractValidator<PersonCreateRequest>
{
    public PersonCreateRequestValidator()
    {
        RuleFor(p => p.Id ?? p.StudentId ?? p.ProfessorId)
            .NotEmpty()
            .MaximumLength(128)
            .WithName("Username/IF-name");

        RuleFor(p => p.FirstName)
            .NotEmpty()
            .MaximumLength(100);

        RuleFor(p => p.LastName)
            .NotEmpty()
            .MaximumLength(100);

        RuleFor(p => p)
            .Must(p => p.ClassId.HasValue == p.SchoolYearId.HasValue)
            .WithMessage("Class and school year must be provided together.");
    }
}
