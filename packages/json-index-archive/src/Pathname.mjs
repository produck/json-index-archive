import * as Ow from '@produck/ow';
import { Assert } from '@produck/idiom';

const WIN32_SEP_REG = /\\/;
const PATHNAME_REG = /^\//;
const TAIL_SEP = /(?<!^)\/+$/;
const SPAN_REG = /\/([^<>:"/\\|*?]+)/g;
const PICK_INDEX_1 = vector => vector[1];

export function toSpanList(pathname) {
	const normalized = pathname.trim().replace(TAIL_SEP, '');

	return [...normalized.matchAll(SPAN_REG)].map(PICK_INDEX_1);
}

export function assert(value) {
	Assert.Type.String(value, 'pathname');

	if (WIN32_SEP_REG.test(value)) {
		Ow.Error.Common('Use POSIX path separator instead.');
	}

	if (!PATHNAME_REG.test(value)) {
		Ow.Error.Common('Starting with "/" please.');
	}
}
