import * as path from 'node:path';
import { describe, it } from 'mocha';

import { Archiver, visit } from '../src/Archiver.mjs';

const __dirname = import.meta.dirname;
const samplePathname = path.join(__dirname, 'sample');

describe('::Archiver', function () {
	describe('.entities()', async function () {
		it('should access all dirent.', async function () {
			const archiver = new Archiver(path.join(__dirname, 'sample'));

			for await (const dirent of archiver.entities()) {
				console.log(dirent.name);
			}
		});
	});

	describe('.paths()', async function () {
		it('should access all dirent.', async function () {
			const archiver = new Archiver(samplePathname);

			console.log(await archiver.buildIndex());
		});
	});

	describe('.archive', function () {
		it.only('should archive a file', async function () {
			const archiver = new Archiver(samplePathname);

			await archiver.archive(path.join(__dirname, 'output.gen.jiar'));
		});
	});
});
