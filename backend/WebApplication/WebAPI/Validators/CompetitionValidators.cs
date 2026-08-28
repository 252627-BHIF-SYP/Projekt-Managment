using FluentValidation;
using Services.Interfaces;

namespace WebAPI.Validators;

public class CreateCompetitionDtoValidator : AbstractValidator<CreateCompetitionDto>
{
    public CreateCompetitionDtoValidator()
    {
        RuleFor(c => c.Name)
            .NotEmpty()
            .MaximumLength(200);

        RuleFor(c => c.PresentationDurationMinutes)
            .GreaterThan(0)
            .LessThanOrEqualTo(180);

        RuleFor(c => c.BreakDurationMinutes)
            .GreaterThanOrEqualTo(0)
            .LessThanOrEqualTo(120);

        RuleFor(c => c.AllowedClassTypes)
            .MaximumLength(100)
            .When(c => !string.IsNullOrWhiteSpace(c.AllowedClassTypes));

        RuleFor(c => c.EndDate)
            .GreaterThanOrEqualTo(c => c.StartDate)
            .When(c => c.EndDate.HasValue)
            .WithMessage("Enddatum darf nicht vor dem Startdatum liegen.");
    }
}

public class UpdateCompetitionDtoValidator : AbstractValidator<UpdateCompetitionDto>
{
    public UpdateCompetitionDtoValidator()
    {
        RuleFor(c => c.Name)
            .NotEmpty()
            .MaximumLength(200);

        RuleFor(c => c.PresentationDurationMinutes)
            .GreaterThan(0)
            .LessThanOrEqualTo(180);

        RuleFor(c => c.BreakDurationMinutes)
            .GreaterThanOrEqualTo(0)
            .LessThanOrEqualTo(120);

        RuleFor(c => c.AllowedClassTypes)
            .MaximumLength(100)
            .When(c => !string.IsNullOrWhiteSpace(c.AllowedClassTypes));

        RuleFor(c => c.EndDate)
            .GreaterThanOrEqualTo(c => c.StartDate)
            .When(c => c.EndDate.HasValue)
            .WithMessage("Enddatum darf nicht vor dem Startdatum liegen.");
    }
}

public class SetCompetitionProjectsDtoValidator : AbstractValidator<SetCompetitionProjectsDto>
{
    public SetCompetitionProjectsDtoValidator()
    {
        RuleFor(p => p.ProjectIds)
            .NotNull();

        RuleForEach(p => p.ProjectIds)
            .GreaterThan(0);
    }
}

public class CreateScheduleSlotDtoValidator : AbstractValidator<CreateScheduleSlotDto>
{
    public CreateScheduleSlotDtoValidator()
    {
        RuleFor(s => s.Title)
            .NotEmpty()
            .MaximumLength(200);

        RuleFor(s => s.DurationMinutes)
            .GreaterThan(0)
            .LessThanOrEqualTo(300);

        RuleFor(s => s.ProjectId)
            .GreaterThan(0)
            .When(s => s.ProjectId.HasValue);

        RuleFor(s => s.Note)
            .MaximumLength(1000)
            .When(s => !string.IsNullOrWhiteSpace(s.Note));
    }
}

public class UpdateScheduleSlotDtoValidator : AbstractValidator<UpdateScheduleSlotDto>
{
    public UpdateScheduleSlotDtoValidator()
    {
        RuleFor(s => s.Title)
            .NotEmpty()
            .MaximumLength(200);

        RuleFor(s => s.DurationMinutes)
            .GreaterThan(0)
            .LessThanOrEqualTo(300);

        RuleFor(s => s.ProjectId)
            .GreaterThan(0)
            .When(s => s.ProjectId.HasValue);

        RuleFor(s => s.Note)
            .MaximumLength(1000)
            .When(s => !string.IsNullOrWhiteSpace(s.Note));
    }
}
