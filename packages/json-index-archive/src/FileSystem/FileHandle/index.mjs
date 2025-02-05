import * as FileHandle from './Constructor.mjs';
import { IMPLEMENT } from './Abstract.mjs';

import Read from './Implement/Read.mjs';
import CreateReadStream from './Implement/CreateReadStream.mjs';
import ReadFile from './Implement/ReadFile.mjs';

FileHandle.implement(IMPLEMENT.READ, Read);
FileHandle.implement(IMPLEMENT.CREATE_READ_STREAM, CreateReadStream);
FileHandle.implement(IMPLEMENT.READ_FILE, ReadFile);

export { FileHandle } from './Constructor.mjs';
export * as constants from './constants.mjs';
