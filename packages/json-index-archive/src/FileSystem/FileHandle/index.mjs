import * as FileHandle from './Constructor.mjs';
import { IMPLEMENT } from './Abstract.mjs';

import Read from './Implement/Read.mjs';

FileHandle.implement(IMPLEMENT.READ, Read);

export { FileHandle } from './Constructor.mjs';
