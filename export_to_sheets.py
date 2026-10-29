#!/usr/bin/env python3
"""
9 Kings - Script de Automação de Exportação para o Google Sheets
Desenvolvido para automatizar a extração completa do jogo 9 Kings (Sad Socket / Hooded Horse)
diretamente para o Google Drive e Google Sheets.

Suporta:
- 4 Níveis de Dificuldade: Fácil, Médio, Difícil e Hard Master.
- 9 Reis com arquétipos, habilidades reais, baralhos iniciais e sinergias.
- Catálogo de Cartas (Unidades, Edifícios, Feitiços e Relíquias).
- Simulador de Batalhas em lote para balanceamento ('muitas vezes').
- Envio direto para o Google Sheets via API REST (Google Sheets v4) ou exportação CSV/JSON.

Uso:
  python3 export_to_sheets.py --help
  python3 export_to_sheets.py --simular 20 --dificuldade hard_master
  python3 export_to_sheets.py --token "SEU_ACCESS_TOKEN"
  python3 export_to_sheets.py --exportar-csv
"""

import sys
import os
import json
import csv
import argparse
import random
import urllib.request
import urllib.error
from datetime import datetime

# ==============================================================================
# DADOS DO JOGO (9 KINGS - SAD SOCKET / HOODED HORSE)
# ==============================================================================

STEAM_METADATA = {
    "title": "9 Kings",
    "developer": "Sad Socket",
    "publisher": "Hooded Horse, Sidekick Publishing",
    "releaseDate": "23/mai./2025",
    "earlyAccessExitDate": "12/nov./2026",
    "priceBRL": 39.99,
    "reviewsSummary": {
        "overall": "Muito positivas (345)",
        "ptBr": "Extremamente positivas (3.853)",
    },
    "genres": ["RPG", "Estratégia", "Acesso Antecipado", "Roguelike", "Construção de Cidades"],
    "tags": [
        "Estratégia", "RPG", "Batalha Automática", "Roguelike", "Cartas",
        "Construtor de Reinos", "Gestão", "Pixel Art", "Fantasia Medieval",
        "Combos Caóticos", "Multijogador Assíncrono"
    ],
    "languages": "30 idiomas (Português do Brasil com interface e legendas)",
    "steamUrl": "https://store.steampowered.com/app/11160348/9_Kings/"
}

DIFFICULTIES = {
    "facil": {
        "id": "facil",
        "name": "Fácil (Novato dos Reinos)",
        "tag": "Fácil",
        "description": "Inimigos moderados, economia generosa e ondas previsíveis.",
        "enemyHealthMultiplier": 0.75,
        "enemyDamageMultiplier": 0.70,
        "waveCount": 8,
        "startingGold": 250,
        "bossRounds": [4, 8],
        "chaosFactor": 0.05,
        "rewardsMultiplier": 1.0,
    },
    "medio": {
        "id": "medio",
        "name": "Médio (Conquistador Real)",
        "tag": "Médio",
        "description": "A experiência equilibrada padrão do 9 Kings.",
        "enemyHealthMultiplier": 1.0,
        "enemyDamageMultiplier": 1.0,
        "waveCount": 12,
        "startingGold": 175,
        "bossRounds": [4, 8, 12],
        "chaosFactor": 0.15,
        "rewardsMultiplier": 1.5,
    },
    "dificil": {
        "id": "dificil",
        "name": "Difícil (Cerco dos 9 Reis)",
        "tag": "Difícil",
        "description": "Exércitos rivais usam feitiços agressivos e bombardeiros.",
        "enemyHealthMultiplier": 1.50,
        "enemyDamageMultiplier": 1.45,
        "waveCount": 16,
        "startingGold": 120,
        "bossRounds": [4, 8, 12, 16],
        "chaosFactor": 0.35,
        "rewardsMultiplier": 2.2,
    },
    "hard_master": {
        "id": "hard_master",
        "name": "Hard Master (Soberano Supremo)",
        "tag": "Hard Master",
        "description": "Nível extremo para veteranos. Inimigos atacam em hordas caóticas e chefes duplos.",
        "enemyHealthMultiplier": 2.30,
        "enemyDamageMultiplier": 2.20,
        "waveCount": 20,
        "startingGold": 80,
        "bossRounds": [3, 6, 10, 15, 20],
        "chaosFactor": 0.65,
        "rewardsMultiplier": 3.5,
    },
}

