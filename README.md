# Motor de Execução da Máquina de Turing de Duas Fitas

Este projeto fornece uma API baseada em Flask para executar uma Máquina de Turing de duas fitas (Fita 1 e Fita 2). O diferencial desta API é que ela atua puramente como um **Motor de Execução**. A API não contém lógicas ou operações matemáticas pré-definidas (como soma ou multiplicação); toda a configuração, alfabeto e transições de estado devem ser injetados pelo cliente (Frontend) no momento da requisição.

---

## 1. Como a Máquina Funciona

A Máquina de Turing modelada neste projeto é composta por:
* **Duas Fitas Infinitas (Fita 1 e Fita 2)**: Cada fita possui o seu próprio cabeçote de leitura/escrita que se move independentemente. A Fita 1 é preenchida com a `entrada` inicial fornecida e a Fita 2 começa vazia.
* **Estados e Transições**: A máquina processa iterações baseada no Estado Atual e nos Símbolos Lidos pelas duas fitas simultaneamente. Em cada iteração, ela executa uma Transição que diz: (1) O que escrever na Fita 1, (2) O que escrever na Fita 2, (3) Para onde mover o cabeçote 1, (4) Para onde mover o cabeçote 2, e (5) Qual será o Próximo Estado.
* **Fim da Execução**: A máquina para imediatamente quando atinge o `estado_aceitacao` definido, o `estado_rejeicao` definido, ou caso não haja nenhuma transição mapeada para o estado atual (caindo em rejeição por padrão).

### Movimentos Permitidos
Para os cabeçotes de cada fita, você deve informar a direção como um dos três valores:
- `D`: Move para a Direita.
- `E`: Move para a Esquerda.
- `P`: Para (Fica na mesma posição).

---

## 2. Como Utilizar a Rota da API

Você pode se comunicar com a Máquina de Turing enviando um `POST` para o endpoint de execução. O servidor instanciará a máquina com a sua lógica, simulará passo a passo, e devolverá todo o histórico da simulação.

### **POST** `/api/run`
**Content-Type**: `application/json`

O corpo da requisição (`payload`) é dividido em 3 blocos obrigatórios: `entrada`, `configuracao` e `transicoes`.

#### Exemplo de Payload (JSON)

```json
{
  "entrada": "111",
  "configuracao": {
    "simbolo_inicial": ">",
    "simbolo_branco": "_",
    "alfabeto_entrada": ["1"],
    "alfabeto_auxiliar": ["1", "X"],
    "estado_inicial": "q0",
    "estado_aceitacao": "q_aceita",
    "estado_rejeicao": "q_rejeita"
  },
  "transicoes": [
    {
      "estado_origem": "q0",
      "simbolos_lidos": [">", ">"],
      "simbolos_escritos": [">", ">"],
      "direcoes": ["D", "P"],
      "estado_destino": "q1"
    },
    {
      "estado_origem": "q1",
      "simbolos_lidos": ["1", "_"],
      "simbolos_escritos": ["X", "1"],
      "direcoes": ["D", "D"],
      "estado_destino": "q1"
    },
    {
      "estado_origem": "q1",
      "simbolos_lidos": ["_", "_"],
      "simbolos_escritos": ["_", "_"],
      "direcoes": ["P", "P"],
      "estado_destino": "q_aceita"
    }
  ]
}
```

#### Retorno de Sucesso (HTTP 200)

O retorno é projetado para permitir que o Frontend desenhe uma animação ou slider passo a passo do processo.

```json
{
  "entrada_processada": "111",
  "aceito": true,
  "estado_final": "q_aceita",
  "historico": [
    {
      "iteracao": 0,
      "estado": "q0",
      "fita1": "[>]111",
      "fita2": "[>]_"
    },
    {
      "iteracao": 1,
      "estado": "q1",
      "fita1": ">[1]11",
      "fita2": ">[_]"
    },
    {
      "iteracao": 2,
      "estado": "q1",
      "fita1": ">X[1]1",
      "fita2": ">1[_]"
    }
    // ...
  ]
}
```

* **`historico`**: Uma array de objetos. Cada objeto descreve o momento em uma iteração.
* **Colchetes `[ ]` nas Fitas**: A formatação de string retornada no history, como `>X[1]1`, significa que a fita contém `>X11` e o cabeçote atual está parado **em cima do caractere `1` (o terceiro caractere)**.

#### Retorno de Erro (HTTP 400)

Erros ocorrem caso haja um `payload` incompleto, tipos incorretos no JSON, ou caso a máquina entre em Loop Infinito (a API previne travamentos abortando após 5000 iterações).

```json
{
  "erro": "A execução excedeu o limite máximo de iterações."
}
```

---

## 3. Swagger UI
A API acompanha documentação nativa via Swagger.
Com a aplicação Flask rodando, você pode acessar:
`http://127.0.0.1:5000/apidocs/`
Lá é possível inspecionar os tipos de cada parâmetro e testar submissões de payloads diretamente no navegador.
