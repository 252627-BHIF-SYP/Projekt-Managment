using Core.Entities;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using Persistence;
using WebAPI.DTOs;
using WebAPI.Service;

namespace WebAPI.Controllers
{
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
