package com.digitallibrary.model;

/**
 * Enumerazione che rappresenta i generi letterari disponibili
 * nella libreria digitale.
 * 
 * Ogni genere ha un nome di visualizzazione user-friendly
 * e può essere esteso facilmente con nuovi generi.
 * 
 * @author Digital Library Team
 * @version 1.0
 */
public enum Genre {
    
    // Generi principali con descrizioni
    FICTION("Narrativa"),
    NON_FICTION("Saggistica"),
    MYSTERY("Giallo/Mystery"),
    ROMANCE("Romantico"),
    SCIENCE_FICTION("Fantascienza"),
    FANTASY("Fantasy"),
    THRILLER("Thriller"),
    HORROR("Horror"),
    BIOGRAPHY("Biografia"),
    HISTORY("Storia"),
    SCIENCE("Scienza"),
    TECHNOLOGY("Tecnologia"),
    PHILOSOPHY("Filosofia"),
    POETRY("Poesia"),
    DRAMA("Teatro"),
    CHILDREN("Per Bambini"),
    YOUNG_ADULT("Young Adult"),
    COOKING("Cucina"),
    TRAVEL("Viaggi"),
    SELF_HELP("Auto-aiuto"),
    BUSINESS("Business"),
    HEALTH("Salute"),
    ART("Arte"),
    MUSIC("Musica"),
    SPORTS("Sport"),
    OTHER("Altro");
    
    // Campo per il nome di visualizzazione
    private final String displayName;
    
    /**
     * Costruttore dell'enum
     * @param displayName nome user-friendly del genere
     */
    Genre(String displayName) {
        this.displayName = displayName;
    }
    
    /**
     * Getter per il nome di visualizzazione
     * @return nome user-friendly del genere
     */
    public String getDisplayName() {
        return displayName;
    }
    
    /**
     * Metodo statico per trovare un genere dal nome di visualizzazione
     * Utile per la conversione da input utente
     * 
     * @param displayName nome di visualizzazione da cercare
     * @return il genere corrispondente, o OTHER se non trovato
     */
    public static Genre fromDisplayName(String displayName) {
        if (displayName == null || displayName.trim().isEmpty()) {
            return OTHER;
        }
        
        for (Genre genre : Genre.values()) {
            if (genre.displayName.equalsIgnoreCase(displayName.trim())) {
                return genre;
            }
        }
        return OTHER;
    }
    
    /**
     * Metodo statico per ottenere tutti i generi come array di stringhe
     * Utile per creare menù di selezione
     * 
     * @return array di nomi di visualizzazione di tutti i generi
     */
    public static String[] getAllDisplayNames() {
        Genre[] genres = Genre.values();
        String[] displayNames = new String[genres.length];
        
        for (int i = 0; i < genres.length; i++) {
            displayNames[i] = genres[i].displayName;
        }
        
        return displayNames;
    }
    
    /**
     * Metodo per ottenere una rappresentazione formattata di tutti i generi
     * con numerazione, utile per i menù
     * 
     * @return stringa formattata con tutti i generi numerati
     */
    public static String getFormattedList() {
        StringBuilder sb = new StringBuilder();
        Genre[] genres = Genre.values();
        
        for (int i = 0; i < genres.length; i++) {
            sb.append(String.format("%2d. %s\n", i + 1, genres[i].displayName));
        }
        
        return sb.toString();
    }
    
    /**
     * Metodo per ottenere un genere dall'indice numerico
     * Utile per selezioni da menù numerato
     * 
     * @param index indice del genere (1-based)
     * @return il genere corrispondente, o OTHER se indice non valido
     */
    public static Genre fromIndex(int index) {
        Genre[] genres = Genre.values();
        if (index >= 1 && index <= genres.length) {
            return genres[index - 1];
        }
        return OTHER;
    }
    
    /**
     * Override del toString per restituire il nome di visualizzazione
     */
    @Override
    public String toString() {
        return displayName;
    }
}
