package com.javacti.projeto_java.business;

import com.javacti.projeto_java.infrastructure.entitys.Jogador;
import com.javacti.projeto_java.infrastructure.repository.JogadorRepository;
import org.springframework.stereotype.Service;

@Service
public class JogadorService {

    private final JogadorRepository repository;


    public JogadorService(JogadorRepository repository) {
        this.repository = repository;
    }

    public void salvarJogador(Jogador jogador){
        repository.saveAndFlush(jogador);
    }

    public Jogador buscarJogadorPorNome(String name){
        return  repository.findByName(name).orElseThrow(
                () -> new RuntimeException("Jogador não encontrado")
        );
    }

    public void deletarJogadorPorNome(String name){
        repository.deleteByName(name);
    }

    public void atualizarJogadorPorId(Integer id, Jogador jogador){
        Jogador jogadorEntity = repository.findById(id).orElseThrow(() -> new RuntimeException("Id inexistente"));
        Jogador jogadorAtualizado = Jogador.builder()
                .name(jogador.getName() != null ? jogador.getName() : jogadorEntity.getName())
                .idade(jogador.getIdade() != null ? jogador.getIdade() : jogadorEntity.getIdade())
                .valor(jogador.getValor() != null ? jogador.getValor() : jogadorEntity.getValor())
                .desempenho(jogador.getDesempenho() != null ? jogador.getDesempenho() : jogadorEntity.getDesempenho())
                .id(jogador.getId())
                .build();

        repository.saveAndFlush(jogadorAtualizado);
    }
}
