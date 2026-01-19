package at.htlleonding.resource;

import at.htlleonding.dto.*;
import at.htlleonding.entity.ChangeRequest;
import at.htlleonding.mapper.ChangeRequestMapper;
import at.htlleonding.service.ChangeRequestService;
import jakarta.inject.Inject;
import jakarta.ws.rs.*;
import jakarta.ws.rs.core.MediaType;

@Path("/api/change-requests")
@Consumes(MediaType.APPLICATION_JSON)
@Produces(MediaType.APPLICATION_JSON)
public class ChangeRequestResource {

    @Inject ChangeRequestService changeRequestService;

    @POST
    public ChangeRequestResponse create(CreateChangeRequestRequest req) {
        ChangeRequest cr = changeRequestService.createChangeRequest(
                req.projectId,
                req.requestedByHistoryId,
                req.newTitle,
                req.newDescription,
                req.newGithubUrl,
                req.newLogoUrl
        );
        return ChangeRequestMapper.toResponse(cr);
    }

    @POST
    @Path("/{changeRequestId}/approve")
    public ChangeRequestResponse approve(@PathParam("changeRequestId") Long changeRequestId, ApproveChangeRequestRequest req) {
        ChangeRequest cr = changeRequestService.approve(changeRequestId, req.professorId);
        return ChangeRequestMapper.toResponse(cr);
    }

    @POST
    @Path("/{changeRequestId}/reject")
    public ChangeRequestResponse reject(@PathParam("changeRequestId") Long changeRequestId, ApproveChangeRequestRequest req) {
        ChangeRequest cr = changeRequestService.reject(changeRequestId, req.professorId);
        return ChangeRequestMapper.toResponse(cr);
    }
}
