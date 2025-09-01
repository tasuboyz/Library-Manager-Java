package com.digitallibrary.web;

import com.digitallibrary.model.Book;
import com.digitallibrary.model.Loan;
import com.digitallibrary.model.User;
import com.digitallibrary.service.BookService;
import com.digitallibrary.service.LoanService;
import com.digitallibrary.service.UserService;
import com.google.gson.Gson;
import com.google.gson.GsonBuilder;
import com.google.gson.reflect.TypeToken;

import com.sun.net.httpserver.HttpServer;
import com.sun.net.httpserver.HttpExchange;
import com.sun.net.httpserver.Headers;

import java.io.*;
import java.net.InetSocketAddress;
import java.nio.file.Files;
import java.nio.file.Path;
import java.nio.file.Paths;
import java.util.List;
import java.util.Map;
import java.util.concurrent.CountDownLatch;
import java.util.stream.Collectors;

/**
 * Very small embedded HTTP server to expose a minimal REST API and a static UI.
 */
public class WebServer {

    private final BookService bookService;
    private final UserService userService;
    private final LoanService loanService;
    private final int port;
    private HttpServer server;
    private final Gson gson = createGson();

    private static Gson createGson() {
        com.google.gson.GsonBuilder gb = new com.google.gson.GsonBuilder().setPrettyPrinting();
        // LocalDateTime adapter
        gb.registerTypeAdapter(java.time.LocalDateTime.class, (com.google.gson.JsonSerializer<java.time.LocalDateTime>) (src, typeOfSrc, context) ->
                new com.google.gson.JsonPrimitive(src == null ? "" : src.toString())
        );
        gb.registerTypeAdapter(java.time.LocalDateTime.class, (com.google.gson.JsonDeserializer<java.time.LocalDateTime>) (json, typeOfT, context) -> {
            try { String s = json.getAsString(); return s == null || s.isEmpty() ? null : java.time.LocalDateTime.parse(s); } catch (Exception e) { return null; }
        });
        // LocalDate adapter
        gb.registerTypeAdapter(java.time.LocalDate.class, (com.google.gson.JsonSerializer<java.time.LocalDate>) (src, typeOfSrc, context) ->
                new com.google.gson.JsonPrimitive(src == null ? "" : src.toString())
        );
        gb.registerTypeAdapter(java.time.LocalDate.class, (com.google.gson.JsonDeserializer<java.time.LocalDate>) (json, typeOfT, context) -> {
            try { String s = json.getAsString(); return s == null || s.isEmpty() ? null : java.time.LocalDate.parse(s); } catch (Exception e) { return null; }
        });
        return gb.create();
    }
    private final CountDownLatch latch = new CountDownLatch(1);

    public WebServer(int port, BookService bookService, UserService userService, LoanService loanService) {
        this.port = port;
        this.bookService = bookService;
        this.userService = userService;
        this.loanService = loanService;
    }

    public void start() throws IOException {
        server = HttpServer.create(new InetSocketAddress(port), 0);
        server.createContext("/", this::handleIndex);
        server.createContext("/api/books", this::handleBooks);
        server.createContext("/api/users", this::handleUsers);
        server.createContext("/api/loans", this::handleLoans);
        server.setExecutor(java.util.concurrent.Executors.newCachedThreadPool());
        server.start();
        System.out.println("Web UI available at http://localhost:" + port + "/ (serving ./frontend)");
    }

    public void stop() {
        if (server != null) server.stop(0);
        latch.countDown();
    }

    public void blockUntilStopped() throws InterruptedException {
        latch.await();
    }

    private void handleIndex(HttpExchange ex) throws IOException {
        try {
            System.out.println("HTTP GET " + ex.getRequestURI());
            String rawPath = ex.getRequestURI().getPath();
            if (rawPath == null || rawPath.equals("/")) rawPath = "/index.html";
            // normalize and prevent directory traversal
            if (rawPath.contains("..")) { writeResponse(ex, 400, "Bad path"); return; }
            if (rawPath.startsWith("/")) rawPath = rawPath.substring(1);
            Path p = Paths.get(System.getProperty("user.dir"), "frontend", rawPath);
            if (!Files.exists(p) || Files.isDirectory(p)) {
                writeResponse(ex, 404, "Not found");
                return;
            }
            byte[] content = Files.readAllBytes(p);
            Headers h = ex.getResponseHeaders();
            String ct = "application/octet-stream";
            if (rawPath.endsWith(".html")) ct = "text/html; charset=utf-8";
            else if (rawPath.endsWith(".js")) ct = "application/javascript; charset=utf-8";
            else if (rawPath.endsWith(".css")) ct = "text/css; charset=utf-8";
            else if (rawPath.endsWith(".json")) ct = "application/json; charset=utf-8";
            else if (rawPath.endsWith(".svg")) ct = "image/svg+xml; charset=utf-8";
            else if (rawPath.endsWith(".png")) ct = "image/png";
            else if (rawPath.endsWith(".jpg") || rawPath.endsWith(".jpeg")) ct = "image/jpeg";
            h.set("Content-Type", ct);
            ex.sendResponseHeaders(200, content.length);
            try (OutputStream os = ex.getResponseBody()) { os.write(content); }
        } catch (Throwable t) {
            t.printStackTrace();
            try { writeResponse(ex, 500, "Internal Server Error: " + t.getMessage()); } catch (IOException ignore) {}
        }
    }

