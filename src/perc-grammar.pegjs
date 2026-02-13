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
  = __ stmts:Statement* {
      return node("SourceFile", { body: stmts });
    }

// --- Statements ---

Statement
  = s:(
      FunctionDeclaration
    / VarInit
    / VarChange
    / ReturnStatement
    / BreakStatement
    / ContinueStatement
    / DebuggerStatement
    / IfStatement
    / WhileStatement
    / ForInStatement
    / ExpressionStatement
    / Block
    ) EOS { return s; }

VarInit
  = "init" _ name:Identifier _ "=" __ value:Expression {
      return node("VarInit", { name: name.name, value });
    }

VarChange
  = "change" _ target:(MemberExpression / Identifier) _ "=" __ value:Expression {
      return node("VarChange", { target, value });
    }


FunctionDeclaration
  = "function" _ name:Identifier _ params:ParameterList __ body:Block {
      return node("FunctionDeclaration", { name: name.name, parameters: params, body });
    }

ParameterList
  = "(" __ head:Identifier? tail:(__ "," __ Identifier)* __ trailing:","? __ ")" {
      const params = head ? buildList(head.name, tail.map(t => t[3].name), -1) : []; // buildList expects tail to be array of elements
      // Wait, buildList is: function buildList(head, tail, index) { return [head].concat(extractList(tail, index)); }
      // tail is (_ "," _ Identifier)*. So element[3] is Identifier node.
      // I'll rewrite params collection for clarity
      const p = head ? [head.name] : [];
      tail.forEach(t => p.push(t[3].name));
      return p;
    }

Block
  = "{" __ stmts:Statement* "}" {
      return node("Block", { body: stmts });
    }

IfStatement
  = "if" _ "(" __ condition:Expression __ ")" _ "then" __ consequence:Block alternative:(_ "else" _ (Block / IfStatement))? {
      const alt = alternative ? alternative[3] : null;
      return node("IfStatement", { condition, consequence, alternative: alt });
    }

WhileStatement
  = "while" _ "(" __ condition:Expression __ ")" _ "then" __ body:Block {
      return node("WhileStatement", { condition, body });
    }

ForInStatement
  = "for" _ "(" __ "init" _ item:Identifier __ "in" __ collection:Expression __ ")" _ "then" __ body:Block {
      return node("ForInStatement", { item: item.name, collection, body });
    }

ReturnStatement
  = "return" _ expr:Expression? {
      return node("ReturnStatement", { argument: expr });
    }

BreakStatement
  = "break" { return node("BreakStatement", {}); }

ContinueStatement
  = "continue" { return node("ContinueStatement", {}); }

DebuggerStatement
  = "debugger" { return node("DebuggerStatement", {}); }

ExpressionStatement
  = expr:Expression {
      return node("ExpressionStatement", { expression: expr });
    }

// --- Expressions ---

Expression
  = LogicalOr

LogicalOr
  = head:LogicalAnd tail:(_ ("||" / "or") __ LogicalAnd)* {
      return buildBinaryExpression(head, tail);
    }

LogicalAnd
  = head:BitwiseOr tail:(_ ("&&" / "and") __ BitwiseOr)* {
      return buildBinaryExpression(head, tail);
    }

BitwiseOr
  = head:BitwiseXor tail:(_ "|" __ BitwiseXor)* {
      return buildBinaryExpression(head, tail);
    }

BitwiseXor
  = head:BitwiseAnd tail:(_ "^" __ BitwiseAnd)* {
      return buildBinaryExpression(head, tail);
    }

BitwiseAnd
  = head:Comparative tail:(_ "&" __ Comparative)* {
      return buildBinaryExpression(head, tail);
    }

Comparative
  = head:Shift tail:(_ ("==" / "!=" / "<=" / ">=" / "<" / ">" / "<=>" / "is") __ Shift)* {
      return buildBinaryExpression(head, tail);
    }

Shift
  = head:Additive tail:(_ ("<<" / ">>") __ Additive)* {
      return buildBinaryExpression(head, tail);
    }

Additive
  = head:Multiplicative tail:(_ ("+" / "-") __ Multiplicative)* {
      return buildBinaryExpression(head, tail);
    }

Multiplicative
  = head:Power tail:(_ ("*" / "/" / "%") __ Power)* {
      return buildBinaryExpression(head, tail);
    }

