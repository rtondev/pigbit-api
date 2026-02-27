package com.pigbit.core.service;

import com.pigbit.application.dto.CnpjCompanyInfo;
import com.pigbit.application.dto.CompanyRequest;
import com.pigbit.application.dto.CompanyResponse;
import com.pigbit.application.exception.NotFoundException;
import com.pigbit.core.model.Company;
import com.pigbit.core.model.User;
import com.pigbit.infrastructure.integration.CnpjLookupService;
import com.pigbit.infrastructure.persistence.CompanyRepository;
import com.pigbit.infrastructure.persistence.UserRepository;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDateTime;

@Service
@Transactional
public class CompanyService {
    private final CompanyRepository companyRepository;
    private final UserRepository userRepository;
    private final CnpjLookupService cnpjLookupService;

    public CompanyService(
            CompanyRepository companyRepository,
            UserRepository userRepository,
            CnpjLookupService cnpjLookupService
    ) {
        this.companyRepository = companyRepository;
        this.userRepository = userRepository;
        this.cnpjLookupService = cnpjLookupService;
    }

    public CompanyResponse upsert(String userEmail, CompanyRequest req) {
        User user = userRepository.findByEmail(userEmail)
                .orElseThrow(() -> new NotFoundException("Usuário não encontrado"));

        Company company = companyRepository.findByUserId(user.getId())
                .orElseGet(() -> Company.builder().user(user).build());

        company.setTaxId(req.taxId());
        company.setLegalName(req.legalName());
        company.setTradingName(req.tradingName());
        company.setAddress(req.address());
        company.setBusinessActivityCode(req.businessActivityCode());
        company.setDeletedAt(null);

        Company saved = companyRepository.save(company);
        return mapToResponse(saved);
    }

    public CompanyResponse getMyCompany(String userEmail) {
        User user = userRepository.findByEmail(userEmail)
                .orElseThrow(() -> new NotFoundException("Usuário não encontrado"));

        Company company = companyRepository.findByUserIdAndDeletedAtIsNull(user.getId())
                .orElseThrow(() -> new NotFoundException("Empresa não encontrada"));
        return mapToResponse(company);
    }

    public void softDelete(String userEmail) {
        User user = userRepository.findByEmail(userEmail)
                .orElseThrow(() -> new NotFoundException("Usuário não encontrado"));
        Company company = companyRepository.findByUserIdAndDeletedAtIsNull(user.getId())
                .orElseThrow(() -> new NotFoundException("Empresa não encontrada"));
        company.setDeletedAt(LocalDateTime.now());
        companyRepository.save(company);
    }

    public CnpjCompanyInfo consultCnpj(String taxId) {
        return cnpjLookupService.lookup(taxId);
    }

    private CompanyResponse mapToResponse(Company company) {
        return new CompanyResponse(
                company.getId(),
                company.getTaxId(),
                company.getLegalName(),
                company.getTradingName(),
                company.getRegistrationStatus()
        );
    }
}
