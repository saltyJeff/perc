import peggy from 'peggy';

function extractAllowedStartRules(allowedStartRules) {
    if (allowedStartRules) {
        if (typeof allowedStartRules === 'string') {
            return [allowedStartRules];
        }
        if (Array.isArray(allowedStartRules)) {
            return allowedStartRules;
        }
    }
    return [];
}

export default function peggyLoader(options) {
    return {
        name: 'peggy-loader',
        transform(source, id) {
            if (!id.endsWith('.pegjs')) return;
            if (this.cacheable) {
                this.cacheable();
            }

            const cacheParserResults = !!(options && options.cache);
            const optimizeParser = options && options.optimize || 'speed';
            const trace = !!(options && options.trace);
            const dependencies = options && options.dependencies || {};
            const allowedStartRules = extractAllowedStartRules(options && options.allowedStartRules);

            // Description of Peggy options: https://peggyjs.org/documentation.html#generating-a-parser-javascript-api
            const pegOptions = {
                cache: cacheParserResults,
                dependencies,
                format: 'es',
                optimize: optimizeParser,
                output: 'source',
                trace,
            };
            if (allowedStartRules.length > 0) {
                pegOptions.allowedStartRules = allowedStartRules;
            }

            const methodName = typeof peggy.generate === 'function' ? 'generate' : 'buildParser';
            return peggy[methodName](source, pegOptions);
        },
    };
}
