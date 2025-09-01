package com.digitallibrary.util;

import java.util.Scanner;

public class InputHelper {
    public static int readInt(Scanner scanner, String prompt, int defaultValue) {
        while (true) {
            System.out.print(prompt);
            String line = scanner.nextLine().trim();
            if (line.isEmpty()) return defaultValue;
            try {
                return Integer.parseInt(line);
            } catch (NumberFormatException e) {
                System.out.println("Valore non valido. Inserisci un numero.");
            }
        }
    }

    public static String readNonEmptyString(Scanner scanner, String prompt) {
        while (true) {
            System.out.print(prompt);
            String line = scanner.nextLine().trim();
            if (!line.isEmpty()) return line;
            System.out.println("Valore non può essere vuoto.");
        }
    }
}
