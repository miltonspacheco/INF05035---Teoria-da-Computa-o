# V2 em JavaScript com interface grafica

Esta versao implementa o simulador de Maquina de Turing com duas fitas em JavaScript puro, com uma interface web simples.

## Arquivos

- `index.html`: estrutura da interface.
- `styles.css`: estilos da pagina.
- `app.js`: motor da maquina e logica da interface.

## Como usar

1. Abra `v2/index.html` no navegador.
2. Clique em `Carregar exemplo` se quiser partir de uma maquina pronta.
3. Clique em `Inicializar`.
4. Use `Executar passo` ou `Executar ate parar`.

## Formato das transicoes

As transicoes sao fornecidas como uma lista JSON:

```json
[
  {
    "state": "q0",
    "read1": "1",
    "read2": "_",
    "nextState": "q0",
    "write1": "1",
    "write2": "1",
    "move1": "R",
    "move2": "R"
  }
]
```

Os movimentos aceitos sao `L`, `R` e `S`.
