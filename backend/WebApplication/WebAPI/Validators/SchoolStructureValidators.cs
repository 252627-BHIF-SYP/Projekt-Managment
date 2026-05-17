using FluentValidation;
using Services.Interfaces;

namespace WebAPI.Validators;

public class CreateSchoolYearDtoValidator : AbstractValidator<CreateSchoolYearDto>
{
    public CreateSchoolYearDtoValidator()
    {
        RuleFor(s => s.Year)
            .NotEmpty()
            .MaximumLength(20)
            .Matches(@"^\d{4}/\d{2}$")
            .WithMessage("School year must use format YYYY/YY, e.g. 2025/26.");
    }
}

public class CreateStudentClassDtoValidator : AbstractValidator<CreateStudentClassDto>
{
    public CreateStudentClassDtoValidator()
    {
        RuleFor(c => c.Name)
            .NotEmpty()
            .MaximumLength(30);

        RuleFor(c => c.Branch)
            .NotEmpty()
            .MaximumLength(80);
    }
}
