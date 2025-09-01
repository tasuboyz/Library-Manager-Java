package com.digitallibrary.repository;

import com.digitallibrary.model.Book;
import com.digitallibrary.model.Genre;

import java.io.IOException;
import java.nio.file.Files;
import java.nio.file.Path;
import java.nio.file.Paths;
import java.sql.*;
import java.time.LocalDateTime;
import java.util.ArrayList;
import java.util.List;
import java.util.Optional;
import java.util.stream.Collectors;

/**
 * Repository che usa SQLite via JDBC (Xerial).
 * Richiede il driver org.xerial:sqlite-jdbc nel classpath (gestito da Gradle).
 */
public class SqliteBookRepository implements BookRepository {

    private final String dbUrl;
    private final Path dbFile;

    public SqliteBookRepository(String dbFilePath) {
        this.dbFile = Paths.get(dbFilePath);
        this.dbUrl = "jdbc:sqlite:" + dbFilePath;
        ensureTable();
    }

    private Connection connect() throws SQLException {
        return DriverManager.getConnection(dbUrl);
    }

    private void ensureTable() {
        String sql = "CREATE TABLE IF NOT EXISTS books ("
                + "id TEXT PRIMARY KEY,"
                + "title TEXT NOT NULL,"
                + "author TEXT NOT NULL,"
                + "genre TEXT,"
                + "publicationYear INTEGER,"
                + "isbn TEXT,"
                + "available INTEGER,"
                + "addedDate TEXT"
                + ");";
        try (Connection c = connect(); Statement s = c.createStatement()) {
            s.execute(sql);
        } catch (SQLException e) {
            throw new RuntimeException("Impossibile creare la tabella books", e);
        }
    }

    @Override
    public Book save(Book book) {
        String sql = "INSERT OR REPLACE INTO books(id,title,author,genre,publicationYear,isbn,available,addedDate) VALUES (?,?,?,?,?,?,?,?)";
        try (Connection c = connect(); PreparedStatement ps = c.prepareStatement(sql)) {
            ps.setString(1, book.getId());
            ps.setString(2, book.getTitle());
            ps.setString(3, book.getAuthor());
            ps.setString(4, book.getGenre() != null ? book.getGenre().getDisplayName() : null);
            ps.setInt(5, book.getPublicationYear());
            ps.setString(6, book.getIsbn());
            ps.setInt(7, book.isAvailable() ? 1 : 0);
            ps.setString(8, book.getAddedDate() != null ? book.getAddedDate().toString() : null);
            ps.executeUpdate();
            return book;
        } catch (SQLException e) {
            throw new RuntimeException(e);
        }
    }

    @Override
    public Optional<Book> findById(String id) {
        String sql = "SELECT * FROM books WHERE id = ?";
        try (Connection c = connect(); PreparedStatement ps = c.prepareStatement(sql)) {
            ps.setString(1, id);
            try (ResultSet rs = ps.executeQuery()) {
                if (rs.next()) return Optional.of(mapRow(rs));
                return Optional.empty();
            }
        } catch (SQLException e) {
            throw new RuntimeException(e);
        }
    }

    @Override
    public List<Book> findAll() {
        String sql = "SELECT * FROM books";
        List<Book> list = new ArrayList<>();
        try (Connection c = connect(); Statement s = c.createStatement(); ResultSet rs = s.executeQuery(sql)) {
            while (rs.next()) list.add(mapRow(rs));
        } catch (SQLException e) {
            throw new RuntimeException(e);
        }
        return list;
    }

    @Override
    public Book update(Book book) {
        return save(book);
    }

    @Override
    public boolean deleteById(String id) {
        String sql = "DELETE FROM books WHERE id = ?";
        try (Connection c = connect(); PreparedStatement ps = c.prepareStatement(sql)) {
            ps.setString(1, id);
            int changed = ps.executeUpdate();
            return changed > 0;
        } catch (SQLException e) {
            throw new RuntimeException(e);
        }
    }

    @Override
    public void saveAll(List<Book> books) {
        String sql = "INSERT OR REPLACE INTO books(id,title,author,genre,publicationYear,isbn,available,addedDate) VALUES (?,?,?,?,?,?,?,?)";
        try (Connection c = connect(); PreparedStatement ps = c.prepareStatement(sql)) {
            c.setAutoCommit(false);
            for (Book book : books) {
                ps.setString(1, book.getId());
                ps.setString(2, book.getTitle());
                ps.setString(3, book.getAuthor());
                ps.setString(4, book.getGenre() != null ? book.getGenre().getDisplayName() : null);
                ps.setInt(5, book.getPublicationYear());
                ps.setString(6, book.getIsbn());
                ps.setInt(7, book.isAvailable() ? 1 : 0);
                ps.setString(8, book.getAddedDate() != null ? book.getAddedDate().toString() : null);
                ps.addBatch();
            }
            ps.executeBatch();
            c.commit();
        } catch (SQLException e) {
            throw new RuntimeException(e);
        }
    }

    @Override
    public List<Book> loadAll() {
        return findAll();
    }

    private Book mapRow(ResultSet rs) throws SQLException {
        Book b = new Book();
        b.setId(rs.getString("id"));
        b.setTitle(rs.getString("title"));
        b.setAuthor(rs.getString("author"));
        b.setGenre(Genre.fromDisplayName(rs.getString("genre")));
        try { b.setPublicationYear(rs.getInt("publicationYear")); } catch (Exception e) { b.setPublicationYear(0); }
        b.setIsbn(rs.getString("isbn"));
        b.setAvailable(rs.getInt("available") == 1);
        String added = rs.getString("addedDate");
        if (added != null && !added.isEmpty()) {
            try { b.setAddedDate(LocalDateTime.parse(added)); } catch (Exception e) { /* ignore */ }
        }
        return b;
    }

    /**
     * Se il DB non esiste, prova a eseguire il file SQL di seed se presente
     */
    public void seedIfEmpty(Path seedSqlPath) {
        try {
            if (!Files.exists(dbFile)) {
                // DB file will be created upon connection
            }
            boolean empty = findAll().isEmpty();
            if (!empty) return;

            if (seedSqlPath != null && Files.exists(seedSqlPath)) {
                String sql = Files.lines(seedSqlPath).collect(Collectors.joining("\n"));
                try (Connection c = connect(); Statement s = c.createStatement()) {
                    String[] parts = sql.split(";\s*\n");
                    for (String part : parts) {
                        String stmt = part.trim();
                        if (!stmt.isEmpty()) s.execute(stmt);
                    }
                }
            }
        } catch (IOException | SQLException e) {
            throw new RuntimeException(e);
        }
    }
}
