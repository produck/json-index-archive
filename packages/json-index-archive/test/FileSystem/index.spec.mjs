import * as fs from 'node:fs';
import * as path from 'node:path';
import * as assert from 'node:assert/strict';
import { describe, it } from 'mocha';

import PathnameDescribe from './Pathname.mjs';
import IndexTreeDescribe from './Index/Tree.mjs';
import IndexObjectDescribe from './Index/Object.mjs';
import DirentDescribe from './Dirent.mjs';

import { FileSystem } from '../../src/FileSystem/index.mjs';

const __dirname = import.meta.dirname;
const samplePathname = path.resolve(__dirname, 'sample.jiar');

describe('::FileSystem', function () {
	describe('::Pathname', PathnameDescribe);

	describe('::Index', function () {
		describe('::Tree', IndexTreeDescribe);
		describe('::Object', IndexObjectDescribe);
	});

	describe('::Dirent', DirentDescribe);

	describe('.archiveSize', function () {
		it('should get archiveSize.', async function () {
			const jiarFS = await FileSystem.mount(samplePathname);

			assert.equal(jiarFS.archiveSize, 714);
		});
	});

	describe('.fileSize', function () {
		it('should get fileSize.', async function () {
			const jiarFS = await FileSystem.mount(samplePathname);

			assert.equal(jiarFS.fileSize, 20n);
		});
	});

	describe('.indexSize', function () {
		it('should get indexSize.', async function () {
			const jiarFS = await FileSystem.mount(samplePathname);

			assert.equal(jiarFS.indexSize, 686);
		});
	});

	describe('.exists()', function () {
		it('should get true.', async function () {
			const jiarFS = await FileSystem.mount(samplePathname);

			for (const pathname of [
				'/bar',
				'/bar/foo',
				'/bar/foo/bar',
				'/bar/foo/baz',
				'/bar/baz',
				'/bar/qux',
				'/foo',
				'/baz',
			]) {
				assert.ok(jiarFS.exists(pathname));
			}
		});

		it('should get false.', async function () {
			const jiarFS = await FileSystem.mount(samplePathname);

			assert.equal(jiarFS.exists('/bad'), false);
		});

		it('should throw if bad pathname.', async function () {
			const jiarFS = await FileSystem.mount(samplePathname);

			for (const pathname of [
				'a', 'b/c', '\\d\\b',
			]) {
				assert.throws(() => jiarFS.exists(pathname), {
					name: 'Error',
					message: 'Bad pathname, should be POSIX absolute path.',
				});
			}
		});
	});

	describe('.open()', function () {
		it('should get a FileHandle.', function () {

		});

		it('should throw if bad pathname.', function () {

		});

		it('should throw if node NOT found.', function () {

		});
	});

	describe('.readdir()', function () {
		it('should get name string[].', function () {

		});

		it('should get pathname string[].', function () {

		});

		it('should get dirent[].', function () {

		});

		it('should throw if bad pathname.', function () {

		});

		it('should throw if bad options.', function () {

		});

		it('should throw if bad options.recursive.', function () {

		});

		it('should throw if bad options.withFileTypes.', function () {

		});
	});

	describe('.readFile()', function () {
		it('should get a buffer.', function () {

		});

		it('should throw if bad pathname.', function () {

		});

		it('should throw if bad options.', function () {

		});
	});

	describe('.createReadStream()', function () {
		it('should get a read stream.', function () {

		});

		it('should throw if bad pathname.', function () {

		});

		it('should throw if bad options.', function () {

		});
	});

	const FILE_NOT_EXISTED_REG = /^File ".*" is NOT existed.$/;

	describe('.sync()', function () {
		it('shoud ok if file is correct.', async function () {
			const jiarFS = await FileSystem.mount(samplePathname);

			await jiarFS.sync();
		});

		it('should throw if file NOT existed.', async function () {
			const copyPathname = path.join(__dirname, 'sample.gen.jiar');

			await fs.promises.copyFile(samplePathname, copyPathname);

			const jiarFS = await FileSystem.mount(copyPathname);

			await fs.promises.rm(copyPathname);

			await assert.rejects(() => jiarFS.sync(), {
				name: 'Error',
				message: FILE_NOT_EXISTED_REG,
			});
		});

		it('should throw if bad object.sha256.', async function () {
			const pathname = path.join(__dirname, 'sample.sha.missing.jiar');

			await assert.rejects(() => FileSystem.mount(pathname), {
				name: 'TypeError',
				message: 'Invalid ".sha256", one "string" expected.',
			});
		});

		it('should throw if object.sha256 NOT matched.', async function () {
			const pathname = path.join(__dirname, 'sample.sha.wrong.jiar');

			await assert.rejects(() => FileSystem.mount(pathname), {
				name: 'Error',
				message: 'File is broken.',
			});
		});
	});

	describe('::mount()', function () {
		it('should get fs.', async function () {
			const jiarFS = await FileSystem.mount(samplePathname);

			assert.ok(jiarFS instanceof FileSystem);
		});

		it('should throw if bad pathname.', async function () {
			await assert.rejects(() => FileSystem.mount(null), {
				name: 'TypeError',
				message: 'Invalid "pathname", one "string" expected.',
			});
		});

		it('should throw if file NOT existed.', async function () {
			await assert.rejects(() => FileSystem.mount('notExisted'), {
				name: 'Error',
				message: FILE_NOT_EXISTED_REG,
			});
		});
	});
});
