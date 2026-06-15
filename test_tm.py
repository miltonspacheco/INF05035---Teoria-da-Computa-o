import sys
from main import Configuracao, Transicao, MaquinaTuringDuasFitas

def imprimir_estado(maquina: MaquinaTuringDuasFitas, passo: int):
    print(f"--- Passo {passo} ---")
    print(f"Estado Atual: {maquina.estado_atual}")
    
    for i, fita in enumerate(maquina.fitas):
        # Encontrar os limites da fita para imprimir
        indices = list(fita.celulas.keys())
        if not indices:
            min_idx, max_idx = 0, 0
        else:
            min_idx = min(min(indices), fita.posicao)
            max_idx = max(max(indices), fita.posicao)
        
        conteudo = ""
        for j in range(min_idx, max_idx + 1):
            simbolo = fita.celulas[j]
            if j == fita.posicao:
                conteudo += f"[{simbolo}]"
            else:
                conteudo += f" {simbolo} "
        
        print(f"Fita {i + 1}: {conteudo}")
    print()

def criar_maquina_exemplo():
    # Exemplo: Máquina que aceita strings com mesmo número de a's e b's (a^n b^n)
    config = Configuracao(
        simbolo_inicial='>', 
        simbolo_branco='_', 
        alfabeto_entrada={'a', 'b'}, 
        alfabeto_auxiliar={'A', 'B'}, 
        estado_inicial='q0', 
        estado_aceitacao='q_aceita', 
        estado_rejeicao='q_rejeita'
    )
    
    transicoes = [
        # q0: Lê o símbolo inicial '>' em AMBAS as fitas e avança as duas.
        Transicao('q0', ('>', '>'), ('>', '>'), ('D', 'D'), 'q1'),
        
        # q1: Logo após o símbolo inicial. Se for branco, é string vazia (aceita).
        Transicao('q1', ('_', '_'), ('_', '_'), ('P', 'P'), 'q_aceita'),
        
        # q1: Se for 'a', escreve 'A' na fita 2 e vai para q_le_a
        Transicao('q1', ('a', '_'), ('a', 'A'), ('D', 'D'), 'q_le_a'),
        
        # q_le_a: Continua lendo 'a's da fita 1 e escrevendo 'A's na fita 2
        Transicao('q_le_a', ('a', '_'), ('a', 'A'), ('D', 'D'), 'q_le_a'),
        
        # q_le_a: Encontrou o primeiro 'b'. Começa a rebobinar a fita 2 para a esquerda.
        Transicao('q_le_a', ('b', '_'), ('b', '_'), ('P', 'E'), 'q2'),
        
        # q2: Rebobina a fita 2, passando por todos os 'A's.
        Transicao('q2', ('b', 'A'), ('b', 'A'), ('P', 'E'), 'q2'),
        
        # q2: Encontrou o símbolo inicial '>' na fita 2! Vai uma casa pra direita e muda pra q3.
        Transicao('q2', ('b', '>'), ('b', '>'), ('P', 'D'), 'q3'),
        
        # q3: Compara 'b' na fita 1 com 'A' na fita 2. Se baterem, avança ambas.
        Transicao('q3', ('b', 'A'), ('b', 'A'), ('D', 'D'), 'q3'),
        
        # q3: Se ambas as fitas terminarem ao mesmo tempo (lendo branco), aceita!
        Transicao('q3', ('_', '_'), ('_', '_'), ('P', 'P'), 'q_aceita'),
        
        # Casos de rejeição explícitos não são estritamente necessários pois a falta de transição
        # já causa rejeição, mas podemos deixá-los para maior clareza caso queiramos travar a fita:
        Transicao('q3', ('_', 'A'), ('_', 'A'), ('P', 'P'), 'q_rejeita'),
        Transicao('q3', ('b', '_'), ('b', '_'), ('P', 'P'), 'q_rejeita'),
    ]
    
    return config, transicoes

def interativo():
    print("=== Testador de Máquina de Turing de Duas Fitas ===")
    print("Por padrão, uma máquina que reconhece a^n b^n foi carregada.")
    print("Modifique a função 'criar_maquina_exemplo()' no código para testar outras máquinas.\n")
    
    entrada = input("Digite a string de entrada (ex: aabb): ")
    config, transicoes = criar_maquina_exemplo()
    
    maquina = MaquinaTuringDuasFitas(entrada, config, transicoes)
    
    passo = 0
    imprimir_estado(maquina, passo)
    
    modo = input("Pressione Enter para rodar passo a passo, ou digite 'T' para rodar tudo até o fim: ").strip().lower()
    
    while maquina.estado_atual not in [config.estado_aceitacao, config.estado_rejeicao]:
        if modo != 't':
            input("Pressione Enter para o próximo passo...")
            
        if not maquina.passo(): # if false, it halted
            break
            
        passo += 1
        imprimir_estado(maquina, passo)
        
    print("--- FIM DA EXECUÇÃO ---")
    if maquina.estado_atual == config.estado_aceitacao:
        print("Resultado Final: ACEITO")
    else:
        print("Resultado Final: REJEITADO")

if __name__ == "__main__":
    interativo()
