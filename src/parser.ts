/**
 * This file is generated with meta-chevrotain
 */

import {
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
} from "./lexer";

export class MetaParser extends CstParser {
    constructor(tokens: TokenType[]) {
        super(tokens, {
            recoveryEnabled: true
        })
        this.performSelfAnalysis();
    }
    private ArgumentSep = this.RULE("ArgumentSep", () => {
        this.consume(0, Semicolon);
        this.consume(1, Identifier);
    });
    private BacktrackPredicate = this.RULE("BacktrackPredicate", () => {
        this.consume(0, LAngle);
        this.or(0, [{
            ALT: () => this.consume(1, Identifier)
        }, {
            ALT: () => this.subrule(0, this.Statement)
        }, {
            ALT: () => this.subrule(1, this.StatementList)
        }, ]);
    });
    private ArgumentGate = this.RULE("ArgumentGate", () => {
        this.consume(0, RAngle);
        this.or(0, [{
            ALT: () => this.consume(1, EscapedString)
        }, {
            ALT: () => this.subrule(0, this.BacktrackPredicate)
        }, ]);
    });
    private ArgumentErr = this.RULE("ArgumentErr", () => {
        this.consume(0, Exclamation);
        this.consume(1, EscapedString);
    });
    private ArgumentMaxLa = this.RULE("ArgumentMaxLa", () => {
        this.consume(0, Caret);
        this.consume(1, EscapedString);
    });
    private ArgumentLabel = this.RULE("ArgumentLabel", () => {
        this.consume(0, At);
        this.consume(1, EscapedString);
    });
    private AtLeastOneArguments = this.RULE("AtLeastOneArguments", () => {
        this.consume(0, LBrace);
        this.AT_LEAST_ONE({
            DEF: () => this.or(0, [{
                ALT: () => this.subrule(0, this.ArgumentSep)
            }, {
                ALT: () => this.subrule(1, this.ArgumentGate)
            }, {
                ALT: () => this.subrule(2, this.ArgumentErr)
            }, {
                ALT: () => this.subrule(3, this.ArgumentMaxLa)
            }, ])
        });
        this.consume(1, RBrace);
    });
    private AtLeastOneStatement = this.RULE("AtLeastOneStatement", () => {
        this.consume(0, OnePlus);
        this.option(0, () => this.subrule(0, this.AtLeastOneArguments));
        this.or(0, [{
            ALT: () => this.subrule(1, this.Statement)
        }, {
            ALT: () => this.subrule(2, this.StatementList)
        }, ]);
    });
    private ConsumeArguments = this.RULE("ConsumeArguments", () => {
        this.consume(0, LBrace);
        this.AT_LEAST_ONE({
            DEF: () => this.or(0, [{
                ALT: () => this.subrule(0, this.ArgumentErr)
            }, {
                ALT: () => this.subrule(1, this.ArgumentLabel)
            }, ])
        });
        this.consume(1, RBrace);
    });
    private ConsumeStatement = this.RULE("ConsumeStatement", () => {
        this.consume(0, Underscore);
        this.option(0, () => this.subrule(0, this.ConsumeArguments));
        this.consume(1, Identifier);
    });
    private ManyArguments = this.RULE("ManyArguments", () => {
        this.consume(0, LBrace);
        this.AT_LEAST_ONE({
            DEF: () => this.or(0, [{
                ALT: () => this.subrule(0, this.ArgumentSep)
            }, {
                ALT: () => this.subrule(1, this.ArgumentGate)
            }, {
                ALT: () => this.subrule(2, this.ArgumentMaxLa)
            }, ])
        });
        this.consume(1, RBrace);
    });
    private ManyStatement = this.RULE("ManyStatement", () => {
        this.consume(0, ZeroPlus);
        this.option(0, () => this.subrule(0, this.ManyArguments));
        this.or(0, [{
            ALT: () => this.subrule(1, this.Statement)
        }, {
            ALT: () => this.subrule(2, this.StatementList)
        }, ]);
    });
    private OptionArguments = this.RULE("OptionArguments", () => {
        this.consume(0, LBrace);
        this.AT_LEAST_ONE({
            DEF: () => this.or(0, [{
                ALT: () => this.subrule(0, this.ArgumentGate)
            }, {
                ALT: () => this.subrule(1, this.ArgumentMaxLa)
            }, ])
        });
        this.consume(1, RBrace);
    });
    private OptionStatement = this.RULE("OptionStatement", () => {
        this.consume(0, Question);
        this.option(0, () => this.subrule(0, this.OptionArguments));
        this.or(0, [{
            ALT: () => this.subrule(1, this.Statement)
        }, {
            ALT: () => this.subrule(2, this.StatementList)
        }, ]);
    });
    private OrAlternativeArguments = this.RULE("OrAlternativeArguments", () => {
        this.consume(0, LBrace);
        this.AT_LEAST_ONE({
            DEF: () => this.or(0, [{
                ALT: () => this.subrule(0, this.ArgumentGate)
            }, {
                ALT: () => this.consume(2, EscapedString)
            }, ])
        });
        this.consume(1, RBrace);
    });
    private OrAlternative = this.RULE("OrAlternative", () => {
        this.consume(0, Backslash);
        this.option(0, () => this.subrule(0, this.OrAlternativeArguments));
        this.or(0, [{
            ALT: () => this.subrule(1, this.Statement)
        }, {
            ALT: () => this.subrule(2, this.StatementList)
        }, ]);
    });
    private OrArguments = this.RULE("OrArguments", () => {
        this.consume(0, LBrace);
        this.AT_LEAST_ONE({
            DEF: () => this.or(0, [{
                ALT: () => this.subrule(0, this.ArgumentErr)
            }, {
                ALT: () => this.subrule(1, this.ArgumentMaxLa)
            }, {
                ALT: () => this.consume(2, EscapedString)
            }, ])
        });
        this.consume(1, RBrace);
    });
    private OrStatement = this.RULE("OrStatement", () => {
        this.consume(0, VBar);
        this.option(0, () => this.subrule(0, this.OrArguments));
        this.AT_LEAST_ONE({
            DEF: () => this.subrule(1, this.OrAlternative)
        });
    });
    private SkipStatement = this.RULE("SkipStatement", () => {
        this.consume(0, Minus);
        this.consume(1, Identifier);
    });
    private SubruleArguments = this.RULE("SubruleArguments", () => {
        this.consume(0, LBrace);
        this.AT_LEAST_ONE({
            DEF: () => this.or(0, [{
                ALT: () => this.subrule(0, this.ArgumentLabel)
            }, {
                ALT: () => this.consume(2, EscapedString)
            }, ])
        });
        this.consume(1, RBrace);
    });
    private SubruleStatement = this.RULE("SubruleStatement", () => {
        this.consume(0, Asterisk);
        this.option(0, () => this.subrule(0, this.SubruleArguments));
        this.consume(1, Identifier);
    });
    private Statement = this.RULE("Statement", () => {
        this.or(0, [{
            ALT: () => this.subrule(0, this.AtLeastOneStatement)
        }, {
            ALT: () => this.subrule(1, this.ConsumeStatement)
        }, {
            ALT: () => this.subrule(2, this.ManyStatement)
        }, {
            ALT: () => this.subrule(3, this.OptionStatement)
        }, {
            ALT: () => this.subrule(4, this.OrStatement)
        }, {
            ALT: () => this.subrule(5, this.SkipStatement)
        }, {
            ALT: () => this.subrule(6, this.SubruleStatement)
        }, {
            ALT: () => this.consume(0, EscapedString)
        }, ]);
    });
    private StatementList = this.RULE("StatementList", () => {
        this.consume(0, LCurly);
        this.MANY({
            DEF: () => this.subrule(0, this.Statement)
        });
        this.consume(1, RCurly);
    });
    private RuleArguments = this.RULE("RuleArguments", () => {
        this.consume(0, LBrace);
        this.AT_LEAST_ONE({
            DEF: () => this.consume(2, EscapedString)
        });
        this.consume(1, RBrace);
    });
    private RuleStatement = this.RULE("RuleStatement", () => {
        this.option(0, () => this.consume(1, Equals));
        this.option(1, () => this.subrule(1, this.RuleArguments));
        this.consume(0, Identifier);
        this.subrule(0, this.StatementList);
    });
    private RootStatement = this.RULE("RootStatement", () => {
        this.or(0, [{
            ALT: () => this.subrule(0, this.RuleStatement)
        }, {
            ALT: () => this.consume(0, EscapedString)
        }, ]);
    });
    public Root = this.RULE("Root", () => {
        this.MANY({
            DEF: () => this.subrule(0, this.RootStatement)
        });
    });
}