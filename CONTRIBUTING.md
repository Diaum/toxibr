# Contribuindo com o ToxiBR

Obrigado por querer contribuir! Este guia explica como adicionar palavras, abreviações e melhorias ao filtro.

## Como adicionar uma palavra

### 1. Escolha a lista correta

Abra `src/wordlists.ts` e identifique onde a palavra se encaixa:

| Lista               | Quando usar                                                   | Exemplo               |
| ------------------- | ------------------------------------------------------------- | --------------------- |
| `HARD_BLOCKED`      | Palavra **sempre** tóxica, sem contexto inocente              | `estupro`, `pedofilo` |
| `CONTEXT_SENSITIVE` | Tóxica quando **dirigida a alguém**, mas OK em auto-expressão | `idiota`, `burro`     |
| `ABBREVIATION_MAP`  | Abreviação BR que expande para uma palavra já bloqueada       | `ppk` → `pepeca`      |

### 2. Regras para adicionar

- Sempre em **lowercase** e **sem acentos** (o normalizador cuida disso)
- Adicione na **categoria/seção correta** (slurs, sexual, violência, etc.)
- **Não** adicione variantes com leetspeak (`3stupr0`) — o normalizador já cobre
- **Não** adicione variantes com acentos (`viàdo`) — o normalizador já cobre
- **Verifique duplicatas** antes de adicionar (ou deixe o CI pegar)

### 3. Exemplo de PR

```typescript
// Em HARD_BLOCKED, na seção correta:
export const HARD_BLOCKED: string[] = [
  // ── Slurs / ofensas graves ──
  'viado', 'viadinho', 'viadao',
  'nova_palavra_aqui',  // ← adicione aqui
  ...
];
```

### 4. Adicione um teste

Em `__tests__/filter.test.ts`, adicione pelo menos um teste:

```typescript
it('blocks "nova_palavra"', () => {
  expect(filterContent('nova_palavra').allowed).toBe(false);
});
```

### 5. Rode a validação

```bash
npm test                    # testes
npm run validate            # verifica duplicatas
```

## Como funciona a validação de duplicatas

O script `scripts/validate-wordlists.ts` verifica:

- Duplicatas **dentro** de cada lista (`HARD_BLOCKED`, `CONTEXT_SENSITIVE`)
- Duplicatas **cruzadas** entre `HARD_BLOCKED` e `CONTEXT_SENSITIVE`
- Consistência do `ABBREVIATION_MAP`

O CI roda isso automaticamente em todo PR.

## Setup do editor (VS Code / Cursor)

Para manter a formatação consistente (Prettier/ESLint) e reduzir ruído no diff, instale as **extensões recomendadas do workspace**:

- Ao abrir o projeto, aceite o prompt de **instalar as extensões recomendadas**.
- Alternativamente, abra a aba de Extensões e procure por **Recomendadas** (workspace) ou use o comando **“Extensions: Show Recommended Extensions”**.

## Checklist do PR

- [ ] Palavra em lowercase, sem acentos
- [ ] Na lista/seção correta
- [ ] Teste adicionado
- [ ] `npm test` passando
- [ ] `npm run validate` sem erros

## Dúvidas sobre qual lista usar?

**Regra geral:** se a palavra pode aparecer em uma frase inocente (ex: "eu me sinto um idiota"), use `CONTEXT_SENSITIVE`. Se nunca tem uso inocente (ex: "estupro"), use `HARD_BLOCKED`.
