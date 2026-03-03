using Microsoft.AspNetCore.Mvc;
using Persistence;
using WebAPI.DTOs;
using WebAPI.Service;

namespace WebAPI.Controllers
{
    [ApiController]
    [Route("[controller]")]
    public class ProfessorController : ControllerBase
    {
        private readonly ApplicationDbContext _context;
        private readonly ImportService _importService;


        public ProfessorController(ImportService importService, ApplicationDbContext context)
        {
            _importService = importService;
            _context = context;
        }

        [HttpPost("Import")]
        [ProducesResponseType(StatusCodes.Status201Created)]
        [ProducesResponseType(StatusCodes.Status400BadRequest)]
        public async Task<IActionResult> Upload(IFormFile file)
        {
            if (file == null)
                return BadRequest();

            using var stream = file.OpenReadStream();
            using var reader = new StreamReader(stream);

            string csvText = await reader.ReadToEndAsync();

            await _importService.ImportProfessors(csvText);

            return Ok(csvText);
        }

        [HttpPost("Add")]
        [ProducesResponseType(StatusCodes.Status201Created)]
        public async Task<IActionResult> Create([FromBody] ProfessorDTO dto)
        {
            var result = await _importService.ImportProfessor(dto);
            
            if (result)
            {
                return Created();
            }

            return BadRequest();
        }
    }
}
