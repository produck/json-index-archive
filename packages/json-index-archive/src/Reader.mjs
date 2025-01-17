import * as path from 'node:path';
import * as fs from 'node:fs';
import * as crypto from 'node:crypto';
import * as Stream from 'node:stream';

import * as Ow from '@produck/ow';
import { Assert } from '@produck/idiom';

import * as Utils from './Utils.mjs';
import * as Token from './Token.mjs';
import * as JIARError from './Error.mjs';
import { FileHandle } from './FileHandler.mjs';
import * as ReaderReaddir from './ReaderReaddir.mjs';

const USE_BIGINT = { bigint: true };
const CHILDREN = Symbol('property::children');
const SIZE = Symbol('property::size');
const OFFSET = Symbol('property::offset');
const FILE_SIZE_BUFFER_BYTE_LENGTH = 8;
const CLOSE_STREAM = stream => stream.close();
const { S_IFDIR, S_IFREG } = fs.constants;

export class Reader {
	#pathname = '';
	#root = { [CHILDREN]: {} };

	#size = {
		archive: 0n,
		file: 0n,
	};

	get archiveSize() {
		return this.#size.archive;
	}

	get fileSize() {
		return this.#size.file;
	}

	get indexSize() {
		const bodySize = Number(this.#size.archive) - FILE_SIZE_BUFFER_BYTE_LENGTH;

		return bodySize - Number(this.#size.file);
	}

	constructor(pathname, token) {
		if (!Token.has(token)) {
			Ow.Error.Common('Illegal constructor');
		}

		this.#pathname = pathname;
	}

	#find(pathname) {
		const components = pathname.split(path.posix.sep);
		let current = this.#root;

		components.shift();

		while (components.length > 0) {
			const top = components.shift();

			if (!Object.hasOwn(current, CHILDREN)) {
				return null;
			}

			if (!Object.hasOwn(current[CHILDREN], top)) {
				return null;
			}

			current = current[CHILDREN][top];
		}

		return current;
	}

	exists(pathname) {
		Utils.Pathname.assert(pathname);

		return this.#find(pathname) === null ? false : true;
	}

	async open(pathname) {
		Utils.Pathname.assert(pathname);

		if (this.#find(pathname) === null) {
			Ow.throw(JIARError.ENOENT(pathname));
		}

		return new FileHandle(this, pathname);
	}

	*nodes(parentPath, maxDepth = 1) {
		Utils.Pathname.assert(parentPath);

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
		}(parentPath, this.#find(parentPath), 1);
	}

	readdir(pathname, options) {
		Utils.Pathname.assert(pathname);

		const { recursive, withFileType } = ReaderReaddir.normalizeOptions(options);
		const list = [];

		let handler = ReaderReaddir.Handler.toName;

		if (recursive) {
			handler = ReaderReaddir.Handler.toPathname;
		}

		if (withFileType) {
			handler = ReaderReaddir.Handler.toDirent;
		}

		for (const triple of this.nodes(recursive ? Number.MAX_SAFE_INTEGER : 1)) {
			list.push(handler(...triple));
		}

		return list;
	}

	async sync() {
		Utils.assertFileExisted(this.#pathname);

		const stat = await fs.promises.stat(this.#pathname, USE_BIGINT);

		this.#size.archive = stat.size;

		const handle = await fs.promises.open(this.#pathname);
		const fileSizeBuffer = new BigUint64Array([0n]);

		await handle.read(fileSizeBuffer);

		const fileSize = this.#size.file = fileSizeBuffer[0];
		const indexBuffer = Buffer.allocUnsafe(this.indexSize);
		const fileSizeByteLength = fileSizeBuffer.byteLength;

		await handle.read(indexBuffer, {
			position: fileSizeByteLength + Number(fileSize),
		});

		const indexObject = JSON.parse(indexBuffer.toString('utf-8'));
		const closingReading = [];

		await (async function visit(object, node) {
			if (Object.hasOwn(object, 'children')) {
				const children = node[CHILDREN] = {};

				for (const childObject of object.children) {
					const childNode = children[childObject.name] = {};

					await visit(childObject, childNode);
				}
			} else {
				const offset = node[OFFSET] = Number(object.offset);
				const size = node[SIZE] = Number(object.size);
				const start = fileSizeByteLength + offset;
				const end = start + size - 1;

				const hash = crypto.createHash('sha256');

				const readStream = handle.createReadStream({
					autoClose: false,
					start, end,
				});

				closingReading.push(readStream);
				await Stream.promises.pipeline(readStream, hash);

				if (hash.digest('hex') !== object.sha256) {
					Ow.Error.Common('File is broken.');
				}
			}
		})(indexObject, this.#root);

		closingReading.forEach(CLOSE_STREAM);
	}

	async extractAll(destination) {
		Assert.Type.String(destination);
		await this.sync();
		destination = path.resolve(destination);


	}

	static async #from(pathname) {
		pathname = path.resolve(pathname);
		Utils.assertFileExisted(pathname);

		const reader = new Reader(pathname, Token.create());

		await reader.sync();

		return reader;
	}

	static async extractAll(source, destination) {
		Assert.Type.String(source, 'source');
		Assert.Type.String(destination, 'destination');

		const reader = await this.#from(source);

		await reader.extractAll(destination);
	}

	static async from(pathname) {
		Assert.Type.String(pathname, 'pathname');

		return await this.#from(pathname);
	}
}
