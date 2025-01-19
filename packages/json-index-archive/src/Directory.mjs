import * as fs from 'node:fs';
import * as path from 'node:path';

import * as Pathname from './Pathname.mjs';

const { S_IFDIR, S_IFREG } = fs.constants;

export const CHILDREN = Symbol('property::children');
export const SIZE = Symbol('property::size');
export const OFFSET = Symbol('property::offset');

export function find(pathname, rootNode) {
	const spanList = Pathname.toSpanList(pathname);
	let currentNode = rootNode;

	while (spanList.length > 0) {
		const top = spanList.shift();

		if (!Object.hasOwn(currentNode, CHILDREN)) {
			return null;
		}

		if (!Object.hasOwn(currentNode[CHILDREN], top)) {
			return null;
		}

		currentNode = currentNode[CHILDREN][top];
	}

	return currentNode;
}

export function createRootNode() {
	return { [CHILDREN]: {} };
}

export function* nodes(dirname, rootNode, maxDepth) {
	yield * function* visit(parentPath, node, depth) {
		if (depth > maxDepth) {
			return;
		}

		for (const name in node[CHILDREN]) {
			const childNode = node[CHILDREN][name];
			const isDirectory = CHILDREN in childNode;

			yield [parentPath, name, isDirectory ? S_IFDIR : S_IFREG];

			if (isDirectory) {
				yield * visit(path.posix.join(parentPath, name), childNode, depth + 1);
			}
		}
	}(dirname, find(dirname, rootNode), 1);
}
