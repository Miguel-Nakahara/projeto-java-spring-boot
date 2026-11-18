package com.javacti.projeto_java.business;

import com.javacti.projeto_java.infrastructure.entitys.Jogador;
import com.javacti.projeto_java.infrastructure.repository.JogadorRepository;
import org.springframework.http.HttpStatus;
import org.springframework.stereotype.Service;
import org.springframework.web.server.ResponseStatusException;

import java.util.List;

@Service
public class JogadorService {

    private final JogadorRepository repository;

    public JogadorService(JogadorRepository repository) {
        this.repository = repository;
    }

    public void salvarJogador(Jogador jogador) {
        validarNome(jogador.getName());
        repository.findByName(jogador.getName()).ifPresent(existente -> {
            throw new ResponseStatusException(HttpStatus.CONFLICT, "Já existe um jogador com esse nome");
        });
        repository.saveAndFlush(jogador);
    }

    public List<Jogador> listarJogadores() {
        return repository.findAll();
    }

    public Jogador buscarJogadorPorNome(String name) {
        return repository.findByName(name).orElseThrow(
                () -> new ResponseStatusException(HttpStatus.NOT_FOUND, "Jogador não encontrado")
        );
    }

    public void deletarJogadorPorNome(String name) {
        Jogador jogador = repository.findByName(name).orElseThrow(
                () -> new ResponseStatusException(HttpStatus.NOT_FOUND, "Jogador não encontrado")
        );
        repository.delete(jogador);
    }

    public void atualizarJogadorPorId(Integer id, Jogador jogador) {
        Jogador jogadorEntity = repository.findById(id).orElseThrow(
                () -> new ResponseStatusException(HttpStatus.NOT_FOUND, "Jogador não encontrado")
        );

        String nextName = jogador.getName() != null ? jogador.getName() : jogadorEntity.getName();
        validarNome(nextName);
        repository.findByName(nextName)
                .filter(existente -> !existente.getId().equals(id))
                .ifPresent(existente -> {
                    throw new ResponseStatusException(HttpStatus.CONFLICT, "Já existe um jogador com esse nome");
                });

        jogadorEntity.setName(nextName);
        if (jogador.getIdade() != null) jogadorEntity.setIdade(jogador.getIdade());
        if (jogador.getValor() != null) jogadorEntity.setValor(jogador.getValor());
        if (jogador.getDesempenho() != null) jogadorEntity.setDesempenho(jogador.getDesempenho());
        repository.saveAndFlush(jogadorEntity);
    }

    private void validarNome(String name) {
        if (name == null || name.isBlank()) {
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "O nome do jogador é obrigatório");
        }
    }
}
