package com.digitallibrary.repository;

import com.digitallibrary.model.Book;
import com.digitallibrary.model.Genre;

import java.io.*;
import java.nio.file.Files;
import java.nio.file.Paths;
import java.time.LocalDateTime;
import java.util.*;
import java.util.stream.Collectors;

/**
 * Implementazione semplice della persistenza su CSV.
 * Formato: id,title,author,genre,year,isbn,available,addedDate
 */
public class CsvBookRepository implements BookRepository {

    private final String filePath;
    private static final String SEP = ",";

    public CsvBookRepository(String filePath) {
        this.filePath = filePath;
    }

    @Override
    public Book save(Book book) {
        List<Book> books = loadAll();
        books.add(book);
        saveToFile(books);
        return book;
    }

    @Override
    public Optional<Book> findById(String id) {
        return loadAll().stream().filter(b -> b.getId().equals(id)).findFirst();
    }

    @Override
    public List<Book> findAll() {
        return loadAll();
    }

    @Override
    public Book update(Book book) {
        List<Book> books = loadAll();
        books = books.stream().map(b -> b.getId().equals(book.getId()) ? book : b).collect(Collectors.toList());
        saveToFile(books);
        return book;
    }

    @Override
    public boolean deleteById(String id) {
        List<Book> books = loadAll();
        boolean removed = books.removeIf(b -> b.getId().equals(id));
        if (removed) saveToFile(books);
        return removed;
    }

    @Override
    public void saveAll(List<Book> books) {
        saveToFile(books);
    }

    @Override
    public List<Book> loadAll() {
        List<Book> list = new ArrayList<>();
        if (!Files.exists(Paths.get(filePath))) return list;

        try (BufferedReader br = new BufferedReader(new FileReader(filePath))) {
            String line;
            while ((line = br.readLine()) != null) {
                if (line.trim().isEmpty()) continue;
                String[] parts = line.split(SEP, -1);
                if (parts.length < 8) continue; // malformed
                try {
                    String title = parts[1] != null ? parts[1].trim() : "";
                    if (title.isEmpty()) {
                        // skip rows without a valid title
                        continue;
                    }
                    Book b = new Book();
                    b.setId(parts[0]);
                    b.setTitle(title);
                    b.setAuthor(parts[2]);
                    b.setGenre(Genre.fromDisplayName(parts[3]));
                    try { b.setPublicationYear(Integer.parseInt(parts[4])); } catch (Exception e) { b.setPublicationYear(0); }
                    b.setIsbn(parts[5]);
                    b.setAvailable(Boolean.parseBoolean(parts[6]));
                    try { b.setAddedDate(LocalDateTime.parse(parts[7])); } catch (Exception e) { /* ignore */ }
                    list.add(b);
                } catch (Exception e) {
                    // skip malformed row but continue processing others
                    System.out.println("Warning: skipping malformed CSV row: " + Arrays.toString(parts) + " -> " + e.getMessage());
                }
            }
        } catch (IOException e) {
            e.printStackTrace();
        }
        return list;
    }

    private void saveToFile(List<Book> books) {
        try (BufferedWriter bw = new BufferedWriter(new FileWriter(filePath))) {
            for (Book b : books) {
                String line = String.join(SEP,
                    b.getId(),
                    escapeCsv(b.getTitle()),
                    escapeCsv(b.getAuthor()),
                    b.getGenre().getDisplayName(),
                    String.valueOf(b.getPublicationYear()),
                    b.getIsbn(),
                    String.valueOf(b.isAvailable()),
                    b.getAddedDate() != null ? b.getAddedDate().toString() : ""
                );
                bw.write(line);
                bw.newLine();
            }
        } catch (IOException e) {
            e.printStackTrace();
        }
    }

    private String escapeCsv(String s) {
        if (s == null) return "";
        return s.replace("\n", " ").replace(SEP, " ").trim();
    }
}
