package com.connectlocal.backend.catalog;

import org.springframework.jdbc.core.simple.JdbcClient;
import org.springframework.stereotype.Repository;

import java.util.ArrayList;
import java.util.LinkedHashMap;
import java.util.List;
import java.util.Map;

@Repository
public class CategoryRepository {

    private final JdbcClient jdbc;

    public CategoryRepository(JdbcClient jdbc) {
        this.jdbc = jdbc;
    }

    public List<CategoryResponse> findAllActive() {
        Map<String, CategoryBuilder> categories = new LinkedHashMap<>();

        jdbc.sql("""
                        SELECT id, name, description, icon, color, soft_color, regulated, disclaimer
                        FROM categories
                        WHERE is_active = TRUE
                        ORDER BY sort_order, name
                        """)
                .query((rs, rowNum) -> new CategoryBuilder(
                        rs.getString("id"),
                        rs.getString("name"),
                        rs.getString("description"),
                        rs.getString("icon"),
                        rs.getString("color"),
                        rs.getString("soft_color"),
                        rs.getBoolean("regulated"),
                        rs.getString("disclaimer")
                ))
                .list()
                .forEach(category -> categories.put(category.id, category));

        jdbc.sql("""
                        SELECT id, category_id, name
                        FROM subcategories
                        WHERE is_active = TRUE
                        ORDER BY sort_order, name
                        """)
                .query((rs, rowNum) -> new SubcategoryRow(
                        rs.getString("id"),
                        rs.getString("category_id"),
                        rs.getString("name")
                ))
                .list()
                .forEach(subcategory -> {
                    CategoryBuilder category = categories.get(subcategory.categoryId());
                    if (category != null) {
                        category.subcategories.add(
                                new SubcategoryResponse(subcategory.id(), subcategory.name())
                        );
                    }
                });

        return categories.values().stream().map(CategoryBuilder::build).toList();
    }

    private static final class CategoryBuilder {
        private final String id;
        private final String name;
        private final String description;
        private final String icon;
        private final String color;
        private final String softColor;
        private final boolean regulated;
        private final String disclaimer;
        private final List<SubcategoryResponse> subcategories = new ArrayList<>();

        private CategoryBuilder(
                String id,
                String name,
                String description,
                String icon,
                String color,
                String softColor,
                boolean regulated,
                String disclaimer
        ) {
            this.id = id;
            this.name = name;
            this.description = description;
            this.icon = icon;
            this.color = color;
            this.softColor = softColor;
            this.regulated = regulated;
            this.disclaimer = disclaimer;
        }

        private CategoryResponse build() {
            return new CategoryResponse(
                    id, name, description, icon, color, softColor, regulated, disclaimer,
                    List.copyOf(subcategories)
            );
        }
    }

    private record SubcategoryRow(String id, String categoryId, String name) {
    }
}
