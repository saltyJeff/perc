{
  function node(type, props) {
    return { type, ...props, location: location() };
  }

  function buildBinaryExpression(head, tail) {
    return tail.reduce((result, element) => {
      return node("BinaryExpression", {
        left: result,
        operator: element[1],
        right: element[3]
      });
    }, head);
  }

  function extractList(list, index) {
    return list.map(function(element) { return element[index]; });
  }

  function buildList(head, tail, index) {
    return [head].concat(extractList(tail, index));
  }
}

SourceFile
  = _ stmts:(FunctionDeclaration / Statement)* {
      return node("SourceFile", { body: stmts });
    }

// --- Statements ---

Statement
  = VarInit
  / VarChange
  / ReturnStatement
  / BreakStatement
  / ContinueStatement
  / IfStatement
  / WhileStatement
  / ForInStatement
  / ExpressionStatement
  / Block

VarInit
  = "init" _ name:Identifier _ "=" _ value:Expression {
      return node("VarInit", { name, value });
    }

VarChange
  = "change" _ target:(MemberExpression / Identifier) _ "=" _ value:Expression {
      return node("VarChange", { target, value });
    }


FunctionDeclaration
  = "function" _ name:Identifier _ params:ParameterList _ body:Block {
      return node("FunctionDeclaration", { name, parameters: params, body });
    }

ParameterList
  = "(" _ head:Identifier? tail:(_ "," _ Identifier)* _ trailing:","? _ ")" {
      const params = head ? buildList(head, tail, 3) : [];
      return params;
    }

Block
  = "{" _ stmts:Statement* "}" _ {
      return node("Block", { body: stmts });
    }

IfStatement
  = "if" _ "(" _ condition:Expression _ ")" _ "then" _ consequence:Block alternative:(_ "else" _ (Block / IfStatement))? {
      const alt = alternative ? alternative[3] : null;
      return node("IfStatement", { condition, consequence, alternative: alt });
    }

WhileStatement
  = "while" _ "(" _ condition:Expression _ ")" _ "then" _ body:Block {
      return node("WhileStatement", { condition, body });
    }

ForInStatement
  = "for" _ "(" _ "init" _ item:Identifier _ "in" _ collection:Expression _ ")" _ "then" _ body:Block {
      return node("ForInStatement", { item, collection, body });
    }

ReturnStatement
  = "return" _ expr:Expression? {
      return node("ReturnStatement", { argument: expr });
    }

BreakStatement
  = "break" _ { return node("BreakStatement", {}); }

ContinueStatement
  = "continue" _ { return node("ContinueStatement", {}); }

ExpressionStatement
  = expr:Expression _ {
      return node("ExpressionStatement", { expression: expr });
    }

// --- Expressions ---

Expression
  = LogicalOr

LogicalOr
  = head:LogicalAnd tail:(_ ("||" / "or") _ LogicalAnd)* {
      return buildBinaryExpression(head, tail);
    }

LogicalAnd
  = head:BitwiseOr tail:(_ ("&&" / "and") _ BitwiseOr)* {
      return buildBinaryExpression(head, tail);
    }

BitwiseOr
  = head:BitwiseXor tail:(_ "|" _ BitwiseXor)* {
      return buildBinaryExpression(head, tail);
    }

BitwiseXor
  = head:BitwiseAnd tail:(_ "^" _ BitwiseAnd)* {
      return buildBinaryExpression(head, tail);
    }

BitwiseAnd
  = head:Comparative tail:(_ "&" _ Comparative)* {
      return buildBinaryExpression(head, tail);
    }

Comparative
  = head:Shift tail:(_ ("==" / "!=" / "<=" / ">=" / "<" / ">" / "<=>" / "is") _ Shift)* {
      return buildBinaryExpression(head, tail);
    }

Shift
  = head:Additive tail:(_ ("<<" / ">>") _ Additive)* {
      return buildBinaryExpression(head, tail);
    }

Additive
  = head:Multiplicative tail:(_ ("+" / "-") _ Multiplicative)* {
      return buildBinaryExpression(head, tail);
    }

Multiplicative
  = head:Power tail:(_ ("*" / "/" / "%") _ Power)* {
      return buildBinaryExpression(head, tail);
    }

Power
  = head:Unary _ "**" _ right:Power {
      return node("BinaryExpression", { left: head, operator: "**", right: right });
    }
  / Unary

Unary
  = op:("!" / "not" / "-" / "+") _ operand:Unary {
      return node("UnaryExpression", { operator: op, operand });
    }
  / Instantiation

Instantiation
  = "new" _ expr:(ArrayLiteral / MapLiteral / TupleLiteral) {
      return node("InstantiationExpression", { expression: expr });
    }
  / Primary

Primary
  = head:Atom tail:(_ (MemberAccess / CallAccess))* {
      return tail.reduce((result, element) => {
        const access = element[1];
        if (access.type === "MemberAccess") {
          return node("MemberExpression", { object: result, property: access.property, propertyType: access.propertyType });
        } else if (access.type === "IndexAccess") {
          return node("MemberExpression", { object: result, index: access.index });
        } else if (access.type === "CallAccess") {
          return node("CallExpression", { callee: result, arguments: access.arguments });
        }
        return result;
      }, head);
    }

