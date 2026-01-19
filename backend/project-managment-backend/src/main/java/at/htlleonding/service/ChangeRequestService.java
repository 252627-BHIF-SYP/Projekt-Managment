package at.htlleonding.service;

import at.htlleonding.entity.*;
import at.htlleonding.repository.*;
import at.htlleonding.service.exception.BadRequestException;
import at.htlleonding.service.exception.NotFoundException;
import jakarta.enterprise.context.ApplicationScoped;
import jakarta.inject.Inject;
import jakarta.transaction.Transactional;

@ApplicationScoped
public class ChangeRequestService {

    @Inject ChangeRequestRepository changeRequestRepository;
    @Inject ProjectRepository projectRepository;
    @Inject StudentClassHistoryRepository historyRepository;
    @Inject ProfessorRepository professorRepository;

    @Transactional
    public ChangeRequest createChangeRequest(
            Long projectId,
            Long requestedByHistoryId,
            String newTitle,
            String newDescription,
            String newGithubUrl,
            String newLogoUrl
    ) {
        Project project = requireProject(projectId);
        StudentClassHistory requestedBy = requireHistory(requestedByHistoryId);

        if (isBlank(newTitle) && isBlank(newDescription) && isBlank(newGithubUrl) && isBlank(newLogoUrl)) {
            throw new BadRequestException("At least one change field must be provided");
        }

        ChangeRequest cr = new ChangeRequest();
        cr.project = project;
        cr.requestedBy = requestedBy;
        cr.approvedBy = null;
        cr.status = ChangeRequestStatus.PENDING;

        cr.newTitle = blankToNull(newTitle);
        cr.newDescription = blankToNull(newDescription);
        cr.newGithubUrl = blankToNull(newGithubUrl);
        cr.newLogoUrl = blankToNull(newLogoUrl);

        changeRequestRepository.persist(cr);
        return cr;
    }

    @Transactional
    public ChangeRequest approve(Long changeRequestId, Long professorId) {
        ChangeRequest cr = requireChangeRequest(changeRequestId);
        if (cr.status != ChangeRequestStatus.PENDING) {
            throw new BadRequestException("Only PENDING requests can be approved");
        }

        Professor prof = requireProfessor(professorId);

        cr.status = ChangeRequestStatus.APPROVED;
        cr.approvedBy = prof;

        applyChangesToProject(cr);

        return cr;
    }

    @Transactional
    public ChangeRequest reject(Long changeRequestId, Long professorId) {
        ChangeRequest cr = requireChangeRequest(changeRequestId);
        if (cr.status != ChangeRequestStatus.PENDING) {
            throw new BadRequestException("Only PENDING requests can be rejected");
        }

        Professor prof = requireProfessor(professorId);

        cr.status = ChangeRequestStatus.REJECTED;
        cr.approvedBy = prof;

        return cr;
    }

    private void applyChangesToProject(ChangeRequest cr) {
        Project p = cr.project;

        if (cr.newTitle != null) p.title = cr.newTitle;
        if (cr.newDescription != null) p.description = cr.newDescription;
        if (cr.newGithubUrl != null) p.githubUrl = cr.newGithubUrl;
        if (cr.newLogoUrl != null) p.logoUrl = cr.newLogoUrl;
    }

    private ChangeRequest requireChangeRequest(Long id) {
        if (id == null) throw new BadRequestException("changeRequestId is required");
        ChangeRequest cr = changeRequestRepository.findById(id);
        if (cr == null) throw new NotFoundException("ChangeRequest not found: " + id);
        return cr;
    }

    private Project requireProject(Long id) {
        if (id == null) throw new BadRequestException("projectId is required");
        Project p = projectRepository.findById(id);
        if (p == null) throw new NotFoundException("Project not found: " + id);
        return p;
    }

    private StudentClassHistory requireHistory(Long id) {
        if (id == null) throw new BadRequestException("requestedByHistoryId is required");
        StudentClassHistory h = historyRepository.findById(id);
        if (h == null) throw new NotFoundException("StudentClassHistory not found: " + id);
        return h;
    }

    private Professor requireProfessor(Long id) {
        if (id == null) throw new BadRequestException("professorId is required");
        Professor p = professorRepository.findById(id);
        if (p == null) throw new NotFoundException("Professor not found: " + id);
        return p;
    }

    private boolean isBlank(String s) {
        return s == null || s.trim().isEmpty();
    }

    private String blankToNull(String s) {
        if (s == null) return null;
        String t = s.trim();
        return t.isEmpty() ? null : t;
    }
}
