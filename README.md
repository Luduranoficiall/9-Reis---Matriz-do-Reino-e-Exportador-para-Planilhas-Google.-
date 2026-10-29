# 9 Kings - Kingdom Matrix & Google Sheets Exporter

> **Descrição para o Repositório:**  
> *Exportador automatizado para Google Sheets e simulador de balanceamento do jogo 9 Kings (Sad Socket / Hooded Horse). Suporte a 4 níveis de dificuldade (Fácil, Médio, Difícil e Hard Master), integração direta com Google Drive via OAuth e script de automação em Python.*

---

## 👑 Visão Geral

Este projeto foi desenvolvido com urgência para extrair, organizar e automatizar a exportação de todos os dados do jogo **9 Kings** (Sad Socket / Hooded Horse) diretamente para o **Google Sheets** no **Google Drive** do usuário.

A aplicação inclui:
1. **Integração Real com Google Drive e Google Sheets:** Criação automatizada de planilhas formatadas com 6 abas detalhadas.
2. **Script de Automação em Python (`export_to_sheets.py`):** Script independente sem dependências externas (Python Standard Library pura), pronto para CLI ou agendamentos cron.
3. **Simulador de Batalhas Roguelike:** Arena jogável a 60fps com simulação de balanceamento em 4 níveis de dificuldade (*Fácil*, *Médio*, *Difícil* e *Hard Master*), com capacidade de rodar lotes de partidas (*"muitas vezes"*).
4. **Base de Dados Completa:** Dados do Steam, informações da versão 1.0 (lançamento previsto em 12/nov./2026), catálogo dos 9 Monarcas, 17+ cartas/unidades, sinergias e histórico de partidas.

---

## 📊 Estrutura da Planilha Exportada no Google Drive

A planilha gerada contém 6 abas estilizadas e formatadas com cabeçalhos em estilo nobre:

| Aba | Nome da Aba | Conteúdo |
|---|---|---|
| **Aba 1** | `Resumo do Jogo (9 Kings)` | Título oficial, Sad Socket, Hooded Horse, preço (R$ 39,99), avaliações PT-BR (3.853 Extremamente Positivas), tags, 30 idiomas, requisitos mínimos. |
| **Aba 2** | `Os 9 Reis & Facções` | Os 9 Reis (Cavaleiros, Feitiçaria, Mortos, Floresta, Cobiça, Fogo, Caos, Pedra, Tempo), habilidades ativas, passivas, fraquezas e baralhos iniciais. |
| **Aba 3** | `Cartas & Unidades` | Tabela com IDs, nomes, arquétipos, tipos (Unidade, Edifício, Feitiço, Relíquia), custos, HP, ATK, velocidade, alcance e sinergias. |
| **Aba 4** | `Dificuldades & Balanço` | Matriz com os 4 níveis (Fácil, Médio, Difícil, Hard Master) com multiplicadores de HP/dano dos inimigos, ouro e ondas. |
| **Aba 5** | `Registro de Partidas` | Histórico de simulações com vitórias, derrotas, dano causado, ouro coletado e taxa de sinergia do baralho. |
| **Aba 6** | `Combos & Sinergias` | Guias de estratégias entre facções e contra-ataques a chefes de cerco. |

---

## 🐍 Script de Automação em Python (`export_to_sheets.py`)

O script Python foi desenvolvido de forma modular e independente, utilizando apenas bibliotecas nativas do Python (`urllib.request`, `json`, `csv`, `argparse`, `random`). Não requer `pip install`.

### Exemplos de Uso:

#### 1. Simular partidas em lote ("muitas vezes") e exportar CSVs locais:
```bash
python3 export_to_sheets.py --simular 25 --dificuldade hard_master --exportar-csv
```

#### 2. Exportação direta para o Google Sheets via OAuth Access Token:
```bash
python3 export_to_sheets.py --token "SEU_GOOGLE_ACCESS_TOKEN" --simular 50 --dificuldade dificil
```

#### 3. Teste rápido no nível Fácil:
```bash
python3 export_to_sheets.py --simular 10 --dificuldade facil
```

#### 4. Parâmetros disponíveis:
- `--token`: Token de acesso OAuth para criação direta no Google Sheets v4.
- `--exportar-csv`: Exporta 5 arquivos CSV no diretório `./9kings_export`.
- `--simular`: Número de partidas simuladas a gerar (ex: 10, 50, 100).
- `--dificuldade`: `facil`, `medio`, `dificil` ou `hard_master`.
- `--output-dir`: Diretório para salvar os CSVs.

---

## ⚔️ Os 4 Níveis de Dificuldade

1. **Fácil (Novato dos Reinos):**
   - 8 Ondas · 250 Ouro Inicial · Inimigos com 75% HP e 70% Dano.
   - Ideal para novos baralhos e testes rápidos de combos.
2. **Médio (Conquistador Real):**
   - 12 Ondas · 175 Ouro Inicial · Inimigos com 100% HP e 100% Dano.
   - A experiência padrão do jogo no Steam.
3. **Difícil (Cerco dos 9 Reis):**
   - 16 Ondas · 120 Ouro Inicial · Inimigos com 150% HP e 145% Dano.
   - Chefes agressivos e tempestades de cerco.
4. **Hard Master (Soberano Supremo):**
   - 20 Ondas · 80 Ouro Inicial · Inimigos com 230% HP e 220% Dano.
   - Chefes duplos, penalidades de mana e caos elevado.

---

## 🚀 Como Executar o Aplicativo Web

1. **Instalar dependências (se necessário):**
   ```bash
   npm install
   ```

2. **Iniciar servidor de desenvolvimento:**
   ```bash
   npm run dev
   ```
   Acesse `http://localhost:3000`.

3. **Executar testes unitários do motor de combate:**
   ```bash
   npx --yes tsx --test src/game/combatLogic.test.ts
   ```

---

## 📋 Resumo das Entregas Solicitadas

- **Nome do Aplicativo:** `9 Kings - Kingdom Matrix & Google Sheets Exporter`
- **Descrição para o Repositório:** `Exportador automatizado para Google Sheets e simulador de balanceamento do jogo 9 Kings (Sad Socket / Hooded Horse). Suporte a 4 níveis de dificuldade (Fácil, Médio, Difícil e Hard Master), integração direta com Google Drive via OAuth e script de automação em Python.`
- **Linguagem além de JS:** Python 3 (script completo `export_to_sheets.py` com CLI, simulações em lote e suporte a Google Sheets API v4).
- **Múltiplas Simulações:** Simulador com suporte a lotes de 10x, 25x, 50x partidas ("muitas vezes").
- **Dificuldades:** Fácil, Médio, Difícil e Hard Master totalmente integrados na arena, nas simulações e nas planilhas.