Power
  = head:Unary _ "**" __ right:Power {
      return node("BinaryExpression", { left: head, operator: "**", right: right });
    }
  / Unary

Unary
  = op:("!" / "not" / "-" / "+") __ operand:Unary {
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
          return node("MemberExpression", { object: result, property: access.property.name, propertyType: access.propertyType });
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
          return node("MemberExpression", { object: result, property: access.property.name, propertyType: access.propertyType });
        } else {
          return node("MemberExpression", { object: result, index: access.index });
        }
      }, head);
    }

MemberAccess
  = "." _ property:Identifier { return { type: "MemberAccess", property, propertyType: "dot" }; }
  / "[" __ index:Expression __ "]" { return { type: "IndexAccess", index }; }

CallAccess
  = args:ArgumentList { return { type: "CallAccess", arguments: args }; }

ArgumentList
  = "(" __ head:Expression? tail:(__ "," __ Expression)* __ trailing:","? __ ")" {
      return head ? buildList(head, tail, 3) : [];
    }

Atom
  = Identifier
  / Literal
  / ParenthesizedExpression
  / FunctionLiteral

ParenthesizedExpression
  = "(" __ expr:Expression __ ")" { return expr; }

FunctionLiteral
  = "function" _ params:ParameterList __ body:Block {
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
  = "nil" { return node("NilLiteral", {}); }

BooleanLiteral
  = "true" { return node("BooleanLiteral", { value: true }); }
  / "false" { return node("BooleanLiteral", { value: false }); }

IntegerLiteral
  = digits:$( "0x" [0-9a-fA-F] ("_"? [0-9a-fA-F])*
           / "0b" [01] ("_"? [01])*
           / "0o" [0-7] ("_"? [0-7])*
           / [0-9] ("_"? [0-9])*
           ) {
      return node("IntegerLiteral", { value: digits });
    }

FloatLiteral
  = digits:$( [0-9] ("_"? [0-9])* "." [0-9] ("_"? [0-9])* Exponent?
           / "." [0-9] ("_"? [0-9])* Exponent?
           / [0-9] ("_"? [0-9])* Exponent
           ) {
      return node("FloatLiteral", { value: digits });
    }

Exponent
  = [eE] [+-]? [0-9] ("_"? [0-9])*

StringLiteral
  = "\"" chars:StringChar* "\"" {
      return node("StringLiteral", { value: chars.join("") });
    }

StringChar
  = !("\"" / "\\") char:. { return char; }
  / "\\" sequence:EscapeSequence { return sequence; }

CharLiteral
  = "'" char:( !("'" / "\\") c:. { return c; } / "\\" s:EscapeSequence { return s; } ) "'" {
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
  = "[" __ head:Expression? tail:(__ "," __ Expression)* __ trailing:","? __ "]" {
      return node("ArrayLiteral", { elements: head ? buildList(head, tail, 3) : [] });
    }

MapLiteral
  = "{" __ head:Pair? tail:(__ "," __ Pair)* __ trailing:","? __ "}" {
      return node("MapLiteral", { pairs: head ? buildList(head, tail, 3) : [] });
    }

Pair
  = key:Expression __ ":" __ value:Expression {
      return node("Pair", { key, value });
    }

TupleLiteral
  = "(|" __ head:Expression? tail:(__ "," __ Expression)* __ trailing:","? __ "|)" {
      return node("TupleLiteral", { elements: head ? buildList(head, tail, 3) : [] });
    }

// --- Identifiers and Keywords ---

Identifier
  = !Keyword name:$(IdentifierName) { return node("Identifier", { name }); }

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
    / "debugger"
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

EOS
  = _ ";" __
  / _ NewLine __
  / _ &"}"
  / _ EOF

_ "whitespace (no newlines)"
  = (WhiteSpaceNoNL / CommentNoNL)*

__ "whitespace (with newlines)"
  = (WhiteSpace / Comment)*

WhiteSpaceNoNL
  = [ \t]

WhiteSpace
  = [ \t\n\r]

NewLine
  = "\r\n" / "\n" / "\r"

Comment
  = "//" [^\n]*
  / "/*" (!"*/" .)* "*/"

CommentNoNL
  = "//" [^\n]*
  / "/*" (!("*/" / [\r\n]) .)* "*/"

EOF
  = !.
