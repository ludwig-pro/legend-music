# Native Modules - Legend Music macOS

Ce document décrit les modules natifs (bridges) qui permettent la communication entre React Native et le code natif macOS.

## Vue d'ensemble

Legend Music utilise **18 modules natifs** répartis en trois catégories :

- **RCTEventEmitter** : Modules qui émettent des événements vers JavaScript
- **RCTViewManager** : Modules qui exposent des composants UI natifs
- **RCTBridgeModule** : Modules qui exposent uniquement des méthodes

---

## Modules Objective-C

### MenuEvents

**Fichier** : `macos/LegendMusic-macOS/MenuEvents/MenuEvents.m`

**Type** : RCTEventEmitter

**Description** : Gestion des événements de menu macOS. Permet de mettre à jour l'état des éléments de menu, activer/désactiver des options, modifier les titres et raccourcis clavier.

**Méthodes exportées** :
- `isAvailable()` - Vérifie si le module est disponible
- `updateMenuItemState(menuId, state)` - Met à jour l'état d'un élément de menu
- `setMenuItemEnabled(menuId, enabled)` - Active/désactive un élément
- `updateMenuItemTitle(menuId, title)` - Change le titre d'un élément
- `updateMenuItemShortcut(menuId, shortcut)` - Modifie le raccourci clavier

**Événements émis** :
- `onMenuCommand` - Déclenché lors d'une action de menu

---

### WindowManager

**Fichier** : `macos/LegendMusic-macOS/WindowManager/WindowManager.m`

**Type** : RCTEventEmitter

**Description** : Système central de gestion des fenêtres macOS. Création, configuration, fermeture de fenêtres, gestion des effets de flou et du positionnement.

**Méthodes exportées** :
- `openWindow(options)` - Ouvre une nouvelle fenêtre
- `setWindowTitle(title)` - Définit le titre de la fenêtre
- `closeWindow(windowId)` - Ferme une fenêtre spécifique
- `closeFrontmostWindow()` - Ferme la fenêtre au premier plan
- `setWindowBlur(enabled)` - Active/désactive l'effet de flou
- `getMainWindowFrame()` - Récupère les dimensions de la fenêtre principale
- `setMainWindowFrame(frame)` - Définit les dimensions de la fenêtre principale

**Événements émis** :
- `onWindowClosed` - Fenêtre fermée
- `onMainWindowMoved` - Fenêtre principale déplacée
- `onMainWindowResized` - Fenêtre principale redimensionnée
- `onWindowFocused` - Fenêtre focalisée

---

### AudioPlayer

**Fichier** : `macos/LegendMusic-macOS/AudioPlayer/AudioPlayer.m`

**Type** : RCTEventEmitter

**Description** : Moteur de lecture audio complet avec extraction de métadonnées, visualisation audio (FFT) et contrôle de lecture. Supporte les formats : mp3, wav, m4a, aac, flac, aif, aiff, aifc, caf.

**Dépendances** : MediaToolbox, AudioToolbox, ImageIO, ID3TagEditor (Swift bridge)

**Fonctionnalités** :
- Scan de fichiers audio
- Lecture de métadonnées (titre, artiste, album, durée)
- Extraction de pochettes d'album
- Contrôle de lecture (play, pause, seek)
- Visualisation audio basée sur FFT

---

### FileDialog

**Fichier** : `macos/LegendMusic-macOS/FileDialog/FileDialog.m`

**Type** : RCTBridgeModule

**Description** : Dialogues natifs du système de fichiers macOS pour ouvrir, sauvegarder et révéler des fichiers.

**Méthodes exportées** :
- `open(options)` - Ouvre un dialogue de sélection de fichier/dossier
- `save(options)` - Ouvre un dialogue de sauvegarde
- `revealInFinder(path)` - Révèle un fichier dans le Finder

**Options** :
- Filtrage par type de fichier
- Sélection de répertoires
- Sélection multiple

---

### AutoUpdater

**Fichier** : `macos/LegendMusic-macOS/AutoUpdater/AutoUpdater.m`

**Type** : RCTBridgeModule

