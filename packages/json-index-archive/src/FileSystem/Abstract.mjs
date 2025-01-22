import * as fs from 'node:fs';
import * as path from 'node:path';

import * as Ow from '@produck/ow';
import { Assert } from '@produck/idiom';

import { Tree } from './Index/index.mjs';
import * as Pathname from './Pathname.mjs';

export const PATHNAME = Symbol('pathname');
export const ROOT = Symbol('root');
export const ARCHIVE_SIZE = Symbol('archiveSize');
export const FILE_SIZE = Symbol('fileSize');

export const FILE_SIZE_BUFFER_BYTE_LENGTH = 8;

export const PROTOTYPE = {
	SYNC: Symbol('_sync'),
	EXISTS: Symbol('_exists'),
	OPEN: Symbol('_open'),
	READDIR: Symbol('_readdir'),
	READ_FILE: Symbol('_readFile'),
	CREATE_READ_STREAM: Symbol('_createReadStream'),
};

const RTTF = [() => true, () => false];

export async function isFileExisted(pathname) {
	return await fs.promises.access(pathname).then(...RTTF);
}

export async function assertFileExisted(pathname) {
	if (!await isFileExisted(pathname)) {
		Ow.Error.Common(`File "${pathname}" is NOT existed.`);
	}
}

export class AbstractFileSystem {
	[ROOT] = new Tree.DirectoryNode();

	[PATHNAME] = '';

	get pathname() {
		return this[PATHNAME];
	}

	[ARCHIVE_SIZE] = 0n;

	get archiveSize() {
		return this[ARCHIVE_SIZE];
	}

	[FILE_SIZE] = 0n;

	get fileSize() {
		return this[FILE_SIZE];
	}

	get indexSize() {
		const bodySize = Number(this[ARCHIVE_SIZE]) - FILE_SIZE_BUFFER_BYTE_LENGTH;

		return bodySize - Number(this[FILE_SIZE]);
	}

	exists(pathname) {
		Pathname.assert(pathname);

		return this[PROTOTYPE.EXISTS](pathname);
	}

	open(pathname) {
		Pathname.assert(pathname);

		return this[PROTOTYPE.OPEN](pathname);
	}

	readdir(pathname, ...options) {
		Pathname.assert(pathname);

		return this[PROTOTYPE.READDIR](pathname, ...options);
	}

	readFile(pathname, ...options) {
		Pathname.assert(pathname);

		return this[PROTOTYPE.READ_FILE](pathname, ...options);
	}

	createReadStream(pathname, ...options) {
		Pathname.assert(pathname);

		return this[PROTOTYPE.CREATE_READ_STREAM](pathname, ...options);
	}

	async sync() {
		await assertFileExisted(this[PATHNAME]);
		await this[PROTOTYPE.SYNC]();
	}

	static async mount(pathname) {
		Assert.Type.String(pathname, 'pathname');
		pathname = path.resolve(pathname);
		await assertFileExisted(pathname);

		const fs = new this();

		fs[PATHNAME] = pathname;
		await fs.sync();

		return fs;
	}
}
