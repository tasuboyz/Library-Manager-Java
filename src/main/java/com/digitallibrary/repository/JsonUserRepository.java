package com.digitallibrary.repository;

import com.digitallibrary.model.User;

import java.io.*;
import java.nio.file.Files;
import java.nio.file.Paths;
import java.time.LocalDateTime;
import java.util.*;
import com.google.gson.Gson;
import com.google.gson.reflect.TypeToken;

public class JsonUserRepository implements com.digitallibrary.repository.UserRepository {

    private final String filePath;

    public JsonUserRepository(String filePath) { this.filePath = filePath; }

    @Override
    public User save(User user) {
        List<User> users = loadAll();
        users.add(user);
        saveToFile(users);
        return user;
    }

    @Override
    public Optional<User> findById(String id) {
        return loadAll().stream().filter(u -> u.getId().equals(id)).findFirst();
    }

    @Override
    public List<User> findAll() { return loadAll(); }

    @Override
    public boolean deleteById(String id) {
        List<User> users = loadAll();
        boolean removed = users.removeIf(u -> u.getId().equals(id));
        if (removed) saveToFile(users);
        return removed;
    }

    private List<User> loadAll() {
        List<User> list = new ArrayList<>();
        if (!Files.exists(Paths.get(filePath))) return list;
        try {
            String content = new String(Files.readAllBytes(Paths.get(filePath)));
            Gson gson = new Gson();
            java.lang.reflect.Type listType = new com.google.gson.reflect.TypeToken<List<Map<String, Object>>>(){}.getType();
            List<Map<String, Object>> raw = gson.fromJson(content, listType);
            if (raw == null) return list;
            for (Map<String, Object> m : raw) {
                String id = Objects.toString(m.getOrDefault("id", ""), "");
                if (id.isEmpty()) continue;
                User u = new User();
                u.setId(id);
                u.setName(Objects.toString(m.getOrDefault("name", ""), ""));
                u.setEmail(Objects.toString(m.getOrDefault("email", ""), ""));
                try { u.setRegisteredAt(LocalDateTime.parse(Objects.toString(m.getOrDefault("registeredAt", LocalDateTime.now().toString())))); } catch (Exception e) { /* ignore */ }
                list.add(u);
            }
        } catch (IOException e) { e.printStackTrace(); }
        return list;
    }

    private void saveToFile(List<User> users) {
        Gson gson = new Gson();
        try (BufferedWriter bw = new BufferedWriter(new FileWriter(filePath))) {
            bw.write(gson.toJson(users.stream().map(u -> {
                Map<String,Object> m = new LinkedHashMap<>();
                m.put("id", u.getId()); m.put("name", u.getName()); m.put("email", u.getEmail()); m.put("registeredAt", u.getRegisteredAt() != null ? u.getRegisteredAt().toString() : "");
                return m;
            }).toList()));
        } catch (IOException e) { e.printStackTrace(); }
    }

    private String escape(String s) { if (s == null) return ""; return s.replace("\\", "\\\\").replace("\"", "\\\"").replace("\n", " "); }

    private Map<String, String> parseSimpleJson(String json) {
        Map<String, String> map = new HashMap<>();
        String body = json.trim(); if (body.startsWith("{")) body = body.substring(1); if (body.endsWith("}")) body = body.substring(0, body.length()-1);
        String[] parts = body.split(",");
        for (String p : parts) {
            String[] kv = p.split(":", 2); if (kv.length!=2) continue; String k = strip(kv[0]); String v = strip(kv[1]); map.put(k, unescape(v));
        }
        return map;
    }
    private String strip(String s) { s = s.trim(); if (s.startsWith("\"") && s.endsWith("\"")) return s.substring(1, s.length()-1); return s; }
    private String unescape(String s) { return s.replace("\\\"", "\"").replace("\\\\", "\\"); }
}
