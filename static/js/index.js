let historyData = [];
let currentIndex = 0;
let isPlaying = false;
let playInterval = null;
const diagram = new StateDiagram('state-diagram');

function criarOpcoesDirecao(selectedValue = 'P') {
    return ['E', 'D', 'P']
        .map(direction => `<option value="${direction}"${direction === selectedValue ? ' selected' : ''}>${direction}</option>`)
        .join('');
}

function adicionarLinhaTransicao(values = {}) {
    const tbody = document.getElementById('transition-table-body');
    const row = document.createElement('tr');

    row.innerHTML = `
        <td><input type="text" data-field="estado_origem" value="${values.estado_origem || ''}" placeholder="q0"></td>
        <td><input type="text" data-field="leitura_f1" value="${values.leitura_f1 || ''}" placeholder=">"></td>
        <td><input type="text" data-field="leitura_f2" value="${values.leitura_f2 || ''}" placeholder=">"></td>
        <td><input type="text" data-field="escrita_f1" value="${values.escrita_f1 || ''}" placeholder=">"></td>
        <td><input type="text" data-field="escrita_f2" value="${values.escrita_f2 || ''}" placeholder=">"></td>
        <td><select data-field="direcao_f1">${criarOpcoesDirecao(values.direcao_f1)}</select></td>
        <td><select data-field="direcao_f2">${criarOpcoesDirecao(values.direcao_f2)}</select></td>
        <td><input type="text" data-field="estado_destino" value="${values.estado_destino || ''}" placeholder="q1"></td>
        <td><button type="button" class="icon-btn" onclick="removerLinhaTransicao(this)">×</button></td>
    `;

    tbody.appendChild(row);
}

function removerLinhaTransicao(button) {
    const tbody = document.getElementById('transition-table-body');
    const row = button.closest('tr');

            if (tbody.children.length === 1) {
                row.querySelectorAll('input').forEach(input => {
                    input.value = '';
                });
                row.querySelectorAll('select').forEach(select => {
                    select.value = 'P';
                });
                return;
            }

    row.remove();
}

function coletarDefinicaoMaquinaCustomizada(eqInput) {
    const rows = Array.from(document.querySelectorAll('#transition-table-body tr'));
    const transicoesPersonalizadas = [];
    const simboloInicial = document.getElementById('custom-start-symbol').value.trim() || '>';
    const simboloBranco = document.getElementById('custom-blank-symbol').value.trim() || '_';
    const alfabetoEntradaInformado = document
        .getElementById('custom-input-alphabet')
        .value
        .split(',')
        .map(symbol => symbol.trim())
        .filter(Boolean);
    const alfabetoEntrada = new Set(
        alfabetoEntradaInformado.length > 0
            ? alfabetoEntradaInformado
            : eqInput.split('').filter(symbol => symbol && symbol !== simboloInicial && symbol !== simboloBranco)
    );
    const alfabetoAuxiliar = new Set();
    const alfabetoAuxiliarInformado = document
        .getElementById('custom-auxiliary-alphabet')
        .value
        .split(',')
        .map(symbol => symbol.trim())
        .filter(Boolean);
    let possuiConteudoCustomizado = false;

    for (const simbolo of alfabetoAuxiliarInformado) {
        alfabetoAuxiliar.add(simbolo);
    }

    for (const row of rows) {
        const getValue = field => row.querySelector(`[data-field="${field}"]`).value.trim();
        const values = {
            estado_origem: getValue('estado_origem'),
            leitura_f1: getValue('leitura_f1'),
            leitura_f2: getValue('leitura_f2'),
            escrita_f1: getValue('escrita_f1'),
            escrita_f2: getValue('escrita_f2'),
            direcao_f1: getValue('direcao_f1'),
            direcao_f2: getValue('direcao_f2'),
            estado_destino: getValue('estado_destino')
        };

        const linhaTemAlgumValor = Object.values(values).some(value => value !== '' && value !== 'P');

        if (!linhaTemAlgumValor) {
            continue;
        }

        possuiConteudoCustomizado = true;

        const linhaEstaCompleta = Object.values(values).every(value => value !== '');
        if (!linhaEstaCompleta) {
            throw new Error('Preencha todos os campos de cada transição personalizada.');
        }

        const simbolos = [values.leitura_f1, values.leitura_f2, values.escrita_f1, values.escrita_f2];
        for (const simbolo of simbolos) {
            if (simbolo !== simboloInicial && simbolo !== simboloBranco && !alfabetoEntrada.has(simbolo)) {
                alfabetoAuxiliar.add(simbolo);
            }
        }

        transicoesPersonalizadas.push(construirTransicao(
            values.estado_origem,
            [values.leitura_f1, values.leitura_f2],
            [values.escrita_f1, values.escrita_f2],
            [values.direcao_f1, values.direcao_f2],
            values.estado_destino
        ));
    }

    if (!possuiConteudoCustomizado) {
        return null;
    }

    return {
        configuracao: {
            simbolo_inicial: simboloInicial,
            simbolo_branco: simboloBranco,
            alfabeto_entrada: Array.from(alfabetoEntrada),
            alfabeto_auxiliar: Array.from(alfabetoAuxiliar),
            estado_inicial: document.getElementById('custom-initial-state').value.trim() || 'q0',
            estado_aceitacao: document.getElementById('custom-accept-state').value.trim() || 'q_aceita',
            estado_rejeicao: document.getElementById('custom-reject-state').value.trim() || 'q_rejeita'
        },
        transicoes: transicoesPersonalizadas
    };
}

