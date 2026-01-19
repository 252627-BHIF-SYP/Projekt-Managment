package at.htlleonding.dto;

public class CreateChangeRequestRequest {
    public Long projectId;
    public Long requestedByHistoryId;

    public String newTitle;
    public String newDescription;
    public String newGithubUrl;
    public String newLogoUrl;
}
