import * as fs from 'node:fs';

const { S_IFREG, S_IFDIR } = fs.constants;

export class Dirent {
	#mode = 0;

	constructor(parentPath, name, mode) {
		this.parentPath = parentPath;
		this.name = name;
		this.#mode = mode;
		Object.freeze(this);
	}

	isFile() {
		return (this.#mode & S_IFREG) !== 0;
	}

	isDirectory() {
		return (this.#mode & S_IFDIR) !== 0;
	}
}
