import * as fs from 'node:fs';
import * as Ow from '@produck/ow';
import { Tree } from './Index/index.mjs';

const { S_IFREG, S_IFDIR } = fs.constants;
const NODE = Symbol('node');

export class Stats {
	[NODE];

	constructor(node) {
		this[NODE] = node;
	}

	isFile() {
		return Tree.FileNode.isNode(this[NODE]);
	}

	isDirectory() {
		return Tree.DirectoryNode.isNode(this[NODE]);
	}

	get mode() {
		if (this.isDirectory()) {
			return S_IFDIR;
		}

		if (this.isFile()) {
			return S_IFREG;
		}

		return 0;
	}

	get size() {
		if (this.isDirectory()) {
			return 0;
		}

		if (this.isFile()) {
			return this[NODE].size;
		}

		return Ow.Error.Common('Unkown size getter.');
	}
}

const EXTENSION = [
	function GetterBirthtimeMs(prototype) {
		const getBirthtime = stats => stats[NODE].extension[0];

		Object.defineProperty(prototype, 'birthtimeMs', {
			get() {
				return getBirthtime(this);
			},
		});

		Object.defineProperty(prototype, 'birthtime', {
			get() {
				return new Date(getBirthtime(this));
			},
		});
	},
];

for (const decorator of EXTENSION) {
	decorator(Stats.prototype);
}