    private void handleBooks(HttpExchange ex) throws IOException {
        try {
            String method = ex.getRequestMethod();
            System.out.println("HTTP " + method + " " + ex.getRequestURI());
            if ("GET".equalsIgnoreCase(method)) {
                // support simple pagination and search: ?limit=20&offset=40&q=term
                String query = ex.getRequestURI().getQuery();
                int limit = 20;
                int offset = 0;
                String q = null;
                if (query != null) {
                    for (String part : query.split("&")) {
                        String[] kv = part.split("=", 2);
                        if (kv.length == 2) {
                            String k = kv[0];
                            String v = java.net.URLDecoder.decode(kv[1], "UTF-8");
                            if ("limit".equalsIgnoreCase(k)) {
                                try { limit = Integer.parseInt(v); } catch (Exception ignore) {}
                            } else if ("offset".equalsIgnoreCase(k) || "skip".equalsIgnoreCase(k)) {
                                try { offset = Integer.parseInt(v); } catch (Exception ignore) {}
                            } else if ("q".equalsIgnoreCase(k)) {
                                q = v.trim();
                            }
                        }
                    }
                }
                List<Book> all = bookService.listAll();
                List<Book> filtered;
                if (q != null && !q.isEmpty()) {
                    String low = q.toLowerCase();
                    filtered = all.stream().filter(b -> {
                        return (b.getTitle() != null && b.getTitle().toLowerCase().contains(low))
                                || (b.getAuthor() != null && b.getAuthor().toLowerCase().contains(low))
                                || (b.getIsbn() != null && b.getIsbn().toLowerCase().contains(low));
                    }).collect(Collectors.toList());
                } else {
                    filtered = all;
                }
                int total = filtered.size();
                int start = Math.max(0, Math.min(total, offset));
                int end = Math.max(start, Math.min(total, start + Math.max(1, limit)));
                List<Book> page = filtered.subList(start, end);
                java.util.Map<String,Object> resp = new java.util.LinkedHashMap<>();
                resp.put("items", page);
                resp.put("total", total);
                resp.put("limit", limit);
                resp.put("offset", offset);
                writeJson(ex, 200, resp);
                return;
            }
            if ("POST".equalsIgnoreCase(method)) {
                Map<String,Object> body = parseBody(ex);
                // minimal validation
                String title = (String) body.getOrDefault("title", "");
                String author = (String) body.getOrDefault("author", "");
                String genre = (String) body.getOrDefault("genre", "");
                Double yearD = body.containsKey("publicationYear") ? ((Number)body.get("publicationYear")).doubleValue() : null;
                String isbn = (String) body.getOrDefault("isbn", "");
                com.digitallibrary.model.Genre g = com.digitallibrary.model.Genre.fromDisplayName(genre);
                int year = yearD != null ? yearD.intValue() : 0;
                String id = com.digitallibrary.util.IdGenerator.generate();
                Book b = new Book(id, title, author, g, year, isbn);
                bookService.addBook(b);
                writeJson(ex, 201, b);
                return;
            }
            writeResponse(ex, 405, "Method not allowed");
        } catch (Throwable t) {
            t.printStackTrace();
            try { writeResponse(ex, 500, "Internal Server Error: " + t.getMessage()); } catch (IOException ignore) {}
        }
    }

    private void handleUsers(HttpExchange ex) throws IOException {
        try {
            String method = ex.getRequestMethod();
            System.out.println("HTTP " + method + " " + ex.getRequestURI());
            if ("GET".equalsIgnoreCase(method)) {
                List<User> users = userService.listAll();
                writeJson(ex, 200, users);
                return;
            }
            if ("POST".equalsIgnoreCase(method)) {
                Map<String,Object> body = parseBody(ex);
                String name = (String) body.getOrDefault("name", "");
                String email = (String) body.getOrDefault("email", "");
                String id = com.digitallibrary.util.IdGenerator.generate();
                User u = new User(id, name, email);
                userService.register(u);
                writeJson(ex, 201, u);
                return;
            }
            writeResponse(ex, 405, "Method not allowed");
        } catch (Throwable t) {
            t.printStackTrace();
            try { writeResponse(ex, 500, "Internal Server Error: " + t.getMessage()); } catch (IOException ignore) {}
        }
    }

