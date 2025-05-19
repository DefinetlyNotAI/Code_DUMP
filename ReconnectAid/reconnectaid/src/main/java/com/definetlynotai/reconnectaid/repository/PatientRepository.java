package com.example.reconnectaid.repository;

import com.example.reconnectaid.model.Patient;
import org.springframework.data.mongodb.repository.MongoRepository;

public interface PatientRepository extends MongoRepository<Patient, String> {
}