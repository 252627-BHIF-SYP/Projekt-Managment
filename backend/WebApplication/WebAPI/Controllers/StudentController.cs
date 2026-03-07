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
    public class StudentController : ControllerBase
    {
        private readonly ApplicationDbContext _context;
        private readonly ImportService _importService;


        public StudentController(ImportService importService, ApplicationDbContext context)
        {
            _importService = importService;
            _context = context;
        }

        private static StudentDTO StudentToDto(Student Student)
        {
            return new StudentDTO(Student.Id, Student.FirstName, Student.LastName);
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

            await _importService.ImportStudents(csvText);

            return Ok(csvText);
        }

        [HttpPost("Add")]
        [ProducesResponseType(StatusCodes.Status201Created)]
        public async Task<IActionResult> Create([FromBody] StudentDTO dto)
        {
            var result = await _importService.ImportStudent(dto);

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
            var students = await _context.Student.Select(s => StudentToDto(s)).ToListAsync();

            return Ok(students);
        }

        [HttpGet("Count")]
        [ProducesResponseType(StatusCodes.Status200OK)]
        public async Task<IActionResult> GetCount()
        {
            var students = await _context.Student.CountAsync();

            return Ok(students);
        }

        [HttpGet("{id}")]
        [ProducesResponseType(StatusCodes.Status200OK)]
        public async Task<IActionResult> GetById(string id)
        {
            var students = await _context.Student.SingleAsync(p => p.Id == id);

            return Ok(StudentToDto(students));
        }
    }
}
