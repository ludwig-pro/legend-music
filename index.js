/**
 * @format
 */

import { MediaLibraryWindow } from '@/media-library/MediaLibraryWindow';
import { SettingsContainer } from '@/settings/SettingsContainer';
import { AppRegistry } from 'react-native';
import { name as appName } from './app.json';
import App from './src/App';

AppRegistry.registerComponent(appName, () => App);
AppRegistry.registerComponent('SettingsWindow', () => SettingsContainer);
AppRegistry.registerComponent('MediaLibraryWindow', () => MediaLibraryWindow);
