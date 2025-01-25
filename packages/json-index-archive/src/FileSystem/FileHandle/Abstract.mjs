import * as fs from 'node:fs';
import { EventEmitter } from 'node:events';
import * as Ow from '@produck/ow';
import { Assert } from '@produck/idiom';

const NativeFileHandle = (await fs.promises.open('/')).constructor;

export const MEMBER = {
	POSITION: Symbol('position'),
	NATIVE_HANDLE: Symbol('nativeHandle'),
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

	get fd() {
		return this[MEMBER.NATIVE_HANDLE].fd;
	}

	constructor(nativeHandle, isFile, offset, size) {
		Assert.Type.Boolean(isFile, 'isFile');

		super();
		this[MEMBER.IS_FILE] = isFile;

		if (isFile) {
			this[MEMBER.OFFSET] = offset;
			this[MEMBER.SIZE] = size;
		}

		this[MEMBER.NATIVE_HANDLE] = nativeHandle;
		nativeHandle.on('close', () => this.emit('close'));
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
