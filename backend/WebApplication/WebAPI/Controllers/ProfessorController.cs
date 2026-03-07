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
    public class ProfessorController : ControllerBase
    {
        private readonly ApplicationDbContext _context;
        private readonly ImportService _importService;


        public ProfessorController(ImportService importService, ApplicationDbContext context)
        {
            _importService = importService;
            _context = context;
        }

        private static ProfessorDTO ProfessorToDto(Professor professor)
        {
            return new ProfessorDTO(professor.Id, professor.FirstName, professor.LastName);
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

        [HttpGet("All")]
        [ProducesResponseType(StatusCodes.Status200OK)]
        public async Task<IActionResult> GetAll()
        {
            var professors = await _context.Professor.Select(p => ProfessorToDto(p)).ToListAsync();

            return Ok(professors);
        }

        [HttpGet("Count")]
        [ProducesResponseType(StatusCodes.Status200OK)]
        public async Task<IActionResult> GetCount()
        {
            var professors = await _context.Professor.CountAsync();

            return Ok(professors);
        }

        [HttpGet("{id}")]
        [ProducesResponseType(StatusCodes.Status200OK)]
        public async Task<IActionResult> GetById(string id)
        {
            var professor = await _context.Professor.SingleAsync(p => p.Id == id);

            return Ok(ProfessorToDto(professor));
        }
    }
}
