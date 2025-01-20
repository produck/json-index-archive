import { describe, it } from 'mocha';

import PathnameDescribe from './Pathname.mjs';
import IndexTreeDescribe from './IndexTree.mjs';

describe('::FileSystem', function () {
	describe('::Pathname', PathnameDescribe);
	describe('::IndexTree', IndexTreeDescribe);
});
