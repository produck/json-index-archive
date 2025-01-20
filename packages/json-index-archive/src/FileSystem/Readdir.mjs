import * as path from 'node:path';
import { Assert } from '@produck/idiom';

import { Dirent } from './Dirent.mjs';

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

function toPathname(...sections) {
	return path.posix.join('/', ...sections);
}

export const Handler = {
	toName: ([_, name]) => name,
	toPathname: ([sections, name]) => toPathname(...sections, name),
	toDirent: ([sections, name, mode]) => {
		return new Dirent(toPathname(...sections), name, mode);
	},
};
