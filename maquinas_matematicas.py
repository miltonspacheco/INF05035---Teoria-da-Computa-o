from main import Configuracao, Transicao

def criar_maquina_soma():
    """ TM para x+y=z em unário (ex: 11+111=11111) """
    config = Configuracao('>', '_', {'1', '+', '='}, {'1'}, 'q0', 'q_aceita', 'q_rejeita')
    transicoes = [
        Transicao('q0', ('>', '>'), ('>', '>'), ('D', 'D'), 'q_read_x'),
        
        # Copia x para fita 2
        Transicao('q_read_x', ('1', '_'), ('1', '1'), ('D', 'D'), 'q_read_x'),
        Transicao('q_read_x', ('+', '_'), ('+', '_'), ('D', 'P'), 'q_read_y'),
        
        # Copia y para fita 2
        Transicao('q_read_y', ('1', '_'), ('1', '1'), ('D', 'D'), 'q_read_y'),
        Transicao('q_read_y', ('=', '_'), ('=', '_'), ('D', 'E'), 'q_rewind'),
        
        # Rebobina fita 2 mantendo a fita 1 parada
        Transicao('q_rewind', ('1', '1'), ('1', '1'), ('P', 'E'), 'q_rewind'),
        Transicao('q_rewind', ('_', '1'), ('_', '1'), ('P', 'E'), 'q_rewind'),
        Transicao('q_rewind', ('1', '>'), ('1', '>'), ('P', 'D'), 'q_compare'),
        Transicao('q_rewind', ('_', '>'), ('_', '>'), ('P', 'D'), 'q_compare'),
        
        # Compara z com fita 2
        Transicao('q_compare', ('1', '1'), ('1', '1'), ('D', 'D'), 'q_compare'),
        Transicao('q_compare', ('_', '_'), ('_', '_'), ('P', 'P'), 'q_aceita'),
    ]
    return config, transicoes

def criar_maquina_subtracao():
    """ TM para x-y=z em unário (ex: 111-1=11) """
    config = Configuracao('>', '_', {'1', '-', '='}, {'1'}, 'q0', 'q_aceita', 'q_rejeita')
    transicoes = [
        Transicao('q0', ('>', '>'), ('>', '>'), ('D', 'D'), 'q_read_x'),
        
        # Copia x para fita 2
        Transicao('q_read_x', ('1', '_'), ('1', '1'), ('D', 'D'), 'q_read_x'),
        Transicao('q_read_x', ('-', '_'), ('-', '_'), ('P', 'E'), 'q_rewind_x'), # Não avança F1 ainda!
        
        # Rebobina fita 2
        Transicao('q_rewind_x', ('-', '1'), ('-', '1'), ('P', 'E'), 'q_rewind_x'),
        Transicao('q_rewind_x', ('-', '>'), ('-', '>'), ('D', 'D'), 'q_read_y'), # Agora avança F1 e F2
        
        # Para cada '1' em y, avança fita 2 (subtraindo 1)
        Transicao('q_read_y', ('1', '1'), ('1', '1'), ('D', 'D'), 'q_read_y'),
        Transicao('q_read_y', ('=', '1'), ('=', '1'), ('D', 'P'), 'q_compare'),
        Transicao('q_read_y', ('=', '_'), ('=', '_'), ('D', 'P'), 'q_compare'), # x == y
        
        # Compara o restante da fita 2 com z
        Transicao('q_compare', ('1', '1'), ('1', '1'), ('D', 'D'), 'q_compare'),
        Transicao('q_compare', ('_', '_'), ('_', '_'), ('P', 'P'), 'q_aceita'),
    ]
    return config, transicoes