function construirTransicao(estadoOrigem, simbolosLidos, simbolosEscritos, direcoes, estadoDestino) {
    return {
        estado_origem: estadoOrigem,
        simbolos_lidos: simbolosLidos,
        simbolos_escritos: simbolosEscritos,
        direcoes,
        estado_destino: estadoDestino
    };
}

const anbn_payload = {
    "configuracao": {
        "simbolo_inicial": ">", "simbolo_branco": "_",
        "alfabeto_entrada": ["a", "b"], "alfabeto_auxiliar": ["A", "B"],
        "estado_inicial": "q0", "estado_aceitacao": "q_aceita", "estado_rejeicao": "q_rejeita"
    },
    "transicoes": [
        {"estado_origem": "q0", "simbolos_lidos": [">", ">"], "simbolos_escritos": [">", ">"], "direcoes": ["D", "D"], "estado_destino": "q1"},
        {"estado_origem": "q1", "simbolos_lidos": ["_", "_"], "simbolos_escritos": ["_", "_"], "direcoes": ["P", "P"], "estado_destino": "q_aceita"},
        {"estado_origem": "q1", "simbolos_lidos": ["a", "_"], "simbolos_escritos": ["a", "A"], "direcoes": ["D", "D"], "estado_destino": "q2"},
        {"estado_origem": "q2", "simbolos_lidos": ["a", "_"], "simbolos_escritos": ["a", "A"], "direcoes": ["D", "D"], "estado_destino": "q2"},
        {"estado_origem": "q2", "simbolos_lidos": ["b", "_"], "simbolos_escritos": ["b", "_"], "direcoes": ["P", "E"], "estado_destino": "q3"},
        {"estado_origem": "q3", "simbolos_lidos": ["b", "A"], "simbolos_escritos": ["b", "A"], "direcoes": ["P", "E"], "estado_destino": "q3"},
        {"estado_origem": "q3", "simbolos_lidos": ["b", ">"], "simbolos_escritos": ["b", ">"], "direcoes": ["P", "D"], "estado_destino": "q4"},
        {"estado_origem": "q4", "simbolos_lidos": ["b", "A"], "simbolos_escritos": ["b", "A"], "direcoes": ["D", "D"], "estado_destino": "q4"},
        {"estado_origem": "q4", "simbolos_lidos": ["_", "_"], "simbolos_escritos": ["_", "_"], "direcoes": ["P", "P"], "estado_destino": "q_aceita"},
        {"estado_origem": "q4", "simbolos_lidos": ["_", "A"], "simbolos_escritos": ["_", "A"], "direcoes": ["P", "P"], "estado_destino": "q_rejeita"},
        {"estado_origem": "q4", "simbolos_lidos": ["b", "_"], "simbolos_escritos": ["b", "_"], "direcoes": ["P", "P"], "estado_destino": "q_rejeita"}
    ]
};

