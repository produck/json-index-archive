import * as fs from 'node:fs';
import * as Stream from 'node:stream';
import * as crypto from 'node:crypto';

import * as Ow from '@produck/ow';
import { Assert } from '@produck/idiom';

import * as Index from '../Index/index.mjs';

import {
	PATHNAME, ARCHIVE_SIZE, FILE_SIZE, ROOT,
	FILE_SIZE_BUFFER_BYTE_LENGTH,
} from '../Abstract.mjs';

/** @param {import('../Constructor.mjs').FileSystem} self */
export default async (self) => {
	const { [PATHNAME]: pathname } = self;
	const stat = await fs.promises.stat(pathname);

	self[ARCHIVE_SIZE] = stat.size;

	const handle = await fs.promises.open(pathname);
	const fileSizeBuffer = new BigUint64Array([0n]);

	await handle.read(fileSizeBuffer);

	const fileSize = self[FILE_SIZE] = fileSizeBuffer[0];
	const indexBuffer = Buffer.allocUnsafe(self.indexSize);

	await handle.read(indexBuffer, {
		position: FILE_SIZE_BUFFER_BYTE_LENGTH + Number(fileSize),
	});

	const indexObject = JSON.parse(indexBuffer.toString('utf-8'));
	const root = self[ROOT] = new Index.Tree.DirectoryNode();

	for (const { offset, size, sha256 } of Index.Object.build(indexObject, root)) {
		Assert.Type.String(sha256, '.sha256');

		const start = FILE_SIZE_BUFFER_BYTE_LENGTH + Number(offset);
		const end = start + Number(size) - 1;
		const hash = crypto.createHash('sha256');
		const stream = handle.createReadStream({ autoClose: false, start, end });

		await Stream.promises.pipeline(stream, hash);

		if (hash.digest('hex') !== sha256) {
			Ow.Error.Common('File is broken.');
		}
	}

	handle.close();
};
