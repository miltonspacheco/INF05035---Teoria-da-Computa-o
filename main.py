from collections import defaultdict
from typing import Dict, List, Literal, TypeAlias

DIRECAO =   Literal['E', 'D', 'P']

class Fita:
    def __init__(self, entrada: str, simbolo_branco: str, simbolo_inicio: str):
        self.entrada = entrada
        self.simbolo_branco = simbolo_branco
        self.simbolo_inicio = simbolo_inicio
        self.celulas: defaultdict [int, str] = defaultdict(lambda: simbolo_branco)
        self.celulas[0] = simbolo_inicio
        for i, simbolo in enumerate(entrada):
            self.celulas[1 + i] = simbolo
        self.posicao: int = 0

    def ler (self) -> str:
        return self.celulas[self.posicao]
    
    def escrever (self,simbolo: str) -> None:
        self.celulas[self.posicao] = simbolo

    def mover (self, direcao: DIRECAO) -> None:
        if direcao == 'E':
            if self.posicao > 0:
                self.posicao -= 1
        elif direcao == 'D':
            self.posicao += 1
        elif direcao == 'P':
            pass
        else:
            raise ValueError(f"Direção inválida: {direcao}")

class Transicao:
    def __init__(self, estado_origem: str, simbolos_lidos: tuple [str, str], simbolos_escritos: tuple [str, str], direcoes: tuple [DIRECAO, DIRECAO], estado_destino: str):
        self.estado_origem = estado_origem
        self.simbolos_lidos = simbolos_lidos
        self.simbolos_escritos = simbolos_escritos
        self.direcoes = direcoes
        self.estado_destino = estado_destino



class UnidadeControle:
    def __init__(self, estado_inicial: str, transicoes: List[Transicao]):

        self.estado_inicial = estado_inicial
        self.transicoes = {(t.estado_origem, t.simbolos_lidos): t for t in transicoes}

class Configuracao:
    def __init__ (self, simbolo_inicial: str, simbolo_branco: str, alfabeto_entrada: set[str], alfabeto_auxiliar: set[str], estado_inicial: str, estado_aceitacao: str, estado_rejeicao: str):
        self.simbolo_inicial = simbolo_inicial
        self.simbolo_branco = simbolo_branco
        self.alfabeto_entrada = alfabeto_entrada
        self.alfabeto_auxiliar = alfabeto_auxiliar
        self.estado_inicial = estado_inicial
        self.estado_aceitacao = estado_aceitacao
        self.estado_rejeicao = estado_rejeicao

class MaquinaTuringDuasFitas:
    def __init__(self, entrada, config: Configuracao, transicoes: list [Transicao]):
       self.config = config
       self.fitas = [
           Fita(entrada, config.simbolo_branco, config.simbolo_inicial), 
           Fita("", config.simbolo_branco, config.simbolo_inicial)
       ]
       self.unidade_controle = UnidadeControle(config.estado_inicial, transicoes)
       self.estado_atual = config.estado_inicial

    def imprimir_estado(self, iteracao: int):
        f1_max = max(self.fitas[0].celulas.keys()) if self.fitas[0].celulas else 0
        f2_max = max(self.fitas[1].celulas.keys()) if self.fitas[1].celulas else 0
        
        str_f1 = "".join([f"[{self.fitas[0].celulas[i]}]" if i == self.fitas[0].posicao else self.fitas[0].celulas[i] for i in range(f1_max + 1)])
        str_f2 = "".join([f"[{self.fitas[1].celulas[i]}]" if i == self.fitas[1].posicao else self.fitas[1].celulas[i] for i in range(f2_max + 1)])
        
        print(f"Iteração: {iteracao:<4} | Estado: {self.estado_atual:<12} | Fita 1: {str_f1:<20} | Fita 2: {str_f2}")

    def passo(self, verbose: bool = False, iteracao: int = 0) -> bool:
        if verbose:
            self.imprimir_estado(iteracao)
            
        # Se já estiver em estado de aceitação ou rejeição, a máquina parou
        if self.estado_atual in [self.config.estado_aceitacao, self.config.estado_rejeicao]:
            return False
            
        simbolos_lidos = (self.fitas[0].ler(), self.fitas[1].ler())
        chave_busca = (self.estado_atual, simbolos_lidos)
        transicao = self.unidade_controle.transicoes.get(chave_busca)

        if not transicao:
            self.estado_atual = self.config.estado_rejeicao
            if verbose:
                print(f"-> REJEIÇÃO: Nenhuma transição encontrada para ({self.estado_atual}, {simbolos_lidos})")
                self.imprimir_estado(iteracao + 1)
            return False
        
        self.fitas[0].escrever(transicao.simbolos_escritos[0])
        self.fitas[1].escrever(transicao.simbolos_escritos[1])

        self.fitas[0].mover(transicao.direcoes[0])
        self.fitas[1].mover(transicao.direcoes[1])

        self.estado_atual = transicao.estado_destino
        return True
    
    def executar(self, verbose: bool = False) -> bool:
        iteracao = 0
        while self.passo(verbose=verbose, iteracao=iteracao):
            iteracao += 1
            
        if verbose:
            print(f"\n--- FIM DA EXECUÇÃO ---")
            print(f"Resultado Final: {'ACEITO' if self.estado_atual == self.config.estado_aceitacao else 'REJEITADO'}")
            
        return self.estado_atual == self.config.estado_aceitacao
