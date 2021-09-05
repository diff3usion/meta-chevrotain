/**
 * This file is hand-written
 */

import { CstNode, IToken } from "chevrotain";
import { ArgumentSepNode, ArgumentErrNode, ArgumentMaxLaNode, BacktrackPredicateNode, ArgumentGateNode, ArgumentLabelNode, AtLeastOneStatementNode, ConsumeStatementNode, ManyStatementNode, OptionStatementNode, OrAlternativeNode, OrStatementNode, SkipStatementNode, SubruleStatementNode, StatementNode, StatementListNode, RuleStatementNode, RootStatementNode, RootNode, OptionArgumentsNode, AtLeastOneArgumentsNode, ConsumeArgumentsNode, ManyArgumentsNode, OrAlternativeArgumentsNode, OrArgumentsNode, SubruleArgumentsNode } from "./type";

export type CodeSegment = {
    node: CstNode
    segments?: CodeSegment[]
    str?: string
}

function assertDefined(value: unknown, msg?: string): asserts value {
    if (value === undefined)
        throw new Error(`Unexpected undefined occurs${msg ? `: ${msg}` : ''}`);
}

function assertNonEmpty(value: any[] | undefined, msg?: string): asserts value {
    assertDefined(value && value[0], msg)
}

const buildEscapedString: (escaped: IToken) => string
    = escaped => escaped.image.slice(1, -1)

interface ArgumentsNode {
    name: string
    children: {
        ArgumentSep?: ArgumentSepNode[]
        ArgumentErr?: ArgumentErrNode[]
        ArgumentMaxLa?: ArgumentMaxLaNode[]
        ArgumentGate?: ArgumentGateNode[]
        ArgumentLabel?: ArgumentLabelNode[]
    }
    index?: number
}

const buildArguments: (node: ArgumentsNode) => CodeSegment
    = (node) => {
        const { ArgumentSep, ArgumentErr, ArgumentMaxLa, ArgumentGate, ArgumentLabel } = node.children

        const segments: CodeSegment[] = []
        if (ArgumentSep) {
            assertDefined(ArgumentSep[0])
            segments.push(
                { node, str: ',' },
                buildArgumentSep(ArgumentSep[0]),
            )
        }
        if (ArgumentErr) {
            assertDefined(ArgumentErr[0])
            segments.push(
                { node, str: ',' },
                buildArgumentErr(ArgumentErr[0]),
            )
        }
        if (ArgumentMaxLa) {
            assertDefined(ArgumentMaxLa[0])
            segments.push(
                { node, str: ',' },
                buildArgumentMaxLookAhead(ArgumentMaxLa[0]),
            )
        }
        if (ArgumentGate) {
            assertDefined(ArgumentGate[0])
            segments.push(
                { node, str: ',' },
                buildArgumentGate(ArgumentGate[0]),
            )
        }
        if (ArgumentLabel) {
            assertDefined(ArgumentLabel[0])
            segments.push(
                { node, str: ',' },
                buildArgumentLabel(ArgumentLabel[0]),
            )
        }

        return { node, segments }
    }

interface ContentNode {
    name: string
    children: {
        Statement?: StatementNode[]
        StatementList?: StatementListNode[]
    }
    index?: number
}
const buildContent = (node: ContentNode) => {
    const { Statement, StatementList } = node.children
    if (StatementList) {
        assertDefined(StatementList[0])
        return buildStatementList(StatementList[0])
    } else {
        assertDefined(Statement && Statement[0])
        return buildStatementAsBlock(Statement[0])
    }
}

//#region Arguments
const buildArgumentSep: (node: ArgumentSepNode) => CodeSegment
    = node => {
        const { Identifier } = node.children
        assertNonEmpty(Identifier)
        const prefix = 'SEP: '

        const segments: CodeSegment[] = [
            { node, str: prefix },
            { node, str: Identifier[0].image },
        ]
        return { node, segments }
    }

const buildArgumentErr: (node: ArgumentErrNode) => CodeSegment
    = node => {
        const { EscapedString } = node.children
        assertNonEmpty(EscapedString)
        const prefix = 'ERR_MSG: '

        const segments: CodeSegment[] = [
            { node, str: prefix },
            { node, str: buildEscapedString(EscapedString[0]) },
        ]
        return { node, segments }
    }

