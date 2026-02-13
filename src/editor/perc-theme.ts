import ace from 'ace-builds';

const themeData = `
.ace-perc-dark .ace_gutter {
    background: #252526;
    color: #858585;
}
.ace-perc-dark .ace_print-margin {
    width: 1px;
    background: #333333;
}
.ace-perc-dark {
    background-color: #1e1e1e;
    color: #d4d4d4;
}
.ace-perc-dark .ace_cursor {
    color: #aeafad;
}
.ace-perc-dark .ace_marker-layer .ace_selection {
    background: #264f78;
}
.ace-perc-dark.ace_multiselect .ace_selection.ace_start {
    box-shadow: 0 0 3px 0px #1e1e1e;
}
.ace-perc-dark .ace_marker-layer .ace_step {
    background: rgb(198, 219, 174);
}
.ace-perc-dark .ace_marker-layer .ace_bracket {
    margin: -1px 0 0 -1px;
    border: 1px solid #3b3a32;
}
.ace-perc-dark .ace_marker-layer .ace_active-line {
    background: rgba(255, 255, 255, 0.05);
}
.ace-perc-dark .ace_gutter-active-line {
    background-color: #333333;
}
.ace-perc-dark .ace_marker-layer .ace_selected-word {
    border: 1px solid #264f78;
}
.ace-perc-dark .ace_invisible {
    color: #3b3a32;
}
.ace-perc-dark .ace_keyword,
.ace-perc-dark .ace_meta,
.ace-perc-dark .ace_storage,
.ace-perc-dark .ace_storage.ace_type {
    color: #569cd6;
}
.ace-perc-dark .ace_keyword.ace_operator {
    color: #d4d4d4;
}
.ace-perc-dark .ace_constant.ace_character,
.ace-perc-dark .ace_constant.ace_language,
.ace-perc-dark .ace_constant.ace_numeric,
.ace-perc-dark .ace_pointer {
    color: #b5cea8;
}
.ace-perc-dark .ace_invalid {
    color: #f44747;
    background-color: rgba(244, 71, 71, 0.1);
}
.ace-perc-dark .ace_fold {
    background-color: #569cd6;
    border-color: #d4d4d4;
}
.ace-perc-dark .ace_support.ace_function {
    color: #dcdcaa;
}
.ace-perc-dark .ace_variable.ace_parameter {
    font-style: italic;
    color: #9cdcfe;
}
.ace-perc-dark .ace_string {
    color: #ce9178;
}
.ace-perc-dark .ace_comment {
    color: #6a9955;
}
.ace-perc-dark .ace_variable {
    color: #9cdcfe;
}
.ace-perc-dark .ace_entity.ace_name.ace_function {
    color: #dcdcaa;
}
.ace-perc-dark .ace_heading {
    color: #6796e6;
}
`;

(ace as any).define("ace/theme/perc-dark", ["require", "exports", "module", "ace/lib/dom"], function (require: any, exports: any, _module: any) {
    exports.isDark = true;
    exports.cssClass = "ace-perc-dark";
    exports.cssText = themeData;

    var dom = require("../lib/dom");
    dom.importCssString(exports.cssText, exports.cssClass);
});
