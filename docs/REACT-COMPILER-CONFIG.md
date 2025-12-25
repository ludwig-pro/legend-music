# Configuration React Compiler

Ce document décrit la configuration du React Compiler utilisée dans ce projet. Tu peux la réutiliser facilement sur un autre projet.

---

## Qu'est-ce que le React Compiler ?

Le React Compiler (anciennement React Forget) est un compilateur qui optimise automatiquement les composants React en ajoutant de la mémoïsation. Il remplace l'utilisation manuelle de `useMemo`, `useCallback` et `React.memo`.

---

## Installation

```bash
bun add -d babel-plugin-react-compiler eslint-plugin-react-compiler @typescript-eslint/parser eslint
```

Ou avec npm/yarn :

```bash
npm install -D babel-plugin-react-compiler eslint-plugin-react-compiler @typescript-eslint/parser eslint
```

---

## Configuration

### 1. package.json

Ajoute les dépendances et le script :

```json
{
  "devDependencies": {
    "babel-plugin-react-compiler": "^1.0.0",
    "eslint-plugin-react-compiler": "^19.1.0-rc.2",
    "@typescript-eslint/parser": "^8.48.0",
    "eslint": "^9.39.1"
  },
  "scripts": {
    "lint:compiler": "bunx eslint src --max-warnings=0"
  }
}
```

---

### 2. babel.config.js

Le plugin Babel **DOIT être le premier** dans la liste des plugins :

```javascript
/**
 * @type {import('@babel/core').TransformOptions}
 */
module.exports = {
    presets: [
        "module:@react-native/babel-preset",
        // autres presets...
    ],
    plugins: [
        "babel-plugin-react-compiler", // ⚠️ DOIT être en PREMIER !

        // Autres plugins...
        // Ex: module-resolver, dotenv, etc.

        "react-native-reanimated/plugin", // Toujours en DERNIER si utilisé
    ],
};
```

**Important :** L'ordre des plugins est crucial. Le React Compiler doit s'exécuter avant les autres transformations.

---

### 3. .eslintrc.js

Configuration ESLint pour valider la compatibilité avec le compiler :

```javascript
module.exports = {
    root: true,
    extends: '@react-native',
    rules: {
        // Désactivé car le React Compiler gère automatiquement les dépendances
        'react-hooks/exhaustive-deps': 'off',
    },
};
```

---

## Commandes

```bash
# Vérifier la compatibilité du code avec le React Compiler
bun run lint:compiler

# Ou directement
bunx eslint src --max-warnings=0
```

---

## Compatibilité avec d'autres outils

### Avec NativeWind

```javascript
// babel.config.js
module.exports = {
    presets: [
        "module:@react-native/babel-preset",
        "nativewind/babel",  // Preset NativeWind
    ],
    plugins: [
        "babel-plugin-react-compiler",  // Premier !
        // ...
    ],
};
```

### Avec React Native Reanimated

```javascript
// babel.config.js
module.exports = {
    plugins: [
        "babel-plugin-react-compiler",      // Premier !
        // ... autres plugins ...
        "react-native-reanimated/plugin",   // Toujours DERNIER !
    ],
};
```

### Avec Module Resolver (alias de chemins)

```javascript
// babel.config.js
module.exports = {
    plugins: [
        "babel-plugin-react-compiler",  // Premier !
        [
            "module-resolver",
            {
                root: ["./src"],
                alias: {
                    "@": "./src",
                },
            },
        ],
        // ...
    ],
};
```

---

## Configuration Avancée

### Options du plugin Babel

```javascript
// babel.config.js
module.exports = {
    plugins: [
        [
            "babel-plugin-react-compiler",
            {
                // Cible de compilation (optionnel)
                target: '18', // ou '17' pour React 17

                // Sources à compiler (optionnel)
                sources: (filename) => {
                    return filename.includes('src/');
                },
            },
        ],
    ],
};
```

### Désactiver pour un composant spécifique

Si un composant pose problème avec le compiler, tu peux le désactiver localement :

```tsx
function MyComponent() {
    "use no memo"; // Désactive le compiler pour ce composant

    return <View>...</View>;
}
```

---

## Vérification que ça fonctionne

1. **Build sans erreurs** - Le projet doit compiler sans erreurs Babel

2. **ESLint passe** - `bun run lint:compiler` ne doit pas retourner d'erreurs

3. **Vérifier les optimisations** - En mode dev, tu peux voir les composants optimisés dans React DevTools

---

## Résolution de problèmes

### Erreur "Cannot find module 'babel-plugin-react-compiler'"

```bash
bun add -d babel-plugin-react-compiler
```

### Erreur de compatibilité avec un hook custom

Le compiler peut avoir des problèmes avec certains patterns. Utilise `"use no memo"` pour désactiver localement.

### Conflit avec react-hooks/exhaustive-deps

Désactive la règle ESLint car le compiler gère les dépendances :

```javascript
// .eslintrc.js
rules: {
    'react-hooks/exhaustive-deps': 'off',
}
```

---

## Ressources

- [React Compiler Documentation](https://react.dev/learn/react-compiler)
- [Babel Plugin React Compiler](https://www.npmjs.com/package/babel-plugin-react-compiler)
- [ESLint Plugin React Compiler](https://www.npmjs.com/package/eslint-plugin-react-compiler)
