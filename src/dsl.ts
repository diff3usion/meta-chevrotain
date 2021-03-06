import { CstElement, CstNode, ILexingResult, IParserConfig, IRecognitionException } from 'chevrotain'
import { js_beautify } from 'js-beautify'

import { ConsumeStatementNode, SubruleStatementNode, StatementNode, RuleStatementNode, RootNode } from './typing';
import { MetaParser } from './parser';
import { lexer, tokens } from './lexer';
import { buildRoot, CodeSegment } from './interpreter'

const parserImportLine = `import { CstParser, IParserConfig, TokenVocabulary } from 'chevrotain'\n`
const typingImportLine = `import { CstNode, IToken } from 'chevrotain'\n`

export type MetaChevrotainConfig = {
    useJs: boolean
    useModule: boolean
    lexerImportPath?: string
    extraNodeProperties?: { [key: string]: string }
}

const mapGetOrDef: <T, F>(map: Map<T, F>, key: T, def: F) => F = (map, key, def) => {
    if (map.has(key)) return map.get(key)!
    map.set(key, def)
    return def
}

function visitAll<T extends CstElement>(start: CstNode, nodeName: string, action: (s: T) => void, skipNodes?: Set<string>) {
    if (!start) return
    Object.entries(start.children).forEach(([elementsName, elements]) => {
        if (elementsName === nodeName)
            (elements as T[]).forEach(action)
        if (!skipNodes?.has(elementsName) && elements && elements[0] && (elements[0] as CstNode).children)
            (elements as CstNode[]).forEach(n => visitAll(n, nodeName, action))
    })
}

function ruleInterfaceTemplate(name: string, childrenLines: string, extraItemLines: string) {
    return `
interface ${name} extends CstNode {
    readonly children: {
        ${childrenLines}
    }${extraItemLines}
}`
}

function buildRuleType(r: RuleStatementNode, config: MetaChevrotainConfig): string | undefined {
    if (!r || !r.children.Identifier || !r.children.Identifier[0])
        return
    const typeName = (id: string) => `${id}Node`
    const ruleTypeName = typeName(r.children.Identifier[0].image)
    const tokenNames = new Set<string>()
    const nodeNames = new Set<string>()
    visitAll(r, "ConsumeStatement", (c: ConsumeStatementNode) => {
        if (c.children.Identifier && c.children.Identifier[0])
            tokenNames.add(c.children.Identifier[0].image)
    }, new Set("BacktrackPredicate"))
    visitAll(r, "SubruleStatement", (s: SubruleStatementNode) => {
        if (s.children.Identifier && s.children.Identifier[0])
            nodeNames.add(s.children.Identifier[0].image)
    }, new Set("BacktrackPredicate"))
    const childrenItems = [
        ...Array(...tokenNames).map(name => `${name}?: IToken[]`),
        ...Array(...nodeNames).map(name => `${name}?: ${typeName(name)}[]`),
    ]
    const childrenLines = childrenItems.join('\n        ')
    const extraPropertyLines = config.extraNodeProperties
        ? '\n    ' + Object.entries(config.extraNodeProperties)
            .map(([key, valueType]) => `${key}?: ${valueType}`)
            .join('\n    ')
        : ''
    return ruleInterfaceTemplate(ruleTypeName, childrenLines, extraPropertyLines)
}

function indexRule(r: RuleStatementNode): void {
    const counter = new Map<string, number>()
    const indexSpecificStatement: (node: { index?: number }[], key: string) => void
        = (node, key) => {
            if (!node[0]) return
            node[0].index = mapGetOrDef(counter, key, 0)
            counter.set(key, counter.get(key)! + 1)
        }
    const indexStatement: (s: StatementNode) => void
        = s => {
            const atLeastOne = s.children.AtLeastOneStatement
            const consume = s.children.ConsumeStatement
            const many = s.children.ManyStatement
            const option = s.children.OptionStatement
            const or = s.children.OrStatement
            const subrule = s.children.SubruleStatement
            if (atLeastOne) {
                indexSpecificStatement(atLeastOne, "atLeastOne")
            } else if (consume) {
                indexSpecificStatement(consume, "consume")
            } else if (many) {
                indexSpecificStatement(many, "many")
            } else if (option) {
                indexSpecificStatement(option, "option")
            } else if (or) {
                indexSpecificStatement(or, "or")
            } else if (subrule) {
                indexSpecificStatement(subrule, "subrule")
            }
        }
    visitAll(r, "Statement", indexStatement)
}

