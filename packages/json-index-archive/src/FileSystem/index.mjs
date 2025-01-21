import * as path from 'node:path';
import * as fs from 'node:fs';
import * as crypto from 'node:crypto';
import * as Stream from 'node:stream';

import * as Ow from '@produck/ow';
import { Assert, Is } from '@produck/idiom';

import * as Utils from '../Utils.mjs';
import * as JIARError from '../Error.mjs';
import * as Pathname from './Pathname.mjs';
import * as Readdir from './Readdir.mjs';
import * as IndexObject from './IndexObject.mjs';
import { VISIT_AT, DirectoryNode } from './IndexTree/index.mjs';

import {
	FileHandle,
	normalizeReadFileOptions,
	normalizeReadStreamOptions,
} from './FileHandler.mjs';

const { S_IFREG, S_IFDIR } = fs.constants;
const FILE_SIZE_BUFFER_BYTE_LENGTH = 8;

export class FileSystem {
	#pathname = '';
	#root = new DirectoryNode();
	#size = { archive: 0n, file: 0n };

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

	exists(pathname) {
		Pathname.assert(pathname);

		return this.#root.find(...Pathname.parse(pathname)) === null ? false : true;
	}

	async open(pathname) {
		Pathname.assert(pathname);

		const node = this.#root.find(...Pathname.parse(pathname));

		if (node === null) {
			Ow.throw(JIARError.ENOENT(pathname));
		}

		const handle = await fs.promises.open(this.#pathname, 'r');

		return new FileHandle(handle, node.offset, node.size);
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

		const depth = recursive ? Number.MAX_SAFE_INTEGER : 1;
		const sections = Pathname.parse(pathname);
		const node = this.#root.find(...sections);
		const visited = new Set(), nameStack = [], list = [];

		for (const record of node.children(depth, VISIT_AT.ALL)) {
			if (visited.has(record)) {
				nameStack.pop();
			} else {
				const [name, node] = record;
				const mode = DirectoryNode.isNode(node) ? S_IFDIR : S_IFREG;

				list.push(handler([...sections, ...nameStack], name, mode));
				nameStack.push(name);
				visited.add(record);
			}
		}

		return list;
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
				// yield chunk;
			}
		});

		return stream;
	}

	async sync() {
		await Utils.assertFileExisted(this.#pathname);
		await this.#sync();
	}

	async #sync() {
		const stat = await fs.promises.stat(this.#pathname);

		this.#size.archive = stat.size;

		const handle = await fs.promises.open(this.#pathname);
		const fileSizeBuffer = new BigUint64Array([0n]);

		await handle.read(fileSizeBuffer);

		const fileSize = this.#size.file = fileSizeBuffer[0];
		const indexBuffer = Buffer.allocUnsafe(this.indexSize);

		await handle.read(indexBuffer, {
			position: FILE_SIZE_BUFFER_BYTE_LENGTH + Number(fileSize),
		});

		const indexObject = JSON.parse(indexBuffer.toString('utf-8'));
		const root = this.#root = new DirectoryNode();

		for (const { offset, size, sha256 } of IndexObject.build(indexObject, root)) {
			Assert.Type.String(sha256, '.sha256');

			const start = FILE_SIZE_BUFFER_BYTE_LENGTH + Number(offset);
			const end = start + Number(size) - 1;
			const hash = crypto.createHash('sha256');
			const stream = handle.createReadStream({ autoClose: false, start, end });

			await Stream.promises.pipeline(stream, hash);

			if (hash.digest('hex') !== sha256) {
				Ow.Error.Common('File is broken.');
			}
		}

		handle.close();
	}

	static async mount(pathname) {
		Assert.Type.String(pathname, 'pathname');
		pathname = path.resolve(pathname);
		await Utils.assertFileExisted(pathname);

		const fs = new this(pathname);

		fs.#pathname = pathname;
		await fs.#sync();

		return fs;
	}
}
