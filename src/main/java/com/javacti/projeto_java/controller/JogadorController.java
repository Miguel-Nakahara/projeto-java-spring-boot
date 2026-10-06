package com.javacti.projeto_java.controller;

import com.javacti.projeto_java.business.JogadorService;
import com.javacti.projeto_java.infrastructure.entitys.Jogador;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

@RestController
@RequestMapping("/jogador")
@RequiredArgsConstructor

public class JogadorController {

    private final JogadorService jogadorService;

    @PostMapping
    public ResponseEntity<Void> salvarJogador(@RequestBody Jogador jogador){
        jogadorService.salvarJogador(jogador);

        return ResponseEntity.ok().build();
    }

    @GetMapping
    public ResponseEntity<Jogador> buscarJogadorPorNome(@RequestParam String name){
        return ResponseEntity.ok(jogadorService.buscarJogadorPorNome(name));
    }

    @DeleteMapping
    public ResponseEntity<Void> deletarJogadorPorNome(@RequestParam String name){
        jogadorService.deletarJogadorPorNome(name);
        return ResponseEntity.ok().build();
    }

    @PutMapping
    public ResponseEntity<Void> atualizarJogadorPorId(@RequestParam Integer id, @RequestBody Jogador jogador){
        jogadorService.atualizarJogadorPorId(id, jogador);

        return ResponseEntity.ok().build();
    }
}