NINE_KINGS = [
    {
        "name": "Rei dos Cavaleiros",
        "epithet": "O Baluarte Inabalável",
        "realm": "Castelo de Valência",
        "description": "Focado em armaduras impenetráveis, muralhas defensivas e cavalaria pesada.",
        "ability": "Muralha de Ferro (40% redução de dano por 6s)",
        "cooldown": 25,
        "passive": "+25% de Armadura para tropas corpo-a-corpo e regeneração da Capital.",
        "startingDeck": "Cavaleiro de Ferro; Escudeiro da Guarda; Quartel; Bênção de Aço",
        "strength": "Rei dos Diabretes",
        "weakness": "Rei do Fogo"
    },
    {
        "name": "Rei da Feitiçaria",
        "epithet": "O Arquimago do Prisma",
        "realm": "Torre Arcana do Éter",
        "description": "Comanda magos poderosos porém frágeis. Destrói frentes inteiras com tempestades arcanas.",
        "ability": "Tempestade de Mana (Dano massivo em área e atordoamento de 2.5s)",
        "cooldown": 22,
        "passive": "+30% de Poder Mágico e +1 de regeneração de Mana a cada 3s.",
        "startingDeck": "Mago Arcano; Aprendiz de Feiticeiro; Torre de Cristal; Orbe de Chamas",
        "strength": "Rei da Pedra",
        "weakness": "Rei do Tempo"
    },
    {
        "name": "Rei dos Mortos",
        "epithet": "O Senhor da Cripta",
        "realm": "Ossuário Sombrio",
        "description": "Utiliza magia negra e enxames infinitos de esqueletos.",
        "ability": "Colheita de Almas (Ressuscita até 8 unidades caídas na batalha)",
        "cooldown": 20,
        "passive": "Inimigos abatidos têm 35% de chance de erguer um Esqueleto aliado.",
        "startingDeck": "Esqueleto Lanceiro; Bruxo da Peste; Mausoléu Amaldiçoado; Praga",
        "strength": "Rei da Cobiça",
        "weakness": "Rei da Feitiçaria"
    },
    {
        "name": "Rei da Floresta",
        "epithet": "A Voz do Bosque Primordial",
        "realm": "Floresta Viva de Esporos",
        "description": "Comanda cogumelos conscientes, ents titânicos e nuvens tóxicas de esporos.",
        "ability": "Florescimento Tóxico (Cura aliados e envenena todos os inimigos)",
        "cooldown": 24,
        "passive": "Todas as unidades regeneram 2.5% de vida máxima por segundo fora de combate.",
        "startingDeck": "Cogumelo Consciente; Guardião Ent; Bosque Sagrado; Esporos",
        "strength": "Rei dos Cavaleiros",
        "weakness": "Rei do Fogo"
    },
    {
        "name": "Rei da Cobiça",
        "epithet": "O Barão do Ouro Negro",
        "realm": "Cofre Dourado de Midas",
        "description": "Recruta mercenários de elite caros e usa o poder do suborno.",
        "ability": "Chuva de Florins (Gera 150 ouro e +50% velocidade aos mercenários)",
        "cooldown": 30,
        "passive": "Ganha +2 de ouro por inimigo derrotado e 10% de juros por rodada.",
        "startingDeck": "Mercenário Veterano; Besta de Aluguel; Banco; Contrato de Suborno",
        "strength": "Rei da Floresta",
        "weakness": "Rei dos Diabretes"
    },
    {
        "name": "Rei do Fogo & Bombardeiros",
        "epithet": "O Engenheiro do Inferno",
        "realm": "Forja Vulcânica",
        "description": "Especialista em cerco, canhões pesados, morteiros e pirotecnia.",
        "ability": "Salva de Bombardeio (Barragem de 6 morteiros que pulverizam defesas)",
        "cooldown": 26,
        "passive": "Explosões causam 30% de dano adicional a construções e atordoam alvos.",
        "startingDeck": "Bombardeiro Goblin; Artilheiro de Cerco; Forja; Barris de Pólvora",
        "strength": "Rei dos Cavaleiros",
        "weakness": "Rei da Pedra"
    },
    {
        "name": "Rei do Caos & Diabretes",
        "epithet": "O Príncipe do Pandemônio",
        "realm": "Abismo dos Diabretes",
        "description": "Unidades rápidas e descartáveis que se multiplicam freneticamente.",
        "ability": "Frenesi Desvairado (Invoca horda de 6 diabretes furiosos)",
        "cooldown": 18,
        "passive": "Custo de cartas de diabrete reduzido em 1 e 20% de chance de invocação dupla.",
        "startingDeck": "Diabrete Desvairado; Bruxa da Mutação; Fosso de Enxofre; Dado da Fortuna",
        "strength": "Rei da Feitiçaria",
        "weakness": "Rei dos Cavaleiros"
    },
    {
        "name": "Rei da Pedra",
        "epithet": "O Titã de Granito",
        "realm": "Cidadela Rochosa",
        "description": "Focado em construções fortificadas, balistas gigantescas e lançadores de rochas.",
        "ability": "Avalanche de Pedregulhos (Empurra os atacantes para trás com dano de esmagamento)",
        "cooldown": 28,
        "passive": "Construções têm +60% de HP e espinhos que devolvem 15% de dano.",
        "startingDeck": "Lançador de Rocha; Golem de Pedra; Baluarte; Reforço de Muralha",
        "strength": "Rei do Fogo",
        "weakness": "Rei da Feitiçaria"
    },
    {
        "name": "Rei do Tempo",
        "epithet": "O Tecedor do Destino",
        "realm": "Espiráculo Temporal de Cronos",
        "description": "Manipula o fluxo do combate, reduz recargas e congela inimigos.",
        "ability": "Rebobinamento Temporal (Restaura vida da capital e congela inimigos por 3s)",
        "cooldown": 35,
        "passive": "Tempo de recarga de todas as cartas e habilidades reduzido em 20%.",
        "startingDeck": "Crononavegante; Guardião do Relógio; Torre do Pêndulo; Ampulheta",
        "strength": "Rei da Feitiçaria",
        "weakness": "Rei dos Mortos"
    }
]

