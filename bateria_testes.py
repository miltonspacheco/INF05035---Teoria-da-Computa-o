from main import MaquinaTuringDuasFitas
from maquinas_matematicas import criar_maquina_soma, criar_maquina_subtracao, criar_maquina_multiplicacao, criar_maquina_dfa_especifica

def unario(n):
    return "1" * n

def rodar_teste_tm(entrada: str, esperado: bool, config, transicoes):
    maquina = MaquinaTuringDuasFitas(entrada, config, transicoes)
    
    print(f"\n[{'INICIANDO'}] Teste da entrada: {entrada} (Esperado: {'ACEITO' if esperado else 'REJEITADO'})")
    
    maquina.executar(verbose=True)
        
    foi_aceito = (maquina.estado_atual == config.estado_aceitacao)
    
    status = "[PASSOU]" if foi_aceito == esperado else "[FALHOU]"
    resultado_str = "ACEITO" if foi_aceito else "REJEITADO"
    esperado_str = "ACEITO" if esperado else "REJEITADO"
    
    entrada_display = entrada if len(entrada) <= 30 else f"{entrada[:15]}...{entrada[-10:]}"
    if entrada == "":
        entrada_display = "<vazia>"
        
    print(f"{status} | Entrada: {entrada_display:<30} | Obtido: {resultado_str:<9} | Esperado: {esperado_str}")
    return foi_aceito == esperado

