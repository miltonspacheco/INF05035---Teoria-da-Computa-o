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

## Como rodar o projeto?

Recomendamos criar um ambiente virtual para rodar a aplicação, como requisito basta ter python instalado na sua máquina.

Crie o ambiente virtual

```sh
python -m venv nome_do_seu_ambiente
```

Acesse o ambiente virtual

Windows
```sh
env\Scripts\activate
```

Linux
```sh
source env/bin/activate
```

Baixar depedências necessárias
```sh
pip install -r requirements.txt
```

Rodar projeto
```sh
python3 app.py
```

Acessar URL local
```sh
http://127.0.0.1:5000
```