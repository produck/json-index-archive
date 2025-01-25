import * as assert from 'node:assert/strict';
import { describe, it } from 'mocha';

import * as Index from '../../../src/FileSystem/Index/index.mjs';

export default function Describe() {
	describe('::build()', function () {
		it('should throw bad DirectoryTuple[NODE.DIRECTORY.CHILDREN].', () => {
			assert.throws(() => [...Index.Object.build('bad')], {
				name: 'TypeError',
				message: 'Invalid "DirectoryTuple[2]", one "Array" expected.',
			});
		});

		it('should throw bad node.', () => {
			assert.throws(() => [...Index.Object.build([], null)], {
				name: 'TypeError',
				message: 'Invalid "node", one "FileNode | DirectoryNode" expected.',
			});
		});

		it('should throw if bad Tuple[NODE.NAME].', () => {
			assert.throws(() => [...Index.Object.build([
				[0, null],
			], new Index.Tree.DirectoryNode())], {
				name: 'TypeError',
				message: 'Invalid "Tuple[1]", one "string" expected.',
			});
		});

		it('should throw if bad DirectoryTuple[NODE.DIRECTORY.CHILDREN].', () => {
			assert.throws(() => [...Index.Object.build([
				[1, 'foo', {}],
			], new Index.Tree.DirectoryNode())], {
				name: 'TypeError',
				message: 'Invalid "DirectoryTuple[2]", one "Array" expected.',
			});
		});

		it('should throw if bad FileTuple[NODE.FILE.OFFSET].', () => {
			assert.throws(() => [...Index.Object.build([
				[0, 'foo', null],
			], new Index.Tree.DirectoryNode())], {
				name: 'TypeError',
				message: 'Invalid "FileTuple[2]", one "string" expected.',
			});
		});

		it('should throw if bad FileTuple[NODE.FILE.SIZE].', () => {
			assert.throws(() => [...Index.Object.build([
				[0, 'foo', '10', null],
			], new Index.Tree.DirectoryNode())], {
				name: 'TypeError',
				message: 'Invalid "FileTuple[3]", one "string" expected.',
			});
		});

		it('should throw if FileTuple[NODE.FILE.OFFSET] is NaN.', () => {
			assert.throws(() => [...Index.Object.build([
				[0, 'foo', 'bad', 'bad'],
			], new Index.Tree.DirectoryNode())], {
				name: 'Error',
				message: '"FileTuple[2]" SHOULD NOT be NaN.',
			});
		});

		it('should throw if FileTuple[NODE.FILE.SIZE] is NaN.', () => {
			assert.throws(() => [...Index.Object.build([
				[0, 'foo', '10', 'bad'],
			], new Index.Tree.DirectoryNode())], {
				name: 'Error',
				message: '"FileTuple[3]" SHOULD NOT be NaN.',
			});
		});

		it('should build a tree.', () => {
			const root = new Index.Tree.DirectoryNode();
			const list = [];

			for (const fileTuple of Index.Object.build([
				[1, 'foo', [
					[0, 'bar', '0', '10'],
				]],
				[1, 'bar', []],
				[0, 'baz', '0', '11'],
			], root)) {
				list.push(fileTuple);
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
