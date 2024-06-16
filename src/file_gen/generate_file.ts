import path from 'path';
import * as p from '@clack/prompts';
import fs from 'fs-extra';
import color from 'picocolors';

const ProjectType = [
	{
		value: 'django',
		label: 'Django'
	},
	{
		value: 'nextjs',
		label: 'Next.js'
	}
];

export const generate_files = async (CURRENT_EXEC_DIR: string) => {
	// print "about to generate file for current project:"
	const current_project_name = path.basename(CURRENT_EXEC_DIR);
	p.note(`Generating file for project: ${color.green(current_project_name)}`);

	// prompt project type: django, nextjs ?
	const project_type_selected = await p.select({
		message: `Pick which type of project you want to create`,
		options: ProjectType
	});

	p.note(`Project type selected: ${color.green(project_type_selected as string)}`);

	// if django
	if (project_type_selected == 'django') {
		handleDjango(CURRENT_EXEC_DIR);
	}
};

const handleDjango = async (CURRENT_EXEC_DIR: string) => {
	// multi-select the apps where the file will be generated

	// read folders, exclude folder like .git, .venv, .vscode,
	// templates, static,node_modules
	const folder_to_exclude = [
		'.git',
		'.venv',
		'.vscode',
		'templates',
		'static',
		'node_modules',
		'img'
	];
	const app_names = fs
		.readdirSync(CURRENT_EXEC_DIR)
		.filter((f) => fs.statSync(path.join(CURRENT_EXEC_DIR, f)).isDirectory())
		.filter((f) => !folder_to_exclude.includes(f));

	const selected_apps = await p.multiselect({
		message: 'Select apps to generate files',
		options: app_names.map((app) => ({
			value: app,
			label: app
		}))
	});

	for (const app_name of selected_apps as string[]) {
		// multi-select what files to generate: urls.py, serializers.py etc.
		const files_to_generate = await p.multiselect({
			message: `Select files to generate for app: ${color.yellow(app_name as string)}`,
			options: [
				{
					value: 'urls.py',
					label: 'urls.py'
				},
				{
					value: 'serializers.py',
					label: 'serializers.py'
				}
			]
		});

		// if not selected any return
		if ((files_to_generate as string[]).length === 0) {
			p.cancel('No files selected');
		}

		p.note(`Files to generate: ${color.gray(files_to_generate.toString())}`);

		// generate the files

		for (const file of files_to_generate as string[]) {
			const file_path = path.join(CURRENT_EXEC_DIR, app_name as string, file);
			const file_content = ``;
			fs.writeFileSync(file_path, file_content);
		}

		p.note('Files generated successfully for app: ' + color.cyan(app_name));
	}
	p.note(color.green('All files generated successfully'));
};
