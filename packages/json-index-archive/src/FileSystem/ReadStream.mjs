import { Stream } from 'node:stream';

export class ReadStream extends Stream.Readable {
	path = '';
	pending = true;
	bytesRead = 0;


}
