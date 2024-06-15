import path from 'path';
import fs from 'fs-extra';

export const copy_dir = (
	sourceDir: string,
	destinationDir: string,
	ignoreDirList: string[] = [],
	ignoreFileList: string[] = []
) => {
	fs.copySync(sourceDir, destinationDir, {
		overwrite: true,
		errorOnExist: false,

		filter: (src, dest) => {
			// check if directory, followed by if directory is in ignoreDirList
			if (fs.lstatSync(src).isDirectory()) {
				return !ignoreDirList.includes(path.basename(src));
			}
			// check if file, followed by if file is in web_ignore_file_list
			if (fs.lstatSync(src).isFile()) {
				return !ignoreFileList.includes(path.basename(src));
			}
			return true;
		}
	});
};
