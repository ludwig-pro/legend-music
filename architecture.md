# Architecture de Legend Music

Legend Music est une application **React Native macOS** pour la gestion et lecture de bibliothèques musicales locales.

## Structure du projet

```
src/
├── App.tsx                 # Point d'entrée principal
├── systems/                # État et logique métier
│   ├── LocalMusicState.ts  # Scan de bibliothèque, cache, métadonnées
│   ├── LibraryState.ts     # Organisation (artistes, albums, playlists)
│   ├── Settings.ts         # Configuration persistante
│   ├── State.ts            # État UI runtime
│   └── MenuManager.ts      # Menus macOS
├── components/             # Composants React
│   ├── LocalAudioPlayer.tsx # État de lecture, file d'attente
│   ├── Playlist.tsx        # Liste des pistes
│   ├── PlaybackArea.tsx    # Zone "Now Playing"
│   └── PlaybackControls.tsx
├── native-modules/         # Interfaces vers les modules natifs
│   ├── AudioPlayer.ts      # Lecture audio, extraction métadonnées
│   ├── WindowManager.ts    # Gestion des fenêtres macOS
│   └── FileSystemWatcher.ts
├── settings/               # Écrans de paramètres
├── windows/                # Système de navigation multi-fenêtres
├── utils/                  # Utilitaires (JSONManager, persistence)
└── theme/                  # Thème et couleurs
```

## Gestion d'état (Legend State)

Utilise `@legendapp/state` avec des observables suffixés `$`:

| Observable | Rôle |
|------------|------|
| `settings$` | Configuration persistante (bibliothèque, UI, overlay) |
| `localMusicState$` | Pistes, progression du scan, playlists |
| `library$` | Artistes, albums, playlists organisées |
| `localPlayerState$` | État lecture (isPlaying, currentTrack, volume) |
| `queue$` | File d'attente des pistes |

**Pattern d'accès**: `useValue(observable$)` pour la réactivité dans les composants.

### Fichiers d'état clés

- **`src/systems/Settings.ts`** - Configuration app (sidebar, bibliothèque, overlay, lecture)
- **`src/systems/State.ts`** - État UI runtime (dropdowns, navigation, fenêtres)
- **`src/systems/LocalMusicState.ts`** - Données bibliothèque musicale et état de scan
- **`src/systems/LibraryState.ts`** - État UI de la médiathèque

## Architecture audio

```
Native AudioPlayer (Swift/Obj-C)
        ↓
AudioPlayer.ts (Bridge TypeScript)
        ↓
LocalAudioPlayer.tsx (État et contrôles)
```

### Fonctionnalités

- Lecture via AVPlayer natif
- Extraction métadonnées (AVAsset/AudioToolbox)
- Visualiseur FFT temps réel
- Intégration Now Playing macOS

### API de lecture

```typescript
// src/native-modules/AudioPlayer.ts
loadTrack(filePath: string): Promise<{ success, error? }>
play(): Promise<{ success, error? }>
pause(): Promise<{ success, error? }>
stop(): Promise<{ success, error? }>
seek(seconds: number): Promise<{ success, error? }>
setVolume(volume: number): Promise<{ success, error? }>
```

### Contrôles exposés

```typescript
// src/components/LocalAudioPlayer.tsx
localAudioControls = {
  togglePlayPause(),
  playNext(),
  playPrevious(),
  seek(time),
  setVolume(volume),
  toggleShuffle(),
  cycleRepeatMode(),
  queueTracks(tracks, startIndex),
  clearQueue()
}
```

## Scan de bibliothèque

### Flux de scan

1. **Initialisation** → Charge le cache si disponible
2. **Scan natif** → Parcours récursif des dossiers
3. **Extraction métadonnées** → Titre, artiste, album, artwork
4. **Mise en cache** → Persistance JSON pour démarrages rapides
5. **File watcher** → Détection des changements (debounce 2s)

### API native

```typescript
scanMediaLibrary(paths: string[], cacheDir: string, options?: {
  batchSize?: number,
  includeHidden?: boolean,
  skip?: { rootIndex, relativePath }[],
  includeArtwork?: boolean,
  allowedExtensions?: string[]
}): Promise<MediaScanResult>
```

### Événements émis

- `onMediaScanBatch` - Lot de pistes découvertes
- `onMediaScanProgress` - Progression du scan
- `onMediaScanComplete` - Scan terminé

