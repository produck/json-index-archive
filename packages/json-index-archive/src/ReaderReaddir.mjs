import * as fs from 'node:fs';
import * as path from 'node:path';
import { Assert } from '@produck/idiom';

export function normalizeOptions(options = {}) {
	Assert.Type.Object(options, '[0]');

	const _options = {
		withFileType: false,
		recursive: false,
	};

	const {
		withFileType: _withFileType = _options.withFileType,
		recursive: _recursive = _options.recursive,
	} = options;

	Assert.Type.Boolean(_withFileType, '[0].widthFileType');
	Assert.Type.Boolean(_recursive, '[0].recursive');

	_options.withFileType = _withFileType;
	_options.recursive = _recursive;

	return _options;
}

export class Dirent {
	#mode = 0;
	#parentPath = '';
	#name = '';

	constructor(parentPath, name, mode) {
		this.#parentPath = parentPath;
		this.#name = name;
		this.#mode = mode;
	}

	get name() {
		return this.#name;
	}

	get parentPath() {
		return this.#parentPath;
	}

	isFile() {
		return this.#mode & fs.constants.S_IFREG !== 0;
	}

	isDirectory() {
		return this.#mode & fs.constants.S_IFDIR !== 0;
	}
}

export const Handler = {
	toName: (_, name) => name,
	toPathname: (parentPath, name) => path.posix.join(parentPath, name),
	toDirent: (parentPath, name, mode) => new Dirent(parentPath, name, mode),
};
