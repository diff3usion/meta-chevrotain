/**
 * This file is hand-written
 */

import { CstNode, IToken } from "chevrotain";
import { ArgumentSepNode, ArgumentErrNode, ArgumentMaxLaNode, BacktrackPredicateNode, ArgumentGateNode, ArgumentLabelNode, AtLeastOneStatementNode, ConsumeStatementNode, ManyStatementNode, OptionStatementNode, OrAlternativeNode, OrStatementNode, SkipStatementNode, SubruleStatementNode, StatementNode, StatementListNode, RuleStatementNode, RootStatementNode, RootNode, SubruleArgumentsNode, ManyArgumentsNode, AtLeastOneArgumentsNode, OrArgumentsNode, RuleArgumentsNode, OptionArgumentsNode, ConsumeArgumentsNode, OrAlternativeArgumentsNode } from "./typing";

export type CodeSegment = {
    node: CstNode
    segments?: CodeSegment[]
    str?: string
}

interface CstNodeWithChildren<T extends {
    [identifier: string]: (IToken | CstNode)[] | undefined
}> extends CstNode {
    readonly children: T
}

type ArgumentsNode = CstNodeWithChildren<{
    ArgumentSep?: ArgumentSepNode[]
    ArgumentErr?: ArgumentErrNode[]
    ArgumentMaxLa?: ArgumentMaxLaNode[]
    ArgumentGate?: ArgumentGateNode[]
    ArgumentLabel?: ArgumentLabelNode[]
}>

type ArgumentedStatementNode = CstNodeWithChildren<{
    AtLeastOneArguments?: AtLeastOneArgumentsNode[]
    OrArguments?: OrArgumentsNode[]
    ManyArguments?: ManyArgumentsNode[]
    RuleArguments?: RuleArgumentsNode[]
    OptionArguments?: OptionArgumentsNode[]
    SubruleArguments?: SubruleArgumentsNode[]
    ConsumeArguments?: ConsumeArgumentsNode[]
    OrAlternativeArguments?: OrAlternativeArgumentsNode[]
}>

const assertDefined: (value: unknown, msg?: string) => asserts value
    = (value, msg) => {
        if (value === undefined)
            throw new Error(`Unexpected undefined value when analyzing CST${msg ? `: ${msg}` : ''}`);
    }

const assertNonEmptyIfDefined: (value: any[] | undefined, msg?: string) => asserts value
    = (value, msg) => {
        if (value)
            assertDefined(value[0], msg)
    }

const assertNonEmpty: (value: any[] | undefined, msg?: string) => asserts value
    = (value, msg) => assertDefined(value && value[0], msg)

const assertValidArguments: (node: ArgumentedStatementNode) => void
    = node => {
        const { AtLeastOneArguments, ManyArguments } = node.children
        if (AtLeastOneArguments) {
            const { ArgumentGate, ArgumentSep } = AtLeastOneArguments[0].children
            if (ArgumentGate && ArgumentSep)
                throw new Error(`${JSON.stringify(node.location)} AtLeastOneArgumentsNode cannot have gate and sep at same time`)
        }
        if (ManyArguments) {
            const { ArgumentGate, ArgumentSep } = ManyArguments[0].children
            if (ArgumentGate && ArgumentSep)
                throw new Error(`${JSON.stringify(node.location)} ManyArgumentsNode cannot have gate and sep at same time`)
        }
    }

const assertNonEmptyChildren: (node: CstNode) => void
    = node => Object.values(node.children).forEach(child => assertNonEmptyIfDefined(child))

const buildEscapedString: (EscapedString: IToken) => string
    = EscapedString => EscapedString.image.slice(1, -1)

const buildArguments: (node: ArgumentsNode) => CodeSegment
    = (node) => {
        const { ArgumentSep, ArgumentErr, ArgumentMaxLa, ArgumentGate, ArgumentLabel } = node.children
        assertNonEmptyChildren(node)
        const segments: CodeSegment[] = []
        const pushArgSeg = (seg: CodeSegment) => segments.push({ node, str: ',' }, seg)
        if (ArgumentSep) pushArgSeg(buildArgumentSep(ArgumentSep[0]))
        if (ArgumentErr) pushArgSeg(buildArgumentErr(ArgumentErr[0]))
        if (ArgumentMaxLa) pushArgSeg(buildArgumentMaxLookAhead(ArgumentMaxLa[0]))
        if (ArgumentGate) pushArgSeg(buildArgumentGate(ArgumentGate[0]))
        if (ArgumentLabel) pushArgSeg(buildArgumentLabel(ArgumentLabel[0]))
        return { node, segments }
    }

const buildOptionalArguments: (argumentsNode?: ArgumentsNode[]) => CodeSegment[]
    = (argumentsNode) => argumentsNode ? [buildArguments(argumentsNode[0])] : []

