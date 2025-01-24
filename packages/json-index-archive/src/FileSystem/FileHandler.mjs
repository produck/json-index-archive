import * as fs from 'node:fs';
import { EventEmitter } from 'node:events';
import * as StreamConsumers from 'node:stream/consumers';

import * as Ow from '@produck/ow';
import { Assert, Is } from '@produck/idiom';

function normalizeReadOptions(options = {}) {
	const buffer = Buffer.alloc(16384);
	const offset = 0;

	const _options = {
		buffer, offset,
		length: buffer.byteLength - offset,
		position: null,
	};

	const {
		buffer: _buffer = _options.buffer,
		offset: _offset = _options.offset,
		length: _length = _options.length,
		position: _position = _options.position,
	} = options;

	if (!Buffer.isBuffer(buffer)) {
		Ow.Invalid('options.buffer', 'Buffer');
	}

	Assert.Integer(_offset, 'options.offset');
	Assert.Integer(_length, 'options.length');

	if (!Is.Null(_position) && !Is.Integer(_position)) {
		Ow.Invalid('options.position', 'null | integer');
	}

	if (_offset < 0) {
		Ow.Error.Range('The "options.offset" should NOT less then 0.');
	}

	if (_length < 0) {
		Ow.Error.Range('The "options.length" should NOT less then 0.');
	}

	_options.buffer = _buffer;
	_options.offset = _offset;
	_options.length = _length;
	_options.position = _position;

	return _options;
}

export function normalizeReadStreamOptions(options) {

}

export function normalizeReadFileOptions(options) {
	const _options = {
		encoding: null,
		signal: undefined,
	};

	const {
		encoding: _encoding = _options.encoding,
		signal: _signal = _options.encoding,
	} = options;

	if (!Is.Null(_encoding) && !Is.Type.String(_encoding)) {
		Ow.Invalid('options.encoding', 'null | string');
	}

	if (!(_signal instanceof AbortSignal) && !Is.Type.Undefined(_signal)) {
		Ow.Invalid('options.signal', 'AbortSignal | undefined');
	}

	_options.encoding = null;
	_options.signal = null;

	return _options;
}

const ReadArgsFormat = {
	None: {
		test: args => args.length === 0,
		options: () => normalizeReadOptions(),
	},
	Buffer: {
		test: args => args.length === 1 && Buffer.isBuffer(args[0]),
		options: ([buffer]) => normalizeReadOptions({ buffer }),
	},
	Options: {
		test: args => {
			if (args.length !== 1) {
				return false;
			}

			const [options] = args;

			return Is.Type.Object(options) &&
				!Is.Null(options) &&
				!Buffer.isBuffer(options);
		},
		options: ([options]) => normalizeReadOptions(options),
	},
	BufferOptions: {
		test: args => {
			if (args.length !== 2) {
				return false;
			}

			const [buffer, options] = args;

			return Buffer.isBuffer(buffer) && Is.Type.Object(options) && !Is.Null(options);
		},
		options: ([buffer, options]) => normalizeReadOptions({ buffer, ...options }),
	},
};

/** @returns {ReturnType<normalizeReadOptions>} */
function argsOfReadToOptions(args) {
	for (const name in ReadArgsFormat) {
		const { test, options } = ReadArgsFormat[name];

		if (test(args)) {
			return options(args);
		}
	}

	Ow.Error.Common('No matched arguments format.');
}

export class FileHandle extends EventEmitter {
	#position = 0;
	/** @type {fs.promises.FileHandle} */
	#handle;
	#offset = 0;
	#size = 0;

	constructor(handle, offset, size) {
		super();
		this.#handle = handle.on('close', (...args) => this.emit(...args));
		this.#offset = offset;
		this.#size = size;
		Object.freeze(this);
	}

	async close() {
		await this.#handle.close();
	}

	async read(...args) {
		const {
			buffer, offset, length, position,
		} = argsOfReadToOptions(args);

		const result = await this.#handle.read(buffer, {
			offset,
			length: Math.min(this.#size - this.#position, length),
			position: position + this.#position,
		});

		this.#position += result.bytesRead;

		return result;
	}

	async readFile(options) {
		const { encoding, signal } = normalizeReadFileOptions(options);

		const readStream = this.#handle.createReadStream({
			encoding,
			start: this.#offset,
			end: this.#offset + this.#size - 1,
			signal,
		});

		const buffer = await StreamConsumers.buffer(readStream);

		this.#position += readStream.bytesRead;

		return encoding === null ? buffer : buffer.toString(encoding);
	}

	createReadStream(options) {
		return this.#handle.createReadStream(options);
		// https://nodejs.org/dist/v20.18.1/docs/api/fs.html#filehandlecreatereadstreamoptions
	}
}
