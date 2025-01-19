import * as assert from 'node:assert/strict';
import { describe, it } from 'mocha';

import * as Pathname from '../src/Pathname.mjs';

describe(';;Pathname', function () {
	describe('::toSpanList()', function () {
		it('should ok', function () {
			for (const [pathname, spanList] of [
				['/', []],
				['/a', ['a']],
				['/a/b', ['a', 'b']],
				['/a//b', ['a', 'b']],
				['/a///b///c', ['a', 'b', 'c']],
				['/a//b/', ['a', 'b']],
			]) {
				assert.deepEqual(Pathname.toSpanList(pathname), spanList);
			}
		});
	});
});