const extractContent: (node: CstNodeWithChildren<{ Statement?: StatementNode[], StatementList?: StatementListNode[] }>) => CodeSegment
    = node => {
        const { Statement, StatementList } = node.children
        if (StatementList) {
            assertDefined(StatementList[0], JSON.stringify(node.location))
            return buildStatementList(StatementList[0])
        } else {
            assertDefined(Statement && Statement[0], JSON.stringify(node.location))
            return buildStatementAsBlock(Statement[0])
        }
    }

const extractEscapedString: (node: CstNodeWithChildren<{ EscapedString?: IToken[] }>) => CodeSegment
    = node => {
        const { EscapedString } = node.children
        assertNonEmpty(EscapedString)
        return { node, str: buildEscapedString(EscapedString[0]) }
    }

const extractIdentifier: (node: CstNodeWithChildren<{ Identifier?: IToken[] }>) => CodeSegment
    = node => {
        const { Identifier } = node.children
        assertNonEmpty(Identifier)
        return { node, str: Identifier[0].image }
    }

const extractPropertyIdentifier: (node: CstNodeWithChildren<{ Identifier?: IToken[] }>) => CodeSegment[]
    = node => {
        const { Identifier } = node.children
        assertNonEmpty(Identifier)
        return [
            { node, str: 'this.' },
            { node, str: Identifier[0].image },
        ]
    }

const getIndexStr: (node: { index?: number }, def?: string) => string
    = ({ index }, def = '') => index ? `${index}` : def

const makeSegments: (node: CstNode, content: (CodeSegment | string)[]) => CodeSegment[]
    = (node, content) => content.map(s => typeof s === 'string' ? { node, str: s } : s)

//#region Arguments
const buildArgumentSep: (node: ArgumentSepNode) => CodeSegment
    = node => {
        const segments = makeSegments(node, [
            'SEP: ',
            extractIdentifier(node)
        ])
        return { node, segments }
    }

const buildArgumentErr: (node: ArgumentErrNode) => CodeSegment
    = node => {
        const segments = makeSegments(node, [
            'ERR_MSG: ',
            extractEscapedString(node),
        ])
        return { node, segments }
    }

const buildArgumentMaxLookAhead: (node: ArgumentMaxLaNode) => CodeSegment
    = node => {
        const segments = makeSegments(node, [
            'MAX_LOOKAHEAD: ',
            extractEscapedString(node),
        ])
        return { node, segments }
    }

const buildArgumentGate: (node: ArgumentGateNode) => CodeSegment
    = node => {
        const { BacktrackPredicate } = node.children
        assertNonEmptyIfDefined(BacktrackPredicate)
        const segments = makeSegments(node, [
            'GATE: ',
            BacktrackPredicate ? buildBacktrackPredicate(BacktrackPredicate[0]) : extractEscapedString(node),
        ])
        return { node, segments }
    }

const buildArgumentLabel: (node: ArgumentLabelNode) => CodeSegment
    = node => {
        const segments = makeSegments(node, [
            'LABEL: ',
            extractEscapedString(node),
        ])
        return { node, segments }
    }
//#endregion

//#region BacktrackPredicate
const buildBacktrackPredicate: (node: BacktrackPredicateNode) => CodeSegment
    = node => {
        const { Identifier } = node.children
        const segments = makeSegments(node, [
            'this.', 'BACKTRACK', '(',
            ...Identifier ? extractPropertyIdentifier(node) : [extractContent(node)],
            ')',
        ])
        return { node, segments }
    }
//#endregion

//#region AtLeastOne
const getAtLeastOneFunctionName: (node: AtLeastOneStatementNode) => string
    = node => {
        const { AtLeastOneArguments } = node.children
        const isSepVariant = AtLeastOneArguments && AtLeastOneArguments[0] && AtLeastOneArguments[0].children.ArgumentSep
        return isSepVariant ? 'AT_LEAST_ONE_SEP' : 'AT_LEAST_ONE'
    }

const buildAtLeastOneStatement: (node: AtLeastOneStatementNode) => CodeSegment
    = node => {
        const { AtLeastOneArguments } = node.children
        assertNonEmptyIfDefined(AtLeastOneArguments)
        assertValidArguments(node)
        const segments = makeSegments(node, [
            'this.', getAtLeastOneFunctionName(node), getIndexStr(node), '({ DEF: ',
            extractContent(node),
            ...buildOptionalArguments(AtLeastOneArguments),
            ' })',
        ])
        return { node, segments }
    }
//#endregion

//#region Consume
const buildConsumeStatement: (node: ConsumeStatementNode) => CodeSegment
    = node => {
        const { ConsumeArguments, Identifier } = node.children
        assertNonEmpty(Identifier)
        assertNonEmptyIfDefined(ConsumeArguments)
        const segments = makeSegments(node, [
            'this.', 'consume', '(', getIndexStr(node, '0'), ', ',
            extractIdentifier(node),
            ...buildOptionalArguments(ConsumeArguments),
            ')',
        ])
        return { node, segments }
    }
//#endregion

//#region Many
const getManyFunctionName: (node: ManyStatementNode) => string
    = node => {
        const { ManyArguments } = node.children
        const isSepVariant = ManyArguments && ManyArguments[0] && ManyArguments[0].children.ArgumentSep
        return isSepVariant ? 'MANY_SEP' : 'MANY'
    }

