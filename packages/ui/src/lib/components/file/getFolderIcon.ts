import {
	defaultFolderIcon,
	defaultFolderIconOpen,
	folderIcons,
	folderIconsOpen
} from '$components/file/folderIcons';
import {
	folderNamesToIcons,
	folderNamesToIconsOpen,
	lightFolderNamesToIcons,
	lightFolderNamesToIconsOpen
} from '$components/file/typeMap';
import { convertToBase64 } from '$lib/utils/convertToBase64';

export type Theme = 'light' | 'dark';

export function getFolderIcon(folderName: string, isOpen = false, theme: Theme = 'dark') {
	folderName = folderName.toLowerCase();
	const isLight = theme === 'light';

	let iconName = '';
	let lightIconName = '';

	if (isOpen) {
		iconName = folderNamesToIconsOpen[folderName] ?? '';
		if (isLight) {
			lightIconName = lightFolderNamesToIconsOpen[folderName] ?? '';
		}

		const finalIconName = isLight && lightIconName ? lightIconName : iconName;

		if (finalIconName && folderIconsOpen[finalIconName]) {
			return `data:image/svg+xml;base64,${convertToBase64(folderIconsOpen[finalIconName])}`;
		}
		if (iconName && folderIconsOpen[iconName]) {
			return `data:image/svg+xml;base64,${convertToBase64(folderIconsOpen[iconName])}`;
		}
	}

	iconName = folderNamesToIcons[folderName] ?? '';
	if (isLight) {
		lightIconName = lightFolderNamesToIcons[folderName] ?? '';
	}

	const iconMap = isOpen ? folderIconsOpen : folderIcons;
	const defaultIcon = isOpen ? defaultFolderIconOpen : defaultFolderIcon;

	const finalIconName = isLight && lightIconName ? lightIconName : iconName;

	let icon = iconMap[finalIconName];
	if (!icon) {
		icon = iconMap[iconName];
	}
	if (!icon) {
		icon = iconMap[defaultIcon] as string;
	}

	return `data:image/svg+xml;base64,${convertToBase64(icon)}`;
}
