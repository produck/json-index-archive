import * as assert from 'node:assert/strict';
import { describe, it } from 'mocha';

import * as Pathname from '../../src/FileSystem/Pathname.mjs';

export default function Describe() {
	describe('::Pathname', function () {
		describe('::parse()', function () {
			it('should get a string[] as sections.', function () {
				for (const [pathname, expected] of [
					['/', []],
					['/a', ['a']],
					['/a/b', ['a', 'b']],
					['/a//b', ['a', 'b']],
					['/a///b///c', ['a', 'b', 'c']],
					['/a//b/', ['a', 'b']],
				]) {
					assert.deepEqual(Pathname.parse(pathname), expected);
				}
			});

			it('should throw if bad pathname type.', function () {
				for (const badPathname of [
					1, null, true, false, undefined, Symbol(), {}, [], 0n,
				]) {
					assert.throws(() => Pathname.parse(badPathname), {
						name: 'TypeError',
						message: 'Invalid "pathname", one "string" expected.',
					});
				}
			});

			it('should throw if pathname not in pattern.', function () {
				for (const badPathname of [
					'', '\\', '/a\\b', 'a/b/c',
				]) {
					assert.throws(() => Pathname.parse(badPathname), {
						name: 'Error',
						message: 'Bad pathname, should be POSIX absolute path.',
					});
				}
			});
		});

		describe('::stringify()', function () {
			it('should get a string as pathname.', function () {
				for (const [sections, expected] of [
					[['a', 'b'], '/a/b'],
					[[], '/'],
				]) {
					assert.equal(Pathname.stringify(...sections), expected);
				}
			});

			it('should throw if bad section type.', function () {
				for (const [sections, index] of [
					[['a', 'b', 1], 2],
					[[null, 'b'], 0],
				]) {
					assert.throws(() => Pathname.stringify(...sections), {
						name: 'TypeError',
						message: `Invalid "sections[${index}]", one "string" expected.`,
					});
				}
			});

			it('should throw if bad section type.', function () {
				for (const [sections, index] of [
					[['a', 'b', ':aaa'], 2],
					[['abc/', 'b'], 0],
				]) {
					assert.throws(() => Pathname.stringify(...sections), {
						name: 'Error',
						message: `Bad section with illegal charact at [${index}].`,
					});
				}
			});
		});

		describe('::assert()', function () {
			it('should pass.', function () {
				for (const [pathname] of [
					'/',
					'/a',
					'/a/b',
					'/a//b',
					'/a///b///c',
					'/a//b/',
				]) {
					Pathname.assert(pathname);
				}
			});

			it('should throw if bad type.', function () {
				for (const badPathname of [
					1, null, true, false, undefined, Symbol(), {}, [], 0n,
				]) {
					assert.throws(() => Pathname.assert(badPathname), {
						name: 'TypeError',
						message: 'Invalid "pathname", one "string" expected.',
					});
				}
			});

			it('should throw with specific role.', function () {
				assert.throws(() => Pathname.assert(null, 'foo'), {
					name: 'TypeError',
					message: 'Invalid "foo", one "string" expected.',
				});
			});

			it('should throw if not in pattern.', function () {
				for (const badPathname of [
					'', '\\', '/a\\b', 'a/b/c',
				]) {
					assert.throws(() => Pathname.assert(badPathname), {
						name: 'Error',
						message: 'Bad pathname, should be POSIX absolute path.',
					});
				}
			});
		});
	});
}