MemberExpression
  = head:Atom tail:(_ MemberAccess)+ {
      return tail.reduce((result, element) => {
        const access = element[1];
        if (access.type === "MemberAccess") {
          return node("MemberExpression", { object: result, property: access.property, propertyType: access.propertyType });
        } else {
          return node("MemberExpression", { object: result, index: access.index });
        }
      }, head);
    }

MemberAccess
  = "." _ property:Identifier { return { type: "MemberAccess", property, propertyType: "dot" }; }
  / "[" _ index:Expression _ "]" _ { return { type: "IndexAccess", index }; }

CallAccess
  = args:ArgumentList { return { type: "CallAccess", arguments: args }; }

ArgumentList
  = "(" _ head:Expression? tail:(_ "," _ Expression)* _ trailing:","? _ ")" _ {
      return head ? buildList(head, tail, 3) : [];
    }

Atom
  = Identifier
  / Literal
  / ParenthesizedExpression
  / FunctionLiteral

ParenthesizedExpression
  = "(" _ expr:Expression _ ")" _ { return expr; }

FunctionLiteral
  = "function" _ params:ParameterList _ body:Block {
      return node("FunctionLiteral", { parameters: params, body });
    }

// --- Literals ---

Literal
  = FloatLiteral
  / IntegerLiteral
  / StringLiteral
  / CharLiteral
  / BooleanLiteral
  / NilLiteral

NilLiteral
  = "nil" _ { return node("NilLiteral", {}); }

BooleanLiteral
  = "true" _ { return node("BooleanLiteral", { value: true }); }
  / "false" _ { return node("BooleanLiteral", { value: false }); }

IntegerLiteral
  = digits:$( "0x" [0-9a-fA-F] ("_"? [0-9a-fA-F])*
           / "0b" [01] ("_"? [01])*
           / "0o" [0-7] ("_"? [0-7])*
           / [0-9] ("_"? [0-9])*
           ) _ {
      return node("IntegerLiteral", { value: digits });
    }

FloatLiteral
  = digits:$( [0-9] ("_"? [0-9])* "." [0-9] ("_"? [0-9])* Exponent?
           / "." [0-9] ("_"? [0-9])* Exponent?
           / [0-9] ("_"? [0-9])* Exponent
           ) _ {
      return node("FloatLiteral", { value: digits });
    }

Exponent
  = [eE] [+-]? [0-9] ("_"? [0-9])*

StringLiteral
  = "\"" chars:StringChar* "\"" _ {
      return node("StringLiteral", { value: chars.join("") });
    }

StringChar
  = !("\"" / "\\") char:. { return char; }
  / "\\" sequence:EscapeSequence { return sequence; }

CharLiteral
  = "'" char:( !("'" / "\\") c:. { return c; } / "\\" s:EscapeSequence { return s; } ) "'" _ {
      return node("CharLiteral", { value: char });
    }

EscapeSequence
  = "'"
  / "\""
  / "\\"
  / "b" { return "\b"; }
  / "f" { return "\f"; }
  / "n" { return "\n"; }
  / "r" { return "\r"; }
  / "t" { return "\t"; }
  / "v" { return "\v"; }
  / octal:$( [0-7] [0-7]? [0-7]? ) { return String.fromCharCode(parseInt(octal, 8)); }
  / "x" digits:$( [0-9a-fA-F] [0-9a-fA-F] ) { return String.fromCharCode(parseInt(digits, 16)); }
  / "u" digits:$( [0-9a-fA-F] [0-9a-fA-F] [0-9a-fA-F] [0-9a-fA-F] ) { return String.fromCharCode(parseInt(digits, 16)); }
  / "U" digits:$( [0-9a-fA-F] [0-9a-fA-F] [0-9a-fA-F] [0-9a-fA-F] [0-9a-fA-F] [0-9a-fA-F] [0-9a-fA-F] [0-9a-fA-F] ) { return String.fromCodePoint(parseInt(digits, 16)); }

ArrayLiteral
  = "[" _ head:Expression? tail:(_ "," _ Expression)* _ trailing:","? _ "]" _ {
      return node("ArrayLiteral", { elements: head ? buildList(head, tail, 3) : [] });
    }

MapLiteral
  = "{" _ head:Pair? tail:(_ "," _ Pair)* _ trailing:","? _ "}" _ {
      return node("MapLiteral", { pairs: head ? buildList(head, tail, 3) : [] });
    }

Pair
  = key:Expression _ ":" _ value:Expression {
      return node("Pair", { key, value });
    }

TupleLiteral
  = "(|" _ head:Expression? tail:(_ "," _ Expression)* _ trailing:","? _ "|)" _ {
      return node("TupleLiteral", { elements: head ? buildList(head, tail, 3) : [] });
    }

// --- Identifiers and Keywords ---

Identifier
  = !Keyword name:IdentifierName _ { return name; }

IdentifierName
  = $([a-zA-Z_] [a-zA-Z0-9_]*)

Keyword
  = ( "init"
    / "change"
    / "function"
    / "if"
    / "then"
    / "else"
    / "while"
    / "for"
    / "in"
    / "return"
    / "break"
    / "continue"
    / "new"
    / "true"
    / "false"
    / "nil"
    / "not"
    / "is"
    / "and"
    / "or"
    / "clone"
    ) ![a-zA-Z0-9_]

// --- Extras ---

_ "whitespace"
  = (WhiteSpace / Comment)*

WhiteSpace
  = [ \t\n\r]

Comment
  = "//" [^\n]*
  / "/*" (!"*/" .)* "*/"