const buildManyStatement: (node: ManyStatementNode) => CodeSegment
    = node => {
        const { ManyArguments } = node.children
        assertValidArguments(node)
        const segments = makeSegments(node, [
            'this.', getManyFunctionName(node), getIndexStr(node), '({ DEF: ',
            extractContent(node),
            ...buildOptionalArguments(ManyArguments),
            ' })',
        ])
        return { node, segments }
    }
//#endregion

//#region Option
const buildOptionStatement: (node: OptionStatementNode) => CodeSegment
    = node => {
        const { OptionArguments } = node.children
        assertNonEmptyIfDefined(OptionArguments)
        const segments = makeSegments(node, [
            'this.', 'option', '(', getIndexStr(node, '0'), ', ',
            ...OptionArguments ? [
                '{ DEF: ',
                extractContent(node),
                buildArguments(OptionArguments[0]),
                ' }',
            ] : [
                extractContent(node),
            ],
            ')',
        ])
        return { node, segments }
    }
//#endregion

//#region OrAlternative
const buildOrAlternative: (node: OrAlternativeNode) => CodeSegment
    = node => {
        const { OrAlternativeArguments } = node.children
        assertNonEmptyIfDefined(OrAlternativeArguments)
        const segments = makeSegments(node, [
            '{ ALT: ',
            extractContent(node),
            ...buildOptionalArguments(OrAlternativeArguments),
            ' }',
        ])
        return { node, segments }
    }
//#endregion

//#region Or
const buildOrStatement: (node: OrStatementNode) => CodeSegment
    = node => {
        const { OrArguments, OrAlternative } = node.children
        assertNonEmptyIfDefined(OrArguments)
        assertNonEmpty(OrAlternative)
        const buildOrContent = () => OrAlternative
            .map(a => buildOrAlternative(a))
            .flatMap(seg => [seg, { node, str: ', ' }])
        const segments = makeSegments(node, [
            'this.', 'or', '(', getIndexStr(node, '0'), ', [',
            ...OrArguments ? [
                '{ DEF: ',
                ...buildOrContent(),
                buildArguments(OrArguments[0]),
                ' }',
            ] : buildOrContent(),
            ' ])',
        ])
        return { node, segments }
    }
//#endregion

//#region Skip
const buildSkipStatement: (node: SkipStatementNode) => CodeSegment
    = node => {
        const segments = makeSegments(node, [
            'this.', 'SKIP', '(',
            extractIdentifier(node),
            ')',
        ])
        return { node, segments }
    }
//#endregion

//#region Subrule
const buildSubruleStatement: (node: SubruleStatementNode) => CodeSegment
    = node => {
        const { SubruleArguments } = node.children
        const segments = makeSegments(node, [
            'this.', 'subrule', '(', getIndexStr(node, '0'), ',',
            ...extractPropertyIdentifier(node),
            ...buildOptionalArguments(SubruleArguments),
            ')',
        ])
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
        assertNonEmptyChildren(node)

        if (AtLeastOneStatement) {
            return buildAtLeastOneStatement(AtLeastOneStatement[0])
        } else if (ConsumeStatement) {
            return buildConsumeStatement(ConsumeStatement[0])
        } else if (ManyStatement) {
            return buildManyStatement(ManyStatement[0])
        } else if (OptionStatement) {
            return buildOptionStatement(OptionStatement[0])
        } else if (OrStatement) {
            return buildOrStatement(OrStatement[0])
        } else if (SkipStatement) {
            return buildSkipStatement(SkipStatement[0])
        } else if (SubruleStatement) {
            return buildSubruleStatement(SubruleStatement[0])
        } else {
            assertNonEmpty(EscapedString)
            return extractEscapedString(node)
        }
    }

const buildStatementAsBlock: (node: StatementNode) => CodeSegment
    = node => {
        const segments = makeSegments(node, [
            '() => ',
            buildStatement(node),
        ])
        return { node, segments }
    }

const buildStatementList: (node: StatementListNode) => CodeSegment
    = node => {
        const { Statement } = node.children
        assertDefined(Statement)
        const segments = makeSegments(node, [
            '() => {',
            ...Statement.flatMap(s => [buildStatement(s), { node, str: ';' }]),
            '}',
        ])
        return { node, segments }
    }

const buildRuleStatement: (node: RuleStatementNode) => CodeSegment
    = node => {
        const { Identifier, StatementList, Equals } = node.children
        assertNonEmpty(Identifier)
        assertDefined(StatementList)
        const isPublic = Equals && Equals[0]
        const descriptor = isPublic ? 'public ' : 'private '
        const ruleName = Identifier[0].image
        const segments = makeSegments(node, [
            descriptor, ruleName, ' = ', 'this.', 'RULE', '("', ruleName, '", ',
            buildStatementList(StatementList[0]),
            ');',
        ])
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
        assertNonEmpty(RootStatement)
        const segments = RootStatement.map(buildRootStatement)
        return { node, segments }
    }
