# Configuration Linter - Biome

Ce document décrit la configuration du linter Biome utilisée dans ce projet React Native macOS. Tu peux la réutiliser facilement sur un autre projet.

---

## Stack

- **Biome** v2.3.8 - Linter + Formatter ultra-rapide (remplace ESLint + Prettier)
- **ESLint** (optionnel) - Uniquement pour le React Compiler

---

## Installation

```bash
bun add -d @biomejs/biome
```

---

## biome.json

Copie ce fichier à la racine de ton projet :

```json
{
    "$schema": "https://biomejs.dev/schemas/2.0.6/schema.json",
    "vcs": {
        "enabled": false,
        "clientKind": "git",
        "useIgnoreFile": false
    },
    "files": {
        "ignoreUnknown": false
    },
    "formatter": {
        "enabled": true,
        "formatWithErrors": false,
        "indentStyle": "space",
        "indentWidth": 4,
        "lineEnding": "lf",
        "lineWidth": 120
    },
    "linter": {
        "enabled": true,
        "rules": {
            "recommended": true,
            "style": {
                "noNonNullAssertion": "off",
                "noParameterAssign": "error",
                "useAsConstAssertion": "error",
                "useDefaultParameterLast": "error",
                "useEnumInitializers": "error",
                "useSelfClosingElements": "error",
                "useSingleVarDeclarator": "error",
                "noUnusedTemplateLiteral": "error",
                "useNumberNamespace": "error",
                "noInferrableTypes": "error",
                "noUselessElse": "off"
            },
            "suspicious": {
                "noArrayIndexKey": "off",
                "noExplicitAny": "off",
                "noConfusingVoidType": "off"
            },
            "correctness": {
                "noUnusedImports": "warn",
                "useExhaustiveDependencies": "off"
            },
            "nursery": {}
        }
    },
    "javascript": {
        "formatter": {
            "quoteStyle": "double"
        }
    },
    "assist": {
        "actions": {
            "source": {
                "organizeImports": "on"
            }
        }
    }
}
```

---

## Scripts package.json

Ajoute ces scripts :

```json
{
  "scripts": {
    "lint": "bunx biome check ./src && bunx biome format ./src",
    "lint:fix": "bunx biome lint --write ./src && bunx biome format --write ./src && bunx biome check --write ./src"
  }
}
```

---

## Résumé des Règles

### Formatter

| Option | Valeur | Description |
|--------|--------|-------------|
| `indentStyle` | `space` | Utilise des espaces (pas des tabs) |
| `indentWidth` | `4` | 4 espaces par niveau d'indentation |
| `lineWidth` | `120` | Largeur max de ligne (120 caractères) |
| `lineEnding` | `lf` | Unix line endings (LF, pas CRLF) |
| `quoteStyle` | `double` | Guillemets doubles pour les strings |

### Règles de Style

| Règle | Valeur | Explication |
|-------|--------|-------------|
| `noNonNullAssertion` | off | Autorise l'opérateur `!` (non-null assertion) |
| `noParameterAssign` | error | Interdit de réassigner les paramètres de fonction |
| `useAsConstAssertion` | error | Préfère `as const` pour les littéraux |
| `useDefaultParameterLast` | error | Les params par défaut doivent être à la fin |
| `useEnumInitializers` | error | Les enums doivent avoir des valeurs explicites |
| `useSelfClosingElements` | error | `<Div />` au lieu de `<Div></Div>` |
| `useSingleVarDeclarator` | error | Une déclaration par ligne |
| `noUnusedTemplateLiteral` | error | Pas de template strings inutiles |
| `useNumberNamespace` | error | `Number.isNaN()` au lieu de `isNaN()` |
| `noInferrableTypes` | error | Pas de types évidents (ex: `const x: number = 5`) |
| `noUselessElse` | off | Autorise `else` après `return` |

### Règles Suspicious

| Règle | Valeur | Explication |
|-------|--------|-------------|
| `noArrayIndexKey` | off | Autorise l'index comme key dans les listes React |
| `noExplicitAny` | off | Autorise le type `any` |
| `noConfusingVoidType` | off | Autorise `void` dans les types union |

### Règles Correctness

| Règle | Valeur | Explication |
|-------|--------|-------------|
| `noUnusedImports` | warn | Avertissement sur les imports non utilisés |
| `useExhaustiveDependencies` | off | Désactive la vérification des deps des hooks |

### Assist (Auto-fix)

| Action | Valeur | Description |
|--------|--------|-------------|
| `organizeImports` | on | Trie automatiquement les imports |

---

## Commandes Utiles

```bash
# Vérifier le code (sans modifier)
bunx biome check ./src

# Vérifier le formatage
bunx biome format ./src

# Corriger automatiquement tout
bunx biome check --write ./src

# Lint seul avec corrections
bunx biome lint --write ./src

# Format seul avec corrections
bunx biome format --write ./src
```

---

## Intégration VS Code

Installe l'extension **Biome** et ajoute dans `.vscode/settings.json` :

```json
{
  "editor.defaultFormatter": "biomejs.biome",
  "editor.formatOnSave": true,
  "editor.codeActionsOnSave": {
    "source.organizeImports.biome": "explicit"
  }
}
```

---

## Pourquoi ces choix ?

1. **`noExplicitAny: off`** - Pragmatique pour React Native où certains types sont complexes
2. **`noArrayIndexKey: off`** - Souvent nécessaire dans les listes statiques
3. **`useExhaustiveDependencies: off`** - Legend State gère la réactivité différemment
4. **`noUselessElse: off`** - Question de préférence de lisibilité
5. **`lineWidth: 120`** - Plus large que 80, adapté aux écrans modernes
6. **`indentWidth: 4`** - Meilleure lisibilité que 2 espaces
