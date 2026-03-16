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
    public class StudentClassController : ControllerBase
    {
        private readonly ApplicationDbContext _context;
        private readonly ImportService _importService;


        public StudentClassController(ImportService importService, ApplicationDbContext context)
        {
            _importService = importService;
            _context = context;
        }

        private static StudentClassDTO StudentClassToDto(StudentClass studentClass)
        {
            return new StudentClassDTO(studentClass.ClassId, studentClass.Name, studentClass.Branch);
        }

        [HttpGet("All")]
        [ProducesResponseType(StatusCodes.Status200OK)]
        public async Task<IActionResult> GetAll()
        {
            var studentClasses = await _context.StudentClass.Select(s => StudentClassToDto(s)).ToListAsync();

            return Ok(studentClasses);
        }

        [HttpGet("Count")]
        [ProducesResponseType(StatusCodes.Status200OK)]
        public async Task<IActionResult> GetCount()
        {
            var studentClassesCount = await _context.StudentClass.CountAsync();

            return Ok(studentClassesCount);
        }

        [HttpGet("{id}")]
        [ProducesResponseType(StatusCodes.Status200OK)]
        public async Task<IActionResult> GetById(int id)
        {
            var studentClass = await _context.StudentClass.SingleAsync(s => s.ClassId == id);

            return Ok(StudentClassToDto(studentClass));
        }
    }
}