CARDS_DATA = [
    ["CARD_01", "Cavaleiro de Ferro", "Rei dos Cavaleiros", "UNIDADE", 1, 40, 480, 28, 1.0, 1, "Infantaria pesada com armadura de placas completa", "+10 de Armadura perto de muralhas"],
    ["CARD_02", "Cavalaria de Ruptura", "Rei dos Cavaleiros", "UNIDADE", 2, 85, 650, 62, 1.2, 1, "Atropela a primeira linha com bônus de investida", "Causa 2x de dano nos primeiros 3s"],
    ["CARD_03", "Quartel de Infantaria", "Rei dos Cavaleiros", "EDIFÍCIO", 2, 110, 900, 0, 0.0, 0, "Treina 1 Escudeiro a cada 8 segundos", "+15% vel. movimento a tropas próximas"],
    ["CARD_04", "Bênção da Coroa", "Rei dos Cavaleiros", "FEITIÇO", 1, 50, 0, 0, 0.0, 0, "Escudo de 30% da vida para 3 unidades", "Dura +50% com o Rei dos Cavaleiros"],
    ["CARD_05", "Mago Arcano do Prisma", "Rei da Feitiçaria", "UNIDADE", 1, 65, 220, 54, 0.8, 4, "Conjurador com projéteis arcanos em ricochete", "Reduz resistência mágica do alvo em 5%"],
    ["CARD_06", "Torre de Cristal Prismática", "Rei da Feitiçaria", "EDIFÍCIO", 2, 130, 650, 42, 1.5, 5, "Torre defensiva com raios arcanos contínuos", "+1 cristal de mana por onda vencida"],
    ["CARD_07", "Chuva de Meteoros Arcanos", "Rei da Feitiçaria", "FEITIÇO", 3, 95, 0, 180, 0.0, 6, "Bombardeia área circular destruindo frentes", "Queima o solo causando dano contínuo"],
    ["CARD_08", "Esqueleto Lanceiro", "Rei dos Mortos", "UNIDADE", 1, 25, 160, 22, 1.1, 1, "Infantaria invocada em duplas de baixo custo", "Ao morrer gera poça de cura espectral"],
    ["CARD_09", "Mausoléu Amaldiçoado", "Rei dos Mortos", "EDIFÍCIO", 2, 100, 800, 0, 0.0, 0, "Absorve almas de unidades mortas no campo", "A cada 5 almas convoca um Cavaleiro da Morte"],
    ["CARD_10", "Cogumelo Consciente", "Rei da Floresta", "UNIDADE", 1, 35, 310, 18, 0.9, 2, "Criatura fúngica que espirra esporos tóxicos", "Esporos acumulam até 5x reduzindo velocidade"],
    ["CARD_11", "Ent Ancião Guardião", "Rei da Floresta", "UNIDADE", 3, 140, 1200, 85, 0.5, 1, "Titã de casca grossa e raízes esmagadoras", "Enraíza unidades atacantes por 1.5s"],
    ["CARD_12", "Mercenário da Cia Dourada", "Rei da Cobiça", "UNIDADE", 2, 70, 440, 48, 1.3, 1, "Combatente experiente escalonado por ouro", "+1% de dano para cada 10 de ouro acumulado"],
    ["CARD_13", "Bombardeiro Pirotécnico", "Rei do Fogo & Bombardeiros", "UNIDADE", 2, 60, 260, 68, 0.7, 4, "Granadas explosivas com estilhaços", "Dano dobrado a construções inimigas"],
    ["CARD_14", "Morteiro da Forja do Vulcão", "Rei do Fogo & Bombardeiros", "EDIFÍCIO", 3, 150, 600, 110, 0.4, 7, "Artilharia pesada de longo alcance", "Deixa o solo em brasa por 5 segundos"],
    ["CARD_15", "Diabrete Desvairado", "Rei do Caos & Diabretes", "UNIDADE", 1, 18, 120, 30, 1.6, 1, "Pequeno demônio veloz com mordidas em fúria", "+10% velocidade de ataque por diabrete próximo"],
    ["CARD_16", "Lançador de Rocha da Cidadela", "Rei da Pedra", "UNIDADE", 2, 75, 490, 55, 0.6, 5, "Pedregulhos que rolam e atropelam linhas", "Atordoa alvos atingidos por 1s"],
    ["CARD_17", "Guardião do Relógio de Areia", "Rei do Tempo", "UNIDADE", 2, 65, 380, 40, 1.1, 3, "Manipulador temporal que desacelera projéteis", "Aura que reduz ataque inimigo em 25%"],
]

