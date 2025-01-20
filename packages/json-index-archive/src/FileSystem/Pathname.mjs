import * as path from 'node:path';
import * as Ow from '@produck/ow';
import { Assert } from '@produck/idiom';

const SECTION_REG = /[^<>:"/\\|*?]+/g;
const BAD_SECTION_REG = /[<>:"/\\|*?]+/;

export function parse(pathname) {
	assert(pathname);

	return [...pathname.trim().matchAll(SECTION_REG)].flat();
}

export function assertSection(value, index) {
	const role = `sections[${index}]`;

	Assert.Type.String(value, role);

	if (BAD_SECTION_REG.test(value)) {
		Ow.Error.Common(`Bad section with illegal charact at [${index}].`);
	}
}

export function stringify(...sections) {
	sections.forEach(assertSection);

	return path.posix.join('/', ...sections);
}

export function assert(value, role = 'pathname') {
	Assert.Type.String(value, role);

	if (!path.posix.isAbsolute(value) || value.includes(path.win32.sep)) {
		Ow.Error.Common('Bad pathname, should be POSIX absolute path.');
	}
}