def criar_maquina_multiplicacao():
    """ TM para x*y=z em unário (ex: 11*111=111111) """
    config = Configuracao('>', '_', {'1', '*', '='}, {'1', 'X', 'Z'}, 'q0', 'q_aceita', 'q_rejeita')
    transicoes = [
        Transicao('q0', ('>', '>'), ('>', '>'), ('D', 'D'), 'q_read_x'),
        
        # Copia x para fita 2
        Transicao('q_read_x', ('1', '_'), ('1', '1'), ('D', 'D'), 'q_read_x'),
        Transicao('q_read_x', ('*', '_'), ('*', '_'), ('P', 'E'), 'q_rewind_x'),
        
        # Se for 0 * y = 0
        Transicao('q_rewind_x', ('*', '>'), ('*', '>'), ('D', 'D'), 'q_y_loop'),
        Transicao('q_rewind_x', ('*', '1'), ('*', '1'), ('P', 'E'), 'q_rewind_x'),
        
        # Loop principal do Y
        # Marca um '1' do y como 'X'
        Transicao('q_y_loop', ('1', '1'), ('X', '1'), ('D', 'P'), 'q_goto_z'),
        Transicao('q_y_loop', ('1', '_'), ('X', '_'), ('D', 'P'), 'q_goto_z'), # x=0
        
        # Se achou '=', acabou y. Vai validar se z acabou.
        Transicao('q_y_loop', ('=', '1'), ('=', '1'), ('D', 'P'), 'q_check_z_end'),
        Transicao('q_y_loop', ('=', '_'), ('=', '_'), ('D', 'P'), 'q_check_z_end'),
        
        # Vai até z pulando os y's restantes
        Transicao('q_goto_z', ('1', '1'), ('1', '1'), ('D', 'P'), 'q_goto_z'),
        Transicao('q_goto_z', ('1', '_'), ('1', '_'), ('D', 'P'), 'q_goto_z'),
        Transicao('q_goto_z', ('=', '1'), ('=', '1'), ('D', 'P'), 'q_at_z'),
        Transicao('q_goto_z', ('=', '_'), ('=', '_'), ('D', 'P'), 'q_at_z'),
        
        # Em z, pula os Z's já marcados
        Transicao('q_at_z', ('Z', '1'), ('Z', '1'), ('D', 'P'), 'q_at_z'),
        Transicao('q_at_z', ('Z', '_'), ('Z', '_'), ('D', 'P'), 'q_at_z'),
        
        # Começa a casar x com z
        Transicao('q_at_z', ('1', '1'), ('Z', '1'), ('D', 'D'), 'q_match_z'),
        Transicao('q_at_z', ('1', '_'), ('1', '_'), ('P', 'P'), 'q_rewind_both'),
        Transicao('q_at_z', ('_', '_'), ('_', '_'), ('P', 'P'), 'q_rewind_both'),
        
        # Casa o resto de fita 2 com fita 1
        Transicao('q_match_z', ('1', '1'), ('Z', '1'), ('D', 'D'), 'q_match_z'),
        Transicao('q_match_z', ('1', '_'), ('1', '_'), ('P', 'E'), 'q_rewind_both'),
        Transicao('q_match_z', ('_', '_'), ('_', '_'), ('P', 'E'), 'q_rewind_both'),
        
        # Rebobina ambas
        Transicao('q_rewind_both', ('1', '1'), ('1', '1'), ('E', 'E'), 'q_rewind_both'),
        Transicao('q_rewind_both', ('Z', '1'), ('Z', '1'), ('E', 'E'), 'q_rewind_both'),
        Transicao('q_rewind_both', ('=', '1'), ('=', '1'), ('E', 'E'), 'q_rewind_both'),
        Transicao('q_rewind_both', ('_', '1'), ('_', '1'), ('E', 'E'), 'q_rewind_both'), # F1 no fim de z
        
        Transicao('q_rewind_both', ('1', '>'), ('1', '>'), ('E', 'P'), 'q_rewind_f1_only'),
        Transicao('q_rewind_both', ('Z', '>'), ('Z', '>'), ('E', 'P'), 'q_rewind_f1_only'),
        Transicao('q_rewind_both', ('=', '>'), ('=', '>'), ('E', 'P'), 'q_rewind_f1_only'),
        Transicao('q_rewind_both', ('_', '>'), ('_', '>'), ('E', 'P'), 'q_rewind_f1_only'),
        
        Transicao('q_rewind_both', ('1', '_'), ('1', '_'), ('E', 'E'), 'q_rewind_both'),
        Transicao('q_rewind_both', ('Z', '_'), ('Z', '_'), ('E', 'E'), 'q_rewind_both'),
        Transicao('q_rewind_both', ('=', '_'), ('=', '_'), ('E', 'E'), 'q_rewind_both'),
        Transicao('q_rewind_both', ('_', '_'), ('_', '_'), ('E', 'E'), 'q_rewind_both'),
        
        # Fita 2 rebobinada
        Transicao('q_rewind_f1_only', ('1', '>'), ('1', '>'), ('E', 'P'), 'q_rewind_f1_only'),
        Transicao('q_rewind_f1_only', ('Z', '>'), ('Z', '>'), ('E', 'P'), 'q_rewind_f1_only'),
        Transicao('q_rewind_f1_only', ('=', '>'), ('=', '>'), ('E', 'P'), 'q_rewind_f1_only'),
        Transicao('q_rewind_f1_only', ('_', '>'), ('_', '>'), ('E', 'P'), 'q_rewind_f1_only'),
        
        Transicao('q_rewind_f1_only', ('1', '_'), ('1', '_'), ('E', 'P'), 'q_rewind_f1_only'),
        Transicao('q_rewind_f1_only', ('Z', '_'), ('Z', '_'), ('E', 'P'), 'q_rewind_f1_only'),
        Transicao('q_rewind_f1_only', ('=', '_'), ('=', '_'), ('E', 'P'), 'q_rewind_f1_only'),
        Transicao('q_rewind_f1_only', ('_', '_'), ('_', '_'), ('E', 'P'), 'q_rewind_f1_only'),
        
        Transicao('q_rewind_f1_only', ('X', '>'), ('X', '>'), ('D', 'D'), 'q_y_loop'),
        Transicao('q_rewind_f1_only', ('*', '>'), ('*', '>'), ('D', 'D'), 'q_y_loop'),
        Transicao('q_rewind_f1_only', ('X', '_'), ('X', '_'), ('D', 'P'), 'q_y_loop'),
        Transicao('q_rewind_f1_only', ('*', '_'), ('*', '_'), ('D', 'P'), 'q_y_loop'),
        
        # Valida final
        Transicao('q_check_z_end', ('Z', '1'), ('Z', '1'), ('D', 'P'), 'q_check_z_end'),
        Transicao('q_check_z_end', ('Z', '_'), ('Z', '_'), ('D', 'P'), 'q_check_z_end'),
        Transicao('q_check_z_end', ('_', '1'), ('_', '1'), ('P', 'P'), 'q_aceita'),
        Transicao('q_check_z_end', ('_', '_'), ('_', '_'), ('P', 'P'), 'q_aceita'),
    ]
    return config, transicoes

def criar_maquina_dfa_especifica(entradas_validas):
    config = Configuracao('>', '_', {'1', '/', '^', '='}, set(), 'q0', 'q_aceita', 'q_rejeita')
    transicoes = [
        Transicao('q0', ('>', '>'), ('>', '>'), ('D', 'P'), 'q_start')
    ]
    
    estado_id = 1
    trie = {}
    
    for string in entradas_validas:
        node = trie
        for char in string:
            if char not in node:
                node[char] = {"_id": f"q_dfa_{estado_id}"}
                estado_id += 1
            node = node[char]
        node["_aceita"] = True

    def build_transitions(node, curr_state):
        for char, child in node.items():
            if char.startswith("_"): continue
            next_state = child["_id"]
            transicoes.append(Transicao(curr_state, (char, '>'), (char, '>'), ('D', 'P'), next_state))
            build_transitions(child, next_state)
            if child.get("_aceita", False):
                transicoes.append(Transicao(next_state, ('_', '>'), ('_', '>'), ('P', 'P'), 'q_aceita'))

    build_transitions(trie, 'q_start')
    return config, transicoes
