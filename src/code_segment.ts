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

function assertDefined(value: unknown, msg?: string): asserts value {
    if (value === undefined)
        throw new Error(`Unexpected undefined value when analyzing CST${msg ? `: ${msg}` : ''}`);
}

function assertNonEmptyIfDefined(value: any[] | undefined, msg?: string): asserts value {
    if (value)
        assertDefined(value[0], msg)
}

function assertNonEmpty(value: any[] | undefined, msg?: string): asserts value {
    assertDefined(value && value[0], msg)
}

function assertValidArguments(node: ArgumentedStatementNode) {
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

function assertNonEmptyChildren(node: CstNode) {
    Object.values(node.children).forEach(child => assertNonEmptyIfDefined(child))
}

function buildEscapedString(EscapedString: IToken): string {
    return EscapedString.image.slice(1, -1)
}

function buildArguments(node: ArgumentsNode): CodeSegment {
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

function buildOptionalArguments(argumentsNode?: ArgumentsNode[]): CodeSegment[] {
    return argumentsNode ? [buildArguments(argumentsNode[0])] : []
}

function extractContent(node: CstNodeWithChildren<{ Statement?: StatementNode[], StatementList?: StatementListNode[] }>): CodeSegment {
    const { Statement, StatementList } = node.children
    if (StatementList) {
        assertDefined(StatementList[0], JSON.stringify(node.location))
        return buildStatementList(StatementList[0])
    } else {
        assertDefined(Statement && Statement[0], JSON.stringify(node.location))
        return buildStatementAsBlock(Statement[0])
    }
}

function extractEscapedString(node: CstNodeWithChildren<{ EscapedString?: IToken[] }>): CodeSegment {
    const { EscapedString } = node.children
    assertNonEmpty(EscapedString)
    return { node, str: buildEscapedString(EscapedString[0]) }
}

function extractIdentifier(node: CstNodeWithChildren<{ Identifier?: IToken[] }>): CodeSegment {
    const { Identifier } = node.children
    assertNonEmpty(Identifier)
    return { node, str: Identifier[0].image }
}

function extractPropertyIdentifier(node: CstNodeWithChildren<{ Identifier?: IToken[] }>): CodeSegment[] {
    const { Identifier } = node.children
    assertNonEmpty(Identifier)
    return [
        { node, str: 'this.' },
        { node, str: Identifier[0].image },
    ]
}

function getIndexStr({ index }: { index?: number }, def: string = ''): string {
    return index ? `${index}` : def
}

function makeSegments(node: CstNode, content: (CodeSegment | string)[]): CodeSegment[] {
    return content.map(s => typeof s === 'string' ? { node, str: s } : s)
}

//#region Arguments
function buildArgumentSep(node: ArgumentSepNode): CodeSegment {
    const segments = makeSegments(node, [
        'SEP: ',
        extractIdentifier(node)
    ])
    return { node, segments }
}

function buildArgumentErr(node: ArgumentErrNode): CodeSegment {
    const segments = makeSegments(node, [
        'ERR_MSG: ',
        extractEscapedString(node),
    ])
    return { node, segments }
}

function buildArgumentMaxLookAhead(node: ArgumentMaxLaNode): CodeSegment {
    const segments = makeSegments(node, [
        'MAX_LOOKAHEAD: ',
        extractEscapedString(node),
    ])
    return { node, segments }
}

function buildArgumentGate(node: ArgumentGateNode): CodeSegment {
    const { BacktrackPredicate } = node.children
    assertNonEmptyIfDefined(BacktrackPredicate)
    const segments = makeSegments(node, [
        'GATE: ',
        BacktrackPredicate ? buildBacktrackPredicate(BacktrackPredicate[0]) : extractEscapedString(node),
    ])
    return { node, segments }
}

function buildArgumentLabel(node: ArgumentLabelNode): CodeSegment {
    const segments = makeSegments(node, [
        'LABEL: ',
        extractEscapedString(node),
    ])
    return { node, segments }
}
//#endregion

//#region BacktrackPredicate
function buildBacktrackPredicate(node: BacktrackPredicateNode): CodeSegment {
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
function getAtLeastOneFunctionName(node: AtLeastOneStatementNode): string {
    const { AtLeastOneArguments } = node.children
    const isSepVariant = AtLeastOneArguments && AtLeastOneArguments[0] && AtLeastOneArguments[0].children.ArgumentSep
    return isSepVariant ? 'AT_LEAST_ONE_SEP' : 'AT_LEAST_ONE'
}

function buildAtLeastOneStatement(node: AtLeastOneStatementNode): CodeSegment {
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
function buildConsumeStatement(node: ConsumeStatementNode): CodeSegment {
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
function getManyFunctionName(node: ManyStatementNode): string {
    const { ManyArguments } = node.children
    const isSepVariant = ManyArguments && ManyArguments[0] && ManyArguments[0].children.ArgumentSep
    return isSepVariant ? 'MANY_SEP' : 'MANY'
}

function buildManyStatement(node: ManyStatementNode): CodeSegment {
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
function buildOptionStatement(node: OptionStatementNode): CodeSegment {
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
function buildOrAlternative(node: OrAlternativeNode): CodeSegment {
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
function buildOrStatement(node: OrStatementNode): CodeSegment {
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
function buildSkipStatement(node: SkipStatementNode): CodeSegment {
    const segments = makeSegments(node, [
        'this.', 'SKIP', '(',
        extractIdentifier(node),
        ')',
    ])
    return { node, segments }
}
//#endregion

//#region Subrule
function buildSubruleStatement(node: SubruleStatementNode): CodeSegment {
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

function buildStatement(node: StatementNode): CodeSegment {
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

function buildStatementAsBlock(node: StatementNode): CodeSegment {
    const segments = makeSegments(node, [
        '() => ',
        buildStatement(node),
    ])
    return { node, segments }
}

function buildStatementList(node: StatementListNode): CodeSegment {
    const { Statement } = node.children
    assertDefined(Statement)
    const segments = makeSegments(node, [
        '() => {',
        ...Statement.flatMap(s => [buildStatement(s), { node, str: ';' }]),
        '}',
    ])
    return { node, segments }
}

function buildRuleStatement(node: RuleStatementNode): CodeSegment {
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

function buildRootStatement(node: RootStatementNode): CodeSegment {
    const { RuleStatement, EscapedString } = node.children
    if (RuleStatement) {
        assertDefined(RuleStatement[0])
        return buildRuleStatement(RuleStatement[0])
    } else {
        assertNonEmpty(EscapedString)
        return { node, str: buildEscapedString(EscapedString[0]) }
    }
}

export function buildRoot(node: RootNode): CodeSegment {
    const { RootStatement } = node.children
    assertNonEmpty(RootStatement)
    const segments = RootStatement.map(buildRootStatement)
    return { node, segments }
}