const pow2x_payload = {
    "configuracao": {
        "simbolo_inicial": ">", "simbolo_branco": "_",
        "alfabeto_entrada": ["1"], "alfabeto_auxiliar": ["A", "1"],
        "estado_inicial": "q0", "estado_aceitacao": "q_aceita", "estado_rejeicao": "q_rejeita"
    },
    "transicoes": [
        {"estado_origem": "q0", "simbolos_lidos": [">", ">"], "simbolos_escritos": [">", ">"], "direcoes": ["D", "D"], "estado_destino": "q1"},
        {"estado_origem": "q1", "simbolos_lidos": ["1", "_"], "simbolos_escritos": ["_", "1"], "direcoes": ["D", "D"], "estado_destino": "q1"},
        {"estado_origem": "q1", "simbolos_lidos": ["_", "_"], "simbolos_escritos": ["_", "_"], "direcoes": ["E", "E"], "estado_destino": "q2"},
        {"estado_origem": "q2", "simbolos_lidos": ["_", "1"], "simbolos_escritos": ["_", "1"], "direcoes": ["E", "E"], "estado_destino": "q2"},
        {"estado_origem": "q2", "simbolos_lidos": [">", ">"], "simbolos_escritos": [">", ">"], "direcoes": ["D", "D"], "estado_destino": "q3"},
        {"estado_origem": "q3", "simbolos_lidos": ["_", "1"], "simbolos_escritos": ["1", "1"], "direcoes": ["E", "P"], "estado_destino": "q4"},
        {"estado_origem": "q3", "simbolos_lidos": ["_", "_"], "simbolos_escritos": ["1", "_"], "direcoes": ["P", "P"], "estado_destino": "q_aceita"},
        {"estado_origem": "q4", "simbolos_lidos": [">", "1"], "simbolos_escritos": [">", "1"], "direcoes": ["D", "P"], "estado_destino": "q5"},
        {"estado_origem": "q5", "simbolos_lidos": ["1", "1"], "simbolos_escritos": ["A", "1"], "direcoes": ["D", "P"], "estado_destino": "q6"},
        {"estado_origem": "q5", "simbolos_lidos": ["1", "_"], "simbolos_escritos": ["1", "_"], "direcoes": ["P", "P"], "estado_destino": "q_aceita"},
        {"estado_origem": "q6", "simbolos_lidos": ["1", "1"], "simbolos_escritos": ["A", "1"], "direcoes": ["D", "P"], "estado_destino": "q6"},
        {"estado_origem": "q6", "simbolos_lidos": ["_", "1"], "simbolos_escritos": ["_", "1"], "direcoes": ["E", "P"], "estado_destino": "q7"},
        {"estado_origem": "q7", "simbolos_lidos": ["A", "1"], "simbolos_escritos": ["A", "1"], "direcoes": ["E", "P"], "estado_destino": "q7"},
        {"estado_origem": "q7", "simbolos_lidos": [">", "1"], "simbolos_escritos": [">", "1"], "direcoes": ["D", "P"], "estado_destino": "q8"},
        {"estado_origem": "q8", "simbolos_lidos": ["A", "1"], "simbolos_escritos": ["1", "1"], "direcoes": ["D", "P"], "estado_destino": "q9"},
        {"estado_origem": "q9", "simbolos_lidos": ["A", "1"], "simbolos_escritos": ["A", "1"], "direcoes": ["D", "P"], "estado_destino": "q9"},
        {"estado_origem": "q9", "simbolos_lidos": ["1", "1"], "simbolos_escritos": ["1", "1"], "direcoes": ["D", "P"], "estado_destino": "q9"},
        {"estado_origem": "q9", "simbolos_lidos": ["_", "1"], "simbolos_escritos": ["1", "1"], "direcoes": ["E", "P"], "estado_destino": "q10"},
        {"estado_origem": "q10", "simbolos_lidos": ["1", "1"], "simbolos_escritos": ["1", "1"], "direcoes": ["E", "P"], "estado_destino": "q10"},
        {"estado_origem": "q10", "simbolos_lidos": ["A", "1"], "simbolos_escritos": ["A", "1"], "direcoes": ["P", "P"], "estado_destino": "q8"},
        {"estado_origem": "q10", "simbolos_lidos": [">", "1"], "simbolos_escritos": [">", "1"], "direcoes": ["D", "P"], "estado_destino": "q11"},
        {"estado_origem": "q11", "simbolos_lidos": ["1", "1"], "simbolos_escritos": ["1", "1"], "direcoes": ["E", "P"], "estado_destino": "q11"},
        {"estado_origem": "q11", "simbolos_lidos": [">", "1"], "simbolos_escritos": [">", "1"], "direcoes": ["D", "D"], "estado_destino": "q5"}
    ]
};