**Description** : Système de mise à jour automatique utilisant le framework Sparkle.

**Méthodes exportées** :
- `checkForUpdates()` - Vérifie les mises à jour (avec UI)
- `checkForUpdatesInBackground()` - Vérifie les mises à jour silencieusement
- `getAutomaticallyChecksForUpdates()` - Récupère le paramètre de vérification auto
- `setAutomaticallyChecksForUpdates(enabled)` - Active/désactive la vérification auto
- `getUpdateCheckInterval()` - Récupère l'intervalle de vérification
- `setUpdateCheckInterval(interval)` - Définit l'intervalle de vérification

---

### ContextMenuManager

**Fichier** : `macos/LegendMusic-macOS/ContextMenuManager/ContextMenuManager.m`

**Type** : RCTBridgeModule

**Description** : Gestion et affichage de menus contextuels dynamiques.

**Méthodes exportées** :
- `showMenu(items, position)` - Affiche un menu contextuel

**Fonctionnalités** :
- Création dynamique de menus
- Activation/désactivation d'éléments
- Positionnement personnalisé

---

### TextInputSearch

**Fichier** : `macos/LegendMusic-macOS/TextInputSearch/TextInputSearch.m`

**Type** : RCTViewManager

**Description** : Wrapper autour de NSSearchField pour créer un champ de recherche natif macOS.

**Méthodes exportées** :
- `focus()` - Donne le focus au champ

**Propriétés** :
- `onChangeText` - Callback lors du changement de texte
- `placeholder` - Texte placeholder
- `defaultText` - Texte par défaut
- `text` - Texte actuel

**Fonctionnalités** :
- Gestion personnalisée des touches fléchées
- Notifications de changement de texte

---

### RNSplitView

**Fichier** : `macos/LegendMusic-macOS/SplitView/RNSplitView.m`

**Type** : RCTViewManager (sous-classe de NSSplitView)

**Description** : Composant split view vertical avec gestion du diviseur.

**Propriétés** :
- `isVertical` - Orientation verticale
- `dividerThickness` - Épaisseur du diviseur
- `onSplitViewDidResize` - Callback lors du redimensionnement

**Fonctionnalités** :
- Positionnement contraint du diviseur
- Suivi de la taille des sous-vues
- Notifications de redimensionnement

---

### AppExit

**Fichier** : `macos/LegendMusic-macOS/AppExit/AppExit.m`

**Type** : RCTEventEmitter

**Description** : Gestion des événements de fermeture de l'application.

**Méthodes exportées** :
- `completeExit()` - Confirme la fermeture de l'application

**Événements émis** :
- `onAppExit` - Déclenché lors de la demande de fermeture

---

## Modules Swift

### RNKeyboardManager

**Fichier** : `macos/LegendMusic-macOS/KeyboardManager/RNKeyboardManager.swift`

**Type** : RCTEventEmitter

**Description** : Monitoring des événements clavier incluant les touches standard et les touches média (play/pause, suivant, précédent).

**Méthodes exportées** :
- `startMonitoringKeyboard()` - Démarre la surveillance du clavier
- `stopMonitoringKeyboard()` - Arrête la surveillance
- `respondToKeyEvent(response)` - Répond à un événement clavier

**Événements émis** :
- `onKeyDown` - Touche pressée
- `onKeyUp` - Touche relâchée
- `keyboardEventResponse` - Réponse à un événement

**Dépendances** : KeyboardManager.swift (singleton pour le monitoring local)

---

### FileSystemWatcher

**Fichier** : `macos/LegendMusic-macOS/FileSystemWatcher/FileSystemWatcher.swift`

**Type** : RCTEventEmitter

**Description** : Surveillance de répertoires utilisant l'API FSEvents pour détecter les changements du système de fichiers.

**Méthodes exportées** :
- `setWatchedDirectories(paths)` - Définit les répertoires à surveiller
- `isWatchingDirectory(path)` - Vérifie si un répertoire est surveillé

**Événements émis** :
- `onDirectoryChanged` - Répertoire modifié