const buildArgumentMaxLookAhead: (node: ArgumentMaxLaNode) => CodeSegment
    = node => {
        const { EscapedString } = node.children
        assertNonEmpty(EscapedString)
        const prefix = 'MAX_LOOKAHEAD: '

        const segments: CodeSegment[] = [
            { node, str: prefix },
            { node, str: buildEscapedString(EscapedString[0]) },
        ]
        return { node, segments }
    }

const buildArgumentGate: (node: ArgumentGateNode) => CodeSegment
    = node => {
        const { BacktrackPredicate, EscapedString } = node.children
        const prefix = 'GATE: '
        const segments: CodeSegment[] = [
            { node, str: prefix }
        ]

        if (BacktrackPredicate) {
            assertDefined(BacktrackPredicate[0])
            segments.push(buildBacktrackPredicate(BacktrackPredicate[0]))
        } else {
            assertNonEmpty(EscapedString)
            segments.push({ node, str: buildEscapedString(EscapedString[0]) })
        }

        return { node, segments }
    }

const buildArgumentLabel: (node: ArgumentLabelNode) => CodeSegment
    = node => {
        const prefix = 'LABEL: '
        const escaped = node.children.EscapedString
        assertNonEmpty(escaped)

        const segments: CodeSegment[] = [
            { node, str: prefix },
            { node, str: buildEscapedString(escaped[0]) },
        ]
        return { node, segments }
    }
//#endregion

//#region BacktrackPredicate
const buildBacktrackPredicate: (node: BacktrackPredicateNode) => CodeSegment
    = node => {
        const { Identifier, Statement, StatementList } = node.children
        const [prefix, suffix] = ['this.BACKTRACK(', ')']

        if (Identifier) {
            assertDefined(Identifier[0])
            const segments: CodeSegment[] = [
                { node, str: prefix },
                { node, str: 'this.' },
                { node, str: Identifier[0].image },
                { node, str: suffix },
            ]
            return { node, segments }
        }

        const segments: CodeSegment[] = [{ node, str: prefix }]
        if (StatementList) {
            assertDefined(StatementList[0])
            segments.push(buildStatementList(StatementList[0]))
        } else {
            assertNonEmpty(Statement)
            segments.push(buildStatementAsBlock(Statement[0]))
        }
        segments.push({ node, str: suffix })
        return { node, segments }
    }
//#endregion

//#region AtLeastOne
const buildAtLeastOneStatement: (node: AtLeastOneStatementNode) => CodeSegment
    = node => {
        const { AtLeastOneArguments, Statement, StatementList } = node.children
        const isAtLeastOneVariant = AtLeastOneArguments && AtLeastOneArguments[0] && AtLeastOneArguments[0].children.ArgumentSep
        const functionName = isAtLeastOneVariant ? 'AT_LEAST_ONE_SEP' : 'AT_LEAST_ONE'
        const indexStr = node.index ? `${node.index}` : ''
        const [prefix, suffix] = [`this.${functionName}${indexStr}({ DEF: `, ' })']
        const segments: CodeSegment[] = [
            { node, str: prefix },
            buildContent(node),
        ]

        if (AtLeastOneArguments) {
            assertDefined(AtLeastOneArguments[0])
            const { ArgumentGate, ArgumentSep } = AtLeastOneArguments[0].children
            if (ArgumentGate && ArgumentSep)
                throw new Error("AtLeastOneStatementNode cannot have gate and sep at same time")
            segments.push(buildArguments(AtLeastOneArguments[0]))
        }

        segments.push({ node, str: suffix })
        return { node, segments }
    }
//#endregion

//#region Consume
const buildConsumeStatement: (node: ConsumeStatementNode) => CodeSegment
    = node => {
        const { ConsumeArguments, Identifier } = node.children
        assertNonEmpty(Identifier)
        const [prefix, suffix] = [node.index === undefined ? 'this.CONSUME( ' : `this.consume(${node.index}, `, ')']
        const segments: CodeSegment[] = [
            { node, str: prefix },
            { node, str: Identifier[0].image },
        ]

        if (ConsumeArguments) {
            assertDefined(ConsumeArguments[0])
            segments.push(buildArguments(ConsumeArguments[0]))
        }

        segments.push({ node, str: suffix })
        return { node, segments }
    }
//#endregion

