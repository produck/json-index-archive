import * as assert from 'node:assert/strict';
import { describe, it } from 'mocha';

import {
	DirectoryNode, FileNode,
	ORDER, VISIT_AT, isNode,
} from '../../../src/FileSystem/Index/Tree.mjs';

export default function Describe() {
	describe('::isNode()', function () {
		it('should be false', function () {
			assert.equal(isNode(null), false);
		});

		it('should be true', function () {
			for (const value of [
				new DirectoryNode(),
				new FileNode(0, 0),
			]) {
				assert.equal(isNode(value), true);
			}
		});
	});

	describe('::FileNode', function () {
		describe('constructor()', function () {
			it('should create a FileNode', function () {
				new FileNode(0, 0);
			});

			it('should throw if bad offset type.', function () {
				assert.throws(() => new FileNode(), {
					name: 'TypeError',
					message: 'Invalid "offset", one "Integer" expected.',
				});
			});

			it('should throw if bad size type.', function () {
				assert.throws(() => new FileNode(0), {
					name: 'TypeError',
					message: 'Invalid "size", one "Integer" expected.',
				});
			});

			it('should throw if bad offset range.', function () {
				assert.throws(() => new FileNode(-1, 0), {
					name: 'RangeError',
					message: 'Offset MUST be > 0.',
				});
			});

			it('should throw if bad size range.', function () {
				assert.throws(() => new FileNode(0, -1), {
					name: 'RangeError',
					message: 'Size MUST be > 0.',
				});
			});
		});

		describe('.offset', function () {
			it('should get offset.', function () {
				const node = new FileNode(10, 20);

				assert.equal(node.offset, 10);
			});
		});

		describe('.size', function () {
			it('should get size.', function () {
				const node = new FileNode(10, 20);

				assert.equal(node.size, 20);
			});
		});

		describe('::isNode', function () {
			it('should get true.', function () {
				assert.equal(FileNode.isNode(new FileNode(0, 0)), true);
			});

			it('should get false.', function () {
				assert.equal(FileNode.isNode(null), false);
			});
		});
	});

	describe('::DirectoryNode', function () {
		describe('.getChild()', function () {
			it('should get null', function () {
				const node = new DirectoryNode();

				assert.equal(node.getChild('notExisted'), null);
			});

			it('should get a node.', function () {
				const node = new DirectoryNode();
				const child = new FileNode(10, 10);

				node.appendChild('foo', child);
				assert.equal(node.getChild('foo'), child);
			});
		});

		describe('.appendChild()', function () {
			it('should apppend a child.', function () {
				const node = new DirectoryNode();
				const child = new FileNode(10, 10);

				node.appendChild('foo', child);
				assert.equal(node.getChild('foo'), child);
			});

			it('should throw if bad name.', function () {
				const node = new DirectoryNode();

				assert.throws(() => node.appendChild(null), {
					name: 'TypeError',
					message: 'Invalid "name", one "string" expected.',
				});
			});

			it('should throw if bad node.', function () {
				const node = new DirectoryNode();

				assert.throws(() => node.appendChild('foo', null), {
					name: 'TypeError',
					message: 'Invalid "node", one "FileNode | DirectoryNode" expected.',
				});
			});

			it('should throw if duplicated name.', function () {
				const node = new DirectoryNode();
				const child = new FileNode(10, 10);

				node.appendChild('foo', child);

				assert.throws(() => node.appendChild('foo', child), {
					name: 'Error',
					message: 'Duplicated name "foo".',
				});
			});
		});

		describe('[Symbol.iterator]()', function () {
			it('should get a list of records.', function () {
				const nodes = {
					foo: new DirectoryNode(),
					bar: new DirectoryNode(),
					baz: new DirectoryNode(),
					qux: new FileNode(0, 0),
				};

				const node = new DirectoryNode();

				for (const name in nodes) {
					node.appendChild(name, nodes[name]);
				}

				for (const [name, child] of node) {
					assert.strictEqual(nodes[name], child);
				}
			});
		});

		function SampleTree() {
			const root = new DirectoryNode();

			root.appendChild('foo', (function() {
				const l1 = new DirectoryNode();

				l1.appendChild('bar', (function () {
					const l2 = new DirectoryNode();

					l2.appendChild('baz', new FileNode(0, 0));
					l2.appendChild('qux', new FileNode(0, 0));
					l2.appendChild('foo', new DirectoryNode); // empty directory

					return l2;
				})());

				l1.appendChild('baz', (function () {
					const l2 = new DirectoryNode();

					l2.appendChild('bar', (function () {
						const l3 = new DirectoryNode();

						l3.appendChild('foo', new FileNode(0, 0));
						l3.appendChild('baz', new FileNode(0, 0));
						l3.appendChild('qux', new DirectoryNode());

						return l3;
					})());

					return l2;
				})());

				return l1;
			})());

			root.appendChild('bar', new FileNode(0, 0));
			root.appendChild('baz', new DirectoryNode());
			root.appendChild('qux', new DirectoryNode());

			return root;
		}

		describe('.find()', function () {
			it('should get null', function () {
				const root = SampleTree();

				for (const sections of [
					['bad'],
					['foo', 'bar', 'bad'],
					['foo', 'baz', 'bar', 'baz', 'any'],
				]) {
					assert.equal(root.find(...sections), null);
				}
			});

			it('should get node.', function () {
				const root = SampleTree();

				for (const [sections, Node] of [
					[[], DirectoryNode],
					[['foo'], DirectoryNode],
					[['bar'], FileNode],
					[['baz'], DirectoryNode],
					[['qux'], DirectoryNode],
					[['foo', 'bar'], DirectoryNode],
					[['foo', 'baz'], DirectoryNode],
					[['foo', 'bar', 'baz'], FileNode],
					[['foo', 'bar', 'qux'], FileNode],
					[['foo', 'bar', 'foo'], DirectoryNode],
					[['foo', 'baz', 'bar'], DirectoryNode],
					[['foo', 'baz', 'bar', 'foo'], FileNode],
					[['foo', 'baz', 'bar', 'baz'], FileNode],
					[['foo', 'baz', 'bar', 'qux'], DirectoryNode],
				]) {
					assert.ok(Node.isNode(root.find(...sections)));
				}
			});
		});

		describe('.records()', function () {
			it('should throw if bad order.', function () {
				assert.throws(() => new DirectoryNode().records(null), {
					name: 'TypeError',
					message: 'Invalid "order", one "function" expected.',
				});
			});

			it('should get a list of records.', function () {
				const root = SampleTree();
				const list = root.records();

				assert.equal(list.length, 4);

				for (const [name, node] of list) {
					assert.equal(root.getChild(name), node);
				}
			});

			it('should get a list of records in TYPE_THEN_NAME order.', function () {
				const root = SampleTree();
				const list = root.records(ORDER.TYPE_THEN_NAME);

				assert.equal(list.length, 4);

				assert.deepEqual(list.map(record => record[0]), [
					'baz', 'foo', 'qux', 'bar',
				]);
			});
		});

		describe('.children()', function () {
			it('should throw if bad options.', function () {
				assert.throws(() => [...new DirectoryNode().children('bad')], {
					name: 'TypeError',
					message: 'Invalid "depth", one "Integer" expected.',
				});
			});

			it('should throw if bad options.visitAt type.', function () {
				assert.throws(() => [...new DirectoryNode().children(1, 'bad')], {
					name: 'TypeError',
					message: 'Invalid "options", one "object" expected.',
				});
			});

			it('should throw if bad options.visitAt range.', function () {
				for (const visitAt of [-1, VISIT_AT.ALL + 1]) {
					assert.throws(() => [...new DirectoryNode().children(1, {
						visitAt,
					})], {
						name: 'RangeError',
						message: 'A "options.visitAt" MUST NOT be < 0 or > 3.',
					});
				}
			});

			it('should throw if bad options.order.', function () {
				assert.throws(() => [...new DirectoryNode().children(1, {
					order: null,
				})], {
					name: 'TypeError',
					message: 'Invalid "options.order", one "function" expected.',
				});
			});

			it('should get [] if depth < 1', function () {
				assert.deepEqual([...SampleTree().children(0)], []);
			});

			it('should get list by default args.', function () {
				const root = SampleTree();
				const list = [...root.children()];

				assert.equal(list.length, 4);

				for (const [name, node] of list) {
					assert.equal(root.getChild(name), node);
				}
			});

			it('should get a list of all records by depth = 10', function () {
				const root = SampleTree();
				const list = [...root.children(10)];

				assert.equal(list.length, 13);
			});

			it('should get all records twice by VISIT_AT.ALL.', function () {
				const root = SampleTree();
				const visited = new Set();
				const stack = [];
				const list = [];

				for (const record of root.children(10, {
					visitAt: VISIT_AT.ALL,
					order: ORDER.TYPE_THEN_NAME,
				})) {
					if (visited.has(record)) {
						stack.pop();
					} else {
						visited.add(record);

						const [name, node] = record;

						stack.push(name);
						list.push([[...stack], node]);
					}
				}

				assert.equal(list.length, 13);

				for (const [sections, node] of list) {
					assert.equal(root.find(...sections), node);
				}
			});
		});
	});
}
