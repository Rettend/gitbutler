import { defaultFileIcon, fileIcons } from '$components/file/fileIcons';
import {
	symbolFileExtensionsToIcons,
	symbolFileNamesToIcons,
	lightFileExtensionsToIcons,
	lightFileNamesToIcons
} from '$components/file/typeMap';
import { convertToBase64 } from '$lib/utils/convertToBase64';

export type Theme = 'light' | 'dark';

export function getFileIcon(fileName: string, theme: Theme = 'dark') {
	fileName = fileName.toLowerCase();
	const splitName = fileName.split('.');
	let iconName = '';
	let lightIconName = '';
	const isLight = theme === 'light';

	while (splitName.length) {
		const curName = splitName.join('.');

		if (symbolFileNamesToIcons[curName]) {
			iconName = symbolFileNamesToIcons[curName] ?? '';
			if (isLight && lightFileNamesToIcons[curName]) {
				lightIconName = lightFileNamesToIcons[curName];
			}
			break;
		}

		if (symbolFileExtensionsToIcons[curName]) {
			iconName = symbolFileExtensionsToIcons[curName] ?? '';
			if (isLight && lightFileExtensionsToIcons[curName]) {
				lightIconName = lightFileExtensionsToIcons[curName];
			}
			break;
		}

		splitName.shift();
	}

	const finalIconName = isLight && lightIconName ? lightIconName : iconName || defaultFileIcon;

	let icon = fileIcons[finalIconName];
	if (!icon) {
		icon = fileIcons[iconName] || (fileIcons[defaultFileIcon] as string);
	}

	return `data:image/svg+xml;base64,${convertToBase64(icon)}`;
}