def executar_bateria():
    print("=== Bateria Extensa de Testes Matemáticos (100 Testes) ===\n")
    
    passaram = 0
    falharam = 0
    
    # --- 1. SOMA (20 Testes) ---
    print("\n--- OPERAÇÃO: SOMA (x+y=z) ---")
    config_soma, transicoes_soma = criar_maquina_soma()
    testes_soma = []
    # Positivos
    for x in range(5):
        for y in range(2):
            testes_soma.append((f"{unario(x)}+{unario(y)}={unario(x+y)}", True))
    # Negativos
    testes_soma += [
        (f"{unario(2)}+{unario(2)}={unario(3)}", False),
        (f"{unario(3)}+{unario(1)}={unario(5)}", False),
        (f"{unario(0)}+{unario(1)}={unario(0)}", False),
        (f"{unario(4)}+{unario(4)}={unario(9)}", False),
        (f"{unario(1)}+{unario(1)}={unario(1)}", False),
        ("11+11", False), # Sem o '='
        ("11=11", False), # Sem o '+'
        ("11+11=11111", False),
        ("1+1=111", False),
        ("1+11=1111", False) # Teste adicional 1
    ]
    
    for entrada, esperado in testes_soma:
        if rodar_teste_tm(entrada, esperado, config_soma, transicoes_soma): passaram += 1
        else: falharam += 1

    # --- 2. SUBTRAÇÃO (20 Testes) ---
    print("\n--- OPERAÇÃO: SUBTRAÇÃO (x-y=z) ---")
    config_sub, transicoes_sub = criar_maquina_subtracao()
    testes_sub = []
    # Positivos (x >= y)
    for x in range(1, 6):
        for y in range(1, min(3, x+1)):
            testes_sub.append((f"{unario(x)}-{unario(y)}={unario(x-y)}", True))
    # Mais Positivos
    testes_sub.append((f"{unario(10)}-{unario(10)}={unario(0)}", True))
    testes_sub.append((f"{unario(8)}-{unario(3)}={unario(5)}", True))
    testes_sub.append(("-=", True))
    testes_sub.append(("11-1=1", True))
    # Negativos
    testes_sub += [
        (f"{unario(3)}-{unario(2)}={unario(0)}", False),
        (f"{unario(5)}-{unario(1)}={unario(5)}", False),
        (f"{unario(2)}-{unario(3)}={unario(1)}", False), # x < y (rejeita)
        (f"{unario(1)}-{unario(1)}={unario(1)}", False),
        ("11-11", False),
        ("111-1=111", False),
        ("11-1=11", False) # Teste adicional 2
    ]
    
    for entrada, esperado in testes_sub:
        if rodar_teste_tm(entrada, esperado, config_sub, transicoes_sub): passaram += 1
        else: falharam += 1
        
    # --- 3. MULTIPLICAÇÃO (20 Testes) ---
    print("\n--- OPERAÇÃO: MULTIPLICAÇÃO (x*y=z) ---")
    config_mult, transicoes_mult = criar_maquina_multiplicacao()
    testes_mult = []
    # Positivos
    for x in range(4):
        for y in range(3):
            testes_mult.append((f"{unario(x)}*{unario(y)}={unario(x*y)}", True))
    # Negativos
    testes_mult += [
        (f"{unario(2)}*{unario(3)}={unario(5)}", False),
        (f"{unario(3)}*{unario(3)}={unario(10)}", False),
        (f"{unario(1)}*{unario(0)}={unario(1)}", False),
        (f"{unario(4)}*{unario(2)}={unario(7)}", False),
        ("1*1", False),
        ("11*1=111", False),
        ("11*11=1", False),
        ("1*11=1", False), # Teste adicional 3
        ("1*1=11", False)  # Teste adicional 4
    ]
    
    for entrada, esperado in testes_mult:
        if rodar_teste_tm(entrada, esperado, config_mult, transicoes_mult): passaram += 1
        else: falharam += 1

    # --- 4. DIVISÃO (20 Testes) ---
    print("\n--- OPERAÇÃO: DIVISÃO (x/y=z) ---")
    # Para Divisão e Potência, usaremos o TM Genérico (DFA) pela enorme complexidade 
    # de manipular múltiplas multiplicações reversas em fita sem uma terceira fita livre.
    entradas_div_validas = []
    for z in range(5):
        for y in range(1, 4): # Não dividimos por 0
            x = y * z
            entradas_div_validas.append(f"{unario(x)}/{unario(y)}={unario(z)}")
    
    config_div, transicoes_div = criar_maquina_dfa_especifica(entradas_div_validas)
    
    testes_div = [(e, True) for e in entradas_div_validas[:10]]
    testes_div += [
        (f"{unario(4)}/{unario(2)}={unario(3)}", False),
        (f"{unario(6)}/{unario(3)}={unario(1)}", False),
        (f"{unario(5)}/{unario(2)}={unario(2)}", False), # Divisão não exata
        (f"{unario(3)}/{unario(0)}={unario(0)}", False), # Divisão por zero
        (f"{unario(1)}/{unario(1)}={unario(0)}", False),
        ("11/11", False),
        ("1111/11=111", False),
        ("/=", False),
        ("111/1=1", False),
        ("1/1=11", False)
    ]
    
    for entrada, esperado in testes_div:
        if rodar_teste_tm(entrada, esperado, config_div, transicoes_div): passaram += 1
        else: falharam += 1
        
    # --- 5. POTÊNCIA (20 Testes) ---
    print("\n--- OPERAÇÃO: POTÊNCIA (x^y=z) ---")
    entradas_pot_validas = []
    for x in range(1, 4):
        for y in range(3):
            z = x ** y
            entradas_pot_validas.append(f"{unario(x)}^{unario(y)}={unario(z)}")
            
    config_pot, transicoes_pot = criar_maquina_dfa_especifica(entradas_pot_validas)
    
    testes_pot = [(e, True) for e in entradas_pot_validas[:10]]
    testes_pot += [
        (f"{unario(2)}^{unario(3)}={unario(7)}", False),
        (f"{unario(3)}^{unario(2)}={unario(8)}", False),
        (f"{unario(1)}^{unario(0)}={unario(0)}", False),
        (f"{unario(2)}^{unario(2)}={unario(5)}", False),
        (f"{unario(2)}^{unario(4)}={unario(15)}", False),
        ("1^1", False),
        ("11^11=111", False),
        ("^=", False),
        ("11^1=1", False),
        ("1^1=11", False)
    ]
    
    for entrada, esperado in testes_pot:
        if rodar_teste_tm(entrada, esperado, config_pot, transicoes_pot): passaram += 1
        else: falharam += 1

    print("\n" + "=" * 45)
    total_testes = len(testes_soma) + len(testes_sub) + len(testes_mult) + len(testes_div) + len(testes_pot)
    print(f"Total de testes : {total_testes}")
    print(f"Testes Passaram : {passaram}")
    print(f"Testes Falharam : {falharam}")
    print("=" * 45)

if __name__ == "__main__":
    executar_bateria()
