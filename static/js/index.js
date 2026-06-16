let historyData = [];
let currentIndex = 0;
let isPlaying = false;
let playInterval = null;

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
                    
                    // Manter a última parte que pode estar incompleta no buffer
                    buffer = lines.pop();

                    for (const line of lines) {
                        if (line.trim() === '') continue;
                        const data = JSON.parse(line);
                        
                        if (data.erro) {
                            alert('Erro: ' + data.erro);
                            break;
                        }

                        historyData.push(data);
                        
                        // Desenhar imediatamente o passo ao vivo na tela
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
                        
                        // Aguardar baseado no slider para ditar a velocidade do streaming visualmente
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
            
            // A string vem no formato: _11[1]1_
            // Vamos fazer parse manual.
            let i = 0;
            while (i < tapeString.length) {
                if (tapeString[i] === '[') {
                    // head element
                    i++; // skip [
                    let char = tapeString[i];
                    i++; // skip char
                    // skip ]
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
            document.getElementById('iter-count').textContent = `${stepData.iteracao} / ${historyData.length - 1}`;
            document.getElementById('current-state').textContent = stepData.estado;

            renderTape(stepData.fita1, 'tape1');
            renderTape(stepData.fita2, 'tape2');

            document.getElementById('btnPrev').disabled = (currentIndex === 0);
            document.getElementById('btnNext').disabled = (currentIndex === historyData.length - 1);
            
            if (currentIndex === historyData.length - 1 && isPlaying) {
                togglePlay(); // stop automatically
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
                    currentIndex = 0; // restart if at the end
                }
                isPlaying = true;
                btnPlay.textContent = 'Pausar';
                
                const speed = document.getElementById('speed').value;
                playInterval = setInterval(() => {
                    step(1);
                }, speed);
            }
        }

        // Update speed dynamically
        document.getElementById('speed').addEventListener('input', function(e) {
            if (isPlaying) {
                clearInterval(playInterval);
                playInterval = setInterval(() => {
                    step(1);
                }, e.target.value);
            }
        });

        adicionarLinhaTransicao();
