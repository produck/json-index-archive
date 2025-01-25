import * as fs from 'node:fs';
import * as path from 'node:path';
import { Stream } from 'node:stream';

import * as Ow from '@produck/ow';
import { Assert } from '@produck/idiom';

import * as FileSystem from '../FileSystem/index.mjs';
import * as Extension from './Extension/index.mjs';

const READDIR_OPTIONS = { withFileTypes: true };
const NOT_AUTO_CLOSE = { autoClose: false };
const { NODE, TYPE } = FileSystem.Index.Object;
const FILE_HANDLERS = Symbol('fileHandlers');
const DIRECTORY_HANDLERS = Symbol('directoryHandlers');

function BY_TYPE_THEN_NAME(direntA, direntB) {
	if (direntA.isDirectory() && direntB.isFile()) {
		return -1;
	} else if (direntA.isFile() && direntB.isDirectory()) {
		return 1;
	}

	return direntA.name.localeCompare(direntB.name);
}

function IS_FILE_OR_DIRECTORY(dirent) {
	return dirent.isFile() || dirent.isDirectory();
}

const PARENT_DIR_REG = /^\.\./;

async function* visit(dirname) {
	const original = await fs.promises.readdir(dirname, READDIR_OPTIONS);
	const filtered = original.filter(IS_FILE_OR_DIRECTORY).sort(BY_TYPE_THEN_NAME);

	for (const dirent of filtered) {
		yield dirent;

		if (dirent.isDirectory()) {
			const { parentPath, name } = dirent;
			const childDirname = path.join(parentPath, name);

			yield * await visit(childDirname);
		}

		yield dirent;
	}
}

const TOP = 0;

export class Archiver {
	#root = '';

	constructor(pathname) {
		this.#root = path.resolve(pathname);
	}

	async *entities() {
		const visited = new Set();

		for await (const dirent of visit(this.#root)) {
			if (!visited.has(dirent)) {
				visited.add(dirent);
				yield dirent;
			}
		}
	}

	async *paths() {
		for await (const dirent of this.entities()) {
			const dirname = path.relative(this.#root, dirent.parentPath);
			const suffix = dirent.isDirectory() ? path.sep : '';

			yield path.join(dirname, dirent.name) + suffix;
		}
	}

	async *buildIndex(root = [TYPE.DIRECTORY, '', []]) {
		const direntStack = [null];
		const directoryNodeStack = [root];

		for await (const dirent of visit(this.#root)) {
			if (dirent === direntStack[0]) {
				direntStack.shift();

				if (dirent.isDirectory()) {
					directoryNodeStack.shift();
				}
			} else {
				const currentNode = [];

				currentNode[NODE.NAME] = dirent.name;

				direntStack.unshift(dirent);
				directoryNodeStack[TOP][NODE.DIRECTORY.CHILDREN].push(currentNode);

				if (dirent.isFile()) {
					currentNode[NODE.TYPE] = TYPE.FILE;
				}

				if (dirent.isDirectory()) {
					currentNode[NODE.TYPE] = TYPE.DIRECTORY;
					currentNode[NODE.DIRECTORY.CHILDREN] = [];
					directoryNodeStack.unshift(currentNode);
				}

				yield [dirent, currentNode];
			}
		}

		return directoryNodeStack[0];
	}

	[FILE_HANDLERS] = [
		Extension.birthtime,
		Extension.integrity,
	];

	[DIRECTORY_HANDLERS] = [
		Extension.birthtime,
	];

	async archive(destination, mode = 0o666) {
		Assert.Type.String(destination, 'destination');
		Assert.Integer(mode, 'mode');

		if (mode < 0 || mode > 0o777) {
			Ow.Error.Range('A mode should >=0 and <=0o777.');
		}

		const absoluteDestination = path.resolve(this.#root, destination);

		if (!PARENT_DIR_REG.test(path.relative(this.#root, absoluteDestination))) {
			Ow.Error.Common('Destination is in the workspace root.');
		}

		const closing = [];
		const handle = await fs.promises.open(absoluteDestination, 'w', mode);
		const sizeBuffer = new BigUint64Array([0n]);

		await handle.write(sizeBuffer);

		let offset = 0n;
		const root = [TYPE.DIRECTORY, '', []];

		for await (const [dirent, node] of this.buildIndex(root)) {
			const pathname = path.join(dirent.parentPath, dirent.name);
			const context = { pathname, dirent };

			if (dirent.isFile()) {
				const readStream = fs.createReadStream(pathname);
				const writeStream = handle.createWriteStream(NOT_AUTO_CLOSE);
				let size = 0n;

				closing.push(writeStream);
				node[NODE.FILE.OFFSET] = String(offset);
				readStream.on('data', chunk => size += BigInt(chunk.length));

				const piping = Stream.promises.pipeline(readStream, writeStream);

				Object.assign(context, { piping, readStream });

				const toHandling = async handler => await handler(context);
				const handlings = this[FILE_HANDLERS].map(toHandling);
				const extension = await Promise.all([...handlings, piping]);

				extension.pop();
				node[NODE.FILE.EXTEND] = extension;
				node[NODE.FILE.SIZE] = String(size);
				offset += size;
			}

			if (dirent.isDirectory()) {
				const toHandling = async handler => await handler(context);
				const handlings = this[DIRECTORY_HANDLERS].map(toHandling);
				const extension = await Promise.all(handlings);

				node[NODE.DIRECTORY.EXTEND] = extension;
			}
		}

		sizeBuffer[0] = offset;
		await handle.write(JSON.stringify(root));
		await handle.write(sizeBuffer, { position: 0 });

		for (const stream of closing) {
			stream.close();
		}

		handle.close();
	}
}
