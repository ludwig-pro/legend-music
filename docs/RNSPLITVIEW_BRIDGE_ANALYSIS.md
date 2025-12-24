# Analyse complète du bridge RNSplitView

Ce document détaille le fonctionnement du bridge React Native `RNSplitView` et fournit un guide pour créer un package npm réutilisable.

## Table des matières

1. [Architecture générale](#1-architecture-générale)
2. [Côté Natif (Objective-C)](#2-côté-natif-objective-c)
3. [Côté React Native (TypeScript)](#3-côté-react-native-typescript)
4. [Flux de données](#4-flux-de-données)
5. [Guide de création d'un Package NPM](#5-guide-de-création-dun-package-npm)
6. [Améliorations possibles](#6-améliorations-possibles)

---

## 1. Architecture générale

Le bridge RNSplitView suit le pattern **RCTViewManager** de React Native, qui permet d'exposer des composants UI natifs vers JavaScript.

### Schéma du flux

```
┌─────────────────────────────────────────────────────────────────┐
│                     React Native (JavaScript)                    │
│  ┌─────────────────────────────────────────────────────────┐   │
│  │  SplitView.tsx                                           │   │
│  │  - requireNativeComponent('RNSplitView')                 │   │
│  │  - Props TypeScript: isVertical, dividerThickness, etc.  │   │
│  └─────────────────────────────────────────────────────────┘   │
│                              │                                   │
│                              ▼                                   │
├─────────────────────────── Bridge ──────────────────────────────┤
│                              │                                   │
│                              ▼                                   │
│  ┌─────────────────────────────────────────────────────────┐   │
│  │  RNSplitViewManager (Objective-C)                        │   │
│  │  - RCT_EXPORT_MODULE(RNSplitView)                        │   │
│  │  - RCT_EXPORT_VIEW_PROPERTY(...)                         │   │
│  └─────────────────────────────────────────────────────────┘   │
│                              │                                   │
│                              ▼                                   │
│  ┌─────────────────────────────────────────────────────────┐   │
│  │  RNSplitView : NSSplitView                               │   │
│  │  - Composant natif macOS                                  │   │
│  │  - NSSplitViewDelegate                                    │   │
│  └─────────────────────────────────────────────────────────┘   │
│                     Native macOS (AppKit)                        │
└─────────────────────────────────────────────────────────────────┘
```

### Fichiers impliqués

| Fichier | Rôle |
|---------|------|
| `macos/.../SplitView/RNSplitView.h` | Header Objective-C - Déclarations |
| `macos/.../SplitView/RNSplitView.m` | Implémentation native |
| `src/native-modules/SplitView.tsx` | Wrapper React Native |

---

## 2. Côté Natif (Objective-C)

### 2.1 Fichier Header (`RNSplitView.h`)

```objc
#import <React/RCTViewManager.h>
#import <AppKit/AppKit.h>

@interface RNSplitView : NSSplitView

@property (nonatomic, assign) BOOL isVertical;
@property (nonatomic, assign) CGFloat dividerThickness;
@property (nonatomic, copy) RCTBubblingEventBlock onSplitViewDidResize;

@end

@interface RNSplitViewManager : RCTViewManager

@end
```

#### Points clés

| Élément | Description |
|---------|-------------|
| `NSSplitView` | Classe parente AppKit pour les vues divisées |
| `RCTBubblingEventBlock` | Type spécial pour les callbacks d'événements vers JavaScript |
| `RCTViewManager` | Classe de base React Native pour exposer des vues natives |

### 2.2 Fichier Implementation (`RNSplitView.m`)

#### Constantes de contraintes

```objc
static const CGFloat kMinimumPrimarySize = 140.0;   // Largeur min du panneau gauche
static const CGFloat kMinimumSecondarySize = 320.0; // Largeur min du panneau droit
```

#### Initialisation

```objc
- (instancetype)init
{
    self = [super init];
    if (self) {
        self.delegate = self;                           // Auto-délégation
        self.dividerStyle = NSSplitViewDividerStyleThin;
        self.isVertical = YES;                          // Layout horizontal par défaut
        self.dividerThickness = 1.0;

        // Permet au split view de se redimensionner avec son conteneur
        self.autoresizingMask = NSViewWidthSizable | NSViewHeightSizable;

        // NSSplitView gère automatiquement ses subviews
        self.arrangesAllSubviews = YES;
        self.initialDividerPositionSet = NO;
        _lastDividerPosition = 0.0f;
    }
    return self;
}
```

#### Setters personnalisés

```objc
- (void)setIsVertical:(BOOL)isVertical
{
    _isVertical = isVertical;
    self.vertical = isVertical;  // Propriété NSSplitView
}

- (void)setDividerThickness:(CGFloat)dividerThickness
{
    _dividerThickness = MAX(1.0, dividerThickness);  // Minimum 1px
    [self setNeedsDisplayInRect:self.bounds];
    [self adjustSubviews];
}
```

#### Méthodes du Delegate (NSSplitViewDelegate)

| Méthode | Rôle |
|---------|------|
| `splitViewDidResizeSubviews:` | Déclenche l'événement `onSplitViewDidResize` vers JS |
| `splitView:canCollapseSubview:` | Retourne `NO` - empêche la réduction des panneaux |
| `splitView:constrainMinCoordinate:` | Applique `kMinimumPrimarySize` |
| `splitView:constrainMaxCoordinate:` | Applique `totalSize - kMinimumSecondarySize` |
| `splitView:resizeSubviewsWithOldSize:` | Gère le redimensionnement avec conservation de position |

#### Notification d'événement vers JavaScript

```objc
- (void)splitViewDidResizeSubviews:(NSNotification *)notification
{
    // Mémoriser la dernière position du diviseur
    if (self.subviews.count >= 1) {
        NSView *firstSubview = self.subviews.firstObject;
        if (firstSubview) {
            _lastDividerPosition = self.isVertical
                ? firstSubview.frame.size.width
                : firstSubview.frame.size.height;
        }
    }

    // Émettre l'événement vers JavaScript
    if (self.onSplitViewDidResize) {
        NSArray<NSView *> *subviews = self.subviews;
        NSMutableArray *sizes = [NSMutableArray array];

        for (NSView *subview in subviews) {
            if (self.isVertical) {
                [sizes addObject:@(subview.frame.size.width)];
            } else {
                [sizes addObject:@(subview.frame.size.height)];
            }
        }

        self.onSplitViewDidResize(@{
            @"sizes": sizes,
            @"isVertical": @(self.isVertical)
        });
    }
}
```

#### Contraintes de position du diviseur

```objc
- (CGFloat)splitView:(NSSplitView *)splitView
    constrainMinCoordinate:(CGFloat)proposedMinimumPosition
    ofSubviewAt:(NSInteger)dividerIndex
{
    return MAX(proposedMinimumPosition, kMinimumPrimarySize);
}

- (CGFloat)splitView:(NSSplitView *)splitView
    constrainMaxCoordinate:(CGFloat)proposedMaximumPosition
    ofSubviewAt:(NSInteger)dividerIndex
{
    CGFloat totalSize = self.isVertical
        ? self.frame.size.width
        : self.frame.size.height;

    if (totalSize <= 0) {
        return proposedMaximumPosition;
    }

    CGFloat maxAllowed = totalSize - kMinimumSecondarySize;
    maxAllowed = MAX(kMinimumPrimarySize, maxAllowed);

    return MIN(proposedMaximumPosition, maxAllowed);
}
```

#### Intégration des enfants React Native

```objc
- (void)insertReactSubview:(NSView *)subview atIndex:(NSInteger)atIndex
{
    // Appeler la méthode parente pour ajouter la subview
    [super insertReactSubview:subview atIndex:atIndex];

    // Configurer la subview pour le redimensionnement automatique
    subview.translatesAutoresizingMaskIntoConstraints = YES;
    subview.autoresizingMask = NSViewWidthSizable | NSViewHeightSizable;

    [self adjustSubviews];

    // Initialiser la position du diviseur quand on a 2 subviews
    if (self.subviews.count >= 2) {
        self.initialDividerPositionSet = NO;
        [self setInitialDividerPositionIfNeeded];
    }
}
```

#### Export du ViewManager

```objc
@implementation RNSplitViewManager

RCT_EXPORT_MODULE(RNSplitView)  // Nom accessible depuis JavaScript

- (NSView *)view
{
    return [[RNSplitView alloc] init];  // Factory pour créer les instances
}

// Export des propriétés vers JavaScript
RCT_EXPORT_VIEW_PROPERTY(isVertical, BOOL)
RCT_EXPORT_VIEW_PROPERTY(dividerThickness, CGFloat)
RCT_EXPORT_VIEW_PROPERTY(onSplitViewDidResize, RCTBubblingEventBlock)

@end
```

### 2.3 Macros React Native importantes

| Macro | Description |
|-------|-------------|
| `RCT_EXPORT_MODULE(name)` | Enregistre le module avec le nom spécifié |
| `RCT_EXPORT_VIEW_PROPERTY(name, type)` | Expose une propriété de la vue |
| `RCT_EXPORT_METHOD(method)` | Expose une méthode callable depuis JS |
| `RCTBubblingEventBlock` | Type pour les événements qui "remontent" vers JS |

---

## 3. Côté React Native (TypeScript)

### Fichier `SplitView.tsx`

```typescript
import { cssInterop } from "nativewind";
import type { ReactNode } from "react";
import { requireNativeComponent, type ViewProps } from "react-native";

// Types pour l'événement de redimensionnement
export interface SplitViewResizeEvent {
    sizes: number[];      // Tailles de chaque panneau en pixels
    isVertical: boolean;  // Orientation actuelle
}

// Props du composant
export interface SplitViewProps extends ViewProps {
    children?: ReactNode;
    isVertical?: boolean;
    dividerThickness?: number;
    onSplitViewDidResize?: (event: { nativeEvent: SplitViewResizeEvent }) => void;
}

// Liaison avec le composant natif via le nom exporté
const NativeSplitView = requireNativeComponent<SplitViewProps>("RNSplitView");

// Intégration NativeWind pour supporter les classes Tailwind
cssInterop(NativeSplitView, {
    className: "style",
});

// Composant wrapper avec valeurs par défaut
export function SplitView({ isVertical = true, style, ...props }: SplitViewProps) {
    const layoutStyle = { flexDirection: isVertical ? "row" : "column" };
    return <NativeSplitView {...props} isVertical={isVertical} style={[style, layoutStyle]} />;
}
```

### Points clés

| Élément | Description |
|---------|-------------|
| `requireNativeComponent` | Fonction RN pour lier un composant natif par son nom |
| `cssInterop` | Permet l'utilisation de classes Tailwind CSS sur le composant |
| `nativeEvent` | Wrapper standard RN pour les données d'événements natifs |
| `ViewProps` | Interface de base pour les props de vue React Native |

### Exemple d'utilisation

```tsx
import { SplitView } from '@/native-modules/SplitView';
import { View, Text } from 'react-native';

function MyLayout() {
    const handleResize = (event: { nativeEvent: SplitViewResizeEvent }) => {
        console.log('Nouvelles tailles:', event.nativeEvent.sizes);
    };

    return (
        <SplitView
            isVertical={true}
            dividerThickness={2}
            onSplitViewDidResize={handleResize}
            className="flex-1"
        >
            <View className="bg-gray-800">
                <Text>Panneau gauche (Sidebar)</Text>
            </View>
            <View className="bg-gray-900">
                <Text>Panneau droit (Contenu)</Text>
            </View>
        </SplitView>
    );
}
```

---

## 4. Flux de données

### 4.1 Props (JavaScript → Natif)

```
React Component          RN Bridge           RNSplitViewManager        RNSplitView
     │                       │                      │                      │
     │── isVertical=true ───▶│──────────────────────▶│─── setIsVertical: ──▶│
     │                       │                      │                      │
     │── dividerThickness ──▶│──────────────────────▶│─ setDividerThick.. ─▶│
     │                       │                      │                      │
     │── children ──────────▶│──────────────────────▶│─ insertReactSub.. ──▶│
```

### 4.2 Events (Natif → JavaScript)

```
RNSplitView                          RN Bridge                     React Component
     │                                    │                              │
     │                                    │                              │
     │  [User drags divider]              │                              │
     │                                    │                              │
     │── splitViewDidResizeSubviews ─────▶│                              │
     │                                    │                              │
     │── onSplitViewDidResize(@{         │                              │
     │      sizes: [200, 600],           │                              │
     │      isVertical: YES              │                              │
     │   }) ─────────────────────────────▶│                              │
     │                                    │                              │
     │                                    │── { nativeEvent: {          │
     │                                    │      sizes: [200, 600],     │
     │                                    │      isVertical: true       │
     │                                    │   }} ──────────────────────▶│
     │                                    │                              │
     │                                    │                  [Callback executed]
```

### 4.3 Cycle de vie

1. **Montage** : React Native crée une instance via `RNSplitViewManager.view`
2. **Ajout des enfants** : `insertReactSubview:atIndex:` est appelé pour chaque enfant
3. **Configuration** : Les props sont appliquées via les setters
4. **Interaction** : L'utilisateur déplace le diviseur
5. **Notification** : `splitViewDidResizeSubviews:` émet l'événement
6. **Callback JS** : `onSplitViewDidResize` est exécuté côté JavaScript

---

## 5. Guide de création d'un Package NPM

### 5.1 Structure recommandée

```
react-native-macos-splitview/
├── package.json
├── README.md
├── LICENSE
├── tsconfig.json
├── tsconfig.build.json
├── src/
│   └── index.tsx              # Export React Native
├── macos/
│   ├── RNSplitView.podspec
│   └── RNSplitView/
│       ├── RNSplitView.h
│       └── RNSplitView.m
└── example/                    # App de démonstration (optionnel)
    ├── App.tsx
    └── ...
```

### 5.2 `package.json`

```json
{
  "name": "react-native-macos-splitview",
  "version": "1.0.0",
  "description": "Native NSSplitView component for React Native macOS",
  "main": "lib/commonjs/index.js",
  "module": "lib/module/index.js",
  "types": "lib/typescript/index.d.ts",
  "react-native": "src/index.tsx",
  "source": "src/index.tsx",
  "files": [
    "src",
    "lib",
    "macos",
    "!**/__tests__",
    "!**/__fixtures__",
    "!**/__mocks__"
  ],
  "scripts": {
    "typescript": "tsc --noEmit",
    "lint": "eslint \"src/**/*.{ts,tsx}\"",
    "prepare": "bob build",
    "release": "release-it"
  },
  "keywords": [
    "react-native",
    "macos",
    "splitview",
    "nssplitview",
    "sidebar"
  ],
  "repository": {
    "type": "git",
    "url": "git+https://github.com/your-username/react-native-macos-splitview.git"
  },
  "author": "Your Name <your.email@example.com>",
  "license": "MIT",
  "bugs": {
    "url": "https://github.com/your-username/react-native-macos-splitview/issues"
  },
  "homepage": "https://github.com/your-username/react-native-macos-splitview#readme",
  "publishConfig": {
    "registry": "https://registry.npmjs.org/"
  },
  "peerDependencies": {
    "react": ">=17.0.0",
    "react-native": ">=0.70.0",
    "react-native-macos": ">=0.70.0"
  },
  "peerDependenciesMeta": {
    "react-native-macos": {
      "optional": false
    }
  },
  "devDependencies": {
    "@types/react": "^18.2.0",
    "react": "^18.2.0",
    "react-native": "^0.73.0",
    "react-native-builder-bob": "^0.23.0",
    "typescript": "^5.0.0"
  },
  "react-native-builder-bob": {
    "source": "src",
    "output": "lib",
    "targets": [
      "commonjs",
      "module",
      ["typescript", { "project": "tsconfig.build.json" }]
    ]
  }
}
```

### 5.3 `macos/RNSplitView.podspec`

```ruby
require 'json'

package = JSON.parse(File.read(File.join(__dir__, '..', 'package.json')))

Pod::Spec.new do |s|
  s.name         = "RNSplitView"
  s.version      = package['version']
  s.summary      = package['description']
  s.homepage     = package['homepage']
  s.license      = package['license']
  s.authors      = package['author']

  s.platforms    = { :osx => "10.15" }
  s.source       = {
    :git => "https://github.com/your-username/react-native-macos-splitview.git",
    :tag => "v#{s.version}"
  }

  s.source_files = "RNSplitView/**/*.{h,m,mm}"

  # Dépendance React Native
  s.dependency "React-Core"
end
```

### 5.4 `src/index.tsx` (version package)

```typescript
import type { ReactNode } from 'react';
import {
  requireNativeComponent,
  Platform,
  View,
  type ViewProps,
  type StyleProp,
  type ViewStyle,
} from 'react-native';

// ============================================================================
// Types
// ============================================================================

export interface SplitViewResizeEvent {
  /** Tailles de chaque panneau en pixels */
  sizes: number[];
  /** true si orientation verticale (panneaux côte-à-côte) */
  isVertical: boolean;
}

export interface SplitViewProps extends ViewProps {
  children?: ReactNode;
  /**
   * Orientation du split view
   * - true: panneaux côte-à-côte (horizontal layout)
   * - false: panneaux empilés (vertical layout)
   * @default true
   */
  isVertical?: boolean;
  /**
   * Épaisseur du séparateur en pixels
   * @default 1
   */
  dividerThickness?: number;
  /**
   * Callback appelé lors du redimensionnement des panneaux
   */
  onSplitViewDidResize?: (event: { nativeEvent: SplitViewResizeEvent }) => void;
  /** Style du conteneur */
  style?: StyleProp<ViewStyle>;
}

// ============================================================================
// Native Component
// ============================================================================

const LINKING_ERROR =
  `The package 'react-native-macos-splitview' doesn't seem to be linked. Make sure:\n\n` +
  Platform.select({
    macos: '- You ran `pod install` in the macos/ directory\n',
    default: '',
  }) +
  '- You rebuilt the app after installing the package\n' +
  '- You are not using Expo Go (it requires custom native code)\n';

const ComponentName = 'RNSplitView';

const NativeSplitView =
  Platform.OS === 'macos'
    ? requireNativeComponent<SplitViewProps>(ComponentName)
    : null;

// ============================================================================
// Component
// ============================================================================

/**
 * SplitView - Composant split view natif pour macOS
 *
 * Encapsule NSSplitView pour fournir un layout divisé redimensionnable
 * avec deux panneaux (typiquement sidebar + contenu).
 *
 * @example
 * ```tsx
 * <SplitView
 *   isVertical={true}
 *   dividerThickness={2}
 *   onSplitViewDidResize={(e) => console.log(e.nativeEvent.sizes)}
 * >
 *   <View style={{ minWidth: 200 }}>
 *     <Text>Sidebar</Text>
 *   </View>
 *   <View style={{ flex: 1 }}>
 *     <Text>Content</Text>
 *   </View>
 * </SplitView>
 * ```
 */
export function SplitView({
  isVertical = true,
  dividerThickness = 1,
  style,
  children,
  ...props
}: SplitViewProps): JSX.Element {
  // Fallback pour les plateformes non-macOS
  if (Platform.OS !== 'macos') {
    console.warn(
      'SplitView is only supported on macOS. Rendering a simple View container instead.'
    );
    return (
      <View
        style={[
          { flex: 1, flexDirection: isVertical ? 'row' : 'column' },
          style
        ]}
      >
        {children}
      </View>
    );
  }

  // Vérification du linking
  if (!NativeSplitView) {
    throw new Error(LINKING_ERROR);
  }

  const layoutStyle: ViewStyle = {
    flexDirection: isVertical ? 'row' : 'column'
  };

  return (
    <NativeSplitView
      {...props}
      isVertical={isVertical}
      dividerThickness={dividerThickness}
      style={[style, layoutStyle]}
    >
      {children}
    </NativeSplitView>
  );
}

// Export par défaut
export default SplitView;

// Re-export des types pour les consommateurs
export type { ViewProps, ViewStyle };
```

### 5.5 `tsconfig.build.json`

```json
{
  "extends": "./tsconfig.json",
  "compilerOptions": {
    "declaration": true,
    "declarationMap": true,
    "outDir": "lib/typescript"
  },
  "include": ["src"],
  "exclude": ["**/__tests__", "**/__mocks__", "example"]
}
```

### 5.6 `tsconfig.json`

```json
{
  "compilerOptions": {
    "target": "ES2020",
    "module": "ESNext",
    "moduleResolution": "bundler",
    "lib": ["ES2020"],
    "jsx": "react-native",
    "strict": true,
    "esModuleInterop": true,
    "skipLibCheck": true,
    "resolveJsonModule": true,
    "allowSyntheticDefaultImports": true,
    "noEmit": true
  },
  "include": ["src"],
  "exclude": ["node_modules", "lib"]
}
```

### 5.7 `README.md` du package

```markdown
# react-native-macos-splitview

Native NSSplitView component for React Native macOS applications.

## Features

- Native macOS NSSplitView wrapper
- Configurable divider thickness
- Resize event callbacks
- Minimum size constraints for panels
- TypeScript support

## Installation

```bash
npm install react-native-macos-splitview
# or
yarn add react-native-macos-splitview
```

Then install the native dependencies:

```bash
cd macos && pod install
```

## Usage

```tsx
import { SplitView } from 'react-native-macos-splitview';

function App() {
  return (
    <SplitView
      isVertical={true}
      dividerThickness={2}
      onSplitViewDidResize={(e) => {
        console.log('Panel sizes:', e.nativeEvent.sizes);
      }}
      style={{ flex: 1 }}
    >
      <View style={{ backgroundColor: '#1a1a1a' }}>
        <Text>Sidebar</Text>
      </View>
      <View style={{ backgroundColor: '#2a2a2a', flex: 1 }}>
        <Text>Main Content</Text>
      </View>
    </SplitView>
  );
}
```

## Props

| Prop | Type | Default | Description |
|------|------|---------|-------------|
| `isVertical` | `boolean` | `true` | Layout orientation (true = side-by-side) |
| `dividerThickness` | `number` | `1` | Divider thickness in pixels |
| `onSplitViewDidResize` | `function` | - | Callback when panels are resized |
| `style` | `ViewStyle` | - | Container style |
| `children` | `ReactNode` | - | Two child views for the split |

## License

MIT
```

### 5.8 Installation dans une autre application

#### Depuis npm (après publication)

```bash
# Installer le package
bun add react-native-macos-splitview

# Installer les pods natifs
cd macos && pod install
```

#### Depuis un dépôt Git

```bash
# Installer directement depuis GitHub
bun add github:your-username/react-native-macos-splitview

# Ou depuis un chemin local
bun add ../react-native-macos-splitview
```

#### Utilisation

```tsx
import { SplitView } from 'react-native-macos-splitview';
import { View, Text, StyleSheet } from 'react-native';

function App() {
    const handleResize = (event) => {
        const { sizes, isVertical } = event.nativeEvent;
        console.log(`Sidebar: ${sizes[0]}px, Content: ${sizes[1]}px`);
    };

    return (
        <SplitView
            isVertical={true}
            dividerThickness={1}
            onSplitViewDidResize={handleResize}
            style={styles.container}
        >
            <View style={styles.sidebar}>
                <Text>Sidebar</Text>
            </View>
            <View style={styles.content}>
                <Text>Main Content</Text>
            </View>
        </SplitView>
    );
}

const styles = StyleSheet.create({
    container: {
        flex: 1,
    },
    sidebar: {
        backgroundColor: '#1a1a1a',
        minWidth: 200,
    },
    content: {
        backgroundColor: '#2a2a2a',
        flex: 1,
    },
});
```

---

## 6. Améliorations possibles

### 6.1 Props configurables

| Prop | Description | Type |
|------|-------------|------|
| `minimumPrimarySize` | Largeur min du premier panneau | `number` |
| `minimumSecondarySize` | Largeur min du second panneau | `number` |
| `initialPosition` | Position initiale du diviseur | `number` |
| `collapsible` | Permettre la réduction des panneaux | `boolean` |
| `dividerColor` | Couleur personnalisée du diviseur | `string` |

### 6.2 Méthodes exposées

```objc
RCT_EXPORT_METHOD(setDividerPosition:(nonnull NSNumber *)position)
{
    // Permettre de définir la position programmatiquement
}

RCT_EXPORT_METHOD(toggleSidebar)
{
    // Afficher/masquer le premier panneau avec animation
}
```

### 6.3 Support multi-plateforme

Pour iOS et Android, implémenter un fallback avec gesture-based splitter :

```tsx
if (Platform.OS !== 'macos') {
  return (
    <GestureBasedSplitView {...props}>
      {children}
    </GestureBasedSplitView>
  );
}
```

### 6.4 Animations

Ajouter le support d'animations natives lors du redimensionnement :

```objc
[NSAnimationContext runAnimationGroup:^(NSAnimationContext *context) {
    context.duration = 0.25;
    context.allowsImplicitAnimation = YES;
    [self setPosition:newPosition ofDividerAtIndex:0];
} completionHandler:nil];
```

---

## Résumé

Le bridge RNSplitView est un exemple classique de **RCTViewManager** qui :

1. **Côté natif** : Hérite de `NSSplitView` et implémente son delegate pour contrôler le comportement
2. **Côté JS** : Utilise `requireNativeComponent` pour créer le pont
3. **Communication bidirectionnelle** : Props pour configurer, events pour notifier

Pour créer un package réutilisable :
1. Encapsuler le code natif avec un podspec
2. Ajouter des types TypeScript complets
3. Gérer les fallbacks pour les autres plateformes
4. Publier sur npm avec react-native-builder-bob

---

## Références

- [React Native Native Modules (macOS)](https://microsoft.github.io/react-native-windows/docs/native-modules)
- [NSSplitView Documentation](https://developer.apple.com/documentation/appkit/nssplitview)
- [react-native-builder-bob](https://github.com/callstack/react-native-builder-bob)
- [Creating React Native Libraries](https://reactnative.dev/docs/native-modules-intro)
