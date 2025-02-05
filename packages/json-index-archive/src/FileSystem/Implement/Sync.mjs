import * as fs from 'node:fs';
import * as Stream from 'node:stream';
import * as StreamConsumer from 'node:stream/consumers';
import * as crypto from 'node:crypto';

import * as Ow from '@produck/ow';
import { Assert } from '@produck/idiom';

import * as Index from '../Index/index.mjs';

import { PATHNAME, ARCHIVE_SIZE, FILE_SIZE, ROOT } from '../Abstract.mjs';
import * as FileHandler from '../FileHandle/index.mjs';

const { NODE } = Index.Object;
const { FILE_SIZE_BUFFER_BYTE_LENGTH } = FileHandler.constants;

async function assertIntegrity(sha256, [, offset, size], handle) {
	Assert.Type.String(sha256, 'sha256');

	const start = FILE_SIZE_BUFFER_BYTE_LENGTH + Number(offset);
	const end = start + Number(size) - 1;
	const hash = crypto.createHash('sha256');
	const stream = handle.createReadStream({ autoClose: false, start, end });

	await Stream.promises.pipeline(stream, hash);

	if (hash.digest('hex') !== sha256) {
		Ow.Error.Common('File is broken.');
	}
};

const EXTENSION_HANDLERS = [
	() => {},
	assertIntegrity,
];

/** @param {import('../Constructor.mjs').FileSystem} self */
export default async (self) => {
	const { [PATHNAME]: pathname } = self;
	const stat = await fs.promises.stat(pathname);

	self[ARCHIVE_SIZE] = stat.size;

	const handle = await fs.promises.open(pathname);
	const fileSizeBuffer = new BigUint64Array([0n]);

	await handle.read(fileSizeBuffer);

	const fileSize = self[FILE_SIZE] = fileSizeBuffer[0];
	const indexStart = FILE_SIZE_BUFFER_BYTE_LENGTH + Number(fileSize);

	const readIndexStream = handle.createReadStream({
		start: indexStart, autoClose: false,
	});

	const indexBuffer = await StreamConsumer.buffer(readIndexStream);
	const children = JSON.parse(indexBuffer.toString('utf-8'));
	const root = self[ROOT] = new Index.Tree.DirectoryNode();

	for (const fileTuple of Index.Object.build(children, root)) {
		const extension = fileTuple[NODE.FILE.EXTEND];
		const fileContext = fileTuple.slice(1, NODE.FILE.EXTEND);

		async function toHandling(handler, index) {
			return await handler(extension[index], fileContext, handle);
		}

		await Promise.all(EXTENSION_HANDLERS.map(toHandling));
	}

	await handle.close();
};
