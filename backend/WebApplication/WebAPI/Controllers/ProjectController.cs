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

        [HttpPost("Add")]
        [ProducesResponseType(StatusCodes.Status201Created)]
        [ProducesResponseType(StatusCodes.Status400BadRequest)]
        public async Task<IActionResult> Create([FromBody] CreateProjectDTO dto)
        {
            await _importService.ImportProject(dto);

            return Ok(dto);
        }

        [HttpGet("ByYear")]
        public async Task<IActionResult> GetByYear([FromQuery] string requesterId ,[FromQuery] int schoolYearId)
        {
            if(await _context.Student.SingleOrDefaultAsync(s => s.StudentId == requesterId) == null)
            {
                var projectsForProfessors = await _context.SchoolYearProject.Where(s => s.SchoolYearId == schoolYearId).Select(s => s.Project).ToListAsync(); //für alle Professoren

                return Ok(projectsForProfessors);
            }

            //Alle Projekte eines Schülers der dazugehörigen ABTEILUNG im dazugehörigen Schuljahr. Hier definiere ich MEINE Branch
            var studentHistory = await _context.StudentClassHistory
                .Include(s => s.StudentClass)
                .SingleOrDefaultAsync(s => s.StudentId == requesterId && s.SchoolYearId == schoolYearId);

            if(studentHistory == null)
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

            if(ownDiplomarbeit != null && !departmentProjects.Any(p => p.ProjectId == ownDiplomarbeit.ProjectId)
            {
                departmentProjects.Add(ownDiplomarbeit);
            }

            return Ok(departmentProjects);

            //var projectsForStudents = await _context.SchoolYearProject.Where(s => s.SchoolYearId == schoolYearId).Select(s => s.Project).ToListAsync(); //für alle Students --> TODO

            //var projectsForStudentstemp = await _context.SchoolYearProject
            //    .Where(s => s.SchoolYearId == schoolYearId &&
            //                s.Project.ProjectType != ProjectType.Diplomarbeit &&
            //                s.Project.ProjectType != ProjectType.Others)
            //    .Select(s => s.Project)
            //    .ToListAsync();

            ////Query um alle Schüler eines Projekts zu holen
            //var students = await _context.ProjectStudent
            //    .Where(ps => ps.ProjectId == projectId)
            //    .Select(ps => ps.StudentClassHistory.StudentId)
            //    .ToListAsync();

            //return Ok(projectsForStudents);
        }
    }
}