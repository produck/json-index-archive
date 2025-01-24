import { PROTOTYPE } from './Abstract.mjs';
import * as FileSystem from './Constructor.mjs';

import Exists from './Implement/Exists.mjs';
import Readdir from './Implement/Readdir.mjs';
import Sync from './Implement/Sync.mjs';
import Open from './Implement/Open.mjs';

FileSystem.implement(PROTOTYPE.EXISTS, Exists);
FileSystem.implement(PROTOTYPE.READDIR, Readdir);
FileSystem.implement(PROTOTYPE.SYNC, Sync);
FileSystem.implement(PROTOTYPE.OPEN, Open);

export { FileSystem } from './Constructor.mjs';
