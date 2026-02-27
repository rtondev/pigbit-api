package com.pigbit.application.controller;

import com.pigbit.application.dto.CnpjExternalResponse;
import com.pigbit.application.dto.CompanyRequest;
import com.pigbit.application.dto.CompanyResponse;
import com.pigbit.core.service.CompanyService;
import jakarta.validation.Valid;
import io.swagger.v3.oas.annotations.responses.ApiResponse;
import io.swagger.v3.oas.annotations.responses.ApiResponses;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.security.core.userdetails.UserDetails;
import org.springframework.web.bind.annotation.*;

@RestController
@RequestMapping("/api/v1/companies")
public class CompanyController {
    private final CompanyService companyService;

    public CompanyController(CompanyService companyService) {
        this.companyService = companyService;
    }

    @PostMapping
    public ResponseEntity<CompanyResponse> upsert(
            @AuthenticationPrincipal UserDetails userDetails,
            @Valid @RequestBody CompanyRequest req) {
        CompanyResponse response = companyService.upsert(userDetails.getUsername(), req);
        return ResponseEntity.ok(response);
    }

    @GetMapping("/me")
    public ResponseEntity<CompanyResponse> getMyCompany(@AuthenticationPrincipal UserDetails userDetails) {
        CompanyResponse response = companyService.getMyCompany(userDetails.getUsername());
        return ResponseEntity.ok(response);
    }

    @GetMapping("/cnpj/{cnpj}")
    public ResponseEntity<CnpjExternalResponse> consultCnpj(@PathVariable String cnpj) {
        var info = companyService.consultCnpj(cnpj);
        CnpjExternalResponse response = new CnpjExternalResponse(
                info.registrationStatus(),
                null,
                info.legalName(),
                info.taxId(),
                null,
                info.businessActivityCode()
        );
        return ResponseEntity.ok(response);
    }

    @DeleteMapping("/me")
    @ApiResponses({
            @ApiResponse(responseCode = "204", description = "No Content")
    })
    public ResponseEntity<Void> softDelete(@AuthenticationPrincipal UserDetails userDetails) {
        companyService.softDelete(userDetails.getUsername());
        return ResponseEntity.noContent().build();
    }
}
