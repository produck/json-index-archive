import * as path from 'node:path';
import * as assert from 'node:assert/strict';
import { describe, it } from 'mocha';

import { FileSystem } from '../../../src/FileSystem/index.mjs';
import { FileHandle } from '../../../src/FileSystem/FileHandle/index.mjs';

import ReadDescribe from './read.mjs';

const __dirname = import.meta.dirname;
const samplePathname = path.resolve(__dirname, '../sample.jiar');

export default function Describe() {
	describe('.close()', function () {
		it('should close.', async function () {
			const jiar = await FileSystem.mount(samplePathname);
			const handle = await jiar.open('/');

			assert.ok(handle instanceof FileHandle);
			await handle.close();
		});
	});

	describe('.read()', ReadDescribe);
	describe('.readFile()', function () {

	});

	describe('.createReadStream', function () {

	});
}
