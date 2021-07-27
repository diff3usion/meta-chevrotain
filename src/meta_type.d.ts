/**
  * This file is generated with meta-chevrotain
  */
import { IToken } from 'chevrotain'

interface ArgumentSepNode {
    name: string
    children: {
        Semicolon?: IToken[]
        Identifier?: IToken[]
    }
    index?: number
}

interface BacktrackPredicateNode {
    name: string
    children: {
        LAngle?: IToken[]
        Identifier?: IToken[]
        Statement?: StatementNode[]
        StatementList?: StatementListNode[]
    }
    index?: number
}

interface ArgumentGateNode {
    name: string
    children: {
        RAngle?: IToken[]
        EscapedString?: IToken[]
        BacktrackPredicate?: BacktrackPredicateNode[]
    }
    index?: number
}

interface ArgumentErrNode {
    name: string
    children: {
        Exclamation?: IToken[]
        EscapedString?: IToken[]
    }
    index?: number
}

interface ArgumentMaxLaNode {
    name: string
    children: {
        Caret?: IToken[]
        EscapedString?: IToken[]
    }
    index?: number
}

interface ArgumentLabelNode {
    name: string
    children: {
        At?: IToken[]
        EscapedString?: IToken[]
    }
    index?: number
}

interface AtLeastOneArgumentsNode {
    name: string
    children: {
        LBrace?: IToken[]
        RBrace?: IToken[]
        ArgumentSep?: ArgumentSepNode[]
        ArgumentGate?: ArgumentGateNode[]
        ArgumentErr?: ArgumentErrNode[]
        ArgumentMaxLa?: ArgumentMaxLaNode[]
    }
    index?: number
}

interface AtLeastOneStatementNode {
    name: string
    children: {
        OnePlus?: IToken[]
        AtLeastOneArguments?: AtLeastOneArgumentsNode[]
        Statement?: StatementNode[]
        StatementList?: StatementListNode[]
    }
    index?: number
}

interface ConsumeArgumentsNode {
    name: string
    children: {
        LBrace?: IToken[]
        RBrace?: IToken[]
        ArgumentErr?: ArgumentErrNode[]
        ArgumentLabel?: ArgumentLabelNode[]
    }
    index?: number
}

interface ConsumeStatementNode {
    name: string
    children: {
        Underscore?: IToken[]
        Identifier?: IToken[]
        ConsumeArguments?: ConsumeArgumentsNode[]
    }
    index?: number
}

interface ManyArgumentsNode {
    name: string
    children: {
        LBrace?: IToken[]
        RBrace?: IToken[]
        ArgumentSep?: ArgumentSepNode[]
        ArgumentGate?: ArgumentGateNode[]
        ArgumentMaxLa?: ArgumentMaxLaNode[]
    }
    index?: number
}

interface ManyStatementNode {
    name: string
    children: {
        ZeroPlus?: IToken[]
        ManyArguments?: ManyArgumentsNode[]
        Statement?: StatementNode[]
        StatementList?: StatementListNode[]
    }
    index?: number
}

interface OptionArgumentsNode {
    name: string
    children: {
        LBrace?: IToken[]
        RBrace?: IToken[]
        ArgumentGate?: ArgumentGateNode[]
        ArgumentMaxLa?: ArgumentMaxLaNode[]
    }
    index?: number
}

interface OptionStatementNode {
    name: string
    children: {
        Question?: IToken[]
        OptionArguments?: OptionArgumentsNode[]
        Statement?: StatementNode[]
        StatementList?: StatementListNode[]
    }
    index?: number
}

interface OrAlternativeArgumentsNode {
    name: string
    children: {
        LBrace?: IToken[]
        EscapedString?: IToken[]
        RBrace?: IToken[]
        ArgumentGate?: ArgumentGateNode[]
    }
    index?: number
}

interface OrAlternativeNode {
    name: string
    children: {
        Backslash?: IToken[]
        OrAlternativeArguments?: OrAlternativeArgumentsNode[]
        Statement?: StatementNode[]
        StatementList?: StatementListNode[]
    }
    index?: number
}

interface OrArgumentsNode {
    name: string
    children: {
        LBrace?: IToken[]
        EscapedString?: IToken[]
        RBrace?: IToken[]
        ArgumentErr?: ArgumentErrNode[]
        ArgumentMaxLa?: ArgumentMaxLaNode[]
    }
    index?: number
}

interface OrStatementNode {
    name: string
    children: {
        VBar?: IToken[]
        OrArguments?: OrArgumentsNode[]
        OrAlternative?: OrAlternativeNode[]
    }
    index?: number
}

interface SkipStatementNode {
    name: string
    children: {
        Minus?: IToken[]
        Identifier?: IToken[]
    }
    index?: number
}

interface SubruleArgumentsNode {
    name: string
    children: {
        LBrace?: IToken[]
        EscapedString?: IToken[]
        RBrace?: IToken[]
        ArgumentLabel?: ArgumentLabelNode[]
    }
    index?: number
}

interface SubruleStatementNode {
    name: string
    children: {
        Asterisk?: IToken[]
        Identifier?: IToken[]
        SubruleArguments?: SubruleArgumentsNode[]
    }
    index?: number
}

interface StatementNode {
    name: string
    children: {
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

interface StatementListNode {
    name: string
    children: {
        LCurly?: IToken[]
        RCurly?: IToken[]
        Statement?: StatementNode[]
    }
    index?: number
}

interface RuleArgumentsNode {
    name: string
    children: {
        LBrace?: IToken[]
        EscapedString?: IToken[]
        RBrace?: IToken[]
    }
    index?: number
}

interface RuleStatementNode {
    name: string
    children: {
        Equals?: IToken[]
        Identifier?: IToken[]
        RuleArguments?: RuleArgumentsNode[]
        StatementList?: StatementListNode[]
    }
    index?: number
}

interface RootStatementNode {
    name: string
    children: {
        EscapedString?: IToken[]
        RuleStatement?: RuleStatementNode[]
    }
    index?: number
}

interface RootNode {
    name: string
    children: {
        RootStatement?: RootStatementNode[]
    }
    index?: number
}