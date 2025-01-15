import * as fs from 'node:fs';
import * as path from 'node:path';
import { Stream } from 'node:stream';
import * as crypto from 'node:crypto';

import * as Ow from '@produck/ow';
import { Assert } from '@produck/idiom';

const READDIR_OPTIONS = { withFileTypes: true };

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

	async buildIndex(handleFile = () => {}) {
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
					await handleFile(dirent, currentNode);
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
			const writeStream = handle.createWriteStream({ autoClose: false });
			const hash = crypto.createHash('sha256');

			closing.push(writeStream);
			node.offset = String(offset);
			node.size = 0;

			readStream.on('data', chunk => {
				node.size += chunk.length;
				hash.update(chunk);
			});

			await Stream.promises.pipeline(readStream, writeStream);
			offset += BigInt(node.size);
			node.sha256 = hash.digest('hex');
		});

		sizeBuffer[0] = offset;
		await handle.write(Buffer.from(JSON.stringify(indexObject), 'utf-8'));
		await handle.write(sizeBuffer, { position: 0 });

		for (const stream of closing) {
			stream.close();
		}
	}
}
