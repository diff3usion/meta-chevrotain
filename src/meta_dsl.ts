import { CstElement, CstNode, ILexingResult, IRecognitionException } from 'chevrotain'
import { js_beautify } from 'js-beautify'

import { ConsumeStatementNode, SubruleStatementNode, StatementNode, RuleStatementNode, RootNode } from './meta_type';
import { MetaParser } from './meta_parser';
import { lexer, tokens } from './meta_lexer';
import { JsSegmentBuilder } from './meta_js_segment'

export type JsSegment = {
    node        : CstNode
    segments?   : JsSegment[]
    str?        : string
}

const mapGetOrDef: <T, F>(map: Map<T, F>, key: T, def: F) => F = (map, key, def) => {
    if (map.has(key)) return map.get(key)!
    map.set(key, def)
    return def
}

function visitAll<T extends CstElement>(start: CstNode, nodeName: string, action: (s: T) => void, skipNodeName?: string) {
    if (!start) return
    Object.entries(start.children).forEach(([elementsName, elements]) => {
        if (elementsName === nodeName) 
            (elements as T[]).forEach(action)
        if (elementsName !== skipNodeName && elements && elements[0] && (elements[0] as CstNode).children) 
            (elements as CstNode[]).forEach(n => visitAll(n, nodeName, action))
    })
}

const buildRuleType: (r: RuleStatementNode, extraItems?: [string, string][]) => void
= (r, extraItems) => {
    if (!r || !r.children.Identifier || !r.children.Identifier[0]) return
    const typeName = (id: string) => `${id}Node`
    const ruleTypeName = typeName(r.children.Identifier[0].image)
    const tokenNames = new Set<string>()
    const nodeNames = new Set<string>()
    visitAll(r, "ConsumeStatement", (c: ConsumeStatementNode) => { 
        if(c.children.Identifier && c.children.Identifier[0])
            tokenNames.add(c.children.Identifier[0].image)
        }, "BacktrackPredicate")
    visitAll(r, "SubruleStatement", (s: SubruleStatementNode) => { 
        if(s.children.Identifier && s.children.Identifier[0])
            nodeNames.add(s.children.Identifier[0].image)
        }, "BacktrackPredicate")
    const childrenItems = [
        ...Array(...tokenNames).map(name => `${name}?: IToken[]`),
        ...Array(...nodeNames).map(name => `${name}?: ${typeName(name)}[]`),
    ]
    const childrenLines = childrenItems.join('\n        ')
    const extraItemLines = extraItems? '\n    ' + extraItems.map(([key, valueType]) => `${key}?: ${valueType}`).join('\n    '): ''
    return `
interface ${ruleTypeName} {
    name: string
    children: {
        ${childrenLines}
    }${extraItemLines}
}`
}

const indexRule: (r: RuleStatementNode) => void
= r => {
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

const prebuildIndexes: (node: RootNode) => void
= node => {
    const rootStatements = node.children.RootStatement
    if (!rootStatements || !rootStatements[0]) return
    const rules = rootStatements
        .filter(s => s.children.RuleStatement && s.children.RuleStatement[0])
        .map(rs => rs.children.RuleStatement![0]!)
    if (!rules || !rules[0]) return
    rules.forEach(indexRule)
}

const buildTypes: (node: RootNode, extraItems?: [string, string][]) => string
= (node, extraItems) => {
    const rootStatements = node.children.RootStatement
    if (!rootStatements || !rootStatements[0]) return ''
    const rules = rootStatements
        .filter(s => s.children.RuleStatement && s.children.RuleStatement[0])
        .map(rs => rs.children.RuleStatement![0]!)
    if (!rules || !rules[0]) return ''
    const importLine = "import { IToken } from 'chevrotain'\n"
    return importLine + rules.map(r => buildRuleType(r, extraItems)).join('\n')
}

export type ParseResult = {
    cst: RootNode,
    lexResult: ILexingResult
    parseErrors: IRecognitionException[]
}

export const lexAndParse: (text: string) => ParseResult
= text => {
    const lexResult = lexer.tokenize(text)
    const parser = new MetaParser(tokens)
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

const concatSegments: (pair: JsSegment) => string
= ({ str, segments }) => 
    str? str: segments? segments.map(concatSegments).join(' '): ''

const generatedFileHeadComment = 
`/**
  * This file is generated with meta-chevrotain
  */
`

export const makeTsFile: (root: RootNode) => string 
= root => {
    prebuildIndexes(root)
    return js_beautify(generatedFileHeadComment + concatSegments(JsSegmentBuilder.buildRoot(root)))
}

export const makeDtsFile: (root: RootNode) => string 
= root => {
    return generatedFileHeadComment + buildTypes(root, [["index", "number"]])
}
