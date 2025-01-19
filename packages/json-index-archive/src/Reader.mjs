import * as path from 'node:path';
import * as fs from 'node:fs';
import * as crypto from 'node:crypto';
import * as Stream from 'node:stream';

import * as Ow from '@produck/ow';
import { Assert } from '@produck/idiom';

import * as Utils from './Utils.mjs';
import * as Pathname from './Pathname.mjs';
import * as Token from './Token.mjs';
import * as JIARError from './Error.mjs';
import * as Readdir from './ReaderReaddir.mjs';
import * as DIR from './Directory.mjs';

import {
	FileHandle,
	normalizeReadFileOptions,
	normalizeReadStreamOptions,
} from './FileHandler.mjs';

const USE_BIGINT = { bigint: true };
const FILE_SIZE_BUFFER_BYTE_LENGTH = 8;
const CLOSE_STREAM = stream => stream.close();

export class Reader {
	#pathname = '';
	#root = DIR.createRootNode();

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

	exists(pathname) {
		Pathname.assert(pathname);

		return DIR.find(pathname, this.#root) === null ? false : true;
	}

	async open(pathname) {
		Pathname.assert(pathname);

		const node = DIR.find(pathname, this.#root);

		if (node === null) {
			Ow.throw(JIARError.ENOENT(pathname));
		}

		const handle = await fs.promises.open(this.#pathname, 'r');

		return new FileHandle(handle, node[DIR.OFFSET], node[DIR.SIZE]);
	}

	readdir(pathname, options) {
		Pathname.assert(pathname);

		const { recursive, withFileTypes } = Readdir.normalizeOptions(options);

		let handler = Readdir.Handler.toName;

		if (recursive) {
			handler = Readdir.Handler.toPathname;
		}

		if (withFileTypes) {
			handler = Readdir.Handler.toDirent;
		}

		const maxDepth = recursive ? Number.MAX_SAFE_INTEGER : 1;

		return [...DIR.nodes(pathname, this.#root, maxDepth)].map(handler);
	}

	async readFile(pathname, options) {
		Pathname.assert(pathname);
		options = normalizeReadFileOptions(options);

		const handle = await this.open(pathname);

		return await handle.readFile(options);
	}

	createReadStream(pathname, options) {
		Pathname.assert(pathname);
		options = normalizeReadStreamOptions(options);

		const stream = Stream.Readable.from(async () => {
			const handle = await this.open(pathname);
			const readStream = handle.createReadStream(options);



			for await (const chunk of readStream) {
				yield chunk;
			}
		});

		return stream;
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
				const children = node[DIR.CHILDREN] = {};

				for (const childObject of object.children) {
					const childNode = children[childObject.name] = {};

					await visit(childObject, childNode);
				}
			} else {
				const offset = node[DIR.OFFSET] = Number(object.offset);
				const size = node[DIR.SIZE] = Number(object.size);
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

	static async #from(pathname) {
		pathname = path.resolve(pathname);
		Utils.assertFileExisted(pathname);

		const reader = new Reader(pathname, Token.create());

		await reader.sync();

		return reader;
	}

	static async from(pathname) {
		Assert.Type.String(pathname, 'pathname');

		return await this.#from(pathname);
	}
}
