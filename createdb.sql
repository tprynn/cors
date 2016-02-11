
CREATE TABLE browser (
	uuid varchar(36) UNIQUE,
	useragent text
);

CREATE TABLE tests (
	uuid varchar(36),
	id integer UNIQUE,
	info text,
	FOREIGN KEY(uuid) REFERENCES browser(uuid)
);

CREATE TABLE expectations (
	testid integer,
	info text,
	FOREIGN KEY(testid) REFERENCES tests(id)
);

CREATE TABLE assertions (
	testid integer,
	info text,
	FOREIGN KEY(testid) REFERENCES tests(id)
);
