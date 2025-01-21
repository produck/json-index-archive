import * as fs from 'node:fs';
import * as assert from 'node:assert/strict';
import { describe, it } from 'mocha';

import { Dirent } from '../../src/FileSystem/Dirent.mjs';

export default function Describe() {
	describe('constructor()', function () {
		it('should get a dirent.', function () {
			new Dirent('/foo', 'bar', fs.constants.S_IFREG);
		});
	});

	describe('.parentPath', function () {
		it('should get parentPath', function () {
			const dirent = new Dirent('/foo', 'bar', fs.constants.S_IFREG);

			assert.equal(dirent.parentPath, '/foo');
		});
	});

	describe('.name', function () {
		it('should get name.', function () {
			const dirent = new Dirent('/foo', 'bar', fs.constants.S_IFREG);

			assert.equal(dirent.name, 'bar');
		});
	});

	describe('.isFile()', function () {
		it('should get true.', function () {
			const dirent = new Dirent('/foo', 'bar', fs.constants.S_IFREG);

			assert.equal(dirent.isFile(), true);
		});

		it('should get false.', function () {
			const dirent = new Dirent('/foo', 'bar', fs.constants.S_IFDIR);

			assert.equal(dirent.isFile(), false);
		});
	});

	describe('.isDirectory()', function () {
		it('should get true.', function () {
			const dirent = new Dirent('/foo', 'bar', fs.constants.S_IFDIR);

			assert.equal(dirent.isDirectory(), true);
		});

		it('should get false.', function () {
			const dirent = new Dirent('/foo', 'bar', fs.constants.S_IFREG);

			assert.equal(dirent.isDirectory(), false);
		});
	});
}
