import * as crypto from 'node:crypto';

export default async function integrity({ readStream, piping }) {
	const hash = crypto.createHash('sha256');

	readStream.on('data', chunk => hash.update(chunk));
	await piping;

	return hash.digest('hex');
}
