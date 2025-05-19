package com.example.reconnectaid.model;

import org.springframework.data.annotation.Id;
import org.springframework.data.mongodb.core.mapping.Document;

@Document(collection = "patients")
public class Patient {

    @Id
    private String id;
    private String name;
    private String status;
    private String location;

    // Getters and Setters
}