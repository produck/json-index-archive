import * as fs from 'node:fs';
import * as path from 'node:path';
import { Stream } from 'node:stream';
import * as crypto from 'node:crypto';

import * as Ow from '@produck/ow';
import { Assert } from '@produck/idiom';

const READDIR_OPTIONS = { withFileTypes: true };
const NOT_AUTO_CLOSE = { autoClose: false };

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

	async buildIndex(fileHandler = () => {}) {
		Assert.Type.Function(fileHandler, 'fileHandler');

		const direntStack = [null];
		const directoryNodeStack = [{ name: '', children: [] }];

		for await (const dirent of visit(this.#root)) {
			if (dirent === direntStack[0]) {
				direntStack.shift();

				if (dirent.isDirectory()) {
					directoryNodeStack.shift();
				}
			} else {
				const currentNode = { name: dirent.name };

				direntStack.unshift(dirent);
				directoryNodeStack[0].children.push(currentNode);

				if (dirent.isFile()) {
					await fileHandler(dirent, currentNode);
				}

				if (dirent.isDirectory()) {
					currentNode.children = [];
					directoryNodeStack.unshift(currentNode);
				}
			}
		}

		return directoryNodeStack[0];
	}

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

		const indexObject = await this.buildIndex(async (dirent, node) => {
			const pathname = path.join(dirent.parentPath, dirent.name);
			const readStream = fs.createReadStream(pathname);
			const writeStream = handle.createWriteStream(NOT_AUTO_CLOSE);
			const hash = crypto.createHash('sha256');
			let size = 0n;

			closing.push(writeStream);
			node.offset = String(offset);

			readStream.on('data', chunk => {
				size += BigInt(chunk.length);
				hash.update(chunk);
			});

			await Stream.promises.pipeline(readStream, writeStream);
			node.sha256 = hash.digest('hex');
			node.size = String(size);
			offset += size;
		});

		sizeBuffer[0] = offset;
		await handle.write(JSON.stringify(indexObject));
		await handle.write(sizeBuffer, { position: 0 });

		for (const stream of closing) {
			stream.close();
		}

		handle.close();
	}
}