## Modules natifs macOS

| Module | Rôle |
|--------|------|
| **AudioPlayer** | Lecture, métadonnées, FFT, Now Playing |
| **WindowManager** | Multi-fenêtres, effets de flou, niveaux |
| **FileSystemWatcher** | Surveillance des dossiers (récursif) |
| **NativeMenuManager** | Barre de menus, raccourcis clavier |
| **ContextMenu** | Menus contextuels (clic droit) |
| **FileDialog** | Sélecteur de fichiers/dossiers |
| **AutoUpdater** | Mises à jour automatiques |
| **SFSymbol** | Icônes SF Symbols macOS |
| **DragDrop** | Glisser-déposer |

### Pattern de bridge

```
NativeModules.AudioPlayer (Native Swift/Obj-C)
    ↓
src/native-modules/AudioPlayer.ts (Bridge TypeScript)
    ├─ audioPlayerApi (Wrapper typé)
    └─ NativeEventEmitter (Écoute d'événements)
    ↓
src/components/LocalAudioPlayer.tsx (Consommateur)
```

## Styling

- **NativeWind** (Tailwind pour React Native)
- Classes Tailwind directement dans les composants
- **VibrancyView** pour effets glass macOS
- Thème sombre fixe

### Exemple

```typescript
<View className="flex-1 flex-row items-stretch gap-3 px-3 py-2">
  <Text className="text-white text-sm font-semibold">Titre</Text>
</View>
```

## Patterns de composants

### Export nommé (préféré)

```typescript
export function PlaybackArea({ showBorder = true }: PlaybackAreaProps) {
  const currentTrack = useValue(localPlayerState$.currentTrack);
  return (
    <View className="flex-1 flex-row items-stretch gap-3 px-3 py-2">
      {/* ... */}
    </View>
  );
}
```

### Hooks utilisés

- `useValue()` - S'abonner aux valeurs observables
- `useCallback()` - Mémoriser les handlers
- `useState()` - État local UI uniquement
- `useMount()` - Équivalent Legend State de `useEffect(() => {}, [])`

## Séquence de démarrage

```
App.tsx
├─ initializeUpdater()
├─ initializeMenuManager()
├─ initializeLocalMusic()
├─ hydrateLibraryFromCache()
└─ Render MainContainer
   ├─ PlaybackArea
   ├─ Playlist
   └─ Windows managers (Settings, MediaLibrary, Overlay, Visualizer)
```

### Optimisation de démarrage

- `runAfterInteractions()` pour différer les initialisations non-critiques
- Marqueurs de performance (`perfMark`, `perfLog`)
- Chargement paresseux des fenêtres secondaires

## Système de fenêtres

| Fenêtre | Comportement |
|---------|--------------|
| **Main** | Toujours ouverte, redimensionnable |
| **Settings** | Fenêtre séparée, chargée à la demande |
| **MediaLibrary** | Sélecteur de dossiers optionnel |
| **CurrentSongOverlay** | Flottante, always-on-top |
| **Visualizer** | Plein écran ou fenêtré |

## Configuration du build

### Alias de chemins

```typescript
"@/*": "./src/*"
"@legend-kit/*": "./src/legend-kit/*"
```

### Plugins Babel

- `babel-plugin-react-compiler` (doit être premier)
- `module-resolver` (alias de chemins)
- `react-native-dotenv`
- `react-native-reanimated/plugin`

## Fichiers clés

| Fichier | Rôle | Taille |
|---------|------|--------|
| `src/App.tsx` | Point d'entrée, orchestration | 124 lignes |
| `src/systems/LocalMusicState.ts` | Scan, cache, métadonnées | ~1350 lignes |
| `src/systems/LibraryState.ts` | Organisation bibliothèque | ~240 lignes |
| `src/components/LocalAudioPlayer.tsx` | État lecture, file d'attente | ~800 lignes |
| `src/systems/Settings.ts` | Configuration persistante | ~130 lignes |
| `src/systems/MenuManager.ts` | Intégration menus macOS | ~240 lignes |
| `src/components/Playlist.tsx` | Vue liste des pistes | ~800 lignes |
| `src/native-modules/AudioPlayer.ts` | Interface module audio | ~175 lignes |
| `src/native-modules/WindowManager.ts` | Interface gestion fenêtres | ~250 lignes |
| `src/utils/JSONManager.ts` | Persistance état observable | ~66 lignes |
