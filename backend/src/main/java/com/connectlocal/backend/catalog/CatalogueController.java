package com.connectlocal.backend.catalog;

import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

@RestController
@RequestMapping("/api/plans")
public class CatalogueController {

    private final CatalogueRepository catalogueRepository;

    public CatalogueController(CatalogueRepository catalogueRepository) {
        this.catalogueRepository = catalogueRepository;
    }

    @GetMapping
    public CatalogueResponse list() {
        return catalogueRepository.getCatalogue();
    }
}
