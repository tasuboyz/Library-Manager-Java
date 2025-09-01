package com.digitallibrary.util;

import java.util.UUID;

public class IdGenerator {
    public static String generate() {
        return UUID.randomUUID().toString();
    }
}
