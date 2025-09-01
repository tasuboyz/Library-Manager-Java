package com.digitallibrary.repository;

import com.digitallibrary.model.Loan;

import java.io.BufferedWriter;
import java.io.FileWriter;
import java.io.IOException;
import java.nio.file.Files;
import java.nio.file.Paths;
import java.time.LocalDateTime;
import java.util.ArrayList;
import java.util.LinkedHashMap;
import java.util.List;
import java.util.Map;
import java.util.Objects;
import java.util.Optional;
import java.util.stream.Collectors;

import com.google.gson.Gson;
import com.google.gson.GsonBuilder;
import com.google.gson.reflect.TypeToken;

public class JsonLoanRepository implements com.digitallibrary.repository.LoanRepository {

    private final String filePath;

    public JsonLoanRepository(String filePath) {
        this.filePath = filePath;
    }

    @Override
    public Loan save(Loan loan) {
        List<Loan> list = loadAll();
        boolean replaced = false;
        for (int i = 0; i < list.size(); i++) {
            if (Objects.equals(list.get(i).getId(), loan.getId())) {
                list.set(i, loan);
                replaced = true;
                break;
            }
        }
        if (!replaced) list.add(loan);
        saveToFile(list);
        return loan;
    }

    @Override
    public Optional<Loan> findById(String id) {
        return loadAll().stream().filter(l -> Objects.equals(l.getId(), id)).findFirst();
    }

    @Override
    public List<Loan> findAll() {
        return loadAll();
    }

    @Override
    public List<Loan> findByUserId(String userId) {
        return loadAll().stream().filter(l -> Objects.equals(l.getUserId(), userId)).collect(Collectors.toList());
    }

    @Override
    public List<Loan> findByBookId(String bookId) {
        return loadAll().stream().filter(l -> Objects.equals(l.getBookId(), bookId)).collect(Collectors.toList());
    }

    @Override
    public boolean deleteById(String id) {
        List<Loan> list = loadAll();
        boolean removed = list.removeIf(l -> Objects.equals(l.getId(), id));
        if (removed) saveToFile(list);
        return removed;
    }

    private List<Loan> loadAll() {
        List<Loan> result = new ArrayList<>();
        if (!Files.exists(Paths.get(filePath))) return result;

        try {
            String content = new String(Files.readAllBytes(Paths.get(filePath)));
            Gson gson = new Gson();
            java.lang.reflect.Type listType = new TypeToken<List<Map<String, Object>>>(){}.getType();
            List<Map<String, Object>> raw = gson.fromJson(content, listType);
            if (raw == null) return result;
            for (Map<String, Object> m : raw) {
                String id = Objects.toString(m.getOrDefault("id", ""), "");
                if (id.trim().isEmpty()) continue;
                Loan l = new Loan();
                l.setId(id);
                l.setBookId(Objects.toString(m.getOrDefault("bookId", ""), ""));
                l.setUserId(Objects.toString(m.getOrDefault("userId", ""), ""));
                try { l.setLoanedAt(LocalDateTime.parse(Objects.toString(m.getOrDefault("loanedAt", ""), ""))); } catch (Exception e) { /* ignore */ }
                try { l.setDueAt(LocalDateTime.parse(Objects.toString(m.getOrDefault("dueAt", ""), ""))); } catch (Exception e) { /* ignore */ }
                try {
                    String returned = Objects.toString(m.getOrDefault("returnedAt", ""), "");
                    if (!returned.trim().isEmpty()) l.setReturnedAt(LocalDateTime.parse(returned));
                } catch (Exception e) { /* ignore */ }
                result.add(l);
            }
        } catch (IOException e) {
            e.printStackTrace();
        }

        return result;
    }

    private void saveToFile(List<Loan> loans) {
        Gson gson = new GsonBuilder().setPrettyPrinting().create();
        List<Map<String, Object>> out = new ArrayList<>();
        for (Loan l : loans) {
            Map<String, Object> m = new LinkedHashMap<>();
            m.put("id", l.getId());
            m.put("bookId", l.getBookId());
            m.put("userId", l.getUserId());
            m.put("loanedAt", l.getLoanedAt() != null ? l.getLoanedAt().toString() : "");
            m.put("dueAt", l.getDueAt() != null ? l.getDueAt().toString() : "");
            m.put("returnedAt", l.getReturnedAt() != null ? l.getReturnedAt().toString() : "");
            out.add(m);
        }

        try (BufferedWriter bw = new BufferedWriter(new FileWriter(filePath))) {
            bw.write(gson.toJson(out));
        } catch (IOException e) {
            e.printStackTrace();
        }
    }
}
