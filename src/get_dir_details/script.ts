import path from 'path';
import * as p from '@clack/prompts';
import fs from 'fs-extra';
import color from 'picocolors';

interface ExtensionCount {
	[key: string]: number;
}

export const get_dir_details = async (CURRENT_EXEC_DIR: string) => {
	p.note(`Generating file for project: ${color.green(CURRENT_EXEC_DIR)}`);

	// Prompt the user to select which folder's stats to display
	const which_folder = await p.text({
		message: "Which folder's stats you want?",
		defaultValue: '.',
		placeholder: './(all)',
		validate(value) {
			if (!fs.existsSync(path.join(CURRENT_EXEC_DIR, value))) {
				return `Path "${value}" doesn't exist.`;
			}
			return undefined;
		}
	});

	const targetDir = path.join(CURRENT_EXEC_DIR, which_folder as string);
	p.note(`Collecting stats for folder: ${color.cyan(targetDir)}`);

	// Function to recursively read directory and gather stats
	const getDirStats = async (
		dirPath: string,
		depth: number = 0
	): Promise<[number, ExtensionCount]> => {
		let totalItems = 0;
		const extensionCount: ExtensionCount = {};

		// Read the directory contents
		const items = await fs.readdir(dirPath, { withFileTypes: true });

		// Count file extensions for the current directory (before processing subfolders)
		for (const item of items) {
			const fullPath = path.join(dirPath, item.name);

			if (!item.isDirectory()) {
				// Count file extensions
				const ext = path.extname(item.name).toLowerCase() || 'no_extension';
				extensionCount[ext] = (extensionCount[ext] || 0) + 1;
				totalItems += 1;
			}
		}

		// Print folder name and current folder's summary
		console.log(
			`${depth > 1 ? '  '.repeat(depth) : '|'}${
				depth > 0 ? (depth == 1 ? '--' : '|--') : ''
			}${color.magenta(path.basename(dirPath))}`
		);

		console.log(
			`${'  '.repeat(depth)}${depth > 0 ? '  ' : ''}total: ${color.green(totalItems.toString())}`
		);
		for (const [ext, count] of Object.entries(extensionCount)) {
			console.log(
				`${'  '.repeat(depth)}${depth > 0 ? '  ' : ''}${color.cyan(ext)}: ${color.magenta(
					count.toString()
				)}`
			);
		}

		// Now process subdirectories
		for (const item of items) {
			const fullPath = path.join(dirPath, item.name);

			if (item.isDirectory()) {
				// Recursively handle subdirectories
				const [subTotal, subExtensionCount] = await getDirStats(fullPath, depth + 1);
				totalItems += subTotal;

				// Merge subfolder extension counts into the current folder's extension count
				for (const [ext, count] of Object.entries(subExtensionCount)) {
					extensionCount[ext] = (extensionCount[ext] || 0) + count;
				}
			}
		}

		// Return total items and extension count for this folder and subfolders
		return [totalItems, extensionCount];
	};

	// Start the recursive function
	await getDirStats(targetDir);

	p.note(color.green('Directory stats generated successfully.'));
};
