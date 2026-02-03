package at.htlleonding.service;

import at.htlleonding.entity.*;
import at.htlleonding.repository.*;
import at.htlleonding.service.exception.BadRequestException;
import at.htlleonding.service.exception.NotFoundException;
import jakarta.enterprise.context.ApplicationScoped;
import jakarta.inject.Inject;
import jakarta.transaction.Transactional;

@ApplicationScoped
public class ProjectService {

    @Inject ProjectRepository projectRepository;
    @Inject SchoolYearRepository schoolYearRepository;
    @Inject StudentClassHistoryRepository studentClassHistoryRepository;
    @Inject ProfessorRepository professorRepository;
    @Inject ProjectStudentRepository projectStudentRepository;
    @Inject ProjectSupervisorRepository projectSupervisorRepository;

    @Transactional
    public Project createProject(Long schoolYearId, String title, String description, String githubUrl, String logoUrl) {
        if (schoolYearId == null) throw new BadRequestException("schoolYearId is required");
        if (title == null || title.isBlank()) throw new BadRequestException("title is required");

        SchoolYear schoolYear = schoolYearRepository.findById(schoolYearId);
        if (schoolYear == null) throw new NotFoundException("SchoolYear not found: " + schoolYearId);

        Project p = new Project();
        p.schoolYear = schoolYear;
        p.title = title;
        p.description = description;
        p.githubUrl = githubUrl;
        p.logoUrl = logoUrl;

        projectRepository.persist(p);
        return p;
    }

    @Transactional
    public ProjectStudent addStudentToProject(Long projectId, Long historyId) {
        Project project = requireProject(projectId);
        StudentClassHistory history = requireHistory(historyId);

        ProjectStudentId id = new ProjectStudentId(project.id, history.id);
        if (projectStudentRepository.findById(id) != null) {
            throw new BadRequestException("Student already assigned to project (projectId=" + projectId + ", historyId=" + historyId + ")");
        }

        ProjectStudent ps = new ProjectStudent(project, history);
        projectStudentRepository.persist(ps);
        return ps;
    }

    @Transactional
    public ProjectSupervisor addSupervisorToProject(Long projectId, Long professorId) {
        Project project = requireProject(projectId);

        Professor professor = professorRepository.findById(professorId);
        if (professor == null) throw new NotFoundException("Professor not found: " + professorId);

        ProjectSupervisorId id = new ProjectSupervisorId(project.id, professor.id);
        if (projectSupervisorRepository.findById(id) != null) {
            throw new BadRequestException("Professor already supervisor of project (projectId=" + projectId + ", professorId=" + professorId + ")");
        }

        ProjectSupervisor ps = new ProjectSupervisor(project, professor);
        projectSupervisorRepository.persist(ps);
        return ps;
    }

    public Project requireProject(Long projectId) {
        if (projectId == null) throw new BadRequestException("projectId is required");
        Project p = projectRepository.findById(projectId);
        if (p == null) throw new NotFoundException("Project not found: " + projectId);
        return p;
    }

    public StudentClassHistory requireHistory(Long historyId) {
        if (historyId == null) throw new BadRequestException("historyId is required");
        StudentClassHistory h = studentClassHistoryRepository.findById(historyId);
        if (h == null) throw new NotFoundException("StudentClassHistory not found: " + historyId);
        return h;
    }
}
