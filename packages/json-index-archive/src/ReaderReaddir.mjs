import * as fs from 'node:fs';
import * as path from 'node:path';
import { Assert } from '@produck/idiom';

const { S_IFREG, S_IFDIR } = fs.constants;

export function normalizeOptions(options = {}) {
	Assert.Type.Object(options, '[0]');

	const _options = {
		withFileTypes : false,
		recursive: false,
	};

	const {
		withFileTypes : _withFileTypes = _options.withFileTypes ,
		recursive: _recursive = _options.recursive,
	} = options;

	Assert.Type.Boolean(_withFileTypes, '[0].widthFileType');
	Assert.Type.Boolean(_recursive, '[0].recursive');

	_options.withFileTypes = _withFileTypes;
	_options.recursive = _recursive;

	return _options;
}

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

export const Handler = {
	toName: ([_, name]) => name,
	toPathname: ([parentPath, name]) => path.posix.join(parentPath, name),
	toDirent: ([parentPath, name, mode]) => new Dirent(parentPath, name, mode),
};
