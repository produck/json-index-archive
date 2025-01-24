import * as Ow from '@produck/ow';
import { AbstractFileHandle, IMPLEMENT } from './Abstract.mjs';

export class FileHandle extends AbstractFileHandle {}

const symbols = Object.values(IMPLEMENT);

export function implement(name, method) {
	if (!symbols.includes(name)) {
		Ow.Error.Common('Bad symbol as member name to implement.');
	}

	FileHandle.prototype[name] = function (...args) {
		return method(this, ...args);
	};
}