# ==============================================================================
# MOTOR DE SIMULAÇÃO DE PARTIDAS EM PYTHON
# ==============================================================================

def simular_partida(dificuldade_id: str, rei_escolhido: str = None) -> dict:
    """Executa a simulação completa de uma partida de 9 Kings."""
    diff = DIFFICULTIES.get(dificuldade_id, DIFFICULTIES["medio"])
    
    if not rei_escolhido:
        rei = random.choice(NINE_KINGS)
    else:
        rei = next((k for k in NINE_KINGS if k["name"] == rei_escolhido), NINE_KINGS[0])
        
    adversario = random.choice([k for k in NINE_KINGS if k["name"] != rei["name"]])
    
    waves_total = diff["waveCount"]
    waves_cleared = 0
    capital_hp = 1200
    dano_causado = 0
    dano_sofrido = 0
    ouro = diff["startingGold"]
    cartas_jogadas = 0
    
    for wave in range(1, waves_total + 1):
        is_boss = wave in diff["bossRounds"]
        wave_mult = 1.0 + (wave * 0.12)
        
        enemy_hp = 420 * wave_mult * diff["enemyHealthMultiplier"] * (2.4 if is_boss else 1.0)
        enemy_dps = 38 * wave_mult * diff["enemyDamageMultiplier"] * (1.8 if is_boss else 1.0)
        
        player_dps = 180 * (1.0 + (wave * 0.10))
        tempo_combate = enemy_hp / max(1.0, player_dps)
        
        dano_recebido = int(enemy_dps * tempo_combate * (1.0 + (random.random() * diff["chaosFactor"] * 0.3)))
        capital_hp -= dano_recebido
        dano_causado += int(enemy_hp)
        dano_sofrido += dano_recebido
        ouro += int((50 + (wave * 15)) * diff["rewardsMultiplier"])
        cartas_jogadas += int(2 + (wave * 0.4))
        
        if capital_hp > 0:
            waves_cleared += 1
            capital_hp = min(1200, capital_hp + 150)
        else:
            break
            
    vitoria = waves_cleared == waves_total
    synergy_score = random.randint(75, 98)
    
    return {
        "id": f"RUN-PY-{random.randint(10000, 99999)}",
        "timestamp": datetime.now().strftime("%Y-%m-%d %H:%M:%S"),
        "difficulty": diff["tag"],
        "chosenKing": rei["name"],
        "opponentKing": adversario["name"],
        "wavesCleared": waves_cleared,
        "maxWaves": waves_total,
        "result": "VITÓRIA" if vitoria else "DERROTA",
        "damageDealt": dano_causado,
        "damageTaken": dano_sofrido,
        "gold": ouro,
        "cardsPlayed": cartas_jogadas,
        "durationSeconds": waves_cleared * 19 + random.randint(5, 20),
        "synergyRating": f"{synergy_score}%",
        "notes": f"Partida automatizada em Python ({diff['tag']}). Sobreviveu a {waves_cleared}/{waves_total} ondas."
    }

