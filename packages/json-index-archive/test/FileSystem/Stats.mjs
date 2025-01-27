import * as fs from 'node:fs';
import * as assert from 'node:assert/strict';
import { describe, it } from 'mocha';

import { Stats } from '../../src/FileSystem/Stats.mjs';
import { Tree } from '../../src/FileSystem/Index/index.mjs';

const { S_IFREG, S_IFDIR } = fs.constants;

export default function Describe() {
	it('should create a stats', () => {
		new Stats(new Tree.DirectoryNode());
	});

	describe('.mode', function () {
		it('should get 0', () => {
			const stats = new Stats(null);

			assert.equal(stats.mode, 0);
		});

		it('should get S_IFDIR', () => {
			const stats = new Stats(new Tree.DirectoryNode());

			assert.equal(stats.mode, S_IFDIR);
		});

		it('should get S_IFREG', () => {
			const stats = new Stats(new Tree.FileNode(0, 10, []));

			assert.equal(stats.mode, S_IFREG);
		});
	});

	describe('.size', function () {
		it('should get 0 if directory', () => {
			const stats = new Stats(new Tree.DirectoryNode());

			assert.equal(stats.size, 0);
		});

		it('should get integer if file', () => {
			const stats = new Stats(new Tree.FileNode(0, 10, []));

			assert.equal(stats.size, 10);
		});

		it('should throw if bad node.', () => {
			const stats = new Stats(null);

			assert.throws(() => stats.size, {
				name: 'Error',
				message: 'Unkown size getter.',
			});
		});
	});

	describe('.isFile()', function () {
		it('should get false', () => {
			const stats = new Stats(new Tree.DirectoryNode());

			assert.equal(stats.isFile(), false);
		});

		it('should get true', () => {
			const stats = new Stats(new Tree.FileNode(0, 10, []));

			assert.equal(stats.isFile(), true);
		});
	});

	describe('.isDirectory()', function () {
		it('should get false', () => {
			const stats = new Stats(new Tree.FileNode(0, 10, []));

			assert.equal(stats.isDirectory(), false);
		});

		it('should get true', () => {
			const stats = new Stats(new Tree.DirectoryNode());

			assert.equal(stats.isDirectory(), true);
		});
	});

	describe('.birthtimeMs', function () {
		it('should get birthtime stamp.', () => {
			const now = Date.now();
			const stats = new Stats(new Tree.FileNode(0, 10, [now]));

			assert.equal(stats.birthtimeMs, now);
		});
	});

	describe('.birthtime', function () {
		it('should get birthtime Date.', () => {
			const now = Date.now();
			const stats = new Stats(new Tree.FileNode(0, 10, [now]));

			assert.equal(stats.birthtime.getTime(), now);
		});
	});
}
