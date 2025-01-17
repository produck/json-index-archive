import * as Ow from '@produck/ow';
import * as path from 'node:path';
import * as fs from 'node:fs';
import { Assert } from '@produck/idiom';

const WIN32_SEP_REG = /^\\\\/;
const PATHNAME_REG = /^\//;
const RTTF = [() => true, () => false];

export async function isFileExisted(pathname) {
	return await fs.promises.access(pathname).then(...RTTF);
}

export async function assertFileExisted(pathname) {
	if (!isFileExisted(pathname)) {
		Ow.Error.Common(`File "${pathname}" is NOT existed.`);
	}
}

export const Pathname = {
	assert(value) {
		Assert.Type.String(value, 'pathname');

		if (WIN32_SEP_REG.test(value)) {
			Ow.Error.Common('Use POSIX path separator instead.');
		}

		if (!PATHNAME_REG.test(value)) {
			Ow.Error.Common('Starting with "/" please.');
		}
	},
	parse(value) {
		return value.trim().split(path.posix.sep);
	},
};
