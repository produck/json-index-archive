import { PROTOTYPE } from './Abstract.mjs';
import * as FileSystem from './Constructor.mjs';

import Exists from './Implement/Exists.mjs';
import Readdir from './Implement/Readdir.mjs';
import Sync from './Implement/Sync.mjs';

FileSystem.implement(PROTOTYPE.EXISTS, Exists);
FileSystem.implement(PROTOTYPE.READDIR, Readdir);
FileSystem.implement(PROTOTYPE.SYNC, Sync);

export { FileSystem } from './Constructor.mjs';
