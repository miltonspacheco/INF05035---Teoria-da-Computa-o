class Tape {
  constructor(initialContent = "", blankSymbol = "_") {
    this.blankSymbol = blankSymbol;
    this.cells = new Map();
    this.head = 0;

    Array.from(initialContent).forEach((symbol, index) => {
      if (symbol !== blankSymbol) {
        this.cells.set(index, symbol);
      }
    });
  }

  read() {
    return this.cells.get(this.head) ?? this.blankSymbol;
  }

  write(symbol) {
    if (symbol === this.blankSymbol) {
      this.cells.delete(this.head);
      return;
    }

    this.cells.set(this.head, symbol);
  }

  move(direction) {
    if (direction === "L") {
      this.head -= 1;
      return;
    }

    if (direction === "R") {
      this.head += 1;
      return;
    }

    if (direction === "S") {
      return;
    }

    throw new Error(`Direcao invalida: ${direction}. Use L, R ou S.`);
  }

  getContent() {
    if (this.cells.size === 0) {
      return "";
    }

    const indexes = Array.from(this.cells.keys());
    const min = Math.min(...indexes);
    const max = Math.max(...indexes);
    let content = "";

    for (let index = min; index <= max; index += 1) {
      content += this.cells.get(index) ?? this.blankSymbol;
    }

    return content;
  }

  getWindow(radius = 8) {
    const cells = [];

    for (let index = this.head - radius; index <= this.head + radius; index += 1) {
      cells.push({
        index,
        symbol: this.cells.get(index) ?? this.blankSymbol,
        active: index === this.head,
      });
    }

    return cells;
  }
}

class TwoTapeTuringMachine {
  constructor({ transitions, initialState, acceptStates, rejectStates, blankSymbol = "_" }) {
    this.transitions = transitions;
    this.initialState = initialState;
    this.acceptStates = new Set(acceptStates);
    this.rejectStates = new Set(rejectStates);
    this.blankSymbol = blankSymbol;
    this.history = [];
    this.reset("", "");
  }

  reset(tape1Input = "", tape2Input = "") {
    this.tape1 = new Tape(tape1Input, this.blankSymbol);
    this.tape2 = new Tape(tape2Input, this.blankSymbol);
    this.currentState = this.initialState;
    this.steps = 0;
    this.halted = this.acceptStates.has(this.currentState) || this.rejectStates.has(this.currentState);
    this.accepted = this.acceptStates.has(this.currentState);
    this.stopReason = this.halted ? "Estado terminal inicial." : "Maquina inicializada.";
    this.history = [this.getSnapshot()];
  }

  getTransitionKey(state, symbol1, symbol2) {
    return `${state}|${symbol1}|${symbol2}`;
  }

  step() {
    if (this.halted) {
      throw new Error("A maquina ja esta finalizada.");
    }

    const symbol1 = this.tape1.read();
    const symbol2 = this.tape2.read();
    const transition = this.transitions.get(this.getTransitionKey(this.currentState, symbol1, symbol2));

    if (!transition) {
      this.halted = true;
      this.accepted = false;
      this.stopReason = `Sem transicao para (${this.currentState}, ${symbol1}, ${symbol2}).`;
      this.history.push(this.getSnapshot());
      return;
    }

    this.tape1.write(transition.write1);
    this.tape2.write(transition.write2);
    this.tape1.move(transition.move1);
    this.tape2.move(transition.move2);

    this.currentState = transition.nextState;
    this.steps += 1;

    if (this.acceptStates.has(this.currentState)) {
      this.halted = true;
      this.accepted = true;
      this.stopReason = `Estado de aceitacao alcancado: ${this.currentState}.`;
    } else if (this.rejectStates.has(this.currentState)) {
      this.halted = true;
      this.accepted = false;
      this.stopReason = `Estado de rejeicao alcancado: ${this.currentState}.`;
    } else {
      this.stopReason = "Execucao em andamento.";
    }

    this.history.push(this.getSnapshot());
  }

  run(maxSteps) {
    while (!this.halted && this.steps < maxSteps) {
      this.step();
    }

    if (!this.halted && this.steps >= maxSteps) {
      this.halted = true;
      this.accepted = false;
      this.stopReason = `Limite de passos excedido (${maxSteps}).`;
      this.history.push(this.getSnapshot());
    }
  }

  getSnapshot() {
    return {
      state: this.currentState,
      steps: this.steps,
      head1: this.tape1.head,
      head2: this.tape2.head,
      tape1: this.tape1.getContent(),
      tape2: this.tape2.getContent(),
      stopReason: this.stopReason,
    };
  }
}

