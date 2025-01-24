import * as Ow from '@produck/ow';
import { Assert, Is } from '@produck/idiom';
import { MEMBER } from '../Abstract.mjs';

const DEFAULT_BUFFER_BYTE_LENGTH = 1 << 14;

function normalizeOptions(options = {}) {
	const _options = {
		offset: 0,
		position: null,
		...(Buffer.isBuffer(options.buffer) ? {
			buffer: options.buffer,
			length: options.buffer.length,
		}: {
			buffer: Buffer.alloc(DEFAULT_BUFFER_BYTE_LENGTH),
			length: DEFAULT_BUFFER_BYTE_LENGTH,
		}),
	};

	const {
		buffer: _buffer = _options.buffer,
		offset: _offset = _options.offset,
		length: _length = _options.length,
		position: _position = _options.position,
	} = options;

	if (!Buffer.isBuffer(_buffer)) {
		Ow.Invalid('options.buffer', 'Buffer');
	}

	Assert.Integer(_offset, 'options.offset');
	Assert.Integer(_length, 'options.length');

	if (!Is.Null(_position) && !Is.Integer(_position)) {
		Ow.Invalid('options.position', 'null | Integer');
	}

	if (_offset < 0) {
		Ow.Error.Range([
			'The value of "offset" is out of range.',
			`It must be >= 0 && <= ${Number.MAX_SAFE_INTEGER}.`,
			`Received ${_offset}`,
		].join(' '));
	}

	if (_length < 0) {
		Ow.Error.Range([
			'The value of "length" is out of range.',
			'It must be >= 0.',
			`Received ${_length}`,
		].join(' '));
	}

	if (_length > _buffer.length) {
		Ow.Error.Range([
			'The value of "length" is out of range.',
			`It must be <= ${_buffer.length}.`,
			`Received ${_length}`,
		].join(' '));
	}

	_options.buffer = _buffer;
	_options.offset = _offset;
	_options.length = _length;
	_options.position = normalizePosition(_position);

	return _options;
}

function normalizePosition(position) {
	if (position === null) {
		return null;
	}

	if (Is.Integer(position) && position < 0) {
		return null;
	}

	return position;
}

const ArgsFormat = [
	() => normalizeOptions(),
	([arg0]) => {
		if (Buffer.isBuffer(arg0)) {
			return normalizeOptions({ buffer: arg0 });
		}

		if (Is.Type.Object(arg0) && !Is.Null(arg0)) {
			return normalizeOptions(arg0);
		}

		Ow.Invalid('args[0]', 'Buffer | object');
	},
	([buffer, arg1]) => {
		if (!Buffer.isBuffer(buffer)) {
			Ow.Invalid('args[0] as buffer', 'Buffer');
		}

		// As offset
		if (Is.Integer(arg1)) {
			return normalizeOptions({ buffer, offset: arg1 });
		}

		// As options
		if (Is.Type.Object(arg1) && !Is.Null(arg1)) {
			return normalizeOptions({ buffer, ...arg1});
		}

		Ow.Invalid('args[1]', 'object | Integer');
	},
	([buffer, offset, length]) => {
		if (!Buffer.isBuffer(buffer)) {
			Ow.Invalid('args[0] as buffer', 'Buffer');
		}

		Assert.Integer(offset, 'args[1] as offset');
		Assert.Integer(length, 'args[2] as length');

		return normalizeOptions({ buffer, offset, length });
	},
	([buffer, offset, length, position]) => {
		if (!Buffer.isBuffer(buffer)) {
			Ow.Invalid('args[0] as buffer', 'Buffer');
		}

		Assert.Integer(offset, 'args[1] as offset');
		Assert.Integer(length, 'args[2] as length');

		if (!Is.Integer(position) && !Is.Type.BigInt(position) && !Is.Null(position)) {
			Ow.Invalid('args[3] as position', 'Integer | bigint | null');
		}

		return normalizeOptions({ buffer, offset, length, position });
	},
];

/** @returns {ReturnType<normalizeOptions>} */
function toOptions(args) {
	return ArgsFormat[Math.min(args.length, ArgsFormat.length)](args);
}

/** @param {import('../Constructor.mjs').FileHandle} self */
export default async (self, ...args) => {
	const { buffer, offset, length, position } = toOptions(args);

	const finalLength = Math.min(length, self[MEMBER.SIZE] - self[MEMBER.POSITION]);
	const finalPosition = position === null ? self[MEMBER.POSITION] : position;

	const result = await self[MEMBER.NATIVE_HANDLE].read(buffer, {
		offset, length: finalLength,
		position: self[MEMBER.OFFSET] + finalPosition,
	});

	if (Is.Null(position)) {
		self[MEMBER.POSITION] += result.bytesRead;
	}

	return result;
};