def simular_lote(dificuldade_id: str, quantidade: int) -> list:
    """Executa múltiplas partidas para gerar estatísticas de balanceamento ('muitas vezes')."""
    print(f"\n[SIMULADOR] Iniciando {quantidade} simulações no nível '{dificuldade_id.upper()}'...")
    runs = []
    vitorias = 0
    for i in range(quantidade):
        run = simular_partida(dificuldade_id)
        runs.append(run)
        if run["result"] == "VITÓRIA":
            vitorias += 1
    win_rate = (vitorias / quantidade) * 100
    print(f"[SIMULADOR] Concluído! Taxa de Vitória: {win_rate:.1f}% ({vitorias}/{quantidade})")
    return runs

# ==============================================================================
# EXPORTAÇÃO LOCAL (CSV & JSON)
# ==============================================================================

def exportar_para_csv(output_dir: str = "./9kings_sheets_export", runs_simuladas: list = None):
    """Gera arquivos CSV prontos para serem importados no Google Drive/Sheets."""
    os.makedirs(output_dir, exist_ok=True)
    print(f"\n[EXPORT] Gerando arquivos CSV em: {output_dir}")
    
    # 1. Resumo do Jogo
    resumo_path = os.path.join(output_dir, "01_resumo_9kings.csv")
    with open(resumo_path, mode="w", newline="", encoding="utf-8-sig") as f:
        writer = csv.writer(f)
        writer.writerow(["CAMPO", "VALOR", "OBSERVAÇÕES STEAM"])
        writer.writerow(["Título Oficial", STEAM_METADATA["title"], "Sad Socket"])
        writer.writerow(["Distribuidora", STEAM_METADATA["publisher"], "Hooded Horse, Sidekick Publishing"])
        writer.writerow(["Lançamento EA", STEAM_METADATA["releaseDate"], "23 de maio de 2025"])
        writer.writerow(["Lançamento v1.0", STEAM_METADATA["earlyAccessExitDate"], "Saída do Acesso Antecipado"])
        writer.writerow(["Preço", f"R$ {STEAM_METADATA['priceBRL']:.2f}", "Preço base Brasil"])
        writer.writerow(["Avaliações em PT-BR", STEAM_METADATA["reviewsSummary"]["ptBr"], "Comunidade Steam Brasil"])
        writer.writerow(["Avaliações Gerais", STEAM_METADATA["reviewsSummary"]["overall"], "Muito Positivas"])
        writer.writerow(["Idiomas", STEAM_METADATA["languages"], "Suporte completo"])
        writer.writerow(["Link Steam", STEAM_METADATA["steamUrl"], "Página da Loja"])
    print(f" -> Criado: {resumo_path}")

    # 2. Os 9 Reis
    reis_path = os.path.join(output_dir, "02_os_9_reis.csv")
    with open(reis_path, mode="w", newline="", encoding="utf-8-sig") as f:
        writer = csv.writer(f)
        writer.writerow([
            "REI", "EPÍTETO", "REINO / SEDE", "DESCRIÇÃO",
            "HABILIDADE REAL", "RECARGA (S)", "BÔNUS PASSIVO",
            "BARALHO INICIAL", "FORTE CONTRA", "FRACO CONTRA"
        ])
        for k in NINE_KINGS:
            writer.writerow([
                k["name"], k["epithet"], k["realm"], k["description"],
                k["ability"], k["cooldown"], k["passive"],
                k["startingDeck"], k["strength"], k["weakness"]
            ])
    print(f" -> Criado: {reis_path}")

    # 3. Base de Cartas
    cartas_path = os.path.join(output_dir, "03_cartas_e_unidades.csv")
    with open(cartas_path, mode="w", newline="", encoding="utf-8-sig") as f:
        writer = csv.writer(f)
        writer.writerow([
            "ID", "NOME", "FACÇÃO / REI", "TIPO", "TIER",
            "CUSTO", "VIDA (HP)", "ATAQUE", "VEL. ATAQUE", "ALCANCE",
            "DESCRIÇÃO", "SINERGIA"
        ])
        for c in CARDS_DATA:
            writer.writerow(c)
    print(f" -> Criado: {cartas_path}")

    # 4. Dificuldades
    diff_path = os.path.join(output_dir, "04_dificuldades_e_balanco.csv")
    with open(diff_path, mode="w", newline="", encoding="utf-8-sig") as f:
        writer = csv.writer(f)
        writer.writerow([
            "CÓDIGO", "NÍVEL", "DESCRIÇÃO", "MULT. HP", "MULT. DANO",
            "TOTAL ONDAS", "OURO INICIAL", "CHEFES", "FATOR CAOS", "MULT. RECOMPENSAS"
        ])
        for d in DIFFICULTIES.values():
            writer.writerow([
                d["id"], d["name"], d["description"],
                f"{int(d['enemyHealthMultiplier'] * 100)}%",
                f"{int(d['enemyDamageMultiplier'] * 100)}%",
                d["waveCount"], d["startingGold"],
                str(d["bossRounds"]), f"{int(d['chaosFactor'] * 100)}%",
                f"{d['rewardsMultiplier']}x"
            ])
    print(f" -> Criado: {diff_path}")

    # 5. Registro de Partidas
    sim_path = os.path.join(output_dir, "05_simulacoes_partidas.csv")
    runs = runs_simuladas or [simular_partida("facil"), simular_partida("medio"), simular_partida("dificil"), simular_partida("hard_master")]
    with open(sim_path, mode="w", newline="", encoding="utf-8-sig") as f:
        writer = csv.writer(f)
        writer.writerow([
            "ID", "DATA / HORA", "DIFICULDADE", "REI", "ADVERSÁRIO",
            "ONDAS CONCLUÍDAS", "TOTAL ONDAS", "RESULTADO", "DANO CAUSADO",
            "DANO SOFRIDO", "OURO", "CARTAS", "DURAÇÃO (S)", "SINERGIA", "NOTAS"
        ])
        for r in runs:
            writer.writerow([
                r["id"], r["timestamp"], r["difficulty"], r["chosenKing"],
                r["opponentKing"], r["wavesCleared"], r["maxWaves"],
                r["result"], r["damageDealt"], r["damageTaken"], r["gold"],
                r["cardsPlayed"], r["durationSeconds"], r["synergyRating"], r["notes"]
            ])
    print(f" -> Criado: {sim_path}")
    print(f"\n[SUCESSO] 5 Tabelas exportadas com sucesso em formato CSV.")