const pow2x1_payload = {
    "configuracao": {
        "simbolo_inicial": ">", "simbolo_branco": "_",
        "alfabeto_entrada": ["1"], "alfabeto_auxiliar": ["1"],
        "estado_inicial": "q0", "estado_aceitacao": "q_aceita", "estado_rejeicao": "q_rejeita"
    },
    "transicoes": [
        {"estado_origem": "q0", "simbolos_lidos": [">", ">"], "simbolos_escritos": [">", ">"], "direcoes": ["D", "D"], "estado_destino": "q1"},
        {"estado_origem": "q1", "simbolos_lidos": ["1", "_"], "simbolos_escritos": ["_", "1"], "direcoes": ["D", "D"], "estado_destino": "q1"},
        {"estado_origem": "q1", "simbolos_lidos": ["_", "_"], "simbolos_escritos": ["_", "_"], "direcoes": ["E", "E"], "estado_destino": "q2"},
        {"estado_origem": "q2", "simbolos_lidos": ["_", "1"], "simbolos_escritos": ["_", "1"], "direcoes": ["E", "E"], "estado_destino": "q2"},
        {"estado_origem": "q2", "simbolos_lidos": [">", ">"], "simbolos_escritos": [">", ">"], "direcoes": ["D", "D"], "estado_destino": "q3"},
        {"estado_origem": "q3", "simbolos_lidos": ["_", "1"], "simbolos_escritos": ["1", "1"], "direcoes": ["D", "P"], "estado_destino": "q4"},
        {"estado_origem": "q3", "simbolos_lidos": ["_", "_"], "simbolos_escritos": ["1", "_"], "direcoes": ["P", "P"], "estado_destino": "q_aceita"},
        {"estado_origem": "q4", "simbolos_lidos": ["_", "1"], "simbolos_escritos": ["1", "1"], "direcoes": ["D", "D"], "estado_destino": "q3"}
    ]
};

const par_payload = {
    "configuracao": {
        "simbolo_inicial": ">", "simbolo_branco": "_",
        "alfabeto_entrada": ["1"], "alfabeto_auxiliar": [],
        "estado_inicial": "q0", "estado_aceitacao": "q_aceita", "estado_rejeicao": "q_rejeita"
    },
    "transicoes": [
        {"estado_origem": "q0", "simbolos_lidos": [">", ">"], "simbolos_escritos": [">", ">"], "direcoes": ["D", "D"], "estado_destino": "q1"},
        {"estado_origem": "q1", "simbolos_lidos": ["1", "_"], "simbolos_escritos": ["1", "_"], "direcoes": ["D", "P"], "estado_destino": "q2"},
        {"estado_origem": "q1", "simbolos_lidos": ["_", "_"], "simbolos_escritos": ["_", "_"], "direcoes": ["P", "P"], "estado_destino": "q_aceita"},
        {"estado_origem": "q2", "simbolos_lidos": ["1", "_"], "simbolos_escritos": ["1", "_"], "direcoes": ["D", "P"], "estado_destino": "q1"},
        {"estado_origem": "q2", "simbolos_lidos": ["_", "_"], "simbolos_escritos": ["_", "_"], "direcoes": ["P", "P"], "estado_destino": "q_rejeita"}
    ]
};

