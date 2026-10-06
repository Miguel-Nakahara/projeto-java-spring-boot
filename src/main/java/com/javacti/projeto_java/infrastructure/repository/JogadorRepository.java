package com.javacti.projeto_java.infrastructure.repository;

import com.javacti.projeto_java.infrastructure.entitys.Jogador;
import jakarta.transaction.Transactional;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.Optional;

public interface JogadorRepository extends JpaRepository<Jogador,Integer> {

    Optional<Jogador> findByName(String name);

    @Transactional
    void deleteByName(String name);
}
