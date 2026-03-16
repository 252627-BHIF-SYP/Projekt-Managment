using Core.Entities;
using Core.Enums;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using Persistence;
using WebAPI.DTOs;
using WebAPI.Service;

namespace WebAPI.Controllers
{
    //Endpoints
    [ApiController]
    [Route("[controller]")]
    public class ProjectController : ControllerBase
    {
        private readonly ApplicationDbContext _context;
        private readonly ImportService _importService;


        public ProjectController(ImportService importService, ApplicationDbContext context)
        {
            _importService = importService;
            _context = context;
        }

        private static ProjectDTO ProjectToDto(Project project)
        {
            ProjectStudentDTO[] projectStudents = project.ProjectStudents.Select(p => new ProjectStudentDTO(p.HistoryId, p.Role)).ToArray();
            ProjectSupervisorDTO[] projectSupervisors = project.ProjectSupervisors.Select(p => new ProjectSupervisorDTO(p.ProfessorId, p.Role)).ToArray();

            return new ProjectDTO(project.Title, project.Description, project.GithubUrl, project.LogoUrl, project.SchoolYearProjects.First().SchoolYearId, project.Status.ToString(), project.Technology, project.ProjectType, projectStudents, projectSupervisors);
        }

        [HttpPost("Add")]
        [ProducesResponseType(StatusCodes.Status201Created)]
        [ProducesResponseType(StatusCodes.Status400BadRequest)]
        public async Task<IActionResult> Create([FromBody] ProjectDTO dto)
        {
            await _importService.ImportProject(dto);

            return Ok(dto);
        }


        [HttpGet("ByYear")]
        public async Task<IActionResult> GetByYear([FromQuery] string requesterId, [FromQuery] int schoolYearId)
        {
            var student = await _context.Person
                .Where(p => p.Id == requesterId &&
                            p.PersonType == PersonType.Student
                            )
                .FirstOrDefaultAsync();

            if (student == null)
            {
                var projectsForProfessors = await _context.SchoolYearProject.Where(s => s.SchoolYearId == schoolYearId).Select(s => s.Project).ToListAsync(); //für alle Professoren

                return Ok(projectsForProfessors);
            }

            //Alle Projekte eines Schülers der dazugehörigen ABTEILUNG im dazugehörigen Schuljahr. Hier definiere ich MEINE Branch
            var studentHistory = await _context.StudentClassHistory
                .Include(s => s.StudentClass)
                .SingleOrDefaultAsync(s => s.StudentId == requesterId && s.SchoolYearId == schoolYearId);

            if (studentHistory == null)
            {
                return Ok(new List<Project>());
            }

            var studentBranch = studentHistory.StudentClass.Branch;

            //Als Schüler will ich nicht die Diplomarbeiten und Others von anderen sehen können. Als Schüler will ich meine EIGENEN Projekte aus MEINER Branch sehen
            var departmentProjects = await _context.SchoolYearProject
                .Where(s => s.SchoolYearId == schoolYearId)
                .Select(s => s.Project)
                .Where(p => p.ProjectType != ProjectType.Diplomarbeit &&
                            p.ProjectType != ProjectType.Others &&
                            _context.ProjectStudent.Any(
                                ps => ps.ProjectId == p.ProjectId &&
                                ps.StudentClassHistory.StudentClass.Branch == studentBranch)
                            )
                .ToListAsync();

            //Als Schüler möchte ich meine eigene Diplomarbeit sehen können
            var ownDiplomarbeit = await _context.ProjectStudent
                .Where(ps => ps.StudentClassHistory.StudentId == requesterId &&
                             ps.Project.ProjectType == ProjectType.Diplomarbeit
                             )
                .Select(ps => ps.Project)
                .FirstOrDefaultAsync();

            if (ownDiplomarbeit != null && !departmentProjects.Any(p => p.ProjectId == ownDiplomarbeit.ProjectId))
            {
                departmentProjects.Add(ownDiplomarbeit);
            }

            return Ok(departmentProjects);
        }

        [HttpGet("All")]
        [ProducesResponseType(StatusCodes.Status200OK)]
        public async Task<IActionResult> GetAll()
        {
            var projects = await _context.Project.Select(p => ProjectToDto(p)).ToListAsync();

            return Ok(projects);
        }

        [HttpGet("Count")]
        [ProducesResponseType(StatusCodes.Status200OK)]
        public async Task<IActionResult> GetCount()
        {
            var projects = await _context.Project.CountAsync();

            return Ok(projects);
        }

        [HttpGet("{id}")]
        [ProducesResponseType(StatusCodes.Status200OK)]
        public async Task<IActionResult> GetById(int id)
        {
            var project = await _context.Project.SingleAsync(p => p.ProjectId == id);

            return Ok(ProjectToDto(project));
        }
    }
}