const EXAMPLES = {
    'anbn':  { payload: anbn_payload,  input: 'aabb' },
    '2x':    { payload: pow2x_payload, input: '111' },
    '2x1':   { payload: pow2x1_payload, input: '11' },
    'par':   { payload: par_payload,   input: '1111' }
};

function loadExample(type) {
    document.querySelectorAll('.example-card').forEach(c => {
        c.style.borderColor = 'var(--border-color)';
        c.style.boxShadow = 'none';
    });

    const ex = EXAMPLES[type];
    if (!ex) return;

    event.currentTarget.style.borderColor = 'var(--primary-color)';
    event.currentTarget.style.boxShadow = '0 0 10px rgba(59,130,246,0.25)';

    const payload = ex.payload;
    document.getElementById('equation').value = ex.input;
    document.getElementById('custom-start-symbol').value = payload.configuracao.simbolo_inicial;
    document.getElementById('custom-blank-symbol').value = payload.configuracao.simbolo_branco;
    document.getElementById('custom-input-alphabet').value = payload.configuracao.alfabeto_entrada.join(', ');
    document.getElementById('custom-auxiliary-alphabet').value = (payload.configuracao.alfabeto_auxiliar || []).join(', ');
    document.getElementById('custom-initial-state').value = payload.configuracao.estado_inicial;
    document.getElementById('custom-accept-state').value = payload.configuracao.estado_aceitacao;
    document.getElementById('custom-reject-state').value = payload.configuracao.estado_rejeicao;

    const tbody = document.getElementById('transition-table-body');
    tbody.innerHTML = '';

    payload.transicoes.forEach(t => {
        adicionarLinhaTransicao({
            estado_origem: t.estado_origem,
            leitura_f1: t.simbolos_lidos[0],
            leitura_f2: t.simbolos_lidos[1],
            escrita_f1: t.simbolos_escritos[0],
            escrita_f2: t.simbolos_escritos[1],
            direcao_f1: t.direcoes[0],
            direcao_f2: t.direcoes[1],
            estado_destino: t.estado_destino
        });
    });
   
    diagram.build(payload.transicoes, payload.configuracao);
    document.getElementById('diagram-container').style.display = 'block';
}

        function buildPayload(eqInput) {
            const customMachineDefinition = coletarDefinicaoMaquinaCustomizada(eqInput);
            if (!customMachineDefinition) {
                throw new Error('Adicione ao menos uma transição para simular a máquina.');
            }

            return {
                entrada: eqInput,
                espera_ms: 0,
                configuracao: customMachineDefinition.configuracao,
                transicoes: customMachineDefinition.transicoes
            };
        }

        async function runMachine() {
            const eqInput = document.getElementById('equation').value.trim();
            if (!eqInput) return;

            document.getElementById('runBtn').disabled = true;
            document.getElementById('loading').style.display = 'block';
            document.getElementById('simulation-area').style.display = 'none';
            document.getElementById('final-result').textContent = '-';
            document.getElementById('final-result').className = 'status-value';
            
            historyData = [];
            currentIndex = 0;

            try {
                const payload = buildPayload(eqInput);

               
                diagram.build(payload.transicoes, payload.configuracao);
                document.getElementById('diagram-container').style.display = 'block';

                const response = await fetch('/api/run', {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify(payload) 
                });

                if (!response.ok) {
                    let errorMessage = 'Erro ao executar a máquina.';
                    try {
                        const errorData = await response.json();
                        errorMessage = errorData.erro || errorData.error || errorMessage;
                    } catch (_) {
                        try {
                            const errorText = await response.text();
                            if (errorText.trim()) {
                                errorMessage = errorText.trim();
                            }
                        } catch (_) {}
                    }
                    throw new Error(errorMessage);
                }

                if (!response.body) {
                    throw new Error('O servidor não retornou um stream de execução.');
                }

                document.getElementById('simulation-area').style.display = 'block';
                document.getElementById('loading').style.display = 'none';

                const reader = response.body.getReader();
                const decoder = new TextDecoder();
                let buffer = '';

                while (true) {
                    const { value, done } = await reader.read();
                    if (done) break;
                    
                    buffer += decoder.decode(value, { stream: true });
                    const lines = buffer.split('\n');
                    
                    
                    buffer = lines.pop();

                    for (const line of lines) {
                        if (line.trim() === '') continue;
                        const data = JSON.parse(line);
                        
                        if (data.erro) {
                            alert('Erro: ' + data.erro);
                            break;
                        }

                        historyData.push(data);
                        
                       
                        currentIndex = historyData.length - 1;
                        renderStep();

                        if (data.finalizado) {
                            const resultEl = document.getElementById('final-result');
                            if (data.aceito) {
                                resultEl.textContent = 'ACEITO';
                                resultEl.className = 'status-value accepted';
                            } else {
                                resultEl.textContent = 'REJEITADO';
                                resultEl.className = 'status-value rejected';
                            }
                        }
                        
                       
                        const speed = document.getElementById('speed').value;
                        await new Promise(r => setTimeout(r, speed));
                    }
                }
            } catch (err) {
                alert(err.message || 'Erro de conexão com o servidor Flask Stream.');
            } finally {
                document.getElementById('runBtn').disabled = false;
                document.getElementById('loading').style.display = 'none';
            }
        }

        function renderTape(tapeString, containerId) {
            const container = document.getElementById(containerId);
            container.innerHTML = '';
            
           
            let i = 0;
            while (i < tapeString.length) {
                if (tapeString[i] === '[') {
                
                    i++; 
                    let char = tapeString[i];
                    i++; 
      
                    i++;
                    
                    const div = document.createElement('div');
                    div.className = 'cell head';
                    div.textContent = char;
                    container.appendChild(div);
                } else {
                    const div = document.createElement('div');
                    div.className = 'cell';
                    div.textContent = tapeString[i];
                    container.appendChild(div);
                    i++;
                }
            }
        }

        function renderStep() {
            if (historyData.length === 0) return;

            const stepData = historyData[currentIndex];
            const total = historyData.filter(d => !d.finalizado).length;
            document.getElementById('iter-count').textContent = `${stepData.iteracao} / ${total}`;
            document.getElementById('current-state').textContent = stepData.estado;

            renderTape(stepData.fita1, 'tape1');
            renderTape(stepData.fita2, 'tape2');

           
            const prevState = currentIndex > 0 ? historyData[currentIndex - 1].estado : null;
            diagram.highlight(stepData.estado, prevState);

            document.getElementById('btnPrev').disabled = (currentIndex === 0);
            document.getElementById('btnNext').disabled = (currentIndex === historyData.length - 1);
            
            if (currentIndex === historyData.length - 1 && isPlaying) {
                togglePlay(); 
            }
        }

        function step(direction) {
            currentIndex += direction;
            if (currentIndex < 0) currentIndex = 0;
            if (currentIndex >= historyData.length) currentIndex = historyData.length - 1;
            renderStep();
        }

        function togglePlay() {
            const btnPlay = document.getElementById('btnPlay');
            
            if (isPlaying) {
                clearInterval(playInterval);
                isPlaying = false;
                btnPlay.textContent = 'Reproduzir';
            } else {
                if (currentIndex === historyData.length - 1) {
                    currentIndex = 0;
                }
                isPlaying = true;
                btnPlay.textContent = 'Pausar';
                
                const speed = document.getElementById('speed').value;
                playInterval = setInterval(() => {
                    step(1);
                }, speed);
            }
        }

  
        document.getElementById('speed').addEventListener('input', function(e) {
            document.getElementById('speed-val').textContent = e.target.value + ' ms';
            if (isPlaying) {
                clearInterval(playInterval);
                playInterval = setInterval(() => {
                    step(1);
                }, e.target.value);
            }
        });

        adicionarLinhaTransicao();
