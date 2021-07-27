/**
 * This file is generated with meta-chevrotain
 */

import {
    CstNode,
    CstParser,
    TokenType
} from "chevrotain";
import {
    Semicolon,
    Identifier,
    LAngle,
    RAngle,
    EscapedString,
    Exclamation,
    Caret,
    At,
    LBrace,
    RBrace,
    OnePlus,
    Underscore,
    ZeroPlus,
    Question,
    Backslash,
    VBar,
    Minus,
    Asterisk,
    LCurly,
    RCurly,
    Equals
} from "./meta_lexer";

export class MetaParser extends CstParser {
    readonly Root: (idxInCallingRule ? : number, ...args: any[]) => CstNode
    constructor(tokens: TokenType[]) {
        super(tokens, {
            recoveryEnabled: true
        })

        const $ = this;
        const ArgumentSep = $.RULE("ArgumentSep", () => {
            $.consume(0, Semicolon);
            $.consume(1, Identifier);
        });
        const BacktrackPredicate = $.RULE("BacktrackPredicate", () => {
            $.consume(0, LAngle);
            $.or(0, [{
                ALT: () => $.consume(1, Identifier)
            }, {
                ALT: () => $.subrule(0, Statement)
            }, {
                ALT: () => $.subrule(1, StatementList)
            }, ]);
        });
        const ArgumentGate = $.RULE("ArgumentGate", () => {
            $.consume(0, RAngle);
            $.or(0, [{
                ALT: () => $.consume(1, EscapedString)
            }, {
                ALT: () => $.subrule(0, BacktrackPredicate)
            }, ]);
        });
        const ArgumentErr = $.RULE("ArgumentErr", () => {
            $.consume(0, Exclamation);
            $.consume(1, EscapedString);
        });
        const ArgumentMaxLa = $.RULE("ArgumentMaxLa", () => {
            $.consume(0, Caret);
            $.consume(1, EscapedString);
        });
        const ArgumentLabel = $.RULE("ArgumentLabel", () => {
            $.consume(0, At);
            $.consume(1, EscapedString);
        });
        const AtLeastOneArguments = $.RULE("AtLeastOneArguments", () => {
            $.consume(0, LBrace);
            $.AT_LEAST_ONE({
                DEF: () => $.or(0, [{
                    ALT: () => $.subrule(0, ArgumentSep)
                }, {
                    ALT: () => $.subrule(1, ArgumentGate)
                }, {
                    ALT: () => $.subrule(2, ArgumentErr)
                }, {
                    ALT: () => $.subrule(3, ArgumentMaxLa)
                }, ])
            });
            $.consume(1, RBrace);
        });
        const AtLeastOneStatement = $.RULE("AtLeastOneStatement", () => {
            $.consume(0, OnePlus);
            $.option(0, () => $.subrule(0, AtLeastOneArguments));
            $.or(0, [{
                ALT: () => $.subrule(1, Statement)
            }, {
                ALT: () => $.subrule(2, StatementList)
            }, ]);
        });
        const ConsumeArguments = $.RULE("ConsumeArguments", () => {
            $.consume(0, LBrace);
            $.AT_LEAST_ONE({
                DEF: () => $.or(0, [{
                    ALT: () => $.subrule(0, ArgumentErr)
                }, {
                    ALT: () => $.subrule(1, ArgumentLabel)
                }, ])
            });
            $.consume(1, RBrace);
        });
        const ConsumeStatement = $.RULE("ConsumeStatement", () => {
            $.consume(0, Underscore);
            $.option(0, () => $.subrule(0, ConsumeArguments));
            $.consume(1, Identifier);
        });
        const ManyArguments = $.RULE("ManyArguments", () => {
            $.consume(0, LBrace);
            $.AT_LEAST_ONE({
                DEF: () => $.or(0, [{
                    ALT: () => $.subrule(0, ArgumentSep)
                }, {
                    ALT: () => $.subrule(1, ArgumentGate)
                }, {
                    ALT: () => $.subrule(2, ArgumentMaxLa)
                }, ])
            });
            $.consume(1, RBrace);
        });
        const ManyStatement = $.RULE("ManyStatement", () => {
            $.consume(0, ZeroPlus);
            $.option(0, () => $.subrule(0, ManyArguments));
            $.or(0, [{
                ALT: () => $.subrule(1, Statement)
            }, {
                ALT: () => $.subrule(2, StatementList)
            }, ]);
        });
        const OptionArguments = $.RULE("OptionArguments", () => {
            $.consume(0, LBrace);
            $.AT_LEAST_ONE({
                DEF: () => $.or(0, [{
                    ALT: () => $.subrule(0, ArgumentGate)
                }, {
                    ALT: () => $.subrule(1, ArgumentMaxLa)
                }, ])
            });
            $.consume(1, RBrace);
        });
        const OptionStatement = $.RULE("OptionStatement", () => {
            $.consume(0, Question);
            $.option(0, () => $.subrule(0, OptionArguments));
            $.or(0, [{
                ALT: () => $.subrule(1, Statement)
            }, {
                ALT: () => $.subrule(2, StatementList)
            }, ]);
        });
        const OrAlternativeArguments = $.RULE("OrAlternativeArguments", () => {
            $.consume(0, LBrace);
            $.AT_LEAST_ONE({
                DEF: () => $.or(0, [{
                    ALT: () => $.subrule(0, ArgumentGate)
                }, {
                    ALT: () => $.consume(2, EscapedString)
                }, ])
            });
            $.consume(1, RBrace);
        });
        const OrAlternative = $.RULE("OrAlternative", () => {
            $.consume(0, Backslash);
            $.option(0, () => $.subrule(0, OrAlternativeArguments));
            $.or(0, [{
                ALT: () => $.subrule(1, Statement)
            }, {
                ALT: () => $.subrule(2, StatementList)
            }, ]);
        });
        const OrArguments = $.RULE("OrArguments", () => {
            $.consume(0, LBrace);
            $.AT_LEAST_ONE({
                DEF: () => $.or(0, [{
                    ALT: () => $.subrule(0, ArgumentErr)
                }, {
                    ALT: () => $.subrule(1, ArgumentMaxLa)
                }, {
                    ALT: () => $.consume(2, EscapedString)
                }, ])
            });
            $.consume(1, RBrace);
        });
        const OrStatement = $.RULE("OrStatement", () => {
            $.consume(0, VBar);
            $.option(0, () => $.subrule(0, OrArguments));
            $.AT_LEAST_ONE({
                DEF: () => $.subrule(1, OrAlternative)
            });
        });
        const SkipStatement = $.RULE("SkipStatement", () => {
            $.consume(0, Minus);
            $.consume(1, Identifier);
        });
        const SubruleArguments = $.RULE("SubruleArguments", () => {
            $.consume(0, LBrace);
            $.AT_LEAST_ONE({
                DEF: () => $.or(0, [{
                    ALT: () => $.subrule(0, ArgumentLabel)
                }, {
                    ALT: () => $.consume(2, EscapedString)
                }, ])
            });
            $.consume(1, RBrace);
        });
        const SubruleStatement = $.RULE("SubruleStatement", () => {
            $.consume(0, Asterisk);
            $.option(0, () => $.subrule(0, SubruleArguments));
            $.consume(1, Identifier);
        });
        const Statement = $.RULE("Statement", () => {
            $.or(0, [{
                ALT: () => $.subrule(0, AtLeastOneStatement)
            }, {
                ALT: () => $.subrule(1, ConsumeStatement)
            }, {
                ALT: () => $.subrule(2, ManyStatement)
            }, {
                ALT: () => $.subrule(3, OptionStatement)
            }, {
                ALT: () => $.subrule(4, OrStatement)
            }, {
                ALT: () => $.subrule(5, SkipStatement)
            }, {
                ALT: () => $.subrule(6, SubruleStatement)
            }, {
                ALT: () => $.consume(0, EscapedString)
            }, ]);
        });
        const StatementList = $.RULE("StatementList", () => {
            $.consume(0, LCurly);
            $.MANY({
                DEF: () => $.subrule(0, Statement)
            });
            $.consume(1, RCurly);
        });
        const RuleArguments = $.RULE("RuleArguments", () => {
            $.consume(0, LBrace);
            $.AT_LEAST_ONE({
                DEF: () => $.consume(2, EscapedString)
            });
            $.consume(1, RBrace);
        });
        const RuleStatement = $.RULE("RuleStatement", () => {
            $.option(0, () => $.consume(1, Equals));
            $.option(1, () => $.subrule(1, RuleArguments));
            $.consume(0, Identifier);
            $.subrule(0, StatementList);
        });
        const RootStatement = $.RULE("RootStatement", () => {
            $.or(0, [{
                ALT: () => $.subrule(0, RuleStatement)
            }, {
                ALT: () => $.consume(0, EscapedString)
            }, ]);
        });
        this.Root = $.RULE("Root", () => {
            $.MANY({
                DEF: () => $.subrule(0, RootStatement)
            });
        });
        this.performSelfAnalysis();
    }
}