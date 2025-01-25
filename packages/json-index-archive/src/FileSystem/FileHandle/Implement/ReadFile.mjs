import * as StreamConsumer from 'stream/consumers';
import * as Ow from '@produck/ow';
import { Is } from '@produck/idiom';

export function normalizeOptions(options = {}) {
	const _options = {
		encoding: null,
		signal: undefined,
	};

	const {
		encoding: _encoding = _options.encoding,
		signal: _signal = _options.signal,
	} = options;

	if (!Is.Null(_encoding) && !Is.Type.String(_encoding)) {
		Ow.Invalid('options.encoding', 'null | string');
	}

	if (!(_signal instanceof AbortSignal) && !Is.Type.Undefined(_signal)) {
		Ow.Invalid('options.signal', 'AbortSignal | undefined');
	}

	_options.encoding = _encoding;
	_options.signal = _signal;

	return _options;
}

const ArgsFormat = [
	() => normalizeOptions(),
	([arg0]) => {
		if (Is.Type.String(arg0) || Is.Null(arg0)) {
			return normalizeOptions({ encoding: arg0 });
		}

		if (Is.Type.Object(arg0) && !Is.Null(arg0)) {
			return normalizeOptions(arg0);
		}

		Ow.Invalid('args[0]', 'string | object');
	},
];

/** @returns {ReturnType<normalizeOptions>} */
export function toOptions(args) {
	return ArgsFormat[Math.min(args.length, ArgsFormat.length - 1)](args);
}

/** @param {import('../Constructor.mjs').FileHandle} self */
export default async (self, ...args) => {
	const { encoding } = toOptions(args);
	const buffer = await StreamConsumer.buffer(self.createReadStream());

	return encoding === null ? buffer : buffer.toString(encoding);
};