const elements = {
  initialState: document.querySelector("#initial-state"),
  acceptStates: document.querySelector("#accept-states"),
  rejectStates: document.querySelector("#reject-states"),
  blankSymbol: document.querySelector("#blank-symbol"),
  tape1Input: document.querySelector("#tape-1-input"),
  tape2Input: document.querySelector("#tape-2-input"),
  maxSteps: document.querySelector("#max-steps"),
  transitionsInput: document.querySelector("#transitions-input"),
  currentState: document.querySelector("#current-state"),
  stepCount: document.querySelector("#step-count"),
  haltStatus: document.querySelector("#halt-status"),
  statusMessage: document.querySelector("#status-message"),
  historyList: document.querySelector("#history-list"),
  tape1View: document.querySelector("#tape-1-view"),
  tape2View: document.querySelector("#tape-2-view"),
  tape1Summary: document.querySelector("#tape-1-summary"),
  tape2Summary: document.querySelector("#tape-2-summary"),
  loadExample: document.querySelector("#load-example"),
  initialize: document.querySelector("#initialize"),
  step: document.querySelector("#step"),
  run: document.querySelector("#run"),
};

const EXAMPLE_TRANSITIONS = [
  {
    state: "q0",
    read1: "0",
    read2: "_",
    nextState: "q0",
    write1: "0",
    write2: "0",
    move1: "R",
    move2: "R",
  },
  {
    state: "q0",
    read1: "1",
    read2: "_",
    nextState: "q0",
    write1: "1",
    write2: "1",
    move1: "R",
    move2: "R",
  },
  {
    state: "q0",
    read1: "_",
    read2: "_",
    nextState: "q_accept",
    write1: "_",
    write2: "_",
    move1: "S",
    move2: "S",
  },
];

let machine = null;

function splitCommaSeparatedValues(value) {
  return value
    .split(",")
    .map((item) => item.trim())
    .filter(Boolean);
}

function buildTransitionsMap(rawTransitions) {
  if (!Array.isArray(rawTransitions)) {
    throw new Error("As transicoes precisam ser uma lista JSON.");
  }

  const map = new Map();

  rawTransitions.forEach((transition, index) => {
    const requiredFields = [
      "state",
      "read1",
      "read2",
      "nextState",
      "write1",
      "write2",
      "move1",
      "move2",
    ];

    requiredFields.forEach((field) => {
      if (!(field in transition)) {
        throw new Error(`A transicao ${index + 1} nao possui o campo ${field}.`);
      }
    });

    ["move1", "move2"].forEach((field) => {
      if (!["L", "R", "S"].includes(transition[field])) {
        throw new Error(`A transicao ${index + 1} possui ${field} invalido.`);
      }
    });

    const key = `${transition.state}|${transition.read1}|${transition.read2}`;
    map.set(key, transition);
  });

  return map;
}

function getConfigFromForm() {
  const blankSymbol = elements.blankSymbol.value || "_";

  if (blankSymbol.length !== 1) {
    throw new Error("O simbolo branco precisa ter exatamente um caractere.");
  }

  const transitions = JSON.parse(elements.transitionsInput.value);
  const maxSteps = Number.parseInt(elements.maxSteps.value, 10);

  if (!Number.isFinite(maxSteps) || maxSteps <= 0) {
    throw new Error("Informe um maximo de passos valido.");
  }

  return {
    transitions: buildTransitionsMap(transitions),
    initialState: elements.initialState.value.trim(),
    acceptStates: splitCommaSeparatedValues(elements.acceptStates.value),
    rejectStates: splitCommaSeparatedValues(elements.rejectStates.value),
    blankSymbol,
    tape1Input: elements.tape1Input.value,
    tape2Input: elements.tape2Input.value,
    maxSteps,
  };
}

function setStatus(message, type = "default") {
  elements.statusMessage.textContent = message;
  elements.statusMessage.classList.remove("status-ok", "status-error");

  if (type === "ok") {
    elements.statusMessage.classList.add("status-ok");
  }

  if (type === "error") {
    elements.statusMessage.classList.add("status-error");
  }
}