//#region Many
const buildManyStatement: (node: ManyStatementNode) => CodeSegment
    = node => {
        const { ManyArguments, Statement, StatementList } = node.children
        const functionName = ManyArguments && ManyArguments[0] && ManyArguments[0].children.ArgumentSep ? 'MANY_SEP' : 'MANY'
        const indexStr = node.index ? `${node.index}` : ''
        const [prefix, suffix] = [`this.${functionName}${indexStr}({ DEF: `, ' })']
        const segments: CodeSegment[] = [
            { node, str: prefix },
            buildContent(node),
        ]

        if (ManyArguments) {
            assertDefined(ManyArguments[0])
            const { ArgumentGate, ArgumentSep } = ManyArguments[0].children
            if (ArgumentGate && ArgumentSep)
                throw new Error("ManyStatementNode cannot have gate and sep at same time")
            segments.push(buildArguments(ManyArguments[0]))
        }

        segments.push({ node, str: suffix })
        return { node, segments }
    }
//#endregion

//#region Option
const buildOptionStatement: (node: OptionStatementNode) => CodeSegment
    = node => {
        const { OptionArguments, Statement, StatementList } = node.children
        const [prefix, suffix] = [node.index === undefined ? 'this.OPTION( ' : `this.option(${node.index}, `, ')']
        const segments: CodeSegment[] = [
            { node, str: prefix }
        ]

        if (OptionArguments) {
            assertDefined(OptionArguments[0])
            const [argsPrefix, argsSuffix] = ['{ DEF: ', ' }']
            segments.push(
                { node, str: argsPrefix },
                buildContent(node),
                buildArguments(OptionArguments[0]),
                { node, str: argsSuffix },
            )
        } else {
            segments.push(buildContent(node))
        }

        segments.push({ node, str: suffix })
        return { node, segments }
    }
//#endregion

//#region OrAlternative
const buildOrAlternative: (node: OrAlternativeNode) => CodeSegment
    = node => {
        const { OrAlternativeArguments, Statement, StatementList } = node.children
        const [prefix, suffix] = ['{ ALT: ', ' }']
        const segments: CodeSegment[] = [
            { node, str: prefix },
            buildContent(node),
        ]

        if (OrAlternativeArguments) {
            assertDefined(OrAlternativeArguments[0])
            segments.push(buildArguments(OrAlternativeArguments[0]))
        }

        segments.push({ node, str: suffix })
        return { node, segments }
    }
//#endregion

//#region Or
const buildOrStatement: (node: OrStatementNode) => CodeSegment
    = node => {
        const { OrArguments, OrAlternative } = node.children
        const [prefix, suffix] = [node.index === undefined ? 'this.OR([ ' : `this.or(${node.index}, [`, ' ])']
        const segments: CodeSegment[] = [
            { node, str: prefix }
        ]

        const buildOrContent = () => {
            assertNonEmpty(OrAlternative)
            return OrAlternative.map(a => buildOrAlternative(a)).flatMap(seg => [
                seg,
                { node, str: ',' }
            ])
        }

        if (OrArguments) {
            assertDefined(OrArguments[0])
            const [argsPrefix, argsSuffix] = ['{ DEF: ', ' }']
            segments.push(
                { node, str: argsPrefix },
                ...buildOrContent(),
                buildArguments(OrArguments[0]),
                { node: node, str: argsSuffix },
            )
        } else {
            segments.push(...buildOrContent())
        }

        segments.push({ node, str: suffix })
        return { node, segments }
    }
//#endregion

//#region Skip
const buildSkipStatement: (node: SkipStatementNode) => CodeSegment
    = node => {
        const { Identifier } = node.children
        assertNonEmpty(Identifier)
        const [prefix, suffix] = ['this.SKIP(', ')']
        const segments: CodeSegment[] = [
            { node, str: prefix },
            { node, str: Identifier[0].image },
            { node, str: suffix }
        ]

        return { node, segments }
    }
//#endregion

//#region Subrule
const buildSubruleArguments: (node: SubruleArgumentsNode) => CodeSegment
    = node => {
        const { ArgumentLabel } = node.children
        const [prefix, suffix] = ['{', '}']
        const segments: CodeSegment[] = [
            { node, str: prefix },
        ]

        if (ArgumentLabel) {
            assertDefined(ArgumentLabel[0])
            segments.push({ node, str: ',' })
            segments.push(buildArgumentLabel(ArgumentLabel[0]))
        }

        segments.push({ node, str: suffix })
        return { node, segments }
    }
