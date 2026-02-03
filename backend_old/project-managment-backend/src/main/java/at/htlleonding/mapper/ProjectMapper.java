package at.htlleonding.mapper;

import at.htlleonding.dto.ProjectResponse;
import at.htlleonding.entity.Project;

public class ProjectMapper {

    public static ProjectResponse toResponse(Project p) {
        ProjectResponse r = new ProjectResponse();
        r.id = p.id;
        r.schoolYearId = p.schoolYear != null ? p.schoolYear.id : null;
        r.title = p.title;
        r.description = p.description;
        r.githubUrl = p.githubUrl;
        r.logoUrl = p.logoUrl;
        return r;
    }
}