function renderTape(container, tape) {
  container.innerHTML = "";

  tape.getWindow(window.innerWidth < 840 ? 4 : 8).forEach((cell) => {
    const item = document.createElement("div");
    item.className = `tape-cell${cell.active ? " active" : ""}`;

    const symbol = document.createElement("div");
    symbol.className = "symbol";
    symbol.textContent = cell.symbol;

    const index = document.createElement("div");
    index.className = "index";
    index.textContent = cell.index;

    item.append(index, symbol);
    container.appendChild(item);
  });
}

function renderHistory(history) {
  elements.historyList.innerHTML = "";

  history
    .slice(-8)
    .reverse()
    .forEach((snapshot) => {
      const item = document.createElement("li");
      item.textContent =
        `passos=${snapshot.steps} | estado=${snapshot.state} | fita1=${snapshot.tape1 || "vazia"} | fita2=${snapshot.tape2 || "vazia"}`;
      elements.historyList.appendChild(item);
    });
}

function renderMachine() {
  if (!machine) {
    elements.currentState.textContent = "-";
    elements.stepCount.textContent = "0";
    elements.haltStatus.textContent = "Nao inicializada";
    elements.tape1Summary.textContent = "Sem dados.";
    elements.tape2Summary.textContent = "Sem dados.";
    elements.tape1View.innerHTML = "";
    elements.tape2View.innerHTML = "";
    elements.historyList.innerHTML = "";
    return;
  }

  elements.currentState.textContent = machine.currentState;
  elements.stepCount.textContent = String(machine.steps);
  elements.haltStatus.textContent = machine.halted
    ? machine.accepted
      ? "Aceita"
      : "Parada sem aceitacao"
    : "Executando";
  elements.tape1Summary.textContent = `Cabeca em ${machine.tape1.head} | Conteudo: ${machine.tape1.getContent() || "vazia"}`;
  elements.tape2Summary.textContent = `Cabeca em ${machine.tape2.head} | Conteudo: ${machine.tape2.getContent() || "vazia"}`;

  renderTape(elements.tape1View, machine.tape1);
  renderTape(elements.tape2View, machine.tape2);
  renderHistory(machine.history);
}

function initializeMachine() {
  const config = getConfigFromForm();

  if (!config.initialState) {
    throw new Error("Informe um estado inicial.");
  }

  if (config.acceptStates.length === 0) {
    throw new Error("Informe ao menos um estado de aceitacao.");
  }

  machine = new TwoTapeTuringMachine({
    transitions: config.transitions,
    initialState: config.initialState,
    acceptStates: config.acceptStates,
    rejectStates: config.rejectStates,
    blankSymbol: config.blankSymbol,
  });

  machine.reset(config.tape1Input, config.tape2Input);
  renderMachine();
  setStatus("Maquina inicializada com sucesso.", "ok");
}

function ensureMachineInitialized() {
  if (!machine) {
    initializeMachine();
  }
}

function handleAction(action) {
  try {
    action();
    renderMachine();
  } catch (error) {
    setStatus(error.message, "error");
  }
}

function loadExample() {
  elements.initialState.value = "q0";
  elements.acceptStates.value = "q_accept";
  elements.rejectStates.value = "q_reject";
  elements.blankSymbol.value = "_";
  elements.tape1Input.value = "10110";
  elements.tape2Input.value = "";
  elements.maxSteps.value = "1000";
  elements.transitionsInput.value = JSON.stringify(EXAMPLE_TRANSITIONS, null, 2);
  setStatus("Exemplo carregado. Voce pode inicializar ou editar as regras.", "ok");
}

elements.loadExample.addEventListener("click", () => {
  loadExample();
  machine = null;
  renderMachine();
});

elements.initialize.addEventListener("click", () => {
  handleAction(() => {
    initializeMachine();
  });
});

elements.step.addEventListener("click", () => {
  handleAction(() => {
    ensureMachineInitialized();
    if (machine.halted) {
      setStatus(machine.stopReason, machine.accepted ? "ok" : "error");
      return;
    }
    machine.step();
    setStatus(machine.stopReason, machine.halted ? (machine.accepted ? "ok" : "error") : "default");
  });
});

elements.run.addEventListener("click", () => {
  handleAction(() => {
    ensureMachineInitialized();
    if (machine.halted) {
      setStatus(machine.stopReason, machine.accepted ? "ok" : "error");
      return;
    }
    const maxSteps = Number.parseInt(elements.maxSteps.value, 10);
    machine.run(maxSteps);
    setStatus(machine.stopReason, machine.accepted ? "ok" : machine.halted ? "error" : "default");
  });
});

window.addEventListener("resize", () => {
  renderMachine();
});

loadExample();
renderMachine();
