package com.parking.backend.model.dto;

import jakarta.validation.constraints.*;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;
import java.time.LocalTime;
import java.util.List;
import jakarta.validation.Valid;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class BuildingUpdateDTO {

    @NotBlank(message = "Tên bãi đỗ xe không được để trống")
    @Size(max = 100, message = "Tên bãi đỗ xe không được vượt quá 100 ký tự")
    private String name;

    @NotBlank(message = "Địa chỉ không được để trống")
    @Size(max = 255, message = "Địa chỉ không được vượt quá 255 ký tự")
    private String address;

    @Size(max = 20, message = "Hotline không được vượt quá 20 ký tự")
    @Pattern(regexp = "^[0-9+\\- ]*$", message = "Hotline chỉ được chứa số, khoảng trắng và ký tự + -")
    private String hotline;

    private LocalTime openTime;

    private LocalTime closeTime;

    private Boolean is24Hours;

    @Pattern(regexp = "^(Active|Maintenance|Closed)$", message = "Trạng thái không hợp lệ")
    private String status;

    @Valid
    private List<FloorUpdateDTO> floors;
    
    // Custom validation method
    @AssertTrue(message = "Thời gian đóng cửa phải lớn hơn thời gian mở cửa (Trừ khi hoạt động 24/24)")
    public boolean isValidTime() {
        if (Boolean.TRUE.equals(is24Hours)) {
            return true;
        }
        if (openTime != null && closeTime != null) {
            return closeTime.isAfter(openTime);
        }
        return true;
    }
}
