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
    public class SchoolYearController : ControllerBase
    {
        private readonly ApplicationDbContext _context;
        private readonly ImportService _importService;


        public SchoolYearController(ImportService importService, ApplicationDbContext context)
        {
            _importService = importService;
            _context = context;
        }

        private static SchoolYearDTO SchoolYearToDto(SchoolYear schoolYear)
        {
            return new SchoolYearDTO(schoolYear.SchoolYearId, schoolYear.Year);
        }

        [HttpGet("All")]
        [ProducesResponseType(StatusCodes.Status200OK)]
        public async Task<IActionResult> GetAll()
        {
            var schoolYears = await _context.SchoolYear.Select(s => SchoolYearToDto(s)).ToListAsync();

            return Ok(schoolYears);
        }

        [HttpGet("Count")]
        [ProducesResponseType(StatusCodes.Status200OK)]
        public async Task<IActionResult> GetCount()
        {
            var schoolYears = await _context.SchoolYear.CountAsync();

            return Ok(schoolYears);
        }

        [HttpGet("{id}")]
        [ProducesResponseType(StatusCodes.Status200OK)]
        public async Task<IActionResult> GetById(int id)
        {
            var schoolYear = await _context.SchoolYear.SingleAsync(s => s.SchoolYearId == id);

            return Ok(SchoolYearToDto(schoolYear));
        }
    }
}
