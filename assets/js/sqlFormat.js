// ----------------------------------------
// TAB 5 (FORMAT MODE): SQL FORMAT & CHECK LOGIC
// - Upper-cases SQL keywords/functions only; spacing, comments, strings and
//   identifiers are copied back untouched.
// - Runs a lightweight static check (not a real parser) that reports likely
//   syntax mistakes together with the line/column they were found at.
// ----------------------------------------
(function initSqlFormat() {
    const formatInput = document.getElementById('sqlFormatInput');
    if (!formatInput) return;

    const formatOutput = document.getElementById('sqlFormatOutput');
    const copyFormatBtn = document.getElementById('copySqlFormatBtn');
    const checkBadge = document.getElementById('sqlCheckBadge');
    const checkList = document.getElementById('sqlCheckList');

    const wordSet = text => new Set(text.split(/\s+/).filter(Boolean));

    // Reserved words: they can never be an unquoted table/column name, so upper-casing is always safe
    const KEYWORDS = wordSet(`
        SELECT FROM WHERE AND OR NOT IN IS NULL LIKE BETWEEN EXISTS AS ON USING JOIN INNER LEFT RIGHT OUTER CROSS
        NATURAL STRAIGHT_JOIN GROUP BY ORDER HAVING LIMIT UNION ALL DISTINCT DISTINCTROW INSERT INTO VALUES UPDATE SET
        DELETE REPLACE CREATE ALTER DROP TRUNCATE TABLE DATABASE SCHEMA INDEX TRIGGER PROCEDURE USE DESCRIBE EXPLAIN
        WITH RECURSIVE CASE WHEN THEN ELSE ASC DESC DEFAULT PRIMARY KEY FOREIGN REFERENCES UNIQUE CONSTRAINT CHECK ADD
        COLUMN CHANGE TO IF CALL DECLARE RETURN FOR WHILE LOOP DO REPEAT ELSEIF TRUE FALSE XOR DIV MOD REGEXP RLIKE
        INTERVAL OVER PARTITION LOCK GRANT REVOKE COLLATE IGNORE EXCEPT INTERSECT MATCH CURRENT_TIMESTAMP CURRENT_DATE
        CURRENT_TIME CURRENT_USER LOCALTIME LOCALTIMESTAMP DATABASES
    `);

    // Only upper-cased when directly followed by "(" so a column named e.g. "count" or "date" is left alone
    const FUNCTIONS = wordSet(`
        COUNT SUM AVG MIN MAX IFNULL ISNULL NULLIF COALESCE CONCAT CONCAT_WS GROUP_CONCAT SUBSTRING SUBSTR LENGTH
        CHAR_LENGTH CHARACTER_LENGTH UPPER LOWER TRIM LTRIM RTRIM ROUND CEIL CEILING FLOOR ABS POWER POW SQRT NOW
        CURDATE CURTIME SYSDATE UTC_TIMESTAMP DATE DATE_FORMAT DATE_ADD DATE_SUB ADDDATE SUBDATE DATEDIFF TIMESTAMPDIFF
        TIMESTAMPADD TIMEDIFF STR_TO_DATE YEAR MONTH DAY DAYOFWEEK DAYOFMONTH WEEK HOUR MINUTE SECOND LAST_DAY
        UNIX_TIMESTAMP FROM_UNIXTIME CAST CONVERT FIND_IN_SET FIELD LPAD RPAD REVERSE INSTR LOCATE POSITION ROW_NUMBER
        RANK DENSE_RANK LAG LEAD FIRST_VALUE LAST_VALUE NTILE JSON_EXTRACT JSON_OBJECT JSON_ARRAY JSON_UNQUOTE
        JSON_CONTAINS UUID RAND FORMAT EXTRACT MD5 SHA1 SHA2 HEX UNHEX GREATEST LEAST STDDEV VARIANCE BIT_AND BIT_OR
        ASCII CHAR ORD VERSION LAST_INSERT_ID ROW_COUNT FOUND_ROWS CONNECTION_ID ANY SOME
    `);

    // Words that are only keywords inside CREATE / ALTER statements
    const DDL_WORDS = wordSet(`
        ENGINE CHARSET COMMENT AFTER BEFORE FIRST AUTO_INCREMENT TEMPORARY VIEW FUNCTION RETURNS MODIFY RENAME CASCADE
        RESTRICT EACH ROW UNTIL CHARACTER
    `);

    const TYPES = wordSet(`
        INT INTEGER BIGINT SMALLINT TINYINT MEDIUMINT DECIMAL NUMERIC FLOAT DOUBLE VARCHAR CHAR TEXT TINYTEXT MEDIUMTEXT
        LONGTEXT BLOB TINYBLOB MEDIUMBLOB LONGBLOB DATE DATETIME TIMESTAMP TIME YEAR BOOLEAN BOOL JSON ENUM BIT UNSIGNED
        SIGNED ZEROFILL BINARY VARBINARY
    `);

    const CAST_TYPES = wordSet('SIGNED UNSIGNED CHAR DATE DATETIME DECIMAL JSON TIME BINARY INTEGER INT FLOAT DOUBLE');
    const SHOW_WORDS = wordSet('TABLES DATABASES COLUMNS PROCESSLIST VARIABLES WARNINGS ERRORS FULL GLOBAL SESSION');
    const UNITS = wordSet(`
        MICROSECOND SECOND MINUTE HOUR DAY WEEK MONTH QUARTER YEAR SECOND_MICROSECOND MINUTE_SECOND HOUR_MINUTE
        DAY_HOUR YEAR_MONTH
    `);

    // First word of a statement; also upper-cased when it starts a statement
    const STARTERS = wordSet(`
        SELECT INSERT UPDATE DELETE REPLACE CREATE ALTER DROP TRUNCATE USE SHOW DESCRIBE DESC EXPLAIN WITH SET CALL
        BEGIN START COMMIT ROLLBACK SAVEPOINT RELEASE GRANT REVOKE LOCK UNLOCK RENAME ANALYZE OPTIMIZE REPAIR FLUSH
        KILL PREPARE EXECUTE DEALLOCATE LOAD HANDLER DO TABLE VALUES IF WHILE LOOP REPEAT DECLARE OPEN FETCH CLOSE
        RETURN LEAVE ITERATE CASE END ELSE ELSEIF THEN CHECKSUM DELIMITER
    `);
    const SUGGEST_FROM = ['SELECT', 'INSERT', 'UPDATE', 'DELETE', 'CREATE', 'ALTER', 'DROP', 'TRUNCATE', 'REPLACE', 'USE', 'SHOW', 'DESCRIBE', 'EXPLAIN', 'WITH', 'SET', 'CALL'];

    const TYPOS = {
        FORM: 'FROM', SELCT: 'SELECT', SELET: 'SELECT', SELEC: 'SELECT', SLECT: 'SELECT', WHRE: 'WHERE', WEHRE: 'WHERE',
        WHER: 'WHERE', WHERRE: 'WHERE', GRUOP: 'GROUP', GROPU: 'GROUP', ODER: 'ORDER', ORDR: 'ORDER', ORDERBY: 'ORDER BY',
        GROUPBY: 'GROUP BY', INSER: 'INSERT', INSRT: 'INSERT', UPDTE: 'UPDATE', UDPATE: 'UPDATE', UPDAET: 'UPDATE',
        DELET: 'DELETE', DELTE: 'DELETE', VALUS: 'VALUES', VALUSE: 'VALUES', VAULES: 'VALUES', HAVNG: 'HAVING',
        HAVIG: 'HAVING', LIMT: 'LIMIT', DISTINC: 'DISTINCT', DISTICT: 'DISTINCT', JION: 'JOIN', JOINN: 'JOIN',
        LEFTJOIN: 'LEFT JOIN', INNERJOIN: 'INNER JOIN', UNOIN: 'UNION', BETWEN: 'BETWEEN', BETEWEEN: 'BETWEEN',
        BEETWEEN: 'BETWEEN'
    };

    // What is missing when a statement stops right after one of these words
    const DANGLING = {
        FROM: 'a table name', WHERE: 'a condition', HAVING: 'a condition', AND: 'a condition', OR: 'a condition',
        NOT: 'a condition', ON: 'a join condition', SET: 'an assignment', BY: 'a column', JOIN: 'a table name',
        UNION: 'a SELECT', INTO: 'a table name', VALUES: 'row values', IN: "a list '( ... )'", IS: 'NULL / NOT NULL',
        LIKE: 'a pattern', BETWEEN: 'a range', AS: 'an alias', LIMIT: 'a row count', OFFSET: 'a row count',
        GROUP: "'BY'", ORDER: "'BY'", SELECT: 'a column list', USING: 'a column list', WHEN: 'a condition',
        THEN: 'a value', ELSE: 'a value'
    };

    const COMPARE_OPS = new Set(['=', '<', '>', '<=', '>=', '<>', '!=', '<=>']);
    const MULTI_OPS_3 = ['<=>', '->>'];
    const MULTI_OPS_2 = ['<=', '>=', '<>', '!=', '==', '=>', '=<', ':=', '||', '&&', '<<', '>>', '->'];
    const NUM_RE = /(\d+\.?\d*|\.\d+)([eE][+-]?\d+)?/y;
    const isWordStart = ch => /[A-Za-z_$\u0080-￿]/.test(ch);
    const isWordPart = ch => /[\w$\u0080-￿]/.test(ch);

    // ----------------------------------------
    // 1. Tokenizer
    // ----------------------------------------
    function tokenize(src) {
        const tokens = [];
        const lexErrors = [];
        const lexWarnings = [];
        const n = src.length;
        let i = 0;

        const push = (type, start, end) => tokens.push({ type, start, end, text: src.slice(start, end) });

        while (i < n) {
            const c = src[i];
            const c2 = src[i + 1];
            const start = i;

            if (/\s/.test(c)) {
                while (i < n && /\s/.test(src[i])) i++;
                push('ws', start, i);
            } else if ((c === '-' && c2 === '-') || c === '#') {
                if (c === '-' && i + 2 < n && !/\s/.test(src[i + 2])) {
                    lexWarnings.push({ start, msg: "'--' only starts a comment in MySQL when a space follows it" });
                }
                while (i < n && src[i] !== '\n') i++;
                push('comment', start, i);
            } else if (c === '/' && c2 === '*') {
                const close = src.indexOf('*/', i + 2);
                if (close === -1) {
                    i = n;
                    lexErrors.push({ start, msg: "comment '/*' is never closed" });
                } else {
                    i = close + 2;
                }
                push('comment', start, i);
            } else if (c === "'" || c === '"' || c === '`') {
                i++;
                let closed = false;
                while (i < n) {
                    const ch = src[i];
                    if (ch === '\\' && c !== '`') { i += 2; continue; }
                    if (ch === c) {
                        if (src[i + 1] === c) { i += 2; continue; }
                        i++;
                        closed = true;
                        break;
                    }
                    i++;
                }
                if (i > n) i = n;
                if (!closed) {
                    lexErrors.push({ start, msg: `${c === '`' ? 'identifier' : 'string'} opened with ${c} is never closed` });
                }
                push(c === '`' ? 'bt' : 'string', start, i);
            } else if (/[0-9]/.test(c) || (c === '.' && /[0-9]/.test(c2 || ''))) {
                NUM_RE.lastIndex = i;
                const m = NUM_RE.exec(src);
                i += m[0].length;
                // Something like 1abc or 0x1F is an identifier/hex literal, not a plain number
                if (i < n && isWordPart(src[i])) {
                    while (i < n && isWordPart(src[i])) i++;
                    push('word', start, i);
                } else {
                    push('num', start, i);
                }
            } else if (c === '@') {
                i++;
                if (src[i] === '@') i++;
                while (i < n && /[\w.$]/.test(src[i])) i++;
                push('var', start, i);
            } else if (c === '?') {
                i++;
                push('param', start, i);
            } else if (isWordStart(c)) {
                while (i < n && isWordPart(src[i])) i++;
                push('word', start, i);
            } else {
                const three = src.slice(i, i + 3);
                const two = src.slice(i, i + 2);
                if (MULTI_OPS_3.includes(three)) i += 3;
                else if (MULTI_OPS_2.includes(two)) i += 2;
                else i += 1;
                push('op', start, i);
            }
        }
        return { tokens, lexErrors, lexWarnings };
    }

    // Statements are split on ";" and every token remembers the first word of its statement
    function splitStatements(sig) {
        const stmts = [];
        let cur = [];
        sig.forEach(t => {
            if (t.type === 'op' && t.text === ';') {
                if (cur.length) stmts.push(cur);
                cur = [];
            } else {
                cur.push(t);
            }
        });
        if (cur.length) stmts.push(cur);
        stmts.forEach(s => {
            const kind = s[0].type === 'word' ? s[0].upper : '';
            s.forEach(t => { t.kind = kind; });
        });
        return stmts;
    }

    // ----------------------------------------
    // 2. Upper-case pass (only changes letter case of keyword tokens)
    // ----------------------------------------
    function isKeywordLike(t) {
        return t.type === 'word' && (KEYWORDS.has(t.upper) || DDL_WORDS.has(t.upper));
    }

    function applyUppercase(sig) {
        let blockDepth = 0;
        const parenOwners = [];

        for (let k = 0; k < sig.length; k++) {
            const t = sig[k];
            const prev = sig[k - 1];
            const next = sig[k + 1];

            if (t.type === 'op') {
                if (t.text === '(') parenOwners.push(prev && prev.type === 'word' ? prev.upper : '');
                else if (t.text === ')') parenOwners.pop();
                continue;
            }
            if (t.type !== 'word') continue;

            // Part of a qualified name (db.table.col) is always an identifier
            const afterDot = prev && prev.type === 'op' && prev.text === '.';
            const beforeDot = next && next.type === 'op' && next.text === '.';
            if (afterDot || beforeDot) continue;

            const u = t.upper;
            const prevSemi = prev && prev.type === 'op' && prev.text === ';';
            const atStart = !prev || prevSemi;
            const nextIsParen = next && next.type === 'op' && next.text === '(';
            const owner = parenOwners.length ? parenOwners[parenOwners.length - 1] : '';
            let up = false;

            if (u === 'END') {
                const nu = next && next.type === 'word' ? next.upper : '';
                if (blockDepth > 0) { blockDepth--; up = true; }
                else if (atStart || ['IF', 'LOOP', 'WHILE', 'REPEAT', 'CASE'].includes(nu)) up = true;
            } else if (u === 'CASE') {
                if (!(prev && prev.upper === 'END')) blockDepth++;
                up = true;
            } else if (u === 'BEGIN') {
                // "BEGIN;" alone is a transaction start, not a block that needs an END
                up = atStart;
                const alone = !next || (next.type === 'op' && next.text === ';');
                if (atStart && !alone) blockDepth++;
            } else if (KEYWORDS.has(u)) {
                up = true;
            } else if (atStart && STARTERS.has(u)) {
                up = true;
            } else if (FUNCTIONS.has(u) && nextIsParen) {
                up = true;
            } else if (u === 'OFFSET') {
                up = !!prev && (prev.type === 'num' || prev.type === 'param' || prev.type === 'var');
            } else if (u === 'DUPLICATE') {
                up = !!next && next.upper === 'KEY';
            } else if (u === 'SEPARATOR') {
                up = owner === 'GROUP_CONCAT';
            } else if (UNITS.has(u)) {
                const afterInterval = prev && (prev.type === 'num' || prev.type === 'param' || prev.type === 'var') &&
                    sig[k - 2] && sig[k - 2].upper === 'INTERVAL';
                const firstArg = prev && prev.type === 'op' && prev.text === '(' &&
                    ['TIMESTAMPDIFF', 'TIMESTAMPADD', 'EXTRACT'].includes(owner);
                up = !!(afterInterval || firstArg);
            }

            if (!up) {
                if (t.kind === 'CREATE' || t.kind === 'ALTER') {
                    if (DDL_WORDS.has(u)) {
                        up = true;
                    } else if (TYPES.has(u) && prev) {
                        const columnLike = prev.type === 'bt' ||
                            (prev.type === 'word' && (!isKeywordLike(prev) || TYPES.has(prev.upper)));
                        up = columnLike;
                    }
                }
                if (!up && t.kind === 'SHOW' && SHOW_WORDS.has(u) && prev && ['SHOW', 'FULL', 'GLOBAL', 'SESSION'].includes(prev.upper)) up = true;
                if (!up && (t.kind === 'LOCK' || t.kind === 'UNLOCK') && u === 'TABLES' && prev && prev.upper === t.kind) up = true;
                if (!up && t.kind === 'START' && u === 'TRANSACTION' && prev && prev.upper === 'START') up = true;
                if (!up && prev && prev.upper === 'AS' && CAST_TYPES.has(u) && owner === 'CAST') up = true;
            }

            if (up) t.out = t.text.toUpperCase();
        }
    }

    // ----------------------------------------
    // 3. Static checks
    // ----------------------------------------
    function levenshtein(a, b) {
        const dp = Array.from({ length: a.length + 1 }, (_, i) => [i]);
        for (let j = 1; j <= b.length; j++) dp[0][j] = j;
        for (let i = 1; i <= a.length; i++) {
            for (let j = 1; j <= b.length; j++) {
                dp[i][j] = Math.min(dp[i - 1][j] + 1, dp[i][j - 1] + 1, dp[i - 1][j - 1] + (a[i - 1] === b[j - 1] ? 0 : 1));
            }
        }
        return dp[a.length][b.length];
    }

    function suggestStarter(word) {
        const limit = word.length >= 5 ? 2 : 1;
        let best = null;
        let bestDist = limit + 1;
        SUGGEST_FROM.forEach(candidate => {
            const d = levenshtein(word, candidate);
            if (d < bestDist) { bestDist = d; best = candidate; }
        });
        return best;
    }

    const isW = (t, ...names) => !!t && t.type === 'word' && names.includes(t.upper);
    const isOp = (t, ...ops) => !!t && t.type === 'op' && ops.includes(t.text);
    const isValueTok = t => !!t && (t.type === 'num' || t.type === 'string' || t.type === 'param' || t.type === 'var' || isW(t, 'NULL', 'TRUE', 'FALSE', 'DEFAULT'));
    const isIdentTok = t => !!t && (t.type === 'bt' || (t.type === 'word' && !KEYWORDS.has(t.upper)));

    function findClose(s, open) {
        let depth = 0;
        for (let j = open; j < s.length; j++) {
            if (isOp(s[j], '(')) depth++;
            else if (isOp(s[j], ')')) {
                depth--;
                if (depth === 0) return j;
            }
        }
        return -1;
    }

    function countItems(s, open, close) {
        if (close === open + 1) return 0;
        let depth = 0;
        let items = 1;
        for (let j = open + 1; j < close; j++) {
            if (isOp(s[j], '(')) depth++;
            else if (isOp(s[j], ')')) depth--;
            else if (depth === 0 && isOp(s[j], ',')) items++;
        }
        return items;
    }

    // Two neighbours at the top level of a "( ... )" group with no comma between them
    function checkMissingCommas(s, open, close, add, pairTest, msg) {
        let depth = 0;
        for (let j = open + 1; j < close; j++) {
            if (isOp(s[j], '(')) { depth++; continue; }
            if (isOp(s[j], ')')) { depth--; continue; }
            if (depth === 0 && pairTest(s[j - 1], s[j])) add('error', s[j], msg(s[j]));
        }
    }

    function checkInsert(s, add) {
        let j = 1;
        while (isW(s[j], 'LOW_PRIORITY', 'DELAYED', 'HIGH_PRIORITY', 'IGNORE')) j++;
        if (isW(s[j], 'INTO')) j++;
        if (s[j] && (s[j].type === 'word' || s[j].type === 'bt') && !isW(s[j], 'VALUES', 'SELECT', 'SET')) {
            j++;
            while (isOp(s[j], '.') && s[j + 1]) j += 2;
        }

        let colCount = null;
        if (isOp(s[j], '(') && !isW(s[j + 1], 'SELECT')) {
            const close = findClose(s, j);
            if (close === -1) return;
            colCount = countItems(s, j, close);
            checkMissingCommas(s, j, close, add,
                (a, b) => isIdentTok(a) && isIdentTok(b),
                b => `missing ',' before '${b.text}' in the column list`);
            j = close + 1;
        }

        const kw = s[j];
        if (!kw) {
            add('error', s[s.length - 1], 'INSERT needs VALUES, SELECT or SET after the table / column list');
            return;
        }
        if (isW(kw, 'SELECT', 'SET', 'WITH') || isOp(kw, '(')) return;
        if (!isW(kw, 'VALUES', 'VALUE')) {
            add('error', kw, `INSERT needs VALUES, SELECT or SET here, found '${kw.text}'`);
            return;
        }

        j++;
        let rowNo = 0;
        let firstCount = null;
        while (j < s.length && isOp(s[j], '(')) {
            const close = findClose(s, j);
            if (close === -1) return;
            rowNo++;
            const cnt = countItems(s, j, close);
            if (colCount !== null && cnt !== colCount) {
                add('error', s[j], `row ${rowNo} has ${cnt} value(s) but ${colCount} column(s) are listed`);
            } else if (colCount === null && firstCount !== null && cnt !== firstCount) {
                add('error', s[j], `row ${rowNo} has ${cnt} value(s) but row 1 has ${firstCount}`);
            }
            if (firstCount === null) firstCount = cnt;
            checkMissingCommas(s, j, close, add,
                (a, b) => isValueTok(a) && isValueTok(b) && !(a.type === 'string' && b.type === 'string'),
                b => `missing ',' before '${b.text}' in the values`);

            j = close + 1;
            if (isOp(s[j], ',')) { j++; continue; }
            if (isOp(s[j], '(')) { add('error', s[j], "missing ',' between value rows"); continue; }
            break;
        }
        const rest = s[j];
        if (rest && !isW(rest, 'ON', 'AS', 'RETURNING')) {
            add('error', rest, `unexpected '${rest.text}' after the VALUES rows — missing ';' or ','?`);
        }
    }

    function checkJoins(s, depthAt, add) {
        const stops = ['JOIN', 'STRAIGHT_JOIN', 'WHERE', 'GROUP', 'ORDER', 'HAVING', 'LIMIT', 'UNION', 'SET', 'FOR', 'WINDOW'];
        s.forEach((t, j) => {
            if (!isW(t, 'JOIN')) return;
            const modifier = s[j - 1] && s[j - 1].type === 'word' ? s[j - 1].upper : '';
            if (modifier === 'CROSS' || modifier === 'NATURAL') return;
            // NATURAL LEFT JOIN etc.
            if (['LEFT', 'RIGHT'].includes(modifier) && s[j - 2] && s[j - 2].upper === 'NATURAL') return;
            if (modifier === 'OUTER' && s[j - 2] && ['LEFT', 'RIGHT'].includes(s[j - 2].upper) && s[j - 3] && s[j - 3].upper === 'NATURAL') return;

            const d = depthAt[j];
            let found = false;
            for (let m = j + 1; m < s.length; m++) {
                if (depthAt[m] < d) break;
                if (depthAt[m] > d) continue;
                if (isW(s[m], 'ON', 'USING')) { found = true; break; }
                if (isW(s[m], ...stops) || isOp(s[m], ',')) break;
            }
            if (found) return;
            const outer = ['LEFT', 'RIGHT', 'OUTER'].includes(modifier);
            if (outer) add('error', t, `${modifier} JOIN needs an ON or USING condition`);
            else add('warning', t, 'JOIN has no ON / USING condition — it will behave like a CROSS JOIN (every row against every row)');
        });
    }

    // "a = 1 b = 2": a value, then an identifier, then a comparison — an AND / OR is probably missing
    function checkMissingLogic(s, clauseOf, add) {
        const isOperandEnd = t => !!t && (t.type === 'num' || t.type === 'string' || t.type === 'var' || t.type === 'param' ||
            t.type === 'bt' || isOp(t, ')') || (t.type === 'word' && !KEYWORDS.has(t.upper)));
        for (let j = 0; j < s.length; j++) {
            if (clauseOf[j] !== 'cond') continue;
            const a = s[j];
            if (!isOperandEnd(a)) continue;
            // a bare word followed by "(" is a function name, not a value
            if (a.type === 'word' && isOp(s[j + 1], '(')) continue;
            // the operand "a" may itself be the tail of a dotted name
            let m = j + 1;
            const b = s[m];
            if (!b || !(b.type === 'bt' || b.type === 'var' || (b.type === 'word' && !KEYWORDS.has(b.upper) && !FUNCTIONS.has(b.upper)))) continue;
            while (isOp(s[m + 1], '.') && s[m + 2]) m += 2;
            const c = s[m + 1];
            const isCompare = c && ((c.type === 'op' && COMPARE_OPS.has(c.text)) || isW(c, 'IS', 'LIKE', 'IN', 'BETWEEN', 'REGEXP', 'RLIKE') ||
                (isW(c, 'NOT') && isW(s[m + 2], 'IN', 'LIKE', 'BETWEEN', 'REGEXP')));
            if (isCompare) add('error', b, `missing AND / OR before '${b.text}'`);
        }
    }

    function checkStatement(s, add) {
        const first = s[0];
        const kind = first.type === 'word' ? first.upper : '';
        const last = s[s.length - 1];
        const isDdl = kind === 'CREATE' || kind === 'ALTER';

        // --- statement start ---
        if (first.type === 'word') {
            if (!STARTERS.has(first.upper)) {
                const guess = suggestStarter(first.upper);
                add('error', first, guess
                    ? `unknown statement start '${first.text}' — did you mean ${guess}?`
                    : `unknown statement start '${first.text}'`);
            }
        } else if (!isOp(first, '(')) {
            add('error', first, `a statement should not start with '${first.text}'`);
        }

        // --- bracket balance ---
        const stack = [];
        s.forEach(t => {
            if (isOp(t, '(')) stack.push(t);
            else if (isOp(t, ')')) {
                if (stack.length) stack.pop();
                else add('error', t, "unexpected ')' — there is no matching '('");
            }
        });
        stack.forEach(t => add('error', t, "'(' is never closed"));

        // --- per-token depth / clause / CASE tracking ---
        const depthAt = new Array(s.length);
        const clauseOf = new Array(s.length);
        const caseAt = new Array(s.length);
        const clauseStack = [];
        let clause = 'other';
        let depth = 0;
        let caseDepth = 0;
        s.forEach((t, j) => {
            if (isOp(t, '(')) {
                depthAt[j] = depth;
                depth++;
                clauseStack.push(clause);
            } else if (isOp(t, ')')) {
                depth = Math.max(0, depth - 1);
                depthAt[j] = depth;
                clause = clauseStack.pop() || 'other';
            } else {
                depthAt[j] = depth;
            }
            if (t.type === 'word') {
                const nu = s[j + 1] && s[j + 1].type === 'word' ? s[j + 1].upper : '';
                if (isW(t, 'WHERE', 'HAVING')) clause = 'cond';
                else if (isW(t, 'ON') && !isDdl && !['DUPLICATE', 'DELETE', 'UPDATE'].includes(nu)) clause = 'cond';
                else if (isW(t, 'SET') && kind !== 'SHOW') clause = 'set';
                else if (isW(t, 'UPDATE') && j > 0) clause = 'set';
                else if (isW(t, 'SELECT', 'FROM', 'GROUP', 'ORDER', 'LIMIT', 'UNION', 'JOIN', 'VALUES', 'INTO', 'USING')) clause = 'other';
                if (t.upper === 'CASE' && !(s[j - 1] && s[j - 1].upper === 'END')) caseDepth++;
            }
            clauseOf[j] = clause;
            caseAt[j] = caseDepth;
            if (isW(t, 'END') && caseDepth > 0) caseDepth--;
        });

        // --- CASE ... END balance ---
        if (!isDdl) {
            const cases = [];
            s.forEach((t, j) => {
                if (isW(t, 'CASE') && !isW(s[j - 1], 'END')) cases.push(t);
                else if (isW(t, 'END') && cases.length) cases.pop();
            });
            cases.forEach(t => add('error', t, 'CASE has no matching END'));
        }

        // --- token-pair rules ---
        const clauseWords = ['WHERE', 'GROUP', 'ORDER', 'HAVING', 'LIMIT', 'UNION', 'FROM', 'SET', 'VALUES', 'JOIN', 'ON'];
        s.forEach((t, j) => {
            const prev = s[j - 1];
            const next = s[j + 1];

            // typos of common keywords (the first token is already covered by the start check)
            if (j > 0 && t.type === 'word' && TYPOS[t.upper] && !isOp(prev, '.') && !isOp(next, '.') && !isOp(next, '(')) {
                add('warning', t, `'${t.text}' looks like a typo — did you mean ${TYPOS[t.upper]}?`);
            }

            if (isOp(t, ',')) {
                if (next && (isOp(next, ')') || isW(next, ...clauseWords))) {
                    add('error', t, `trailing comma before '${next.text}' — remove it`);
                }
                if (isOp(prev, '(', ',') || isW(prev, 'SELECT', 'SET', 'BY', 'DISTINCT')) {
                    add('error', t, 'unexpected comma — an item is missing before it');
                }
            }

            if (isW(t, 'SELECT') && next && isW(next, 'FROM')) add('error', t, 'SELECT has no column list before FROM');
            if (isW(t, 'FROM') && next && (isOp(next, ')') || isW(next, 'WHERE', 'GROUP', 'ORDER', 'HAVING', 'LIMIT', 'UNION', 'SET'))) {
                add('error', t, 'FROM has no table name');
            }
            if (isW(t, 'WHERE', 'HAVING') && next && (isOp(next, ')') || isW(next, 'GROUP', 'ORDER', 'LIMIT', 'UNION', 'AND', 'OR'))) {
                add('error', t, `${t.upper} has no condition`);
            }
            if (isW(t, 'AND', 'OR') && !isOp(prev, '.')) {
                if (next && (isOp(next, ')') || isW(next, 'AND', 'OR', 'WHERE', 'GROUP', 'ORDER', 'HAVING', 'LIMIT', 'UNION'))) {
                    add('error', t, `${t.upper} has no condition after it`);
                }
                if (isOp(prev, '(', ',')) add('error', t, `${t.upper} has no condition before it`);
            }
            if (isW(t, 'SET') && kind === 'UPDATE' && next && isW(next, 'WHERE')) add('error', t, 'SET has no assignment');
            if (isW(t, 'JOIN') && next && isW(next, 'ON', 'WHERE', 'GROUP', 'ORDER', 'LIMIT', 'USING')) add('error', t, 'JOIN has no table name');
            if (isW(t, 'ON') && !isDdl && next && (isOp(next, ')') || isW(next, 'WHERE', 'JOIN', 'GROUP', 'ORDER', 'LIMIT', 'LEFT', 'RIGHT', 'INNER'))) {
                add('error', t, 'ON has no join condition');
            }
            if (isW(t, 'GROUP', 'ORDER') && next && !isW(next, 'BY')) add('error', t, `${t.upper} must be followed by BY`);
            if (isW(t, 'BY') && next && (isOp(next, ')') || isW(next, 'LIMIT', 'HAVING', 'UNION', 'ORDER', 'GROUP'))) {
                add('error', t, 'BY has no column');
            }

            if (t.type === 'op') {
                if (['==', '=>', '=<'].includes(t.text)) {
                    const fix = { '==': "'='", '=>': "'>='", '=<': "'<='" }[t.text];
                    add('error', t, `'${t.text}' is not a SQL operator — use ${fix}`);
                }
                if (COMPARE_OPS.has(t.text)) {
                    if (next && (isOp(next, ')', ',') || isW(next, 'AND', 'OR', 'WHERE', 'GROUP', 'ORDER', 'LIMIT', 'HAVING', 'FROM', 'UNION'))) {
                        add('error', t, `'${t.text}' has no value on its right`);
                    }
                    if (!prev || isOp(prev, '(', ',') || isW(prev, 'WHERE', 'AND', 'OR', 'ON', 'HAVING', 'NOT', 'SET')) {
                        add('error', t, `'${t.text}' has no value on its left`);
                    }
                    if (['=', '<>', '!='].includes(t.text) && isW(next, 'NULL') && clauseOf[j] === 'cond') {
                        add('warning', t, `'${t.text} NULL' is never true — use IS ${t.text === '=' ? 'NULL' : 'NOT NULL'}`);
                    }
                }
            }

            if (isW(t, 'IN') && ['SELECT', 'UPDATE', 'DELETE', 'WITH'].includes(kind) && next) {
                if (isOp(next, '(')) {
                    if (isOp(s[j + 2], ')')) add('error', t, 'IN list is empty');
                } else if (!isW(next, 'BOOLEAN', 'NATURAL', 'WITH')) {
                    add('error', t, `IN must be followed by a list in brackets, found '${next.text}'`);
                }
            }

            if (isW(t, 'LIMIT') && next && !(next.type === 'num' || next.type === 'param' || next.type === 'var')) {
                add('error', t, `LIMIT expects a number, found '${next.text}'`);
            }
            if (isW(t, 'LIMIT') && next && next.type === 'num' && isOp(s[j + 2], ',') && s[j + 3] && s[j + 3].type !== 'num' && s[j + 3].type !== 'param') {
                add('error', s[j + 3], `LIMIT expects a number after the comma, found '${s[j + 3].text}'`);
            }
            if (isW(t, 'BETWEEN')) {
                const d = depthAt[j];
                let hasAnd = false;
                for (let m = j + 1; m < s.length; m++) {
                    if (depthAt[m] < d) break;
                    if (depthAt[m] > d) continue;
                    if (isW(s[m], 'AND')) { hasAnd = true; break; }
                    if (isW(s[m], 'OR', 'WHERE', 'GROUP', 'ORDER', 'HAVING', 'LIMIT', 'UNION', 'JOIN', 'ON', 'SET')) break;
                }
                if (!hasAnd) add('error', t, "BETWEEN needs 'AND' — use BETWEEN x AND y");
            }

            // a new statement starting in the middle of another one => missing ";"
            if (j > 0 && depthAt[j] === 0 && t.type === 'word' && !isDdl && kind !== 'WITH' && kind !== 'EXPLAIN') {
                const u = t.upper;
                const pu = prev.type === 'word' ? prev.upper : '';
                let flagged = false;
                if (u === 'SELECT') {
                    flagged = !['INSERT', 'REPLACE'].includes(kind) && !['UNION', 'ALL', 'DISTINCT', 'AS', 'EXISTS', 'IN', 'ANY', 'SOME', 'EXCEPT', 'INTERSECT'].includes(pu) && !isOp(prev, '(');
                } else if (u === 'INSERT') {
                    flagged = !isOp(next, '(');
                } else if (u === 'DELETE') {
                    flagged = !['ON'].includes(pu);
                } else if (u === 'UPDATE') {
                    flagged = !['ON', 'KEY', 'FOR', 'BEFORE', 'AFTER'].includes(pu);
                } else if (u === 'TRUNCATE') {
                    flagged = !isOp(next, '(');
                }
                if (flagged) add('error', t, `${u} starts here but the previous statement is not finished — missing ';' before it?`);
            }
        });

        // --- statement ends too early ---
        if (last.type === 'word' && DANGLING[last.upper] && !isOp(s[s.length - 2], '.') && !(isDdl && ['ON', 'IF', 'ELSE', 'THEN', 'WHEN'].includes(last.upper))) {
            if (!(last.upper === 'SELECT' && s.length > 1)) {
                add('error', last, `statement stops right after ${last.upper} — ${DANGLING[last.upper]} is missing`);
            }
        } else if (last.type === 'op' && (COMPARE_OPS.has(last.text) || last.text === ',' || last.text === '.')) {
            add('error', last, `statement stops right after '${last.text}' — a value is missing`);
        }

        // --- kind specific rules ---
        if (kind === 'UPDATE') {
            const hasSet = s.some((t, j) => depthAt[j] === 0 && isW(t, 'SET'));
            const hasWhere = s.some((t, j) => depthAt[j] === 0 && isW(t, 'WHERE'));
            if (!hasSet) add('error', first, 'UPDATE has no SET clause');
            else if (!hasWhere) add('warning', first, 'UPDATE has no WHERE — every row in the table will be changed');
            s.forEach((t, j) => {
                if (clauseOf[j] === 'set' && caseAt[j] === 0 && depthAt[j] === 0 && isW(t, 'AND') && j > 0 && !isW(s[j - 1], 'SET')) {
                    add('warning', t, "AND inside SET — separate assignments with ',' (AND is a boolean operator here)");
                }
            });
        }
        if (kind === 'DELETE') {
            const hasFrom = s.some((t, j) => depthAt[j] === 0 && isW(t, 'FROM'));
            const hasWhere = s.some((t, j) => depthAt[j] === 0 && isW(t, 'WHERE'));
            if (!hasFrom) add('error', first, 'DELETE needs FROM — use DELETE FROM table_name');
            else if (!hasWhere) add('warning', first, 'DELETE has no WHERE — every row in the table will be removed');
        }
        if (kind === 'INSERT' || kind === 'REPLACE') checkInsert(s, add);

        checkJoins(s, depthAt, add);
        if (['SELECT', 'UPDATE', 'DELETE', 'WITH'].includes(kind) || kind === '') checkMissingLogic(s, clauseOf, add);
    }

    // ----------------------------------------
    // 4. Analyze: tokenize, upper-case, check
    // ----------------------------------------
    function analyze(src) {
        const { tokens, lexErrors, lexWarnings } = tokenize(src);
        const sig = tokens.filter(t => t.type !== 'ws' && t.type !== 'comment');
        sig.forEach(t => { t.upper = t.text.toUpperCase(); });
        const stmts = splitStatements(sig);
        applyUppercase(sig);

        let output = tokens.map(t => (t.out !== undefined ? t.out : t.text)).join('');
        // Safety net: formatting may only change letter case, never the structure
        if (output.toLowerCase() !== src.toLowerCase()) output = src;

        const issues = [];
        const seen = new Set();
        const add = (sev, tok, msg) => {
            const key = `${tok.start}|${msg}`;
            if (seen.has(key)) return;
            seen.add(key);
            issues.push({ sev, start: tok.start, msg });
        };
        lexErrors.forEach(e => add('error', e, e.msg));
        lexWarnings.forEach(e => add('warning', e, e.msg));

        if (lexErrors.length) {
            issues.push({ sev: 'info', start: Infinity, msg: 'fix the quote / comment problem above first — the remaining checks were skipped because they would be unreliable.' });
        } else if (/^\s*delimiter\s/im.test(src)) {
            issues.push({ sev: 'info', start: Infinity, msg: 'DELIMITER blocks (stored procedures / triggers) are not checked.' });
        } else {
            stmts.forEach(s => checkStatement(s, add));
        }

        issues.sort((a, b) => a.start - b.start);
        return { output, issues };
    }

    // ----------------------------------------
    // 5. UI
    // ----------------------------------------
    function buildLocator(src) {
        const starts = [0];
        for (let i = 0; i < src.length; i++) if (src[i] === '\n') starts.push(i + 1);
        return idx => {
            let lo = 0;
            let hi = starts.length - 1;
            while (lo < hi) {
                const mid = (lo + hi + 1) >> 1;
                if (starts[mid] <= idx) lo = mid; else hi = mid - 1;
            }
            return { line: lo + 1, col: idx - starts[lo] + 1, text: src.slice(starts[lo], starts[lo + 1] === undefined ? src.length : starts[lo + 1] - 1) };
        };
    }

    const BADGE_CLASS = {
        ok: 'bg-emerald-500/10 border-emerald-500/20 text-emerald-400',
        error: 'bg-red-500/10 border-red-500/30 text-red-400',
        warning: 'bg-sky-500/10 border-sky-500/20 text-sky-300',
        info: 'bg-zinc-800 border-zinc-700 text-zinc-400'
    };

    function makePill(kind, text) {
        const pill = document.createElement('span');
        pill.className = `inline-flex items-center px-3 py-1 rounded-full border text-xs font-semibold ${BADGE_CLASS[kind]}`;
        pill.textContent = text;
        return pill;
    }

    const MAX_SHOWN = 50;

    function renderCheck(issues, src) {
        checkList.textContent = '';
        checkBadge.textContent = '';
        if (!issues) {
            const hint = document.createElement('p');
            hint.className = 'text-xs text-zinc-600 italic';
            hint.textContent = 'Waiting for SQL input...';
            checkList.appendChild(hint);
            return;
        }

        const errors = issues.filter(i => i.sev === 'error').length;
        const warnings = issues.filter(i => i.sev === 'warning').length;
        if (!errors && !warnings) checkBadge.appendChild(makePill('ok', 'no issues found'));
        if (errors) checkBadge.appendChild(makePill('error', `${errors} error${errors > 1 ? 's' : ''}`));
        if (warnings) checkBadge.appendChild(makePill('warning', `${warnings} warning${warnings > 1 ? 's' : ''}`));

        const locate = buildLocator(src);
        issues.slice(0, MAX_SHOWN).forEach(issue => {
            const row = document.createElement('div');
            row.className = 'flex flex-col gap-1 bg-black/60 border border-zinc-800 rounded-md p-3';

            const head = document.createElement('div');
            head.className = 'flex items-start gap-2 flex-wrap text-sm';
            head.appendChild(makePill(issue.sev, issue.sev));
            if (issue.start !== Infinity) {
                const where = locate(issue.start);
                const pos = document.createElement('span');
                pos.className = 'text-xs font-bold text-zinc-500 pt-1';
                pos.textContent = `line ${where.line}, col ${where.col}`;
                head.appendChild(pos);
            }
            const msg = document.createElement('span');
            msg.className = 'text-zinc-200 break-words min-w-0 pt-0.5';
            msg.textContent = issue.msg;
            head.appendChild(msg);
            row.appendChild(head);

            if (issue.start !== Infinity) {
                const snippet = document.createElement('div');
                snippet.className = 'text-xs text-zinc-500 whitespace-pre-wrap break-all';
                const lineText = locate(issue.start).text.trim();
                snippet.textContent = lineText.length > 160 ? `${lineText.slice(0, 160)}…` : lineText;
                row.appendChild(snippet);
            }
            checkList.appendChild(row);
        });

        if (issues.length > MAX_SHOWN) {
            const more = document.createElement('p');
            more.className = 'text-xs text-zinc-600 italic';
            more.textContent = `…and ${issues.length - MAX_SHOWN} more`;
            checkList.appendChild(more);
        }
    }

    function update() {
        const src = formatInput.value;
        if (!src.trim()) {
            formatOutput.value = '';
            copyFormatBtn.disabled = true;
            renderCheck(null, src);
            return;
        }
        const result = analyze(src);
        formatOutput.value = result.output;
        copyFormatBtn.disabled = false;
        renderCheck(result.issues, src);
    }

    formatInput.addEventListener('input', update);
    copyFormatBtn.addEventListener('click', function () {
        if (!formatOutput.value) return;
        handleClipboardCopy(formatOutput.value, copyFormatBtn, 'copy');
    });

    update();
})();
