import * as Ow from '@produck/ow';
import * as fs from 'node:fs';

const RTTF = [() => true, () => false];

export async function isFileExisted(pathname) {
	return await fs.promises.access(pathname).then(...RTTF);
}

export async function assertFileExisted(pathname) {
	if (!await isFileExisted(pathname)) {
		Ow.Error.Common(`File "${pathname}" is NOT existed.`);
	}
}
