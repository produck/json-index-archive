export const VISIT_AT = {
	SEEK: 0b01,
	DONE: 0b10,
	ALL: 0,
};

VISIT_AT.ALL = VISIT_AT.SEEK | VISIT_AT.DONE;