# ==============================================================================
# EXPORTAÇÃO DIRETA PARA GOOGLE SHEETS API (VIA HTTP REST STANDARD PYTHON)
# ==============================================================================

def exportar_para_google_sheets(access_token: str, runs_simuladas: list = None):
    """
    Cria uma nova planilha formatada no Google Sheets via API v4 utilizando o Access Token OAuth.
    Totalmente compatível com Python Standard Library (sem requerer módulos externos).
    """
    print("\n[GOOGLE SHEETS] Conectando à API do Google Sheets v4 com Access Token...")
    
    headers = {
        "Authorization": f"Bearer {access_token.strip()}",
        "Content-Type": "application/json"
    }
    
    sheet_titles = [
        "Resumo do Jogo (9 Kings)",
        "Os 9 Reis & Facções",
        "Cartas & Unidades",
        "Dificuldades & Balanço",
        "Registro de Partidas",
        "Combos & Sinergias"
    ]
    
    spreadsheet_title = f"9 Kings - Dados & Simulações ({datetime.now().strftime('%d/%m/%Y %H:%M')})"
    create_body = {
        "properties": {
            "title": spreadsheet_title,
            "locale": "pt_BR"
        },
        "sheets": [{"properties": {"sheetId": idx, "title": name}} for idx, name in enumerate(sheet_titles)]
    }
    
    req = urllib.request.Request(
        "https://sheets.googleapis.com/v4/spreadsheets",
        data=json.dumps(create_body).encode("utf-8"),
        headers=headers,
        method="POST"
    )
    
    try:
        with urllib.request.urlopen(req) as resp:
            resp_data = json.loads(resp.read().decode("utf-8"))
            spreadsheet_id = resp_data["spreadsheetId"]
            spreadsheet_url = f"https://docs.google.com/spreadsheets/d/{spreadsheet_id}"
            print(f"[GOOGLE SHEETS] Planilha criada com sucesso no Google Drive!")
            print(f" -> Link: {spreadsheet_url}")
            
    except urllib.error.HTTPError as e:
        error_body = e.read().decode("utf-8")
        print(f"[ERRO] Falha ao criar planilha: HTTP {e.code}")
        print(f"Detalhes: {error_body}")
        print("\nDica: Se o token estiver expirado, faça login no aplicativo web ou gere um novo token de acesso.")
        return False
        
    # Preparar lotes de dados
    runs = runs_simuladas or [simular_partida(d) for d in ["facil", "medio", "dificil", "hard_master"] * 2]
    
    tab1_values = [
        ["CAMPO", "VALOR", "OBSERVAÇÕES STEAM"],
        ["Título Oficial", STEAM_METADATA["title"], "Sad Socket"],
        ["Distribuidora", STEAM_METADATA["publisher"], "Hooded Horse, Sidekick Publishing"],
        ["Lançamento EA", STEAM_METADATA["releaseDate"], "23 de maio de 2025"],
        ["Lançamento v1.0", STEAM_METADATA["earlyAccessExitDate"], "Saída do Acesso Antecipado"],
        ["Preço Base (BRL)", f"R$ {STEAM_METADATA['priceBRL']:.2f}", "Brasil"],
        ["Avaliações Steam (PT-BR)", STEAM_METADATA["reviewsSummary"]["ptBr"], "3.853 análises"],
        ["Gêneros", ", ".join(STEAM_METADATA["genres"]), "Roguelike, Construtor de Reinos"],
        ["Marcadores", ", ".join(STEAM_METADATA["tags"]), "Combos caóticos, batalhas automáticas"],
        ["Idiomas", STEAM_METADATA["languages"], "30 idiomas"],
        ["Link Loja Steam", STEAM_METADATA["steamUrl"], "Página oficial"]
    ]
    
    tab2_values = [
        ["REI", "EPÍTETO", "REINO / SEDE", "DESCRIÇÃO", "HABILIDADE REAL", "RECARGA", "PASSIVA", "BARALHO INICIAL", "FORTE CONTRA", "FRACO CONTRA"]
    ] + [
        [k["name"], k["epithet"], k["realm"], k["description"], k["ability"], k["cooldown"], k["passive"], k["startingDeck"], k["strength"], k["weakness"]]
        for k in NINE_KINGS
    ]
    
    tab3_values = [
        ["ID", "NOME", "FACÇÃO / REI", "TIPO", "TIER", "CUSTO", "HP", "ATAQUE", "VEL. ATAQUE", "ALCANCE", "DESCRIÇÃO", "SINERGIA"]
    ] + CARDS_DATA
    
    tab4_values = [
        ["CÓDIGO", "NÍVEL", "DESCRIÇÃO", "MULT. HP", "MULT. DANO", "TOTAL ONDAS", "OURO INICIAL", "CHEFES", "FATOR CAOS", "MULT. RECOMPENSAS"]
    ] + [
        [d["id"], d["name"], d["description"], f"{int(d['enemyHealthMultiplier']*100)}%", f"{int(d['enemyDamageMultiplier']*100)}%", d["waveCount"], d["startingGold"], str(d["bossRounds"]), f"{int(d['chaosFactor']*100)}%", f"{d['rewardsMultiplier']}x"]
        for d in DIFFICULTIES.values()
    ]
    
    tab5_values = [
        ["ID", "DATA / HORA", "DIFICULDADE", "REI", "ADVERSÁRIO", "ONDAS CONCLUÍDAS", "TOTAL ONDAS", "RESULTADO", "DANO CAUSADO", "DANO SOFRIDO", "OURO", "CARTAS", "DURAÇÃO", "SINERGIA", "NOTAS"]
    ] + [
        [r["id"], r["timestamp"], r["difficulty"], r["chosenKing"], r["opponentKing"], r["wavesCleared"], r["maxWaves"], r["result"], r["damageDealt"], r["damageTaken"], r["gold"], r["cardsPlayed"], r["durationSeconds"], r["synergyRating"], r["notes"]]
        for r in runs
    ]
    
    tab6_values = [
        ["COMBO", "REIS COMBINADOS", "CARTAS CHAVE", "POTENCIAL", "GUIA TÁTICO"],
        ["Muralha Explosiva", "Rei dos Cavaleiros + Rei do Fogo", "Muralha de Ferro, Bombardeiro Goblin", "Crítico Alto", "Defende com armadura e pulveriza com artilharia"],
        ["Esporos Arcanos", "Rei da Floresta + Rei da Feitiçaria", "Cogumelo Consciente, Mago Arcano", "Dano Contínuo", "Desacelera com esporos enquanto magos canalizam"],
        ["Enxame Sem Fim", "Rei dos Mortos + Rei do Caos", "Esqueleto Lanceiro, Diabrete Desvairado", "Velocidade Extrema", "Duplicações automáticas e custos quase nulos"],
        ["Mercenários de Pedra", "Rei da Cobiça + Rei da Pedra", "Mercenário da Cia, Lançador de Rocha", "Econômico", "Muralhas seguram enquanto o cofre acumula juros"],
        ["Colapso Temporal", "Rei do Tempo + Rei da Feitiçaria", "Crononavegante, Chuva de Meteoros", "Rajada Mágica", "Acelera recargas para limpar chefes em segundos"]
    ]
    
    append_body = {
        "valueInputOption": "USER_ENTERED",
        "data": [
            {"range": f"'{sheet_titles[0]}'!A1", "values": tab1_values},
            {"range": f"'{sheet_titles[1]}'!A1", "values": tab2_values},
            {"range": f"'{sheet_titles[2]}'!A1", "values": tab3_values},
            {"range": f"'{sheet_titles[3]}'!A1", "values": tab4_values},
            {"range": f"'{sheet_titles[4]}'!A1", "values": tab5_values},
            {"range": f"'{sheet_titles[5]}'!A1", "values": tab6_values},
        ]
    }
    
    append_req = urllib.request.Request(
        f"https://sheets.googleapis.com/v4/spreadsheets/{spreadsheet_id}/values:batchUpdate",
        data=json.dumps(append_body).encode("utf-8"),
        headers=headers,
        method="POST"
    )
    
    try:
        with urllib.request.urlopen(append_req) as resp:
            print("[GOOGLE SHEETS] Todas as 6 abas foram populadas com sucesso!")
            print(f"[GOOGLE SHEETS] Acesse a planilha completa em:\n{spreadsheet_url}\n")
            return True
    except urllib.error.HTTPError as e:
        print(f"[ERRO] Falha ao enviar dados para a planilha: HTTP {e.code}")
        print(e.read().decode("utf-8"))
        return False

