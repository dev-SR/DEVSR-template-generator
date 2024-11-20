import path from 'path';
import fs from 'fs-extra';
import * as p from '@clack/prompts';
import color from 'picocolors';
import {copy_dir} from './io/file_op';
import {execCommand} from './io/subprocess';
import {fileURLToPath} from 'url';
import {generate_files} from './file_gen/generate_file';
import {get_dir_details} from './get_dir_details/script';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const SOURCE_DIR = __dirname;

export const CURRENT_EXEC_DIR = process.cwd();

// Get All the sub-folder names inside 'templates' folder
export const templatesPath = path.join(SOURCE_DIR,'..','templates');
export const typesOfTemplates = fs.readdirSync(templatesPath);

async function run() {
	p.intro(`${color.bgCyan(color.black(' devsr '))}`);

	const operation_option_selected = await p.select({
		message: `Pick which type of operation you want to create`,
		initialValue: 'ProjectTemplates',
		options: [
			{
				value: 'dir_details',
				label: 'Get dir details'
			},
			{
				value: 'ProjectTemplates',
				label: 'Project Templates'
			},
			{
				value: 'GenerateFile',
				label: 'Generate File'
			},
			{
				value: 'DownloadYTVideo',
				label: 'Download Youtube Video'
			}
			// // web template generation options:
			// ...typesOfTemplates.map((type) => ({
			// 	value: type,
			// 	label: `${type} template generation`
			// }))
		]
	});
	if(operation_option_selected == 'dir_details') {
		get_dir_details(CURRENT_EXEC_DIR);
	}
	if(operation_option_selected == 'GenerateFile') {
		generate_files(CURRENT_EXEC_DIR);
	}

	if(operation_option_selected == 'DownloadYTVideo') {
		await p.group({
			get_link: () =>
				p.text({
					message: 'Paste youtube link here',
					placeholder: '[youtube link]'
				}),
			is_show_info: () => p.confirm({
				message: 'Do you want to show info?',
				initialValue: false
			}),
			show_info: async ({results}) => {
				if(!results.is_show_info) return;
				// await execCommand(`youtube-dl --cookies "D:\\Others\\yt-dl\\www.youtube.com_cookies.txt" --user-agent "Mozilla/5.0 (Android 14; Mobile; rv:128.0) Gecko/128.0 Firefox/128.0" -F ${results.get_link as string}`);
				await execCommand(`yt-dlp -F ${results.get_link as string}`);
			},
			is_playlist: () => p.confirm({
				message: 'Is this a playlist?',
				initialValue: false
			}),
			get_rez: () =>
				// p.text({
				// 	message: 'Select audio and video code (video first)',
				// 	placeholder: 'i.e 270+343'
				// }),
				p.text({
					message: 'What resolution do you want to download?',
					placeholder: "720(default)",
					defaultValue: "720"
				}),
			download: async ({results}) => {
				// await execCommand(`youtube-dl --cookies "D:\\Others\\yt-dl\\www.youtube.com_cookies.txt" --ffmpeg-location "D:\\Others\\yt-dl" --user-agent "Mozilla/5.0 (Android 14; Mobile; rv:128.0) Gecko/128.0 Firefox/128.0" ${results.get_link} -f ${results.get_code}`)
				try {

					if(!results.is_playlist) {
						await execCommand(`yt-dlp --output "%(uploader|Unknown)s-%(title)s.%(ext)s" -S "res:${results.get_rez}" ${results.get_link}`)
					}
					else {
						await execCommand(`yt-dlp --output "%(playlist)s/%(playlist_index)s - %(title)s.%(ext)s" -S "res:${results.get_rez}" --yes-playlist ${results.get_link}`)
					}
				} catch(error) {
					console.error(error)

				}
			}
		});
	}

	if(operation_option_selected == 'ProjectTemplates') {
		const project_type = await p.select({
			message: `Pick Project type`,
			initialValue: typesOfTemplates[1],
			options: [
				// web template generation options:
				...typesOfTemplates.map((type) => ({
					value: type,
					label: `${type} template generation`
				}))
			]
		});

		const selectedTemplatePath = path.join(templatesPath,project_type as string);

		const templatesOptions = fs.readdirSync(selectedTemplatePath);
		if(templatesOptions.length === 0) {
			p.cancel('No templates found');
			process.exit(0);
		}
		const project_template_selected = await p.select({
			message: 'Select a template',
			initialValue: templatesOptions[0],
			options: templatesOptions.map((file) => ({
				value: file,
				label: file
			}))
		});

		const project_name = await p.text({
			message: 'What is the name of your project?',
			defaultValue: '.',
			placeholder: './(current)'
		});

		if(project_type == 'Web') {
			const js_dir_ignore = ['node_modules','.next'];
			const py_dir_ignore = ['.venv','__pycache__'];
			const web_ignore_dir_list = [...js_dir_ignore,...py_dir_ignore];
			const web_ignore_file_list = ['db.sqlite3']; //, '.env'];
			const template_source_path = path.join(
				templatesPath,
				project_type,
				project_template_selected as string
			);
			if(!project_name) {
				p.cancel('operation name is required');
				process.exit(0);
			}
			const to_be_copied_to = path.join(CURRENT_EXEC_DIR,project_name as string);
			// empty existing dir
			fs.emptyDirSync(to_be_copied_to);
			const s = p.spinner();
			s.start('Copying files...');
			// sleep
			await new Promise((resolve) => setTimeout(resolve,1000));
			copy_dir(template_source_path,to_be_copied_to,web_ignore_dir_list,web_ignore_file_list);
			s.stop('Copied files.');

			if(['nextjs-trpc-auth'].includes(project_template_selected as string)) {
				// cd into operation and install packages using subprocess
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

			if(['nextjs-trpc-auth'].includes(project_template_selected as string)) {
				// cd into operation and install packages using subprocess
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
			if(
				['django-tailwind-htmx','django-tailwind-htmx-rest-api'].includes(
					project_template_selected as string
				)
			) {
				// cd into operation and install packages using subprocess
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
		}

		console.log(operation_option_selected);
	}

	// const operation = await p.group({
	// 	// STEP 1: OPTION
	// 	// operation_type_selected: () =>

	// 	// 	}),
	// 	template_selected: ({ results }) => {
	// 		if (results.operation_type_selected == 'GenerateFile') return;
	// 		if (results.operation_type_selected == 'dir_details') return;

	// 		const selectedTemplatePath = path.join(templatesPath, results.operation_type_selected);

	// 		const templatesOptions = fs.readdirSync(selectedTemplatePath);
	// 		if (templatesOptions.length === 0) {
	// 			p.cancel('No templates found');
	// 			process.exit(0);
	// 		}
	// 		return p.select({
	// 			message: 'Select files to generate',
	// 			initialValue: templatesOptions[0],
	// 			options: templatesOptions.map((file) => ({
	// 				value: file,
	// 				label: file
	// 			}))
	// 		});
	// 	},
	// 	operation_name: ({ results }) => {
	// 		if (results.operation_type_selected == 'GenerateFile') return;
	// 		if (results.operation_type_selected == 'dir_details') return;
	// 		return p.text({
	// 			message: 'What is the name of your operation?',
	// 			defaultValue: '.',
	// 			placeholder: './(current)'
	// 		});
	// 	}
	// });

	// if (project_type == 'GenerateFile') {
	// 	generate_files(CURRENT_EXEC_DIR);
	// }
	// if (project_type == 'dir_details') {
	// 	get_dir_details(CURRENT_EXEC_DIR);
	// }

	// 	process.exit(0);
	// }

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

	// if (operation.install) {
	// 	const s = p.spinner();
	// 	s.start('Installing via pnpm');
	// 	s.stop('Installed via pnpm');
	// }

	// let nextSteps = `cd ${operation.path}        \n${operation.install ? '' : 'pnpm install\n'}pnpm dev`;

	// p.note(nextSteps, 'Next steps.');
}
run();