**Fonctionnalités** :
- Surveillance de plusieurs répertoires
- Détection du type d'opération (ajout, suppression, modification)
- Debouncing des événements

---

### WindowControls

**Fichier** : `macos/LegendMusic-macOS/WindowControls/WindowControls.swift`

**Type** : RCTEventEmitter

**Description** : Gestion des boutons de contrôle de fenêtre et détection de l'état plein écran.

**Méthodes exportées** :
- `hideWindowControls()` - Cache les boutons de fenêtre
- `showWindowControls()` - Affiche les boutons de fenêtre
- `isWindowFullScreen()` - Vérifie l'état plein écran

**Événements émis** :
- `fullscreenChange` - Changement d'état plein écran

**Fonctionnalités** :
- Afficher/masquer les boutons (fermer, minimiser, zoom)
- Suivi de l'état plein écran

---

### RNSFSymbol

**Fichier** : `macos/LegendMusic-macOS/SFSymbol/SFSymbol.swift`

**Type** : RCTViewManager

**Description** : Rendu des SF Symbols macOS (icônes système) avec styling personnalisable.

**Propriétés** :
- `name` - Nom du symbole SF
- `color` - Couleur (hex ou RGB)
- `scale` - Échelle (small/medium/large)
- `size` - Taille personnalisée
- `yOffset` - Décalage vertical

**Fonctionnalités** :
- Support des couleurs hex et RGB
- Ajustement de l'échelle
- Dimensionnement personnalisé
- Centrage du rect d'alignement

---

### RNGlassEffectView

**Fichier** : `macos/LegendMusic-macOS/GlassEffect/GlassEffectView.swift`

**Type** : RCTViewManager

**Description** : Composant d'effet verre/vibrancy natif macOS (apparence givrée).

**Propriétés** :
- `glassStyle` - Style de verre ("regular" ou "clear")
- `tintColor` - Couleur de teinte

**Fonctionnalités** :
- Styles "regular" et "clear"
- Couleurs de teinte personnalisées
- Styling spécifique macOS 26.0+

---

### LMSidebar & LMSidebarItem

**Fichier** : `macos/LegendMusic-macOS/Sidebar/SidebarView.swift`

**Type** : RCTViewManager

**Description** : Composant sidebar personnalisé avec éléments sélectionnables.

**Propriétés Sidebar** :
- `items` - Liste des éléments
- `selectedId` - ID de l'élément sélectionné
- `contentInsetTop` - Marge intérieure supérieure
- `onSidebarSelectionChange` - Callback de changement de sélection
- `onSidebarLayout` - Callback de layout

**Propriétés SidebarItem** :
- `itemId` - Identifiant de l'élément
- `selectable` - Élément sélectionnable
- `rowHeight` - Hauteur de la ligne
- `onRightClick` - Callback de clic droit

**Fonctionnalités** :
- Support du menu contextuel (clic droit)
- Hauteurs de ligne dynamiques
- Suivi de la sélection

---

### RNSidebarSplitView

**Fichier** : `macos/LegendMusic-macOS/SidebarSplitView/SidebarSplitView.swift`

**Type** : RCTViewManager

**Description** : Layout split view combinant une sidebar et une zone de contenu avec dimensionnement configurable.

**Propriétés** :
- `onSplitViewDidResize` - Callback de redimensionnement
- `sidebarMinWidth` - Largeur minimum de la sidebar
- `contentMinWidth` - Largeur minimum du contenu

**Fonctionnalités** :
- Largeurs minimum configurables
- Notifications de redimensionnement
- Support du layout pleine hauteur

---

### RNDragDrop & RNTrackDragSource

**Fichier** : `macos/LegendMusic-macOS/DragDrop/DragDropView.swift`

**Type** : RCTViewManager

**Description** : Support du drag & drop pour les fichiers audio et les objets track personnalisés.

**Propriétés DragDrop** :
- `allowedFileTypes` - Types de fichiers autorisés
- `onDragEnter` - Callback d'entrée de drag
- `onDragLeave` - Callback de sortie de drag
- `onDrop` - Callback de drop
- `onTrackDragEnter` - Callback d'entrée de drag de track
- `onTrackDragLeave` - Callback de sortie de drag de track
- `onTrackDragHover` - Callback de survol de drag de track
- `onTrackDrop` - Callback de drop de track

