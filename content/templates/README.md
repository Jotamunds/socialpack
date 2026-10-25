# Textos persuasivos por nicho

Esta pasta guarda os textos usados para gerar a semana de posts.
**Não é preciso mexer em código** para adicionar conteúdo: basta editar os arquivos JSON.

```
content/
├── catalog.json              ← tipos de empresa (categorias), nichos e tons de voz
└── templates/
    ├── _generic.json         ← textos genéricos (fallback para qualquer nicho)
    ├── alimentacao/
    │   ├── pizzaria.json     ← textos exclusivos do nicho "Pizzaria"
    │   └── ...
    └── beleza/
        └── ...
```

## Como a geração funciona

1. O sistema lê `templates/<tipo>/<nicho>.json` do perfil da empresa.
2. Filtra os posts compatíveis com o **tom de voz** escolhido (veja `tones` abaixo).
3. Sorteia até 5 posts com temas diferentes (cada clique gera uma combinação nova).
4. Se o nicho tiver menos de 5 posts, completa com `_generic.json`.

## Formato de um arquivo de nicho

```json
{
  "label": "Alimentação › Pizzaria",
  "posts": [
    {
      "theme": "Oferta",
      "tones": ["descontraido", "divertido"],
      "headline": "A pizza mais desejada de {cidade}",
      "subheadline": "Massa de fermentação lenta e borda recheada de verdade.",
      "cta": "Peça agora",
      "caption": "Sexta-feira pede pizza da {nome}! 🍕\n\nPeça pelo direct.",
      "hashtags": ["#pizza", "#pizzaria"]
    }
  ]
}
```

| Campo         | Obrigatório | Descrição                                                                 |
| ------------- | ----------- | ------------------------------------------------------------------------- |
| `theme`       | sim         | Tema do post (ex.: Oferta, Autoridade). Evita temas repetidos na semana. |
| `tones`       | não         | IDs de tons compatíveis. Se omitido, vale para todos os tons.             |
| `headline`    | sim         | Título grande do card (ideal: até ~45 caracteres).                        |
| `subheadline` | sim         | Texto de apoio do card (ideal: até ~110 caracteres).                      |
| `cta`         | sim         | Chamada para ação no card (ideal: até ~22 caracteres).                    |
| `caption`     | sim         | Legenda do post. Use `\n` para quebrar linha.                             |
| `hashtags`    | não         | Hashtags extras. Nicho, cidade e nome da empresa são adicionados sozinhos. |

### Variáveis disponíveis

`{nome}` · `{nicho}` · `{tipo}` · `{cidade}` · `{instagram}`

### Tons de voz (IDs)

`profissional` · `descontraido` · `inspirador` · `sofisticado` · `acolhedor` · `divertido`

> Nos tons `profissional` e `sofisticado` os emojis da legenda são removidos automaticamente
> e cada tom adiciona sua assinatura final (definida em `catalog.json`).

## Adicionando um novo nicho

1. Adicione o nicho em `content/catalog.json` dentro da categoria desejada.
2. Rode `npm run templates:scaffold` para criar o arquivo vazio (nada existente é sobrescrito).
3. Preencha o array `posts`.

## Checagem dos nichos com 12 posts

`npm run templates:check` confere pizzaria, cafeteria, hamburgueria, barbearia, clínica de estética e imobiliária: pelo menos 12 posts, tema único de 2 a 24 caracteres e os limites de headline, subheadline, cta, caption e hashtags.
