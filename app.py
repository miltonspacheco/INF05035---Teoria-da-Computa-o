from flask import Flask, request, jsonify, render_template, stream_with_context, Response
from main import MaquinaTuringDuasFitas, Configuracao, Transicao
from flask_cors import CORS
import json
import time

app = Flask(__name__)
CORS(app)

@app.route('/')
def index():
    return render_template('index.html')

@app.route('/api/run', methods=['POST'])
def run_maquina_de_touring():
    data = request.json
    if not data or 'entrada' not in data or 'configuracao' not in data or 'transicoes' not in data:
        return jsonify({"error": "Payload inválido. Certifique-se de enviar 'entrada', 'configuracao' e 'transicoes'."}), 400

    entrada = data['entrada']
    config_data = data['configuracao']
    transicoes_data = data['transicoes']
    
    try:
        config = Configuracao(
            simbolo_inicial=config_data.get('simbolo_inicial', '>'),
            simbolo_branco=config_data.get('simbolo_branco', '_'),
            alfabeto_entrada=set(config_data.get('alfabeto_entrada', [])),
            alfabeto_auxiliar=set(config_data.get('alfabeto_auxiliar', [])),
            estado_inicial=config_data.get('estado_inicial', 'q0'),
            estado_aceitacao=config_data.get('estado_aceitacao', 'q_aceita'),
            estado_rejeicao=config_data.get('estado_rejeicao', 'q_rejeita')
        )
        
        transicoes = []
        for t in transicoes_data:
            transicoes.append(Transicao(
                estado_origem=t['estado_origem'],
                simbolos_lidos=tuple(t['simbolos_lidos']),
                simbolos_escritos=tuple(t['simbolos_escritos']),
                direcoes=tuple(t['direcoes']),
                estado_destino=t['estado_destino']
            ))
            
    except Exception as e:
        return jsonify({"erro": f"Erro ao instanciar os objetos de construção e transição: {str(e)}"}), 400

    espera_ms = data.get('espera_ms', 0)

    def generate_steps():
        maquina = MaquinaTuringDuasFitas(entrada, config, transicoes)
        iteracao = 0
        MAX_ITERATIONS = 5000
        
        while True:
            f1_max = max(maquina.fitas[0].celulas.keys()) if maquina.fitas[0].celulas else 0
            f2_max = max(maquina.fitas[1].celulas.keys()) if maquina.fitas[1].celulas else 0
            
            str_f1 = "".join([f"[{maquina.fitas[0].celulas[i]}]" if i == maquina.fitas[0].posicao else maquina.fitas[0].celulas[i] for i in range(f1_max + 1)])
            str_f2 = "".join([f"[{maquina.fitas[1].celulas[i]}]" if i == maquina.fitas[1].posicao else maquina.fitas[1].celulas[i] for i in range(f2_max + 1)])
            
            yield json.dumps({
                "iteracao": iteracao,
                "estado": maquina.estado_atual,
                "fita1": str_f1,
                "fita2": str_f2
            }) + "\n"
            
            if espera_ms > 0:
                time.sleep(espera_ms / 1000.0)
            
            if not maquina.passo(verbose=False, iteracao=iteracao):
                break
                
            iteracao += 1
            if iteracao > MAX_ITERATIONS:
                yield json.dumps({"erro": "A execução excedeu o limite máximo de iterações."}) + "\n"
                return

        f1_max = max(maquina.fitas[0].celulas.keys()) if maquina.fitas[0].celulas else 0
        f2_max = max(maquina.fitas[1].celulas.keys()) if maquina.fitas[1].celulas else 0
        str_f1 = "".join([f"[{maquina.fitas[0].celulas[i]}]" if i == maquina.fitas[0].posicao else maquina.fitas[0].celulas[i] for i in range(f1_max + 1)])
        str_f2 = "".join([f"[{maquina.fitas[1].celulas[i]}]" if i == maquina.fitas[1].posicao else maquina.fitas[1].celulas[i] for i in range(f2_max + 1)])
        
        aceito = maquina.estado_atual == config.estado_aceitacao
        
        yield json.dumps({
            "iteracao": iteracao,
            "estado": maquina.estado_atual,
            "fita1": str_f1,
            "fita2": str_f2,
            "finalizado": True,
            "aceito": aceito
        }) + "\n"

    return Response(stream_with_context(generate_steps()), mimetype='application/x-ndjson')

if __name__ == '__main__':
    app.run(debug=True, port=5000)