    private void handleLoans(HttpExchange ex) throws IOException {
        try {
            String method = ex.getRequestMethod();
            String path = ex.getRequestURI().getPath();
            System.out.println("HTTP " + method + " " + ex.getRequestURI());
            if ("GET".equalsIgnoreCase(method)) {
                List<Loan> loans = loanService.listAll();
                // enrich loans with book title and user name for easier UI rendering
                List<java.util.Map<String,Object>> enriched = loans.stream().map(l -> {
                    java.util.Map<String,Object> m = new java.util.LinkedHashMap<>();
                    m.put("id", l.getId());
                    m.put("bookId", l.getBookId());
                    m.put("userId", l.getUserId());
                    m.put("loanedAt", l.getLoanedAt() != null ? l.getLoanedAt().toString() : "");
                    m.put("dueAt", l.getDueAt() != null ? l.getDueAt().toString() : "");
                    m.put("returnedAt", l.getReturnedAt() != null ? l.getReturnedAt().toString() : "");
                    String bookTitle = bookService.getBookById(l.getBookId()).map(b -> b.getTitle()).orElse("[sconosciuto]");
                    String userName = userService.findById(l.getUserId()).map(u -> u.getName()).orElse("[sconosciuto]");
                    m.put("bookTitle", bookTitle);
                    m.put("userName", userName);
                    return m;
                }).collect(java.util.stream.Collectors.toList());
                writeJson(ex, 200, enriched);
                return;
            }
            if ("POST".equalsIgnoreCase(method) && !path.endsWith("/return")) {
                // Create loan (guard: don't treat POST /.../return as create)
                Map<String,Object> body = parseBody(ex);
                if (body == null) body = new java.util.HashMap<>();
                String bookId = (String) body.getOrDefault("bookId", "");
                String userId = (String) body.getOrDefault("userId", "");
                Number daysN = body.containsKey("days") ? (Number) body.get("days") : 14;
                int days = daysN.intValue();
                java.time.LocalDateTime due = java.time.LocalDateTime.now().plusDays(days);
                String id = com.digitallibrary.util.IdGenerator.generate();
                Loan loan = new Loan(id, bookId, userId, due);
                loanService.createLoan(loan);
                // mark book not available
                bookService.getBookById(bookId).ifPresent(b -> { b.setAvailable(false); bookService.updateBook(b); });
                writeJson(ex, 201, loan);
                return;
            }
            if ("POST".equalsIgnoreCase(method) && path.endsWith("/return")) {
                // handled below
            }

            // handle return: /api/loans/{id}/return
            if ("POST".equalsIgnoreCase(method) && path.matches("/api/loans/[^/]+/return")) {
                String[] seg = path.split("/");
                String id = seg[seg.length-2];
                try {
                    Loan l = loanService.markReturned(id);
                    // mark book available
                    bookService.getBookById(l.getBookId()).ifPresent(b -> { b.setAvailable(true); bookService.updateBook(b); });
                    writeJson(ex, 200, l);
                } catch (IllegalArgumentException e) {
                    writeResponse(ex, 404, e.getMessage());
                }
                return;
            }

            writeResponse(ex, 405, "Method not allowed");
        } catch (Throwable t) {
            t.printStackTrace();
            try { writeResponse(ex, 500, "Internal Server Error: " + t.getMessage()); } catch (IOException ignore) {}
        }
    }

    private Map<String,Object> parseBody(HttpExchange ex) throws IOException {
        try (InputStream is = ex.getRequestBody(); InputStreamReader r = new InputStreamReader(is, "UTF-8")) {
            java.lang.reflect.Type type = new TypeToken<Map<String,Object>>(){}.getType();
            return gson.fromJson(r, type);
        }
    }

    private void writeJson(HttpExchange ex, int status, Object obj) throws IOException {
        String json = gson.toJson(obj);
        byte[] bytes = json.getBytes("UTF-8");
        Headers h = ex.getResponseHeaders();
        h.set("Content-Type", "application/json; charset=utf-8");
        ex.sendResponseHeaders(status, bytes.length);
        try (OutputStream os = ex.getResponseBody()) { os.write(bytes); }
    }

    private void writeResponse(HttpExchange ex, int status, String body) throws IOException {
        byte[] bytes = body.getBytes("UTF-8");
        ex.getResponseHeaders().set("Content-Type", "text/plain; charset=utf-8");
        ex.sendResponseHeaders(status, bytes.length);
        try (OutputStream os = ex.getResponseBody()) { os.write(bytes); }
    }
}
