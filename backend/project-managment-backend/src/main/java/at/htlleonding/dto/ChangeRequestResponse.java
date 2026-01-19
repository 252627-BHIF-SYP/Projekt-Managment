package at.htlleonding.dto;

public class ChangeRequestResponse {
    public Long id;
    public Long projectId;
    public Long requestedByHistoryId;
    public Long approvedByProfessorId;
    public String status;

    public String newTitle;
    public String newDescription;
    public String newGithubUrl;
    public String newLogoUrl;
}
