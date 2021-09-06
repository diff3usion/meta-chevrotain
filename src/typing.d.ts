
/**
  * This file is generated with meta-chevrotain
  */

import { CstNode, IToken } from 'chevrotain'

interface ArgumentSepNode extends CstNode {
    readonly children: {
        Semicolon?: IToken[]
        Identifier?: IToken[]
    }
    index?: number
}

interface BacktrackPredicateNode extends CstNode {
    readonly children: {
        LAngle?: IToken[]
        Identifier?: IToken[]
        Statement?: StatementNode[]
        StatementList?: StatementListNode[]
    }
    index?: number
}

interface ArgumentGateNode extends CstNode {
    readonly children: {
        RAngle?: IToken[]
        EscapedString?: IToken[]
        BacktrackPredicate?: BacktrackPredicateNode[]
    }
    index?: number
}

interface ArgumentErrNode extends CstNode {
    readonly children: {
        Exclamation?: IToken[]
        EscapedString?: IToken[]
    }
    index?: number
}

interface ArgumentMaxLaNode extends CstNode {
    readonly children: {
        Caret?: IToken[]
        EscapedString?: IToken[]
    }
    index?: number
}

interface ArgumentLabelNode extends CstNode {
    readonly children: {
        At?: IToken[]
        EscapedString?: IToken[]
    }
    index?: number
}

interface AtLeastOneArgumentsNode extends CstNode {
    readonly children: {
        LBrace?: IToken[]
        RBrace?: IToken[]
        ArgumentSep?: ArgumentSepNode[]
        ArgumentGate?: ArgumentGateNode[]
        ArgumentErr?: ArgumentErrNode[]
        ArgumentMaxLa?: ArgumentMaxLaNode[]
    }
    index?: number
}

interface AtLeastOneStatementNode extends CstNode {
    readonly children: {
        OnePlus?: IToken[]
        AtLeastOneArguments?: AtLeastOneArgumentsNode[]
        Statement?: StatementNode[]
        StatementList?: StatementListNode[]
    }
    index?: number
}

interface ConsumeArgumentsNode extends CstNode {
    readonly children: {
        LBrace?: IToken[]
        RBrace?: IToken[]
        ArgumentErr?: ArgumentErrNode[]
        ArgumentLabel?: ArgumentLabelNode[]
    }
    index?: number
}

interface ConsumeStatementNode extends CstNode {
    readonly children: {
        Underscore?: IToken[]
        Identifier?: IToken[]
        ConsumeArguments?: ConsumeArgumentsNode[]
    }
    index?: number
}

interface ManyArgumentsNode extends CstNode {
    readonly children: {
        LBrace?: IToken[]
        RBrace?: IToken[]
        ArgumentSep?: ArgumentSepNode[]
        ArgumentGate?: ArgumentGateNode[]
        ArgumentMaxLa?: ArgumentMaxLaNode[]
    }
    index?: number
}

interface ManyStatementNode extends CstNode {
    readonly children: {
        ZeroPlus?: IToken[]
        ManyArguments?: ManyArgumentsNode[]
        Statement?: StatementNode[]
        StatementList?: StatementListNode[]
    }
    index?: number
}

interface OptionArgumentsNode extends CstNode {
    readonly children: {
        LBrace?: IToken[]
        RBrace?: IToken[]
        ArgumentGate?: ArgumentGateNode[]
        ArgumentMaxLa?: ArgumentMaxLaNode[]
    }
    index?: number
}

interface OptionStatementNode extends CstNode {
    readonly children: {
        Question?: IToken[]
        OptionArguments?: OptionArgumentsNode[]
        Statement?: StatementNode[]
        StatementList?: StatementListNode[]
    }
    index?: number
}

interface OrAlternativeArgumentsNode extends CstNode {
    readonly children: {
        LBrace?: IToken[]
        EscapedString?: IToken[]
        RBrace?: IToken[]
        ArgumentGate?: ArgumentGateNode[]
    }
    index?: number
}

interface OrAlternativeNode extends CstNode {
    readonly children: {
        Backslash?: IToken[]
        OrAlternativeArguments?: OrAlternativeArgumentsNode[]
        Statement?: StatementNode[]
        StatementList?: StatementListNode[]
    }
    index?: number
}

interface OrArgumentsNode extends CstNode {
    readonly children: {
        LBrace?: IToken[]
        EscapedString?: IToken[]
        RBrace?: IToken[]
        ArgumentErr?: ArgumentErrNode[]
        ArgumentMaxLa?: ArgumentMaxLaNode[]
    }
    index?: number
}

interface OrStatementNode extends CstNode {
    readonly children: {
        VBar?: IToken[]
        OrArguments?: OrArgumentsNode[]
        OrAlternative?: OrAlternativeNode[]
    }
    index?: number
}

interface SkipStatementNode extends CstNode {
    readonly children: {
        Minus?: IToken[]
        Identifier?: IToken[]
    }
    index?: number
}

interface SubruleArgumentsNode extends CstNode {
    readonly children: {
        LBrace?: IToken[]
        EscapedString?: IToken[]
        RBrace?: IToken[]
        ArgumentLabel?: ArgumentLabelNode[]
    }
    index?: number
}

interface SubruleStatementNode extends CstNode {
    readonly children: {
        Asterisk?: IToken[]
        Identifier?: IToken[]
        SubruleArguments?: SubruleArgumentsNode[]
    }
    index?: number
}

interface StatementNode extends CstNode {
    readonly children: {
        EscapedString?: IToken[]
        AtLeastOneStatement?: AtLeastOneStatementNode[]
        ConsumeStatement?: ConsumeStatementNode[]
        ManyStatement?: ManyStatementNode[]
        OptionStatement?: OptionStatementNode[]
        OrStatement?: OrStatementNode[]
        SkipStatement?: SkipStatementNode[]
        SubruleStatement?: SubruleStatementNode[]
    }
    index?: number
}

interface StatementListNode extends CstNode {
    readonly children: {
        LCurly?: IToken[]
        RCurly?: IToken[]
        Statement?: StatementNode[]
    }
    index?: number
}

interface RuleArgumentsNode extends CstNode {
    readonly children: {
        LBrace?: IToken[]
        EscapedString?: IToken[]
        RBrace?: IToken[]
    }
    index?: number
}

interface RuleStatementNode extends CstNode {
    readonly children: {
        Equals?: IToken[]
        Identifier?: IToken[]
        RuleArguments?: RuleArgumentsNode[]
        StatementList?: StatementListNode[]
    }
    index?: number
}

interface RootStatementNode extends CstNode {
    readonly children: {
        EscapedString?: IToken[]
        RuleStatement?: RuleStatementNode[]
    }
    index?: number
}

interface RootNode extends CstNode {
    readonly children: {
        RootStatement?: RootStatementNode[]
    }
    index?: number
}