import * as fs from 'node:fs';

export default async function birthtime({ pathname }) {
	const stat = await fs.promises.stat(pathname);

	return [Math.trunc(stat.birthtimeMs)];
}
