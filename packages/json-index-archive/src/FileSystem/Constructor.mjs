import * as Ow from '@produck/ow';
import { AbstractFileSystem, PROTOTYPE } from './Abstract.mjs';

export class FileSystem extends AbstractFileSystem {}

const symbols = Object.values(PROTOTYPE);

export function implement(name, method) {
	if (!symbols.includes(name)) {
		Ow.Error.Common('Bad symbol as member name to implement.');
	}

	FileSystem.prototype[name] = function (...args) {
		return method(this, ...args);
	};
}
