import * as fs from 'node:fs';
import { Assert } from '@produck/idiom';

import * as Pathname from '../Pathname.mjs';
import { ROOT } from '../Abstract.mjs';
import { Dirent } from '../Dirent.mjs';
import { Tree } from '../Index/index.mjs';

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

const Handler = {
	toName: ([, name]) => name,
	toPathname: ([sections, name]) => Pathname.stringify(...sections, name),
	toDirent: ([sections, name, mode]) => {
		return new Dirent(Pathname.stringify(...sections), name, mode);
	},
};

/** @param {import('../Constructor.mjs').FileSystem} self */
export default (self, pathname, ...options) => {
	const { recursive, withFileTypes } = normalizeOptions(options);

	let handler = Handler.toName;

	if (recursive) {
		handler = Handler.toPathname;
	}

	if (withFileTypes) {
		handler = Handler.toDirent;
	}

	const depth = recursive ? Number.MAX_SAFE_INTEGER : 1;
	const sections = Pathname.parse(pathname);
	const node = self[ROOT].find(...sections);
	const visited = new Set(), nameStack = [], list = [];

	for (const record of node.children(depth, Tree.VISIT_AT.ALL)) {
		if (visited.has(record)) {
			nameStack.pop();
		} else {
			const [name, node] = record;
			const mode = Tree.DirectoryNode.isNode(node) ? S_IFDIR : S_IFREG;

			list.push(handler([...sections, ...nameStack], name, mode));
			nameStack.push(name);
			visited.add(record);
		}
	}

	return list;
};
