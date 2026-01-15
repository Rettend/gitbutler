/**
 * Generate Material Icon Theme icons for GitButler
 *
 * This script fetches icon data from:
 * - @iconify-json/material-icon-theme (npm) - SVG icon bodies
 * - Rettend/github-material-icon-theme (GitHub) - file/folder mappings
 *
 * And generates:
 * - fileIcons.ts - SVG strings keyed by icon name
 * - folderIcons.ts - SVG strings for folder icons (closed and open)
 * - typeMap.ts - file extension/name to icon name mappings
 *
 * Run with: npx tsx scripts/generate-icons.ts
 */

import { createRequire } from 'module';
import { writeFile, mkdir, readFile, readdir } from 'fs/promises';
import { dirname, join, basename } from 'path';
import { fileURLToPath } from 'url';

const require = createRequire(import.meta.url);
const __dirname = dirname(fileURLToPath(import.meta.url));

// Data sources
const MATERIAL_ICONS_URL =
	'https://raw.githubusercontent.com/Rettend/github-material-icon-theme/main/download/material-icons.json';
const LANGUAGE_MAP_URL =
	'https://raw.githubusercontent.com/Rettend/github-material-icon-theme/main/download/language-map.json';

// Output paths
const OUTPUT_DIR = join(__dirname, '../src/lib/components/file');

// Custom icons directory (for GitButler-specific icons not in material-icon-theme)
const CUSTOM_ICONS_DIR = join(__dirname, '../src/lib/assets/icons');

interface IconifyIcon {
	body: string;
	width?: number;
	height?: number;
	left?: number;
	top?: number;
}

interface IconifyData {
	prefix: string;
	icons: Record<string, IconifyIcon>;
	width?: number;
	height?: number;
}

interface LightThemeOverrides {
	fileExtensions?: Record<string, string>;
	fileNames?: Record<string, string>;
	languageIds?: Record<string, string>;
	folderNames?: Record<string, string>;
	folderNamesExpanded?: Record<string, string>;
}

interface MaterialIcons {
	iconDefinitions: Record<string, unknown>;
	fileExtensions: Record<string, string>;
	fileNames: Record<string, string>;
	folderNames: Record<string, string>;
	folderNamesExpanded: Record<string, string>;
	languageIds: Record<string, string>;
	light?: LightThemeOverrides;
	file?: string;
	folder?: string;
	folderExpanded?: string;
}

interface LanguageMap {
	fileExtensions: Record<string, string>;
}

function buildSvg(
	body: string,
	width: number | undefined,
	height: number | undefined,
	left: number | undefined,
	top: number | undefined,
	defaultWidth: number,
	defaultHeight: number
): string {
	const w = width ?? defaultWidth;
	const h = height ?? defaultHeight;
	const x = left ?? 0;
	const y = top ?? 0;
	return `<svg xmlns="http://www.w3.org/2000/svg" viewBox="${x} ${y} ${w} ${h}">${body}</svg>`;
}