**Propriétés TrackDragSource** :
- `trackPayload` - Données de la track à glisser
- `onDragStart` - Callback de début de drag

**Fonctionnalités** :
- Filtrage par type de fichier audio
- Support du drag de payload track
- Suivi du survol
- Gestion du drop de répertoires

---

### ID3TagEditorBridge

**Fichier** : `macos/LegendMusic-macOS/AudioPlayer/ID3TagEditorBridge.swift`

**Type** : Classe Swift (bridge interne)

**Description** : Lecture et écriture des tags ID3 pour les fichiers MP3.

**Méthodes** :
- `readTags(path)` - Lit les tags d'un fichier
- `writeTags(path, tags)` - Écrit les tags dans un fichier

**Fonctionnalités** :
- Extraction de titre, artiste, album, durée
- Extraction de pochette d'album (préférence pour la couverture frontale)
- Gestion des pochettes en base64
- Création de tags pour les nouveaux fichiers
- Écriture sécurisée via fichier temporaire

---

## Statistiques

| Catégorie | Nombre |
|-----------|--------|
| **Total des modules** | 18 |
| **Modules Objective-C** | 9 |
| **Modules Swift** | 9 |
| **RCTEventEmitter** | 7 |
| **RCTViewManager** | 8 |
| **RCTBridgeModule** | 2 |

---

## Architecture

```
macos/LegendMusic-macOS/
├── AppExit/
│   ├── AppExit.h
│   └── AppExit.m
├── AudioPlayer/
│   ├── AudioPlayer.h
│   ├── AudioPlayer.m
│   └── ID3TagEditorBridge.swift
├── AutoUpdater/
│   ├── AutoUpdater.h
│   └── AutoUpdater.m
├── ContextMenuManager/
│   ├── ContextMenuManager.h
│   └── ContextMenuManager.m
├── DragDrop/
│   └── DragDropView.swift
├── FileDialog/
│   ├── FileDialog.h
│   └── FileDialog.m
├── FileSystemWatcher/
│   └── FileSystemWatcher.swift
├── GlassEffect/
│   └── GlassEffectView.swift
├── KeyboardManager/
│   ├── KeyboardManager.swift
│   └── RNKeyboardManager.swift
├── MenuEvents/
│   ├── MenuEvents.h
│   └── MenuEvents.m
├── SFSymbol/
│   └── SFSymbol.swift
├── Sidebar/
│   └── SidebarView.swift
├── SidebarSplitView/
│   └── SidebarSplitView.swift
├── SplitView/
│   ├── RNSplitView.h
│   └── RNSplitView.m
├── TextInputSearch/
│   ├── TextInputSearch.h
│   └── TextInputSearch.m
├── WindowControls/
│   └── WindowControls.swift
└── WindowManager/
    ├── WindowManager.h
    └── WindowManager.m
```

---

## Utilisation côté JavaScript

Les modules natifs sont accessibles via `NativeModules` de React Native :

```typescript
import { NativeModules, NativeEventEmitter } from 'react-native';

// Accès aux modules
const { WindowManager, AudioPlayer, FileDialog } = NativeModules;

// Écoute des événements
const windowEmitter = new NativeEventEmitter(WindowManager);
windowEmitter.addListener('onWindowClosed', (event) => {
    console.log('Window closed:', event);
});

// Appel de méthodes
await FileDialog.open({ allowsMultipleSelection: true });
```

Les composants UI natifs sont utilisables comme des composants React Native standard :

```tsx
import { requireNativeComponent } from 'react-native';

const SFSymbol = requireNativeComponent('RNSFSymbol');
const GlassEffectView = requireNativeComponent('RNGlassEffectView');

// Utilisation
<SFSymbol name="play.fill" color="#ffffff" size={24} />
<GlassEffectView glassStyle="regular">
    {children}
</GlassEffectView>
```
