import { Readable } from 'node:stream';
import * as Ow from '@produck/ow';
import { Assert, Is } from '@produck/idiom';

import { FileHandle } from './FileHandle/index.mjs';

function normalizeDescriptor(descriptor) {
	const _descriptor = {
		path: undefined,
	};

	const {
		fetchFileHandle: _fetchFileHandle,
		path: _path = _descriptor.path,
	} = descriptor;

	Assert.Type.Function(_fetchFileHandle, 'descriptor.fetchFileHandle');

	if (!Is.Type.String(_path) && !Is.Type.Undefined(_path)) {
		Ow.Invalid('descriptor.path', 'string | undefined');
	}

	_descriptor.fetchFileHandle = _fetchFileHandle;
	_descriptor.path = _path;

	return _descriptor;
}

function normalizeOptions(options = {}) {
	Assert.Type.Object(options, 'options');

	const _options = {
		encoding: null,
		autoClose: true,
		emitClose: true,
		start: undefined,
		end: Infinity,
		highWaterMark: 64 * 1024,
		signal: undefined,
	};

	const {
		encoding: _encoding = _options.encoding,
		autoClose: _autoClose = _options.autoClose,
		emitClose: _emitClose = _options.emitClose,
		start: _start = _options.start,
		end: _end = _options.end,
		highWaterMark: _highWaterMark = _options.highWaterMark,
		signal: _signal = _options.signal,
	} = options;

	if (!Is.Null(_encoding) && !Is.Type.String(_encoding)) {
		Ow.Invalid('options.encoding', 'null | string');
	}

	Assert.Type.Boolean(_autoClose, 'options.autoClose');
	Assert.Type.Boolean(_emitClose, 'options.emitClose');

	if (!Is.Integer(_start) && !Is.Type.Undefined(_start)) {
		Ow.Invalid('options.start', 'Integer | undefined');
	}

	if (!Is.Integer(_end) && _end !== Infinity) {
		Ow.Invalid('options.end', 'Integer | Infinity');
	}

	Assert.Integer(_highWaterMark, 'options.highWaterMark');

	if (!Is.Type.Undefined(_signal) && !(_signal instanceof AbortSignal)) {
		Ow.Invalid('options.signal', 'undefined | AbortSignal');
	}

	if (_start < 0 || _start > Number.MAX_SAFE_INTEGER) {
		Ow.Error.Range([
			'The value of "start" is out of range.',
			`It must be >= 0 && <= ${Number.MAX_SAFE_INTEGER}.`,
			`Received ${_start}`,
		].join(' '));
	}

	if (Is.Integer(_end)) {
		if (_end < 0 || _end > Number.MAX_SAFE_INTEGER) {
			Ow.Error.Range([
				'The value of "end" is out of range.',
				`It must be >= 0 && <= ${Number.MAX_SAFE_INTEGER}.`,
				`Received ${_end}`,
			].join(' '));
		}

		if (_start > _end) {
			Ow.Error.Range([
				'The value of "start" is out of range.',
				`It must be <= "end" (here: ${_end}).`,
				`Received ${_start}`,
			].join(' '));
		}
	}

	if (_highWaterMark < 0) {
		Ow.Error.Range([
			'The value of "highWaterMark" is out of range.',
			'It must be >= 0.',
			`Received ${_highWaterMark}`,
		].join(' '));
	}

	_options.encoding = _encoding;
	_options.autoClose = _autoClose;
	_options.emitClose = _emitClose;
	_options.start = _start;
	_options.end = _end;
	_options.highWaterMark = _highWaterMark;
	_options.signal = _signal;

	return _options;
}

const M = {
	START: Symbol('#start'),
	END: Symbol('#end'),
	POSITION: Symbol('#position'),
	BYTES_READ: Symbol('#bytesRead'),
};

async function readByCurrentPosition(size, handle) {
	const finalSize = Math.min(size, this[M.END] - this[M.BYTES_READ]);
	const alloced = Buffer.alloc(finalSize);

	return await handle.read(alloced, 0);
}

async function readByPosition(size, handle) {
	const position = this[M.START] + this[M.BYTES_READ];
	const finalSize = Math.min(size, (this[M.END] + 1) - position);
	const alloced = Buffer.alloc(finalSize);

	return await handle.read(alloced, 0, finalSize, position);
}

export class ReadStream extends Readable {
	#path = undefined;

	get path() {
		return this.#path;
	}

	[M.BYTES_READ] = 0;

	get bytesRead() {
		return this[M.BYTES_READ];
	}

	#fetching;
	#handle = null;

	get pending() {
		return this.#handle === null ? true : false;
	}

	constructor(descriptor, ...options) {
		const { path, fetchFileHandle } = normalizeDescriptor(descriptor);

		const {
			start, end, autoClose,
			...streamOptions
		} = normalizeOptions(...options);

		super({ ...streamOptions, autoDestroy: autoClose });
		this.#path = path;

		const value = fetchFileHandle();

		if (value instanceof FileHandle) {
			this.#handle = value;
		} else {
			this.#fetching = value;
		}

		if (Is.Integer(start)) {
			this[M.START] = start;
			this[M.POSITION] = start;
			this.#read = readByPosition;
		} else {
			this.#read = readByCurrentPosition;
		}

		this[M.END] = end;
	}

	async _construct(callback) {
		try {
			if (Is.Null(this.#handle)) {
				this.#handle = await this.#fetching;
			}

			this.#handle.on('close', () => this.destroy());
			this.emit('open', this.#handle);
			this.emit('ready');
			callback();
		} catch (error) {
			callback(error);
		}
	}

	[M.START] = undefined;
	[M.END] = Infinity;
	[M.POSITION] = undefined;
	#read;

	async _read(size) {
		try {
			const {bytesRead, buffer} = await this.#read(size, this.#handle);

			this[M.BYTES_READ] += bytesRead;
			this.push(bytesRead > 0 ? buffer.slice(0, bytesRead) : null);
		} catch (error) {
			this.destroy(error);
		}
	}

	async _destroy(err, callback) {
		try {
			if (!Is.Null(this.#handle)) {
				await this.#handle.close();
			}

			callback(...(err ? [err] : []));
		} catch (handleError) {
			callback(handleError);
		}
	}
}
