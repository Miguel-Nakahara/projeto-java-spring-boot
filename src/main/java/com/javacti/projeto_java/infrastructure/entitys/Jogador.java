package com.javacti.projeto_java.infrastructure.entitys;

import jakarta.persistence.*;
import lombok.*;

@Getter
@Setter
@AllArgsConstructor
@NoArgsConstructor
@Builder
@Table(name = "jogadores")
@Entity

public class Jogador {

    @Id
    @GeneratedValue(strategy = GenerationType.AUTO)
    private Integer id;

    @Column(name = "name", unique = true)
    private String name;

    @Column(name = "idade")
    private Integer idade;

    @Column(name = "valor")
    private Float valor;

    @Column(name = "desempenho")
    private String desempenho;


}
