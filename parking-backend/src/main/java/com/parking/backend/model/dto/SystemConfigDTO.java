package com.parking.backend.model.dto;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class SystemConfigDTO {
    private String configKey;
    private String configValue;
    private String dataType;
    private String description;
    private Boolean isPublic;
}
