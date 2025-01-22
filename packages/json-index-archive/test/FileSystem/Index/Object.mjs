import * as assert from 'node:assert/strict';
import { describe, it } from 'mocha';

import * as Index from '../../../src/FileSystem/Index/index.mjs';

export default function Describe() {
	describe('::build()', function () {
		it('should throw bad object.', function () {
			assert.throws(() => [...Index.Object.build('bad')], {
				name: 'TypeError',
				message: 'Invalid "object", one "object" expected.',
			});
		});

		it('should throw bad object.', function () {
			assert.throws(() => [...Index.Object.build({ children: [] }, null)], {
				name: 'TypeError',
				message: 'Invalid "node", one "FileNode | DirectoryNode" expected.',
			});
		});

		it('should throw if bad object.name.', function () {
			assert.throws(() => [...Index.Object.build({
				children: [{ name: null }],
			}, new Index.Tree.DirectoryNode())], {
				name: 'TypeError',
				message: 'Invalid ".name", one "string" expected.',
			});
		});

		it('should throw if bad object.children.', function () {
			assert.throws(() => [...Index.Object.build({
				children: {},
			}, new Index.Tree.DirectoryNode())], {
				name: 'TypeError',
				message: 'Invalid ".children", one "Array" expected.',
			});
		});

		it('should throw if bad object.offset.', function () {
			assert.throws(() => [...Index.Object.build({
				children: [{ name: 'foo', offset: null }],
			}, new Index.Tree.DirectoryNode())], {
				name: 'TypeError',
				message: 'Invalid ".offset", one "string" expected.',
			});
		});

		it('should throw if bad object.size.', function () {
			assert.throws(() => [...Index.Object.build({
				children: [{ name: 'foo', offset: '10', size: null }],
			}, new Index.Tree.DirectoryNode())], {
				name: 'TypeError',
				message: 'Invalid ".size", one "string" expected.',
			});
		});

		it('should throw if object.offset is NaN.', function () {
			assert.throws(() => [...Index.Object.build({
				children: [{ name: 'foo', offset: 'bad', size: 'bad' }],
			}, new Index.Tree.DirectoryNode())], {
				name: 'Error',
				message: '".offset" SHOULD NOT be NaN.',
			});
		});

		it('should throw if object.size is NaN.', function () {
			assert.throws(() => [...Index.Object.build({
				children: [{ name: 'foo', offset: '10', size: 'bad' }],
			}, new Index.Tree.DirectoryNode())], {
				name: 'Error',
				message: '".size" SHOULD NOT be NaN.',
			});
		});

		it('should build a tree.', function () {
			const root = new Index.Tree.DirectoryNode();
			const list = [];

			for (const object of Index.Object.build({
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
				[[], Index.Tree.DirectoryNode],
				[['foo'], Index.Tree.DirectoryNode],
				[['foo', 'bar'], Index.Tree.FileNode],
				[['bar'], Index.Tree.DirectoryNode],
				[['baz'], Index.Tree.FileNode],
			]) {
				assert.ok(Node.isNode(root.find(...sections)));
			}
		});
	});
}
