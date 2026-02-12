import peggy from 'peggy';
import fs from 'fs';

const grammar = fs.readFileSync('./src/perc-grammar.pegjs', 'utf8');
const parser = peggy.generate(grammar);

const code = `
function main(a, b,) {
    init x = 10
    init y = new [1, 2, 3,]
    change x = 20
    
    change x = y[0]
    change y.prop = "hello"
    
    init z = 2 ** 3 ** 2
    init c = 'A'
    init f = function(p) { return p + 1 }
    
    if (x > 1) then {
        return new (| 1, 2, |)
    } else {
        return new { "a": 1, "b": 2, }
    }
}
`;

try {
    const ast = parser.parse(code);
    console.log("AST built successfully!");
    console.log(JSON.stringify(ast, null, 2));
} catch (e) {
    console.error("Parse error:");
    console.error(e.message);
    if (e.location) {
        console.error(`Line ${e.location.start.line}, Column ${e.location.start.column}`);
    }
    process.exit(1);
}
