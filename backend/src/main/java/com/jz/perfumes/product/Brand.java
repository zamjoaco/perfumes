package com.jz.perfumes.product;

import com.jz.perfumes.shared.BaseEntity;
import com.jz.perfumes.shared.ValidationException;
import jakarta.persistence.Column;
import jakarta.persistence.Entity;
import lombok.AccessLevel;
import lombok.Getter;
import lombok.NoArgsConstructor;

@Entity
@Getter
@NoArgsConstructor(access = AccessLevel.PROTECTED)
public class Brand extends BaseEntity {

    @Column(nullable = false, unique = true, length = 80)
    private String name;

    private Brand(String name) {
        this.name = name;
    }

    public static Brand create(String name) {
        if (name == null || name.isBlank()) {
            throw new ValidationException("El nombre de la marca es obligatorio");
        }
        return new Brand(name.trim());
    }
}
