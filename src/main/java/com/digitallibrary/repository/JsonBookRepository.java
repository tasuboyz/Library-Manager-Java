package com.digitallibrary.repository;

import com.digitallibrary.model.Book;
import com.digitallibrary.model.Genre;

import java.io.*;
import java.nio.file.Files;
import java.nio.file.Paths;
import java.time.LocalDateTime;
import java.util.*;
import java.util.stream.Collectors;
import com.google.gson.Gson;
import com.google.gson.reflect.TypeToken;

/**
 * Implementazione semplice della persistenza su JSON (una riga = un oggetto JSON semplice).
 * Questo è un approccio minimale per demo senza dipendenze esterne.
 */
public class JsonBookRepository implements BookRepository {

    private final String filePath;

    public JsonBookRepository(String filePath) {
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

        try {
            String content = new String(Files.readAllBytes(Paths.get(filePath)));
            Gson gson = new Gson();
            java.lang.reflect.Type listType = new TypeToken<List<Map<String, Object>>>(){}.getType();
            List<Map<String, Object>> raw = gson.fromJson(content, listType);
            if (raw == null) return list;
            for (Map<String, Object> m : raw) {
                String id = Objects.toString(m.getOrDefault("id", ""), "");
                if (id.trim().isEmpty()) continue;
                Book b = new Book();
                b.setId(id);
                b.setTitle(Objects.toString(m.getOrDefault("title", ""), ""));
                b.setAuthor(Objects.toString(m.getOrDefault("author", ""), ""));
                b.setGenre(Genre.fromDisplayName(Objects.toString(m.getOrDefault("genre", ""), "")));
                try { b.setPublicationYear(((Number)m.getOrDefault("publicationYear", 0)).intValue()); } catch (Exception e) { try { b.setPublicationYear(Integer.parseInt(Objects.toString(m.getOrDefault("publicationYear", "0")))); } catch (Exception ex) { b.setPublicationYear(0); } }
                b.setIsbn(Objects.toString(m.getOrDefault("isbn", ""), ""));
                b.setAvailable(Boolean.parseBoolean(Objects.toString(m.getOrDefault("available", "true"), "true")));
                try { b.setAddedDate(LocalDateTime.parse(Objects.toString(m.getOrDefault("addedDate", ""), ""))); } catch (Exception e) { /* ignore */ }
                list.add(b);
            }

        } catch (IOException e) {
            e.printStackTrace();
        }
        return list;
    }

    private void saveToFile(List<Book> books) {
        Gson gson = new Gson();
        try (BufferedWriter bw = new BufferedWriter(new FileWriter(filePath))) {
            String json = gson.toJson(books.stream().map(b -> {
                Map<String,Object> m = new LinkedHashMap<>();
                m.put("id", b.getId());
                m.put("title", b.getTitle());
                m.put("author", b.getAuthor());
                m.put("genre", b.getGenre() != null ? b.getGenre().getDisplayName() : "");
                m.put("publicationYear", b.getPublicationYear());
                m.put("isbn", b.getIsbn());
                m.put("available", b.isAvailable());
                m.put("addedDate", b.getAddedDate() != null ? b.getAddedDate().toString() : "");
                return m;
            }).toList());
            bw.write(json);
        } catch (IOException e) {
            e.printStackTrace();
        }
    }

    private String toSimpleJson(Book b) {
    // Kept for backward compatibility but not used after gson refactor
    return "{}";
    }

    private String escape(String s) {
        if (s == null) return "";
        return s.replace("\\", "\\\\").replace("\"", "\\\"").replace("\n", " ");
    }

    private Map<String, String> parseSimpleJson(String json) {
    return Collections.emptyMap();
    }

    private String stripQuotes(String s) {
        if (s.startsWith("\"") && s.endsWith("\"") && s.length() >= 2) return s.substring(1, s.length()-1);
        return s;
    }

    private String unescape(String s) {
        return s.replace("\\\"", "\"").replace("\\\\", "\\");
    }
}
