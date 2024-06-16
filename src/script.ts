import path from 'path';
import fs from 'fs-extra';
import * as p from '@clack/prompts';
import color from 'picocolors';
import { copy_dir } from './io/file_op';
import { execCommand } from './io/subprocess';
import { fileURLToPath } from 'url';
import { generate_files } from './file_gen/generate_file';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const SOURCE_DIR = __dirname;

const CURRENT_EXEC_DIR = process.cwd();

// Get All the sub-folder names inside 'templates' folder
const templatesPath = path.join(SOURCE_DIR, '..', 'templates');
const typesOfTemplates = fs.readdirSync(templatesPath);

async function run() {
	p.intro(`${color.bgCyan(color.black(' devsr '))}`);
	const project = await p.group({
		project_type_selected: () =>
			p.select({
				message: `Pick which type of project you want to create`,
				initialValue: typesOfTemplates[0],
				options: [
					{
						value: 'GenerateFile',
						label: 'Generate File'
					},
					...typesOfTemplates.map((type) => ({
						value: type,
						label: type
					}))
				]
			}),
		template_selected: ({ results }) => {
			const selectedTemplatePath = path.join(templatesPath, results.project_type_selected);
			if (results.project_type_selected == 'GenerateFile') return;

			const templatesOptions = fs.readdirSync(selectedTemplatePath);
			if (templatesOptions.length === 0) {
				p.cancel('No templates found');
				process.exit(0);
			}
			return p.select({
				message: 'Select files to generate',
				initialValue: templatesOptions[0],
				options: templatesOptions.map((file) => ({
					value: file,
					label: file
				}))
			});
		},
		project_name: ({ results }) => {
			if (results.project_type_selected == 'GenerateFile') return;
			return p.text({
				message: 'What is the name of your project?',
				defaultValue: '.',
				placeholder: './(current)'
			});
		}
	});

	if (project.project_type_selected == 'GenerateFile') {
		generate_files(CURRENT_EXEC_DIR);
	}

	if (project.project_type_selected == 'Web') {
		const js_dir_ignore = ['node_modules', '.next'];
		const py_dir_ignore = ['.venv', '__pycache__'];
		const web_ignore_dir_list = [...js_dir_ignore, ...py_dir_ignore];
		const web_ignore_file_list = ['db.sqlite3']; //, '.env'];
		const template_source_path = path.join(
			templatesPath,
			project.project_type_selected,
			project.template_selected as string
		);
		if (!project.project_name) {
			p.cancel('Project name is required');
			process.exit(0);
		}
		const to_be_copied_to = path.join(CURRENT_EXEC_DIR, project.project_name as string);
		// empty existing dir
		fs.emptyDirSync(to_be_copied_to);
		const s = p.spinner();
		s.start('Copying files...');
		// sleep
		await new Promise((resolve) => setTimeout(resolve, 1000));
		copy_dir(template_source_path, to_be_copied_to, web_ignore_dir_list, web_ignore_file_list);
		s.stop('Copied files.');

		if (['nextjs-trpc-auth'].includes(project.template_selected as string)) {
			// cd into project and install packages using subprocess
			process.chdir(to_be_copied_to);
			p.note(
				`Performing ${color.bgCyan(color.black(' pnpm install '))} in ${color.bgCyan(
					color.black(to_be_copied_to)
				)}`
			);
			await execCommand('pnpm install');
			await execCommand('prisma db push');
			await execCommand('prisma db seed');
			await execCommand('pnpm dev');
		}
		if (
			['django-tailwind-htmx', 'django-tailwind-htmx-rest-api'].includes(
				project.template_selected as string
			)
		) {
			// cd into project and install packages using subprocess
			process.chdir(to_be_copied_to);
			p.note(
				`Performing below commands in ${color.bgCyan(color.black(to_be_copied_to))}\n\
				${color.bgCyan(color.black('pnpm install'))}\n\
				${color.bgCyan(color.black('pipenv install'))}\n\
				${color.bgCyan(color.black('python manage.py migrate'))}\n\
				${color.bgCyan(color.black('python manage.py runserver'))}\n
				`
			);
			await execCommand('pnpm install');
			await execCommand('mkdir .venv');
			await execCommand('pipenv install');
			await execCommand('.\\.venv\\Scripts\\python.exe manage.py migrate');
			await execCommand('.\\.venv\\Scripts\\python.exe manage.py runserver');
		}
		process.exit(0);
	}

	// 		install: () =>
	// 			p.confirm({
	// 				message: 'Install dependencies?',
	// 				initialValue: false
	// 			})
	// 	},
	// 	{
	// 		onCancel: () => {
	// 			p.cancel('Operation cancelled.');
	// 			process.exit(0);
	// 		}
	// 	}
	// );

	// if (project.install) {
	// 	const s = p.spinner();
	// 	s.start('Installing via pnpm');
	// 	s.stop('Installed via pnpm');
	// }

	// let nextSteps = `cd ${project.path}        \n${project.install ? '' : 'pnpm install\n'}pnpm dev`;

	// p.note(nextSteps, 'Next steps.');
}
run();
