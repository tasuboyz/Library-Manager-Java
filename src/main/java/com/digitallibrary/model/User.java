package com.digitallibrary.model;

import java.time.LocalDateTime;
import java.util.Objects;

/**
 * Rappresenta un utente iscritto alla libreria
 */
public class User {
    private String id;
    private String name;
    private String email;
    private LocalDateTime registeredAt;

    public User() {
        this.registeredAt = LocalDateTime.now();
    }

    public User(String id, String name, String email) {
        this.id = id;
        this.name = name;
        this.email = email;
        this.registeredAt = LocalDateTime.now();
    }

    public String getId() { return id; }
    public String getName() { return name; }
    public String getEmail() { return email; }
    public LocalDateTime getRegisteredAt() { return registeredAt; }

    public void setId(String id) {
        if (id == null || id.trim().isEmpty()) throw new IllegalArgumentException("ID non può essere vuoto");
        this.id = id;
    }
    public void setName(String name) {
        if (name == null || name.trim().isEmpty()) throw new IllegalArgumentException("Nome non può essere vuoto");
        this.name = name;
    }
    public void setEmail(String email) {
        if (email == null || email.trim().isEmpty()) throw new IllegalArgumentException("Email non può essere vuota");
        this.email = email;
    }
    public void setRegisteredAt(LocalDateTime registeredAt) { this.registeredAt = registeredAt; }

    @Override
    public boolean equals(Object o) {
        if (this == o) return true;
        if (o == null || getClass() != o.getClass()) return false;
        User user = (User) o;
        return Objects.equals(id, user.id);
    }

    @Override
    public int hashCode() {
        return Objects.hash(id);
    }

    @Override
    public String toString() {
        return String.format("User{id='%s', name='%s', email='%s'}", id, name, email);
    }
}
