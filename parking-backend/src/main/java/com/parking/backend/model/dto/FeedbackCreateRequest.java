package com.parking.backend.model.dto;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;
import java.util.List;

@Data
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class FeedbackCreateRequest {
    private Integer buildingId;
    private Integer sessionId;
    private Integer bookingId;
    private String issueCategory;
    private String description;
    private List<String> evidenceImages;
}
