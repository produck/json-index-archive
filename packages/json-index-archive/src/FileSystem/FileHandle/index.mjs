import * as FileHandle from './Constructor.mjs';
import { IMPLEMENT } from './Abstract.mjs';

import Read from './Implement/Read.mjs';
import CreateReadStream from './Implement/CreateReadStream.mjs';

FileHandle.implement(IMPLEMENT.READ, Read);
FileHandle.implement(IMPLEMENT.CREATE_READ_STREAM, CreateReadStream);

export { FileHandle } from './Constructor.mjs';
