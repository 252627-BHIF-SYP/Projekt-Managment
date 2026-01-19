package at.htlleonding.resource;

import at.htlleonding.dto.*;
import at.htlleonding.entity.Project;
import at.htlleonding.mapper.ProjectMapper;
import at.htlleonding.service.ProjectService;
import jakarta.inject.Inject;
import jakarta.ws.rs.*;
import jakarta.ws.rs.core.MediaType;

@Path("/api/projects")
@Consumes(MediaType.APPLICATION_JSON)
@Produces(MediaType.APPLICATION_JSON)
public class ProjectResource {

    @Inject ProjectService projectService;

    @POST
    public ProjectResponse create(CreateProjectRequest req) {
        Project p = projectService.createProject(
                req.schoolYearId,
                req.title,
                req.description,
                req.githubUrl,
                req.logoUrl
        );
        return ProjectMapper.toResponse(p);
    }

    @POST
    @Path("/{projectId}/students")
    public void addStudent(@PathParam("projectId") Long projectId, AddStudentToProjectRequest req) {
        projectService.addStudentToProject(projectId, req.historyId);
    }

    @POST
    @Path("/{projectId}/supervisors")
    public void addSupervisor(@PathParam("projectId") Long projectId, AddSupervisorToProjectRequest req) {
        projectService.addSupervisorToProject(projectId, req.professorId);
    }
}
