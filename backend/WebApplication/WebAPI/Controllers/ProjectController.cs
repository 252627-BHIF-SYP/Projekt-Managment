using Microsoft.AspNetCore.Mvc;
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

        [HttpPost("Add")]
        [ProducesResponseType(StatusCodes.Status201Created)]
        [ProducesResponseType(StatusCodes.Status400BadRequest)]
        public async Task<IActionResult> Create([FromBody] CreateProjectDTO dto)
        {
            await _importService.ImportProject(dto);

            return Ok(dto);
        }
    }
}
