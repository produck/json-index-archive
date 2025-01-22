import * as fs from 'node:fs';
import { Assert } from '@produck/idiom';

import * as Pathname from '../Pathname.mjs';
import { ROOT } from '../Abstract.mjs';
import { Dirent } from '../Dirent.mjs';
import { Tree } from '../Index/index.mjs';

const { S_IFREG, S_IFDIR } = fs.constants;
const VISIT_AT_ALL = { visitAt: Tree.VISIT_AT.ALL };

export function normalizeOptions(options = {}) {
	Assert.Type.Object(options, 'options');

	const _options = {
		withFileTypes : false,
		recursive: false,
	};

	const {
		withFileTypes : _withFileTypes = _options.withFileTypes ,
		recursive: _recursive = _options.recursive,
	} = options;

	Assert.Type.Boolean(_withFileTypes, 'options.withFileTypes');
	Assert.Type.Boolean(_recursive, 'options.recursive');

	_options.withFileTypes = _withFileTypes;
	_options.recursive = _recursive;

	return _options;
}

const Handler = {
	toName: (_, name) => name,
	toPathname: (sections, name) => Pathname.stringify(...sections, name),
	toDirent: (sections, name, node) => {
		const mode = Tree.DirectoryNode.isNode(node) ? S_IFDIR : S_IFREG;

		return new Dirent(Pathname.stringify(...sections), name, mode);
	},
};

/** @param {import('../Constructor.mjs').FileSystem} self */
export default (self, pathname, ...options) => {
	const { recursive, withFileTypes } = normalizeOptions(...options);

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

	for (const record of node.children(depth, VISIT_AT_ALL)) {
		if (visited.has(record)) {
			nameStack.pop();
		} else {
			const [name, node] = record;

			list.push(handler([...sections, ...nameStack], name, node));
			nameStack.push(name);
			visited.add(record);
		}
	}

	return list;
};