const buildSubruleStatement: (node: SubruleStatementNode) => CodeSegment
    = node => {
        const { SubruleArguments, Identifier } = node.children
        assertNonEmpty(Identifier)
        const [prefix, suffix] = [node.index === undefined ? 'this.SUBRULE( ' : `this.subrule(${node.index}, `, ')']
        const segments: CodeSegment[] = [
            { node, str: prefix },
            { node, str: `this.${Identifier[0].image}` },
        ]

        if (SubruleArguments) {
            assertDefined(SubruleArguments[0])
            segments.push(buildSubruleArguments(SubruleArguments[0]))
        }

        segments.push({ node, str: suffix })
        return { node, segments }
    }
//#endregion

const buildStatement: (node: StatementNode) => CodeSegment
    = node => {
        const {
            AtLeastOneStatement,
            ConsumeStatement,
            ManyStatement,
            OptionStatement,
            OrStatement,
            SkipStatement,
            SubruleStatement,
            EscapedString,
        } = node.children

        if (AtLeastOneStatement) {
            assertDefined(AtLeastOneStatement[0])
            return buildAtLeastOneStatement(AtLeastOneStatement[0])
        } else if (ConsumeStatement) {
            assertDefined(ConsumeStatement[0])
            return buildConsumeStatement(ConsumeStatement[0])
        } else if (ManyStatement) {
            assertDefined(ManyStatement[0])
            return buildManyStatement(ManyStatement[0])
        } else if (OptionStatement) {
            assertDefined(OptionStatement[0])
            return buildOptionStatement(OptionStatement[0])
        } else if (OrStatement) {
            assertDefined(OrStatement[0])
            return buildOrStatement(OrStatement[0])
        } else if (SkipStatement) {
            assertDefined(SkipStatement[0])
            return buildSkipStatement(SkipStatement[0])
        } else if (SubruleStatement) {
            assertDefined(SubruleStatement[0])
            return buildSubruleStatement(SubruleStatement[0])
        } else {
            assertNonEmpty(EscapedString)
            return { node, str: buildEscapedString(EscapedString[0]) }
        }
    }

const buildStatementAsBlock: (node: StatementNode) => CodeSegment
    = node => {
        const prefix = '() => '
        const segments: CodeSegment[] = [
            { node, str: prefix },
            buildStatement(node),
        ]

        return { node, segments }
    }

const buildStatementList: (node: StatementListNode) => CodeSegment
    = node => {
        const { Statement } = node.children
        assertDefined(Statement)
        const [prefix, suffix] = ['() => {', '}']
        const segments: CodeSegment[] = [
            { node, str: prefix },
            ...Statement.flatMap(s => [
                buildStatement(s),
                { node, str: ';' },
            ]),
            { node, str: suffix },
        ]

        return { node, segments }
    }

const buildRuleStatement: (node: RuleStatementNode) => CodeSegment
    = node => {
        const isPublic = node.children.Equals && node.children.Equals[0]
        const { Identifier, StatementList } = node.children
        assertNonEmpty(Identifier)
        assertDefined(StatementList)
        const descriptor = isPublic ? 'public ' : 'private '
        const [prefix, suffix] = [`${descriptor}${Identifier[0].image} = this.RULE("${Identifier[0].image}", `, ')']

        const segments: CodeSegment[] = [
            { node, str: prefix },
            buildStatementList(StatementList[0]),
            { node, str: suffix },
        ]
        return { node, segments }
    }

const buildRootStatement: (node: RootStatementNode) => CodeSegment
    = node => {
        const { RuleStatement, EscapedString } = node.children
        if (RuleStatement) {
            assertDefined(RuleStatement[0])
            return buildRuleStatement(RuleStatement[0])
        } else {
            assertNonEmpty(EscapedString)
            return { node, str: buildEscapedString(EscapedString[0]) }
        }
    }

export const buildRoot: (node: RootNode) => CodeSegment
    = node => {
        const { RootStatement } = node.children
        const segments: CodeSegment[] = RootStatement ?
            RootStatement.flatMap(s => s.children.EscapedString ?
                [buildRootStatement(s)] :
                [buildRootStatement(s), { node, str: ';' }]) :
            []
        return { node, segments }
    }