function prebuildIndexes(node: RootNode): void {
    const rootStatements = node.children.RootStatement
    if (!rootStatements || !rootStatements[0]) return
    const rules = rootStatements
        .filter(s => s.children.RuleStatement && s.children.RuleStatement[0])
        .map(rs => rs.children.RuleStatement![0]!)
    if (!rules || !rules[0]) return
    rules.forEach(indexRule)
}

function buildTypes(node: RootNode, config: MetaChevrotainConfig): string {
    const rootStatements = node.children.RootStatement
    if (!rootStatements || !rootStatements[0]) return ''
    const rules = rootStatements
        .filter(s => s.children.RuleStatement && s.children.RuleStatement[0])
        .map(rs => rs.children.RuleStatement![0]!)
    if (!rules || !rules[0]) return ''
    return rules.map(r => buildRuleType(r, config)).join('\n')
}

export type ParseResult = {
    cst: RootNode,
    lexResult: ILexingResult
    parseErrors: IRecognitionException[]
}

export function lexAndParse(text: string): ParseResult {
    const lexResult = lexer.tokenize(text)
    const parser = new MetaParser(tokens, {
        recoveryEnabled: true,
        nodeLocationTracking: "full",
    })
    // setting a new input will RESET the parser instance's state.
    parser.input = lexResult.tokens
    // any top level rule may be used as an entry point
    const cst = parser.Root();

    return {
        cst: cst,
        lexResult: lexResult,
        parseErrors: parser.errors
    }
}

function concatSegments({ str, segments }: CodeSegment): string {
    return str ? str : segments ? segments.map(concatSegments).join('') : ''
}

const generatedFileHeadComment = `
/**
  * This file is generated with meta-chevrotain
  */

`

function wrapInParserClass(content: string, config: MetaChevrotainConfig) {
    const { useJs, useModule } = config
    const constructorArgs = useJs
        ? 'tokenVocabulary, config'
        : 'tokenVocabulary: TokenVocabulary, config?: IParserConfig'
    return `${useModule ? 'export ' : ''}class MetaParser extends CstParser {
    constructor(${constructorArgs}) {
        super(tokenVocabulary, config)
        this.performSelfAnalysis();
    }
    ${content}
}
`
}

function allLexerTokens(root: RootNode) {
    const visited = new Set<string>()
    visitAll(root, "ConsumeStatement", ({ children: { Identifier } }: ConsumeStatementNode) => {
        if (Identifier && Identifier[0]) {
            visited.add(Identifier[0].image)
        }
    })
    return Array.from(visited).sort()
}

function parserImports(root: RootNode, config: MetaChevrotainConfig) {
    const lexerImportLine = config.lexerImportPath
        ? `import { ${allLexerTokens(root).join(', ')} } from '${config.lexerImportPath}'\n`
        : ''
    return parserImportLine + lexerImportLine
}

export function parserFileContent(root: RootNode, config: MetaChevrotainConfig): string {
    prebuildIndexes(root)
    const ruleProperties = concatSegments(buildRoot(root, config))
    const parserClass = wrapInParserClass(ruleProperties, config)
    return generatedFileHeadComment + (config.useModule ? parserImports(root, config) : '') + js_beautify(parserClass)
}

export function typingFileContent(root: RootNode, config: MetaChevrotainConfig): string {
    return generatedFileHeadComment + (config.useModule ? typingImportLine : '') + buildTypes(root, config)
}
