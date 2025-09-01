package com.digitallibrary.model;

import org.junit.jupiter.api.Test;
import static org.junit.jupiter.api.Assertions.*;

public class BookTest {

    @Test
    public void testIsbnValidationAccepts10Or13Digits() {
        Book.validateIsbnStatic("1234567890");
        Book.validateIsbnStatic("1234567890123");
    }

    @Test
    public void testIsbnValidationRejectsInvalid() {
        assertThrows(IllegalArgumentException.class, () -> Book.validateIsbnStatic("abc"));
        assertThrows(IllegalArgumentException.class, () -> Book.validateIsbnStatic("12345"));
    }
}
