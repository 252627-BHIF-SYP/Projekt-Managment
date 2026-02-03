package at.htlleonding.mapper;

import at.htlleonding.dto.ChangeRequestResponse;
import at.htlleonding.entity.ChangeRequest;

public class ChangeRequestMapper {

    public static ChangeRequestResponse toResponse(ChangeRequest cr) {
        ChangeRequestResponse r = new ChangeRequestResponse();
        r.id = cr.id;
        r.projectId = cr.project != null ? cr.project.id : null;
        r.requestedByHistoryId = cr.requestedBy != null ? cr.requestedBy.id : null;
        r.approvedByProfessorId = cr.approvedBy != null ? cr.approvedBy.id : null;
        r.status = cr.status != null ? cr.status.name() : null;

        r.newTitle = cr.newTitle;
        r.newDescription = cr.newDescription;
        r.newGithubUrl = cr.newGithubUrl;
        r.newLogoUrl = cr.newLogoUrl;
        return r;
    }
}
