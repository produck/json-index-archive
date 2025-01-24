import * as fs from 'node:fs';
import { EventEmitter } from 'node:events';
import * as Ow from '@produck/ow';
import { Assert } from '@produck/idiom';

const NativeFileHandle = (await fs.promises.open('/')).constructor;

export const MEMBER = {
	POSITION: Symbol(),
	NATIVE_HANDLE: Symbol('position'),
	OFFSET: Symbol('offset'),
	SIZE: Symbol('size'),
	IS_FILE: Symbol('isFile'),
};

export const IMPLEMENT = {
	READ: Symbol(),
	READ_FILE: Symbol(),
	CREATE_READ_STREAM: Symbol(),
};

function assertFile(handle) {
	if (!handle[MEMBER.IS_FILE]) {
		Ow.Error.Common('EISDIR: illegal operation on a directory, read');
	}
}

export class AbstractFileHandle extends EventEmitter {
	/** @type {fs.promises.FileHandle} */
	[MEMBER.NATIVE_HANDLE] = 0;
	[MEMBER.POSITION] = 0;
	[MEMBER.OFFSET] = 0;
	[MEMBER.SIZE] = 0;
	[MEMBER.IS_FILE] = false;

	constructor(handle, isFile, offset, size) {
		if (!(handle instanceof NativeFileHandle)) {
			Ow.Invalid('handle', 'fs.FileHandle');
		}

		Assert.Type.Boolean(isFile, 'isFile');

		super();
		this[MEMBER.IS_FILE] = isFile;

		if (isFile) {
			Assert.Integer(offset, 'offset');
			Assert.Integer(size, 'size');

			if (offset < 0) {
				Ow.Error.Range('The "offset" should NOT < 0.');
			}

			if (size < 0) {
				Ow.Error.Range('The "size" should NOT < 0.');
			}

			this[MEMBER.OFFSET] = offset;
			this[MEMBER.SIZE] = size;
		}

		this[MEMBER.NATIVE_HANDLE] = handle;

		handle.on('close', (...args) => this.emit(...args));
	}

	async close() {
		await this[MEMBER.NATIVE_HANDLE].close();
	}

	read(...args) {
		assertFile(this);

		return this[IMPLEMENT.READ](...args);
	}

	readFile(...options) {
		assertFile(this);

		return this[IMPLEMENT.READ_FILE](...options);
	}

	createReadStream(...options) {
		return this[IMPLEMENT.CREATE_READ_STREAM](...options);
	}
}
