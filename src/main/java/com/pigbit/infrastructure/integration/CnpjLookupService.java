package com.pigbit.infrastructure.integration;

import com.pigbit.application.dto.CnpjCompanyInfo;

public interface CnpjLookupService {
    CnpjCompanyInfo lookup(String taxId);
}
