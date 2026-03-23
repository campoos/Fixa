---
name: front-brand-guidelines
description: Identidade visual Vibe — paleta de cores, tipografia, iconografia e regras de aplicação. Use ao criar ou revisar componentes visuais no vibe-mobile-app.
---

# Manual da Marca Vibe — Diretrizes para Desenvolvimento

## Paleta de Cores

### Cores Principais (proporção de uso)

| Nome | HEX | RGB | Uso |
|------|-----|-----|-----|
| **Azul Vibe** | `#665FFF` | 102, 95, 255 | Cor principal — até 80% da peça |
| **Contorno** | `#292562` | 41, 37, 98 | Textos escuros, contornos, fundos dark — até 30% |
| **Claro** | `#B9B6F7` | 185, 182, 247 | Destaques suaves, backgrounds leves — até 20% |
| **Nuvem** | `#EFEEFF` | 239, 238, 255 | Backgrounds claros, cards — até 20% |
| **Branco** | `#FFFFFF` | 255, 255, 255 | Textos em fundo escuro, backgrounds — até 20% |

### Cores de Apoio

| HEX | RGB | Descrição |
|-----|-----|-----------|
| `#FF4347` | 255, 67, 71 | Vermelho |
| `#BC0E22` | 188, 14, 34 | Vermelho escuro |
| `#FF8700` | 255, 135, 0 | Laranja |
| `#C74300` | 199, 67, 0 | Laranja escuro |
| `#FEFB00` | 254, 251, 0 | Amarelo |
| `#AA9900` | 170, 153, 0 | Amarelo escuro |
| `#92FF42` | 146, 255, 66 | Verde |
| `#7F9700` | 127, 151, 0 | Verde escuro |
| `#00EDFF` | 0, 237, 255 | Ciano |
| `#0082CF` | 0, 130, 207 | Azul |
| `#FF2B7C` | 255, 43, 124 | Rosa |
| `#C4004C` | 196, 0, 76 | Rosa escuro |
| `#942EF2` | 148, 46, 242 | Roxo |
| `#5B1D94` | 91, 29, 148 | Roxo escuro |

## Tipografia

### Fonte Principal: Neue Plak
- **Pesos:** Light, Regular, SemiBold, Bold, Black
- Usada para toda a comunicação da marca (títulos, corpo, UI)
- Moderna, clara e versátil

### Fallback
- Quando Neue Plak não estiver disponível: **Poppins** ou fonte sans-serif similar
- Preservar leveza e clareza visual

### Fonte Secundária: Vatulemo Glifo
- Uso decorativo e pontual (nunca para textos corridos)
- Ideal para substituir letras em palavras estratégicas
- Cria contraste com a Neue Plak

## Iconografia

### Ícones Principais
- Estilo ilustrativo e colorido
- Usados para categorias: cinema, combustível, eletrônicos, casa, lazer, alimentação, moda, shows, beleza, viagens, pets, educação, mercado, fitness, sorteio, saúde, games, presentes

### Ícones Secundários (Line)
- Estilo "line" (contorno), minimalista
- Usados no **aplicativo** (interface limpa), materiais jurídicos e apresentações corporativas
- Prioridade para clareza e objetividade

## Logo

### Variações
- **Fundos escuros:** Logo branco com contorno preto
- **Fundos brancos:** Logo azul com contorno azul escuro
- **Priorizar:** logo branco com contorno azul escuro

### Área de segurança
- Tamanho mínimo digital: 58x25px
- Quando altura < 35px: usar versão flat

## Elementos Gráficos

- **Moeda Vibe:** simboliza valor, reconhecimento e troca
- **"V" de Vibe:** versão simplificada da logomarca, uso versátil e icônico
- **Lines:** curvas inspiradas na Vatulemo, para backgrounds e contrastes
- **Doodles:** detalhes estratégicos que orientam o olhar
- **Quadrados com bordas arredondadas:** elemento de identidade do app

## Regras de Contraste

Garantir legibilidade e acessibilidade:
- Texto claro em fundo escuro (Azul Vibe, Contorno)
- Texto escuro (Contorno) em fundo claro (Nuvem, Branco)
- Sempre validar contraste WCAG entre texto e fundo

## Checklist de Validação (para código)

1. Cores usam tokens do tema ou paleta institucional (nunca hardcoded fora do theme)
2. Fonte principal: Neue Plak (fallback: Poppins/sans-serif)
3. Ícones do app: estilo line (secundários)
4. Azul Vibe (`#665FFF`) como cor predominante
5. Contrastes respeitam acessibilidade
6. Logo com área de segurança respeitada
