import { IMLEMENT } from './Abstract.mjs';
import * as FileSystem from './Constructor.mjs';

import Exists from './Implement/Exists.mjs';
import Readdir from './Implement/Readdir.mjs';
import Sync from './Implement/Sync.mjs';
import Open from './Implement/Open.mjs';
import CreateReadStream from './Implement/CreateReadStream.mjs';
import ReadFile from './Implement/ReadFile.mjs';

FileSystem.implement(IMLEMENT.EXISTS, Exists);
FileSystem.implement(IMLEMENT.READDIR, Readdir);
FileSystem.implement(IMLEMENT.SYNC, Sync);
FileSystem.implement(IMLEMENT.OPEN, Open);
FileSystem.implement(IMLEMENT.CREATE_READ_STREAM, CreateReadStream);
FileSystem.implement(IMLEMENT.READ_FILE, ReadFile);

export { FileSystem } from './Constructor.mjs';
