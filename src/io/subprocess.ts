import { spawn } from 'child_process';

export const execCommand = async (command) => {
	// supports both realtime streaming and shell execution:
	return new Promise((resolve, reject) => {
		const childProcess = spawn(command, {
			stdio: 'inherit', // for this no need to listen to data event
			shell: true
		});
		childProcess.on('error', (error) => {
			reject(error);
		});
		childProcess.on('exit', (code) => {
			if (code === 0) {
				resolve(code);
			} else {
				reject(new Error(`Command exited with code ${code}.`));
			}
		});
	});
};
