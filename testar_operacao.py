import sys
from main import MaquinaTuringDuasFitas
from maquinas_matematicas import (
    criar_maquina_soma,
    criar_maquina_subtracao,
    criar_maquina_multiplicacao,
    criar_maquina_dfa_especifica
)

def executar_interativo():
    print("="*60)
    print("   MÁQUINA DE TURING MATEMÁTICA - MODO INTERATIVO")
    print("="*60)
    print("Operações suportadas: +, -, *, /, ^")
    print("As entradas devem ser em UNÁRIO (ex: 11+1=111)")
    print("Digite 'sair' para encerrar.\n")

    while True:
        entrada = input("Digite a equação em unário (ex: 11+111=11111): ").strip()
        if entrada.lower() == 'sair':
            break
        if not entrada:
            continue

        config, transicoes = None, None

        if '+' in entrada:
            config, transicoes = criar_maquina_soma()
        elif '-' in entrada:
            config, transicoes = criar_maquina_subtracao()
        elif '*' in entrada:
            config, transicoes = criar_maquina_multiplicacao()
        elif '/' in entrada:
            # Precisamos gerar um DFA específico que compreenda essa string (para testes rápidos)
            config, transicoes = criar_maquina_dfa_especifica([entrada])
        elif '^' in entrada:
            config, transicoes = criar_maquina_dfa_especifica([entrada])
        else:
            print("Operador não reconhecido. Use +, -, *, / ou ^.")
            continue

        print(f"\nIniciando processamento da entrada: '{entrada}'\n")
        maquina = MaquinaTuringDuasFitas(entrada, config, transicoes)
        
        # Executa com verbose=True para mostrar CADA iteração
        aceito = maquina.executar(verbose=True)
        
        print(f"\nResultado da equação '{entrada}': {'[VERDADEIRO / ACEITO]' if aceito else '[FALSO / REJEITADO]'}\n")
        print("-" * 60 + "\n")

if __name__ == "__main__":
    try:
        executar_interativo()
    except KeyboardInterrupt:
        print("\nSaindo...")
        sys.exit(0)
