import * as assert from 'node:assert/strict';
import { describe, it } from 'mocha';

import * as IndexObject from '../../src/FileSystem/IndexObject.mjs';
import * as IndexTree from '../../src/FileSystem/IndexTree/index.mjs';

export default function Describe() {
	describe('::build()', function () {
		it('should throw bad object.', function () {
			assert.throws(() => [...IndexObject.build('bad')], {
				name: 'TypeError',
				message: 'Invalid "object", one "object" expected.',
			});
		});

		it('should throw bad object.', function () {
			assert.throws(() => [...IndexObject.build({ children: [] }, null)], {
				name: 'TypeError',
				message: 'Invalid "node", one "FileNode | DirectoryNode" expected.',
			});
		});

		it('should throw if bad object.name.', function () {
			assert.throws(() => [...IndexObject.build({
				children: [{ name: null }],
			}, new IndexTree.DirectoryNode())], {
				name: 'TypeError',
				message: 'Invalid ".name", one "string" expected.',
			});
		});

		it('should throw if bad object.children.', function () {
			assert.throws(() => [...IndexObject.build({
				children: {},
			}, new IndexTree.DirectoryNode())], {
				name: 'TypeError',
				message: 'Invalid ".children", one "Array" expected.',
			});
		});

		it('should throw if bad object.offset.', function () {
			assert.throws(() => [...IndexObject.build({
				children: [{ name: 'foo', offset: null }],
			}, new IndexTree.DirectoryNode())], {
				name: 'TypeError',
				message: 'Invalid ".offset", one "string" expected.',
			});
		});

		it('should throw if bad object.size.', function () {
			assert.throws(() => [...IndexObject.build({
				children: [{ name: 'foo', offset: '10', size: null }],
			}, new IndexTree.DirectoryNode())], {
				name: 'TypeError',
				message: 'Invalid ".size", one "string" expected.',
			});
		});

		it('should throw if object.offset is NaN.', function () {
			assert.throws(() => [...IndexObject.build({
				children: [{ name: 'foo', offset: 'bad', size: 'bad' }],
			}, new IndexTree.DirectoryNode())], {
				name: 'Error',
				message: '".offset" SHOULD NOT be NaN.',
			});
		});

		it('should throw if object.size is NaN.', function () {
			assert.throws(() => [...IndexObject.build({
				children: [{ name: 'foo', offset: '10', size: 'bad' }],
			}, new IndexTree.DirectoryNode())], {
				name: 'Error',
				message: '".size" SHOULD NOT be NaN.',
			});
		});

		it('should build a tree.', function () {
			const root = new IndexTree.DirectoryNode();
			const list = [];

			for (const object of IndexObject.build({
				name: '', children: [{
					name: 'foo', children: [{
						name: 'bar', offset: '0', size: '10',
					}],
				}, {
					name: 'bar', children: [],
				}, {
					name: 'baz', offset: '0', size: '11',
				}],
			}, root)) {
				list.push(object);
			}

			assert.equal(list.length, 2);

			for (const [sections, Node] of [
				[[], IndexTree.DirectoryNode],
				[['foo'], IndexTree.DirectoryNode],
				[['foo', 'bar'], IndexTree.FileNode],
				[['bar'], IndexTree.DirectoryNode],
				[['baz'], IndexTree.FileNode],
			]) {
				assert.ok(Node.isNode(root.find(...sections)));
			}
		});
	});
}