# ==============================================================================
# PONTO DE ENTRADA CLI
# ==============================================================================

def main():
    parser = argparse.ArgumentParser(
        description="Automação em Python para Exportação de Dados do jogo 9 Kings para o Google Sheets e Google Drive."
    )
    parser.add_argument("--token", type=str, help="Google OAuth Bearer Access Token para upload direto ao Sheets")
    parser.add_argument("--exportar-csv", action="store_true", help="Gera arquivos CSV locais das 5 bases de dados")
    parser.add_argument("--simular", type=int, default=10, help="Quantidade de partidas simuladas a gerar (padrão: 10)")
    parser.add_argument("--dificuldade", type=str, choices=["facil", "medio", "dificil", "hard_master"], default="medio", help="Nível de dificuldade para as simulações")
    parser.add_argument("--output-dir", type=str, default="./9kings_export", help="Diretório para salvar exportações CSV")
    
    args = parser.parse_args()
    
    print("=" * 70)
    print("👑 9 KINGS - GOOGLE SHEETS & DRIVE EXPORT AUTOMATION (PYTHON) 👑")
    print("=" * 70)
    
    # Executa simulações
    runs = simular_lote(args.dificuldade, args.simular)
    
    # Se token fornecido, envia para Google Sheets
    if args.token:
        exportar_para_google_sheets(args.token, runs)
    else:
        print("\n[INFO] Nenhum token OAuth informado via --token.")
        print("[INFO] Gerando exportação local em CSV pronta para importação no Google Drive...")
        exportar_para_csv(args.output_dir, runs)
        print(f"\n💡 Para exportar diretamente ao Google Sheets, use:")
        print(f"   python3 export_to_sheets.py --token \"SEU_ACCESS_TOKEN\" --simular {args.simular} --dificuldade {args.dificuldade}")

if __name__ == "__main__":
    main()
