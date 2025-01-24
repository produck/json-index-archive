import * as StreamConsumers from 'node:stream/consumers';
import * as assert from 'node:assert/strict';
import * as path from 'node:path';
import { describe, it } from 'mocha';

import { FileSystem } from '../../src/FileSystem/index.mjs';

const __dirname = import.meta.dirname;
const samplePathname = path.resolve(__dirname, 'sample.jiar');

export default function Describe() {
	it('should get a buffer from stream.', async function () {
		const jiar = await FileSystem.mount(samplePathname);
		const stream = jiar.createReadStream('/baz');
		const buffer = await StreamConsumers.buffer(stream);

		assert.deepEqual([...buffer], [98, 97, 122, 10]);
	});

	it('should get a EOF from stream if comsuming again.', async function () {
		const jiar = await FileSystem.mount(samplePathname);
		const stream = jiar.createReadStream('/baz');

		assert.deepEqual([...await StreamConsumers.buffer(stream)], [98, 97, 122, 10]);
		assert.deepEqual([...await StreamConsumers.buffer(stream)], []);
		assert.equal(stream.read(), null);
	});
}
