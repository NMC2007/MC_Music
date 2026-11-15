package com.example.catalogservice.model.dto.request;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.Pattern;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class UpdateStatusRequest {

    @NotBlank(message = "Trạng thái không được để trống")
    @Pattern(regexp = "^(APPROVED|REJECTED|TAKEDOWN)$", message = "Trạng thái phải là APPROVED, REJECTED hoặc TAKEDOWN")
    private String status;

    private String rejectionReason;
}