function escapeForTemplate(str: string): string {
	// Escape backticks and ${} for template literal safety, but we'll use single quotes
	return str.replace(/\\/g, '\\\\').replace(/'/g, "\\'");
}

// Convert icon names from material-icons.json format (underscores) to iconify format (hyphens)
function toIconifyName(name: string): string {
	return name.replace(/_/g, '-');
}

async function fetchJson<T>(url: string): Promise<T> {
	const response = await fetch(url);
	if (!response.ok) {
		throw new Error(`Failed to fetch ${url}: ${response.statusText}`);
	}
	return response.json() as Promise<T>;
}

// Load custom SVG icons from the local assets directory
async function loadCustomIcons(
	dir: string
): Promise<{ fileIcons: Record<string, string>; folderIcons: Record<string, string> }> {
	const fileIcons: Record<string, string> = {};
	const folderIcons: Record<string, string> = {};

	try {
		const files = await readdir(dir);
		for (const file of files) {
			if (!file.endsWith('.svg')) continue;

			const iconName = basename(file, '.svg');
			const svgContent = await readFile(join(dir, file), 'utf-8');
			// Clean up the SVG (remove newlines/extra whitespace for consistency)
			const cleanedSvg = svgContent.replace(/\n/g, '').replace(/\s+/g, ' ').trim();

			// Determine if it's a folder icon or file icon based on name
			if (iconName.startsWith('folder')) {
				folderIcons[iconName] = cleanedSvg;
			} else {
				fileIcons[iconName] = cleanedSvg;
			}
			console.log(`   Loaded custom icon: ${iconName}`);
		}
	} catch {
		console.log('   No custom icons directory found, skipping...');
	}

	return { fileIcons, folderIcons };
}

async function main() {
	console.log('🎨 Generating Material Icon Theme icons...\n');

	// Load iconify data from npm package
	console.log('📦 Loading @iconify-json/material-icon-theme...');
	const iconifyData: IconifyData = require('@iconify-json/material-icon-theme/icons.json');
	console.log(`   Found ${Object.keys(iconifyData.icons).length} icons`);

	// Fetch mappings from GitHub
	console.log('🌐 Fetching material-icons.json from GitHub...');
	const materialIcons = await fetchJson<MaterialIcons>(MATERIAL_ICONS_URL);
	console.log(`   Found ${Object.keys(materialIcons.fileExtensions).length} file extensions`);
	console.log(`   Found ${Object.keys(materialIcons.fileNames).length} file names`);
	console.log(`   Found ${Object.keys(materialIcons.folderNames).length} folder names`);

	console.log('🌐 Fetching language-map.json from GitHub...');
	const languageMap = await fetchJson<LanguageMap>(LANGUAGE_MAP_URL);
	console.log(`   Found ${Object.keys(languageMap.fileExtensions).length} language extensions`);

	// Load custom local icons
	console.log('📦 Loading custom local icons...');
	const customIcons = await loadCustomIcons(CUSTOM_ICONS_DIR);

	// Build file icons
	console.log('\n📁 Generating fileIcons.ts...');
	const fileIcons: Record<string, string> = {};
	const usedIconNames = new Set<string>();

	// Collect all icon names used in mappings
	for (const iconName of Object.values(materialIcons.fileExtensions)) {
		usedIconNames.add(iconName);
	}
	for (const iconName of Object.values(materialIcons.fileNames)) {
		usedIconNames.add(iconName);
	}
	for (const iconName of Object.values(materialIcons.languageIds)) {
		usedIconNames.add(iconName);
	}

	if (materialIcons.light) {
		for (const iconName of Object.values(materialIcons.light.fileExtensions || {})) {
			usedIconNames.add(iconName);
		}
		for (const iconName of Object.values(materialIcons.light.fileNames || {})) {
			usedIconNames.add(iconName);
		}
		for (const iconName of Object.values(materialIcons.light.languageIds || {})) {
			usedIconNames.add(iconName);
		}
	}

	// Add default file icon
	const defaultFileIcon = materialIcons.file || 'file';
	usedIconNames.add(defaultFileIcon);

	// Build SVG strings for used icons
	for (const iconName of usedIconNames) {
		const iconifyKey = toIconifyName(iconName);
		const iconData = iconifyData.icons[iconifyKey];
		if (iconData) {
			fileIcons[iconName] = buildSvg(
				iconData.body,
				iconData.width,
				iconData.height,
				iconData.left,
				iconData.top,
				iconifyData.width ?? 32,
				iconifyData.height ?? 32
			);
		}
	}
	console.log(`   Generated ${Object.keys(fileIcons).length} file icons`);

	// Merge custom file icons (these override any existing icons with the same name)
	for (const [iconName, svg] of Object.entries(customIcons.fileIcons)) {
		fileIcons[iconName] = svg;
	}
	if (Object.keys(customIcons.fileIcons).length > 0) {
		console.log(`   Added ${Object.keys(customIcons.fileIcons).length} custom file icons`);
	}

	// Build folder icons (closed and open)
	console.log('📂 Generating folderIcons.ts...');
	const folderIcons: Record<string, string> = {};
	const folderIconsOpen: Record<string, string> = {};
	const usedFolderNames = new Set<string>();

	for (const iconName of Object.values(materialIcons.folderNames)) {
		usedFolderNames.add(iconName);
	}
	for (const iconName of Object.values(materialIcons.folderNamesExpanded)) {
		usedFolderNames.add(iconName);
	}

	if (materialIcons.light) {
		for (const iconName of Object.values(materialIcons.light.folderNames || {})) {
			usedFolderNames.add(iconName);
		}
		for (const iconName of Object.values(materialIcons.light.folderNamesExpanded || {})) {
			usedFolderNames.add(iconName);
		}
	}

	// Add default folder icons
	const defaultFolder = materialIcons.folder || 'folder';
	const defaultFolderOpen = materialIcons.folderExpanded || 'folder-open';
	usedFolderNames.add(defaultFolder);
	usedFolderNames.add(defaultFolderOpen);

	for (const iconName of usedFolderNames) {
		const iconifyKey = toIconifyName(iconName);
		const iconData = iconifyData.icons[iconifyKey];
		if (iconData) {
			// Determine if it's an open or closed icon
			if (iconName.includes('-open') || iconName.includes('expanded')) {
				folderIconsOpen[iconName] = buildSvg(
					iconData.body,
					iconData.width,
					iconData.height,
					iconData.left,
					iconData.top,
					iconifyData.width ?? 32,
					iconifyData.height ?? 32
				);
			} else {
				folderIcons[iconName] = buildSvg(
					iconData.body,
					iconData.width,
					iconData.height,
					iconData.left,
					iconData.top,
					iconifyData.width ?? 32,
					iconifyData.height ?? 32
				);
			}
		}
	}
	console.log(`   Generated ${Object.keys(folderIcons).length} closed folder icons`);
	console.log(`   Generated ${Object.keys(folderIconsOpen).length} open folder icons`);

	// Merge custom folder icons
	for (const [iconName, svg] of Object.entries(customIcons.folderIcons)) {
		// If name ends with -open, add to folderIconsOpen, otherwise folderIcons
		if (iconName.endsWith('-open') || iconName.endsWith('_open')) {
			folderIconsOpen[iconName] = svg;
		} else {
			folderIcons[iconName] = svg;
		}
	}
	if (Object.keys(customIcons.folderIcons).length > 0) {
		console.log(`   Added ${Object.keys(customIcons.folderIcons).length} custom folder icons`);
	}

	// Build type maps
	console.log('🗺️  Generating typeMap.ts...');

	// File extensions from materialIcons
	const symbolFileExtensionsToIcons: Record<string, string> = { ...materialIcons.fileExtensions };

	// File names from materialIcons
	const symbolFileNamesToIcons: Record<string, string> = { ...materialIcons.fileNames };

	// Merge language-map extensions (only if not already defined and if languageId has an icon)
	for (const [ext, lang] of Object.entries(languageMap.fileExtensions)) {
		if (!symbolFileExtensionsToIcons[ext] && materialIcons.languageIds[lang]) {
			symbolFileExtensionsToIcons[ext] = materialIcons.languageIds[lang];
		}
	}

	// Inject mappings for custom icons (e.g. svelte_js -> svelte.js or svelte-js -> svelte.js)
	for (const iconName of Object.keys(customIcons.fileIcons)) {
		if (iconName.includes('_')) {
			// e.g. svelte_js -> svelte.js
			const ext = iconName.replace(/_/g, '.');
			symbolFileExtensionsToIcons[ext] = iconName;
			console.log(`   Added custom mapping: .${ext} -> ${iconName}`);
		} else if (iconName.includes('-')) {
			// e.g. svelte-js -> svelte.js
			const ext = iconName.replace(/-/g, '.');
			symbolFileExtensionsToIcons[ext] = iconName;
			console.log(`   Added custom mapping: .${ext} -> ${iconName}`);
		}
	}

	// Folder mappings
	const folderNamesToIcons: Record<string, string> = { ...materialIcons.folderNames };
	const folderNamesToIconsOpen: Record<string, string> = { ...materialIcons.folderNamesExpanded };

	// Light mappings
	const lightFileExtensionsToIcons: Record<string, string> = {
		...materialIcons.light?.fileExtensions
	};
	const lightFileNamesToIcons: Record<string, string> = { ...materialIcons.light?.fileNames };
	const lightLanguageIdsToIcons: Record<string, string> = { ...materialIcons.light?.languageIds };
	const lightFolderNamesToIcons: Record<string, string> = { ...materialIcons.light?.folderNames };
	const lightFolderNamesToIconsOpen: Record<string, string> = {
		...materialIcons.light?.folderNamesExpanded
	};

	console.log(`   ${Object.keys(symbolFileExtensionsToIcons).length} file extension mappings`);
	console.log(`   ${Object.keys(symbolFileNamesToIcons).length} file name mappings`);
	console.log(`   ${Object.keys(folderNamesToIcons).length} folder name mappings`);
	console.log(
		`   ${Object.keys(lightFileExtensionsToIcons).length} light mode file extension overrides`
	);
	console.log(`   ${Object.keys(lightFileNamesToIcons).length} light mode file name overrides`);
	console.log(`   ${Object.keys(lightFolderNamesToIcons).length} light mode folder name overrides`);

	// Ensure output directory exists
	await mkdir(OUTPUT_DIR, { recursive: true });

	// Write fileIcons.ts
	const fileIconsContent = `// Auto-generated by scripts/generate-icons.ts
// Source: @iconify-json/material-icon-theme + Rettend/github-material-icon-theme
// Do not edit manually!

export const fileIcons: Record<string, string> = {
${Object.entries(fileIcons)
	.sort(([a], [b]) => a.localeCompare(b))
	.map(([name, svg]) => `\t'${name}': '${escapeForTemplate(svg)}'`)
	.join(',\n')}
};

export const defaultFileIcon = '${defaultFileIcon}';
`;

	await writeFile(join(OUTPUT_DIR, 'fileIcons.ts'), fileIconsContent, 'utf-8');
	console.log(`   Wrote fileIcons.ts (${Object.keys(fileIcons).length} icons)`);

	// Write folderIcons.ts
	const folderIconsContent = `// Auto-generated by scripts/generate-icons.ts
// Source: @iconify-json/material-icon-theme + Rettend/github-material-icon-theme
// Do not edit manually!

export const folderIcons: Record<string, string> = {
${Object.entries(folderIcons)
	.sort(([a], [b]) => a.localeCompare(b))
	.map(([name, svg]) => `\t'${name}': '${escapeForTemplate(svg)}'`)
	.join(',\n')}
};

export const folderIconsOpen: Record<string, string> = {
${Object.entries(folderIconsOpen)
	.sort(([a], [b]) => a.localeCompare(b))
	.map(([name, svg]) => `\t'${name}': '${escapeForTemplate(svg)}'`)
	.join(',\n')}
};

export const defaultFolderIcon = '${defaultFolder}';
export const defaultFolderIconOpen = '${defaultFolderOpen}';
`;

	await writeFile(join(OUTPUT_DIR, 'folderIcons.ts'), folderIconsContent, 'utf-8');
	console.log(
		`   Wrote folderIcons.ts (${Object.keys(folderIcons).length} + ${Object.keys(folderIconsOpen).length} icons)`
	);

	// Write typeMap.ts
	const typeMapContent = `// Auto-generated by scripts/generate-icons.ts
// Source: Rettend/github-material-icon-theme
// Do not edit manually!

export const symbolFileExtensionsToIcons: Record<string, string> = {
${Object.entries(symbolFileExtensionsToIcons)
	.sort(([a], [b]) => a.localeCompare(b))
	.map(([ext, icon]) => `\t'${ext}': '${icon}'`)
	.join(',\n')}
};

export const symbolFileNamesToIcons: Record<string, string> = {
${Object.entries(symbolFileNamesToIcons)
	.sort(([a], [b]) => a.localeCompare(b))
	.map(([name, icon]) => `\t'${name}': '${icon}'`)
	.join(',\n')}
};

export const folderNamesToIcons: Record<string, string> = {
${Object.entries(folderNamesToIcons)
	.sort(([a], [b]) => a.localeCompare(b))
	.map(([name, icon]) => `\t'${name}': '${icon}'`)
	.join(',\n')}
};

export const folderNamesToIconsOpen: Record<string, string> = {
${Object.entries(folderNamesToIconsOpen)
	.sort(([a], [b]) => a.localeCompare(b))
	.map(([name, icon]) => `\t'${name}': '${icon}'`)
	.join(',\n')}
};

// Light mode overrides - use these to get alternate icon names for light theme
export const lightFileExtensionsToIcons: Record<string, string> = {
${Object.entries(lightFileExtensionsToIcons)
	.sort(([a], [b]) => a.localeCompare(b))
	.map(([ext, icon]) => `\t'${ext}': '${icon}'`)
	.join(',\n')}
};

export const lightFileNamesToIcons: Record<string, string> = {
${Object.entries(lightFileNamesToIcons)
	.sort(([a], [b]) => a.localeCompare(b))
	.map(([name, icon]) => `\t'${name}': '${icon}'`)
	.join(',\n')}
};

export const lightLanguageIdsToIcons: Record<string, string> = {
${Object.entries(lightLanguageIdsToIcons)
	.sort(([a], [b]) => a.localeCompare(b))
	.map(([name, icon]) => `\t'${name}': '${icon}'`)
	.join(',\n')}
};

export const lightFolderNamesToIcons: Record<string, string> = {
${Object.entries(lightFolderNamesToIcons)
	.sort(([a], [b]) => a.localeCompare(b))
	.map(([name, icon]) => `\t'${name}': '${icon}'`)
	.join(',\n')}
};

export const lightFolderNamesToIconsOpen: Record<string, string> = {
${Object.entries(lightFolderNamesToIconsOpen)
	.sort(([a], [b]) => a.localeCompare(b))
	.map(([name, icon]) => `\t'${name}': '${icon}'`)
	.join(',\n')}
};
`;

	await writeFile(join(OUTPUT_DIR, 'typeMap.ts'), typeMapContent, 'utf-8');
	console.log(`   Wrote typeMap.ts`);

	console.log('\n✅ Done! Material icons generated successfully.');
	console.log(`   Output: ${OUTPUT_DIR}`);
}

main().catch((error) => {
	console.error('❌ Error generating icons:', error);
	process.exit(1);
});
