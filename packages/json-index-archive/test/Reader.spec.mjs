import * as fs from 'node:fs';
import * as path from 'node:path';
import * as assert from 'node:assert/strict';
import { describe, it } from 'mocha';

import { Reader } from '../src/Reader.mjs';

const __dirname = import.meta.dirname;
const archivePathname = path.join(__dirname, 'sample.jiar');

describe('::Reader', function () {
	describe('::from()', function () {
		it('should create a reader.', async function () {
			const reader = await Reader.from(archivePathname);

			console.log(reader);
		});
	});

	describe('.sync()', function () {
		it('should sync ok.', async function () {
			const reader = await Reader.from(archivePathname);

			await reader.sync();
		});

		it('should throw if file deleted.', async function () {

		});

		it('should throw if broken.', async function () {

		});
	});

	describe('.exists()', function () {
		it('should be true.', async function () {
			const reader = await Reader.from(archivePathname);

			for (const pathname of [
				'/baz',
				'/foo',
				'/bar',
				'/bar/baz',
				'/bar/qux',
				'/bar/foo/bar',
				'/bar/foo/baz',
			]) {
				assert.ok(reader.exists(pathname));
			}
		});

		it('should be false.', async function () {
			const reader = await Reader.from(archivePathname);

			for (const pathname of [
				'/bad',
				'/bar/baz/bad',
			]) {
				assert.ok(!reader.exists(pathname));
			}
		});
	});

	describe('.open()', function () {

		describe('::FileHandle', function () {

		});
	});

});
