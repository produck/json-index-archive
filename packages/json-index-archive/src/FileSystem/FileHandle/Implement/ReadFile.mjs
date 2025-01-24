import { Assert, Is } from '@produck/idiom';
import * as Ow from '@produck/ow';
import { IMPLEMENT, MEMBER } from '../Abstract.mjs';

export function normalizeOptions(options) {
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

const ArgsFormat = [
	() => {
		return normalizeOptions();
	},
	([arg0]) => {
		if (Is.Type.String(arg0)) {
			return normalizeOptions({ encoding: arg0 });
		}

		if (Is.Type.Object(arg0)) {
			return normalizeOptions(arg0);
		}

		Ow.Invalid('args[0]', 'string | object');
	},
];

/** @returns {ReturnType<normalizeOptions>} */
export function toOptions(...args) {
	return ArgsFormat[Math.min(args.length, ArgsFormat.length) - 1](args);
}

/** @returns {ReturnType<normalizeOptions>} */
export default async (self, ...args) => {
	const { encoding } = toOptions(args);
	const length = self[MEMBER.SIZE] - self[MEMBER.POSITION];
	const { buffer } = await self[IMPLEMENT.READ](Buffer.alloc(length));

	return encoding === null ? buffer : buffer.toString(encoding);
};
