import path from 'path';
import fs from 'fs-extra';
import * as p from '@clack/prompts';
import color from 'picocolors';
import { copy_dir } from './io/file_op';
import { execSync } from 'child_process';
import { typesOfTemplates, templatesPath, CURRENT_EXEC_DIR } from './script';

export async function run() {
	p.intro(`${color.bgCyan(color.black(' devsr '))}`);
	const project = await p.group({
		project_type_selected: () =>
			p.select({
				message: `Pick which type of project you want to create`,
				initialValue: typesOfTemplates[0],
				options: typesOfTemplates.map((type) => ({
					value: type,
					label: type
				}))
			}),
		template_selected: ({ results }) => {
			const selectedTemplatePath = path.join(templatesPath, results.project_type_selected);
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
		project_name: () =>
			p.text({
				message: 'What is the name of your project?',
				defaultValue: '.',
				placeholder: './(current)'
			})
	});
	console.log(project.project_type_selected, project.template_selected);

	if (project.project_type_selected == 'Web') {
		const web_ignore_dir_list = ['node_modules', '.next'];
		const web_ignore_file_list = ['pnpm-lock.yaml'];
		const template_source_path = path.join(
			templatesPath,
			project.project_type_selected,
			project.template_selected as string
		);
		const to_be_copied_to = path.join(CURRENT_EXEC_DIR, project.project_name);
		const s = p.spinner();
		s.start('Copying files...');
		// sleep
		await new Promise((resolve) => setTimeout(resolve, 1000));
		copy_dir(template_source_path, to_be_copied_to, web_ignore_dir_list, web_ignore_file_list);
		s.stop('Copied files.');

		// cd into project and install packages using subprocess
		process.chdir(to_be_copied_to);
		const s2 = p.spinner();
		s2.start('Installing packages...');
		// sleep
		await new Promise((resolve) => setTimeout(resolve, 1000));
		execSync('pnpm install', {});

		s2.stop('Installed packages.');
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
	p.outro(`Problems? ${color.underline(color.cyan('https://example.com/issues'))}`);
}
