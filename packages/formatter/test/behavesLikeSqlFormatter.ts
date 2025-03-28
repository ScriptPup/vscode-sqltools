import sqlFormatter from "../src/sqlFormatter";
import dedent from 'dedent-js';

/**
 * Core tests for all SQL formatters
 * @param {string} language
 */
export default function behavesLikeSqlFormatter(language?: any) {
    const format = (query, cfg = {}) => sqlFormatter.format(query, { ...cfg, language });

    it("uses given indent config for indention", function() {
        const result = sqlFormatter.format(
            "select count(*),Column1 FROM Table1;",
            {indent: "    "}
        );

        expect(result).toBe(
            "select count(*),\n" +
            "    Column1\n" +
            "FROM Table1;"
        );
    });

    it("formats simple SET SCHEMA queries", function() {
        const result = format("SET SCHEMA tetrisdb; SET CURRENT SCHEMA bingodb;");
        expect(result).toBe(
            "SET SCHEMA tetrisdb;\n" +
            "SET CURRENT SCHEMA bingodb;"
        );
    });

    it("formats simple SELECT query", function() {
        const result = format("SELECT count(*),Column1 FROM Table1;");
        expect(result).toBe(
            "SELECT count(*),\n" +
            "  Column1\n" +
            "FROM Table1;"
        );
    });

    it("formats complex SELECT", function() {
        const result = format(
            "SELECT DISTINCT name, ROUND(age/7) field1, 18 + 20 AS field2, 'some string' FROM foo;"
        );
        expect(result).toBe(
            "SELECT DISTINCT name,\n" +
            "  ROUND(age / 7) field1,\n" +
            "  18 + 20 AS field2,\n" +
            "  'some string'\n" +
            "FROM foo;"
        );
    });

    it("formats SELECT with complex WHERE", function() {
        const result = sqlFormatter.format(
            "SELECT * FROM foo WHERE Column1 = 'testing'" +
            "AND ( (Column2 = Column3 OR Column4 >= NOW()) );"
        );
        expect(result).toBe(
            "SELECT *\n" +
            "FROM foo\n" +
            "WHERE Column1 = 'testing'\n" +
            "  AND (\n" +
            "    (\n" +
            "      Column2 = Column3\n" +
            "      OR Column4 >= NOW()\n" +
            "    )\n" +
            "  );"
        );
    });

    it("formats SELECT with toplevel reserved words", function() {
        const result = format(
            "SELECT * FROM foo WHERE name = 'John' GROUP BY some_column " +
            "HAVING column > 10 ORDER BY other_column LIMIT 5;"
        );
        expect(result).toBe(
            "SELECT *\n" +
            "FROM foo\n" +
            "WHERE name = 'John'\n" +
            "GROUP BY some_column\n" +
            "HAVING column > 10\n" +
            "ORDER BY other_column\n" +
            "LIMIT 5;"
        );
    });

    it("formats LIMIT with two comma-separated values on single line", function() {
        const result = format(
            "LIMIT 5, 10;"
        );
        expect(result).toBe(
            "LIMIT 5, 10;"
        );
    });

    it("formats LIMIT of single value followed by another SELECT using commas", function() {
        const result = format(
            "LIMIT 5; SELECT foo, bar;"
        );
        expect(result).toBe(
            "LIMIT 5;\n" +
            "SELECT foo,\n" +
            "  bar;"
        );
    });

    it("formats LIMIT of single value and OFFSET", function() {
        const result = format(
            "LIMIT 5 OFFSET 8;"
        );
        expect(result).toBe(
            "LIMIT 5 OFFSET 8;"
        );
    });

    it("recognizes LIMIT in lowercase", function() {
        const result = format(
            "limit 5, 10;"
        );
        expect(result).toBe(
            "limit 5, 10;"
        );
    });

    it("preserves case of keywords", function() {
        const result = format(
            "select distinct * frOM foo left join bar WHERe a > 1 and b = 3"
        );
        expect(result).toBe(
            "select distinct *\n" +
            "frOM foo\n" +
            "  left join bar\n" +
            "WHERe a > 1\n" +
            "  and b = 3"
        );
    });

    it("formats SELECT query with SELECT query inside it", function() {
        const result = format(
            "SELECT *, SUM(*) AS sum FROM (SELECT * FROM Posts LIMIT 30) WHERE a > b"
        );
        expect(result).toBe(
            "SELECT *,\n" +
            "  SUM(*) AS sum\n" +
            "FROM (\n" +
            "    SELECT *\n" +
            "    FROM Posts\n" +
            "    LIMIT 30\n" +
            "  )\n" +
            "WHERE a > b"
        );
    });

    it("formats SELECT query with INNER JOIN", function() {
        const result = format(
            "SELECT customer_id.from, COUNT(order_id) AS total FROM customers " +
            "INNER JOIN orders ON customers.customer_id = orders.customer_id;"
        );
        expect(result).toBe(
            "SELECT customer_id.from,\n" +
            "  COUNT(order_id) AS total\n" +
            "FROM customers\n" +
            "  INNER JOIN orders ON customers.customer_id = orders.customer_id;"
        );
    });

    it("formats SELECT query with different comments", function() {
        const result = format(
            "SELECT\n" +
            "/*\n" +
            " * This is a block comment\n" +
            " */\n" +
            "* FROM\n" +
            "-- This is another comment\n" +
            "MyTable # One final comment\n" +
            "WHERE 1 = 2;"
        );
        expect(result).toBe(
            "SELECT\n" +
            "  /*\n" +
            "   * This is a block comment\n" +
            "   */\n" +
            "  *\n" +
            "FROM -- This is another comment\n" +
            "  MyTable # One final comment\n" +
            "WHERE 1 = 2;"
        );
    });

    it("formats SELECT query with different comments with \\r\\n as line ending. Issue #3", function() {
      const result = format(
          "SELECT\r\n" +
          "/*\r\n" +
          " * This is a block comment\r\n" +
          " */\r\n" +
          "* FROM\r\n" +
          "-- This is another comment\r\n" +
          "MyTable # One final comment\n" +
          "WHERE 1 = 2;"
      );
      expect(result).toBe(
          "SELECT\n" +
          "  /*\r\n" +
          "   * This is a block comment\r\n" +
          "   */\n" +
          "  *\n" +
          "FROM -- This is another comment\r\n" +
          "  MyTable # One final comment\n" +
          "WHERE 1 = 2;"
      );
  });

    it("formats simple INSERT query", function() {
        const result = format(
            "INSERT INTO Customers (ID, MoneyBalance, Address, City) VALUES (12,-123.4, 'Skagen 2111','Stv');"
        );
        expect(result).toBe(
            "INSERT INTO Customers (ID, MoneyBalance, Address, City)\n" +
            "VALUES (12, -123.4, 'Skagen 2111', 'Stv');"
        );
    });

    it("keeps short parenthized list with nested parenthesis on single line", function() {
        const result = format(
            "SELECT (a + b * (c - NOW()));"
        );
        expect(result).toBe(
            "SELECT (a + b * (c - NOW()));"
        );
    });

    it("breaks long parenthized lists to multiple lines", function() {
        const result = format(
            "INSERT INTO some_table (id_product, id_shop, id_currency, id_country, id_registration) (" +
            "SELECT IF(dq.id_discounter_shopping = 2, dq.value, dq.value / 100)," +
            "IF (dq.id_discounter_shopping = 2, 'amount', 'percentage') FROM foo);"
        );
        expect(result).toBe(
            "INSERT INTO some_table (\n" +
            "    id_product,\n" +
            "    id_shop,\n" +
            "    id_currency,\n" +
            "    id_country,\n" +
            "    id_registration\n" +
            "  ) (\n" +
            "    SELECT IF(\n" +
            "        dq.id_discounter_shopping = 2,\n" +
            "        dq.value,\n" +
            "        dq.value / 100\n" +
            "      ),\n" +
            "      IF (\n" +
            "        dq.id_discounter_shopping = 2,\n" +
            "        'amount',\n" +
            "        'percentage'\n" +
            "      )\n" +
            "    FROM foo\n" +
            "  );"
        );
    });

    it("formats simple UPDATE query", function() {
        const result = format(
            "UPDATE Customers SET ContactName='Alfred Schmidt', City='Hamburg' WHERE CustomerName='Alfreds Futterkiste';"
        );
        expect(result).toBe(
            "UPDATE Customers\n" +
            "SET ContactName = 'Alfred Schmidt',\n" +
            "  City = 'Hamburg'\n" +
            "WHERE CustomerName = 'Alfreds Futterkiste';"
        );
    });

    it("formats simple DELETE query", function() {
        const result = format(
            "DELETE FROM Customers WHERE CustomerName='Alfred' AND Phone=5002132;"
        );
        expect(result).toBe(
            "DELETE FROM Customers\n" +
            "WHERE CustomerName = 'Alfred'\n" +
            "  AND Phone = 5002132;"
        );
    });

    it("formats simple DROP query", function() {
        const result = format(
            "DROP TABLE IF EXISTS admin_role;"
        );
        expect(result).toBe(
            "DROP TABLE IF EXISTS admin_role;"
        );
    });

    it("formats uncomplete query", function() {
        const result = format("SELECT count(");
        expect(result).toBe(
            "SELECT count("
        );
    });

    it("formats query that ends with open comment", function() {
        const result = format("SELECT count(*)\n/*Comment");
        expect(result).toBe(
            "SELECT count(*)\n" +
            "  /*Comment"
        );
    });

    it("formats UPDATE query with AS part", function() {
        const result = format(
            "UPDATE customers SET totalorders = ordersummary.total  FROM ( SELECT * FROM bank) AS ordersummary"
        );
        expect(result).toBe(
            "UPDATE customers\n" +
            "SET totalorders = ordersummary.total\n" +
            "FROM (\n" +
            "    SELECT *\n" +
            "    FROM bank\n" +
            "  ) AS ordersummary"
        );
    });

    it("formats top-level and newline multi-word reserved words with inconsistent spacing", function() {
        const result = format("SELECT * FROM foo LEFT \t OUTER  \n JOIN bar ORDER \n BY blah");
        expect(result).toBe(
            "SELECT *\n" +
            "FROM foo\n" +
            "  LEFT OUTER JOIN bar\n" +
            "ORDER BY blah"
        );
    });

    it("formats long double parenthized queries to multiple lines", function() {
        const result = format("((foo = '0123456789-0123456789-0123456789-0123456789'))");
        expect(result).toBe(
            "(\n" +
            "  (\n" +
            "    foo = '0123456789-0123456789-0123456789-0123456789'\n" +
            "  )\n" +
            ")"
        );
    });

    it("formats short double parenthized queries to one line", function() {
        const result = format("((foo = 'bar'))");
        expect(result).toBe("((foo = 'bar'))");
    });

    it("formats single-char operators", function() {
        expect(format("foo = bar")).toBe("foo = bar");
        expect(format("foo < bar")).toBe("foo < bar");
        expect(format("foo > bar")).toBe("foo > bar");
        expect(format("foo + bar")).toBe("foo + bar");
        expect(format("foo - bar")).toBe("foo - bar");
        expect(format("foo * bar")).toBe("foo * bar");
        expect(format("foo / bar")).toBe("foo / bar");
        expect(format("foo % bar")).toBe("foo % bar");
    });

    it("formats multi-char operators", function() {
        expect(format("foo != bar")).toBe("foo != bar");
        expect(format("foo <> bar")).toBe("foo <> bar");
        expect(format("foo == bar")).toBe("foo == bar"); // N1QL
        expect(format("foo || bar")).toBe("foo || bar"); // Oracle, Postgres, N1QL string concat

        expect(format("foo <= bar")).toBe("foo <= bar");
        expect(format("foo >= bar")).toBe("foo >= bar");

        expect(format("foo !< bar")).toBe("foo !< bar");
        expect(format("foo !> bar")).toBe("foo !> bar");
        expect(format("foo && bar")).toBe("foo && bar");
        expect(format("foo := bar")).toBe("foo := bar");
        expect(format("foo => bar")).toBe("foo => bar"); // Snowflake, TimescaleDB
        expect(format("foo <=> bar")).toBe("foo <=> bar");
    });

    it("formats logical operators", function() {
        expect(format("foo ALL bar")).toBe("foo ALL bar");
        expect(format("foo = ANY (1, 2, 3)")).toBe("foo = ANY (1, 2, 3)");
        expect(format("EXISTS bar")).toBe("EXISTS bar");
        expect(format("foo IN (1, 2, 3)")).toBe("foo IN (1, 2, 3)");
        expect(format("foo LIKE 'hello%'")).toBe("foo LIKE 'hello%'");
        expect(format("foo IS NULL")).toBe("foo IS NULL");
        expect(format("UNIQUE foo")).toBe("UNIQUE foo");
    });

    it("formats AND/OR operators", function() {
        expect(format("foo BETWEEN bar AND baz")).toBe("foo BETWEEN bar AND baz");
        expect(format("foo AND bar")).toBe("foo\nAND bar");
        expect(format("foo OR bar")).toBe("foo\nOR bar");
    });

    it("recognizes strings", function() {
        expect(format("\"foo JOIN bar\"")).toBe("\"foo JOIN bar\"");
        expect(format("'foo JOIN bar'")).toBe("'foo JOIN bar'");
        expect(format("`foo JOIN bar`")).toBe("`foo JOIN bar`");
    });

    it("recognizes escaped strings", function() {
        expect(format("\"foo \\\" JOIN bar\"")).toBe("\"foo \\\" JOIN bar\"");
        expect(format("'foo \\' JOIN bar'")).toBe("'foo \\' JOIN bar'");
        expect(format("`foo `` JOIN bar`")).toBe("`foo `` JOIN bar`");
    });

    it("formats postgres specific operators", function() {
        expect(format("column::int")).toBe("column::int");
        expect(format("v->2")).toBe("v->2");
        expect(format("v->>2")).toBe( "v->>2");
        expect(format("foo ~~ 'hello'")).toBe("foo ~~ 'hello'");
        expect(format("foo !~ 'hello'")).toBe("foo !~ 'hello'");
        expect(format("foo ~* 'hello'")).toBe("foo ~* 'hello'");
        expect(format("foo ~~* 'hello'")).toBe("foo ~~* 'hello'");
        expect(format("foo !~~ 'hello'")).toBe("foo !~~ 'hello'");
        expect(format("foo !~* 'hello'")).toBe("foo !~* 'hello'");
        expect(format("foo !~~* 'hello'")).toBe("foo !~~* 'hello'");
        expect(format("@ foo")).toBe("@ foo");
        expect(format("tsvector @@ tsquery")).toBe("tsvector @@ tsquery");
        expect(format("foo << 2")).toBe("foo << 2");
        expect(format("foo >> 2")).toBe("foo >> 2");
        expect(format("|/ foo")).toBe("|/ foo");
        expect(format("||/ foo")).toBe("||/ foo");
    });

    it("keeps separation between multiple statements", function() {
        expect(format("foo;bar;")).toBe("foo;\nbar;");
        expect(format("foo\n;bar;")).toBe("foo;\nbar;");
        expect(format("foo\n\n\n;bar;\n\n")).toBe("foo;\nbar;");

        const result = format("SELECT count(*),Column1 FROM Table1;\nSELECT count(*),Column1 FROM Table2;");
        expect(result).toBe(
            "SELECT count(*),\n" +
            "  Column1\n" +
            "FROM Table1;\n" +
            "SELECT count(*),\n" +
            "  Column1\n" +
            "FROM Table2;"
        );
    });

    it("keeps reserved words case", function() {
        expect(format("foo;bar;")).toBe("foo;\nbar;");
        expect(format("foo\n;bar;")).toBe("foo;\nbar;");
        expect(format("foo\n\n\n;bar;\n\n")).toBe("foo;\nbar;");

        const result = sqlFormatter.format("select count(*),Column1 FROM Table1;\nSELECT count(*),Column1 from Table2;");
        expect(result).toBe(
            "select count(*),\n" +
            "  Column1\n" +
            "FROM Table1;\n" +
            "SELECT count(*),\n" +
            "  Column1\n" +
            "from Table2;"
        );
    });

    it("change reserved words case to upper", function() {
        const result = sqlFormatter.format("select count(*),column1 from table1;\nselect count(*),column1 from table2;", { reservedWordCase: 'upper' });
        expect(result).toBe(
            "SELECT COUNT(*),\n" +
            "  column1\n" +
            "FROM table1;\n" +
            "SELECT COUNT(*),\n" +
            "  column1\n" +
            "FROM table2;"
        );
    });

    it("change reserved words case to lower", function() {
        const result = sqlFormatter.format("SELECT count(*),column1 FROM table1;\nSELECT count(*),column1 FROM table2;", { reservedWordCase: 'lower' });
        expect(result).toBe(
            "select count(*),\n" +
            "  column1\n" +
            "from table1;\n" +
            "select count(*),\n" +
            "  column1\n" +
            "from table2;"
        );
    });

    it('keeps separation between multiple statements', () => {
      expect(format('foo;bar;')).toBe('foo;\nbar;');
      expect(format('foo\n;bar;')).toBe('foo;\nbar;');
      expect(format('foo\n\n\n;bar;\n\n')).toBe('foo;\nbar;');

      const result = format(`
        SELECT count(*),Column1 FROM Table1;
        SELECT count(*),Column1 FROM Table2;
      `);
      expect(result).toBe(dedent/* sql */ `
        SELECT count(*),
          Column1
        FROM Table1;
        SELECT count(*),
          Column1
        FROM Table2;
      `);
    });

    it('formats unicode correctly', () => {
      const result = format('SELECT test, тест FROM table;');
      expect(result).toBe(dedent/* sql */ `
        SELECT test,
          тест
        FROM table;
      `);
    });

    it('converts keywords to uppercase when option passed in', () => {
      const result = format('select distinct * frOM foo left join bar WHERe cola > 1 and colb = 3', {
        reservedWordCase: 'upper'
      });
      expect(result).toBe(dedent/* sql */ `
        SELECT DISTINCT *
        FROM foo
          LEFT JOIN bar
        WHERE cola > 1
          AND colb = 3
      `);
    });

    it('line breaks between queries change with config', () => {
      const result = format('SELECT * FROM foo; SELECT * FROM bar;', { linesBetweenQueries: 2 });
      expect(result).toBe(dedent/* sql */ `
        SELECT *
        FROM foo;

        SELECT *
        FROM bar;
      `);
    });

    it('correctly indents create statement after select', () => {
      const result = sqlFormatter.format(`
        SELECT * FROM test;
        CREATE TABLE TEST(id NUMBER NOT NULL, col1 VARCHAR2(20), col2 VARCHAR2(20));
      `);
      expect(result).toBe(dedent/* sql */ `
        SELECT *
        FROM test;
        CREATE TABLE TEST(
          id NUMBER NOT NULL,
          col1 VARCHAR2(20),
          col2 VARCHAR2(20)
        );
      `);
    });

    it('test tokenizer method exists', () => {

      expect(sqlFormatter.tokenize('SELECT', { language })).toEqual([{ type: 'reserved-top-level', value: 'SELECT'}]);
      expect(sqlFormatter.tokenize('SELECT *', { language })).toEqual([{ type: 'reserved-top-level', value: 'SELECT'}, { type: 'whitespace', value: ' '}, { type: 'operator', value: '*'}]);
      expect(sqlFormatter.tokenize(undefined, { language })).toEqual([]);
      expect(sqlFormatter.tokenize(undefined)).toEqual([]);
    })
}
