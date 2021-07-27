/**
 * This file is hand-written
 */

import { CstNode, IToken } from "chevrotain";
import { ArgumentSepNode, ArgumentErrNode, ArgumentMaxLaNode, BacktrackPredicateNode, ArgumentGateNode, ArgumentLabelNode, AtLeastOneStatementNode, ConsumeStatementNode, ManyStatementNode, OptionStatementNode, OrAlternativeNode, OrStatementNode, SkipStatementNode, SubruleStatementNode, StatementNode, StatementListNode, RuleStatementNode, RootStatementNode, RootNode } from "./meta_type";

export type JsSegment = {
    node        : CstNode
    segments?   : JsSegment[]
    str?        : string
}

export namespace JsSegmentBuilder {
    const braceSuffix = ' )'

    function assert(value: unknown, msg?: string): asserts value {
        if (!value) 
            throw new Error('Parsed CST has invalid format' + msg? `: ${msg}`: '');
    }

    const buildEscapedString: (escaped: IToken) => string
    = escaped => escaped.image.slice(1,-1)
    
    const buildArgumentSep: (node: ArgumentSepNode) => JsSegment
    = node => {
        const id = node.children.Identifier
        assert(id && id[0])
    
        const prefix = 'SEP: '
        const segments: JsSegment[] = []
        segments.push({ node, str: prefix })
        segments.push({ node, str: id[0].image })
        return { node, segments }
    }
    
    const buildArgumentErr: (node: ArgumentErrNode) => JsSegment
    = node => {
        const escaped = node.children.EscapedString
        assert(escaped && escaped[0])
    
        const prefix = 'ERR_MSG: '
        const segments: JsSegment[] = []
        segments.push({ node, str: prefix })
        segments.push({ node, str: buildEscapedString(escaped[0]) })
        return { node, segments }
    }
    
    const buildArgumentMaxLookAhead: (node: ArgumentMaxLaNode) => JsSegment
    = node => {
        const escaped = node.children.EscapedString
        assert(escaped && escaped[0])
    
        const prefix = 'MAX_LOOKAHEAD: '
        const str = prefix + buildEscapedString(escaped[0])
        return { node, str }
    }
    
    const buildBacktrackPredicate: (node: BacktrackPredicateNode) => JsSegment
    = node => {
        const id = node.children.Identifier
        const statement = node.children.Statement
        const statementList = node.children.StatementList
    
        const prefix = '$.BACKTRACK('
        const segments: JsSegment[] = []
        segments.push({ node, str: prefix })
        if (id) {
            assert(id[0])
            const str = prefix + id[0].image + braceSuffix
            return { node, str }
        } else if (statementList) {
            assert(statementList[0])
            segments.push(buildStatementList(statementList[0]))
        } else {
            assert(statement && statement[0])
            segments.push(buildStatementAsBlock(statement[0]))
        }
        segments.push({ node, str: braceSuffix })
        return { node, segments }
    }
    
    const buildArgumentGate: (node: ArgumentGateNode) => JsSegment
    = node => {
        const bp = node.children.BacktrackPredicate
        const escaped = node.children.EscapedString
    
        const prefix = 'GATE: '
        const segments: JsSegment[] = []
        segments.push({ node, str: prefix })
    
        if (bp) {
            assert(bp && bp[0])
            segments.push(buildBacktrackPredicate(bp[0]))
        } else {
            assert(escaped && escaped[0])
            segments.push({ node, str: buildEscapedString(escaped[0]) })
        }
    
        return { node, segments }
    }
    
    const buildArgumentLabel: (node: ArgumentLabelNode) => JsSegment
    = node => {
        const escaped = node.children.EscapedString
        assert(escaped && escaped[0])
    
        const prefix = 'LABEL: '
        const segments: JsSegment[] = []
        segments.push({ node, str: prefix })
        segments.push({ node, str: buildEscapedString(escaped[0]) })
        return { node, segments }
    }
    
    const buildAtLeastOneStatement: (node: AtLeastOneStatementNode) => JsSegment
    = node => {
        const args = node.children.AtLeastOneArguments
        const statement = node.children.Statement
        const statementList = node.children.StatementList
    
        const functionName = args && args[0] && args[0].children.ArgumentSep? 'AT_LEAST_ONE_SEP': 'AT_LEAST_ONE'
        const indexStr = node.index? `${node.index}`: ''
        const [prefix, suffix] = [`$.${functionName}${indexStr}({ DEF: `, ' })']
        const segments: JsSegment[] = []
    
        segments.push({ node, str: prefix })
        
        if (statementList) {
            assert(statementList[0])
            segments.push(buildStatementList(statementList[0]))
        } else {
            assert(statement && statement[0])
            segments.push(buildStatementAsBlock(statement[0]))
        }
    
        if (args) {
            assert(args[0])
            const err = args[0].children.ArgumentErr
            const gate = args[0].children.ArgumentGate
            const sep = args[0].children.ArgumentSep
            const maxLa = args[0].children.ArgumentMaxLa
            const argSegments: JsSegment[] = []
            if (gate && sep) 
                throw new Error("at least one cannot have gate and sep at same time")
            if (gate) {
                assert(gate[0])
                argSegments.push({ node: args[0], str: ','})
                argSegments.push(buildArgumentGate(gate[0]))
            } else if (sep) {
                assert(sep[0])
                argSegments.push({ node: args[0], str: ','})
                argSegments.push(buildArgumentSep(sep[0]))
            }
            if (err) {
                assert(err[0])
                argSegments.push({ node: args[0], str: ','})
                argSegments.push(buildArgumentErr(err[0]))
            }
            if (maxLa) {
                assert(maxLa[0])
                argSegments.push({ node: args[0], str: ','})
                argSegments.push(buildArgumentMaxLookAhead(maxLa[0]))
            }
            segments.push({ node: args[0], segments: argSegments })
        } 
    
        segments.push({ node, str: suffix })
    
        return { node, segments }
    }
    
    const buildConsumeStatement: (node: ConsumeStatementNode) => JsSegment
    = node => {
        const args = node.children.ConsumeArguments
        const id = node.children.Identifier
        const prefix = node.index === undefined? '$.CONSUME( ': `$.consume(${node.index}, `
        const segments: JsSegment[] = []
        assert(id && id[0])
        const str = prefix + id[0].image + braceSuffix
        segments.push({ node, str })
    
        if (args) {
            assert(args[0])
            const err = args[0].children.ArgumentErr
            const label = args[0].children.ArgumentLabel
            const argSegments: JsSegment[] = []
            if (err) {
                assert(err[0])
                argSegments.push({ node: args[0], str: ','})
                argSegments.push(buildArgumentErr(err[0]))
            } 
            if (label) {
                assert(label[0])
                argSegments.push({ node: args[0], str: ','})
                argSegments.push(buildArgumentLabel(label[0]))
            }
            segments.push({ node: args[0], segments: argSegments })
        } 
    
        return { node, segments }
    }
    
    const buildManyStatement: (node: ManyStatementNode) => JsSegment
    = node => {
        const args = node.children.ManyArguments
        const statement = node.children.Statement
        const statementList = node.children.StatementList
        const functionName = args && args[0] && args[0].children.ArgumentSep? 'MANY_SEP': 'MANY'
        const indexStr = node.index? `${node.index}`: ''
        const [prefix, suffix] = [`$.${functionName}${indexStr}({ DEF: `, ' })']
        const segments: JsSegment[] = []
        segments.push({ node, str: prefix })
        
        if (statementList) {
            assert(statementList[0])
            segments.push(buildStatementList(statementList[0]))
        } else {
            assert(statement && statement[0])
            segments.push(buildStatementAsBlock(statement[0]))
        }
    
        if (args) {
            assert(args[0])
            const gate = args[0].children.ArgumentGate
            const sep = args[0].children.ArgumentSep
            const maxLa = args[0].children.ArgumentMaxLa
            const argSegments: JsSegment[] = []
            if (gate && sep) 
                throw new Error("many cannot have gate and sep at same time")
            if (gate) {
                assert(gate[0])
                argSegments.push({ node: args[0], str: ','})
                argSegments.push(buildArgumentGate(gate[0]))
            } else if (sep) {
                assert(sep[0])
                argSegments.push({ node: args[0], str: ','})
                argSegments.push(buildArgumentSep(sep[0]))
            }
            if (maxLa) {
                assert(maxLa[0])
                argSegments.push({ node: args[0], str: ','})
                argSegments.push(buildArgumentMaxLookAhead(maxLa[0]))
            }
            segments.push({ node: args[0], segments: argSegments })
        } 
    
        segments.push({ node, str: suffix })
    
        return { node, segments }
    }
    
    const buildOptionStatement: (node: OptionStatementNode) => JsSegment
    = node => {
        const args = node.children.OptionArguments
        const statement = node.children.Statement
        const statementList = node.children.StatementList
        const prefix = node.index === undefined? '$.OPTION( ': `$.option(${node.index}, `
        const segments: JsSegment[] = []
        segments.push({ node, str: prefix })
    
        const buildContent = () => {
            if (statementList) {
                assert(statementList[0])
                segments.push(buildStatementList(statementList[0]))
            } else {
                assert(statement && statement[0])
                segments.push(buildStatementAsBlock(statement[0]))
            }
        }
        if (args) {
            assert(args[0])
            const gate = args[0].children.ArgumentGate
            const maxLa = args[0].children.ArgumentMaxLa
            const [argsPrefix, argsSuffix] = ['{ DEF: ', ' }']
            const argSegments: JsSegment[] = []
            segments.push({ node, str: argsPrefix })
            buildContent()
            if (gate) {
                assert(gate[0])
                argSegments.push({ node: args[0], str: ','})
                argSegments.push(buildArgumentGate(gate[0]))
            } 
            if (maxLa) {
                assert(maxLa[0])
                argSegments.push({ node: args[0], str: ','})
                argSegments.push(buildArgumentMaxLookAhead(maxLa[0]))
            }
            segments.push({ node: args[0], segments: argSegments })
            segments.push({ node: node, str: argsSuffix })
        } else {
            buildContent()
        }
    
        segments.push({ node, str: braceSuffix })
        return { node, segments }
    }
    
    const buildOrAlternative: (node: OrAlternativeNode) => JsSegment
    = node => {
        const args = node.children.OrAlternativeArguments
        const statement = node.children.Statement
        const statementList = node.children.StatementList
        const [prefix, suffix] = ['{ ALT: ', ' }']
        const segments: JsSegment[] = []
        segments.push({ node, str: prefix })
    
        if (statementList) {
            assert(statementList[0])
            segments.push(buildStatementList(statementList[0]))
        } else {
            assert(statement && statement[0])
            segments.push(buildStatementAsBlock(statement[0]))
        }
    
        if (args) {
            assert(args[0])
            const gate = args[0].children.ArgumentGate
            const escaped = args[0].children.EscapedString
            const argSegments: JsSegment[] = []
            if (gate) {
                assert(gate[0])
                argSegments.push({ node: args[0], str: ','})
                argSegments.push(buildArgumentGate(gate[0]))
            }
            if (escaped) {
                assert(escaped[0])
                argSegments.push({ node: args[0], str: ','})
                argSegments.push({ node: args[0], str: buildEscapedString(escaped[0])})
            }
            segments.push({ node: args[0], segments: argSegments })
        }
    
        segments.push({ node, str: suffix })
        return { node, segments }
    }
    
    const buildOrStatement: (node: OrStatementNode) => JsSegment
    = node => {
        const args = node.children.OrArguments
        const alternatives = node.children.OrAlternative
        const prefix = node.index === undefined? '$.OR([ ': `$.or(${node.index}, [`
        const suffix = ' ])'
        const segments: JsSegment[] = []
        segments.push({ node, str: prefix })
    
        const buildContent = () => {
            assert(alternatives && alternatives[0])
            alternatives.map(a => buildOrAlternative(a)).forEach(altStr => {
                segments.push(altStr)
                segments.push({ node, str: ','})
            })
        }
        if (args) {
            assert(args[0])
            const err = args[0].children.ArgumentErr
            const maxLa = args[0].children.ArgumentMaxLa
            const escaped = args[0].children.EscapedString
            const [argsPrefix, argsSuffix] = ['{ DEF: ', ' }']
            const argSegments: JsSegment[] = []
    
            segments.push({ node, str: argsPrefix })
            buildContent()
            if (err) {
                assert(err[0])
                argSegments.push({ node: args[0], str: ','})
                argSegments.push(buildArgumentErr(err[0]))
            }
            if (maxLa) {
                assert(maxLa[0])
                argSegments.push({ node: args[0], str: ','})
                argSegments.push(buildArgumentMaxLookAhead(maxLa[0]))
            }
            if (escaped) {
                assert(escaped[0])
                argSegments.push({ node: args[0], str: ','})
                argSegments.push({ node: args[0], str: buildEscapedString(escaped[0])})
            }
            segments.push({ node: args[0], segments: argSegments })
            segments.push({ node: node, str: argsSuffix })
        } else {
            buildContent()
        }
    
        segments.push({ node, str: suffix })
        return { node, segments }
    }
    
    const buildSkipStatement: (node: SkipStatementNode) => JsSegment
    = node => {
        const id = node.children.Identifier
        
        const prefix = '$.SKIP('
        const segments: JsSegment[] = []
        assert(id && id[0])
        const str = prefix + id[0].image + braceSuffix
        segments.push({ node, str })
    
        segments.push({ node, str: braceSuffix })
        return { node, segments }
    }
    
    const buildSubruleStatement: (node: SubruleStatementNode) => JsSegment
    = node => {
        const args = node.children.SubruleArguments
        const id = node.children.Identifier
        assert(id && id[0])
    
        const prefix = node.index === undefined? '$.SUBRULE( ': `$.subrule(${node.index}, `
        const segments: JsSegment[] = []
        segments.push({ node, str: prefix })
        segments.push({ node, str: id[0].image })
    
        if (args) {
            assert(args[0])
            const label = args[0].children.ArgumentLabel
    
            const [argsPrefix, argsSuffix] = ['{', '}']
            const argSegments: JsSegment[] = []
            argSegments.push({ node: args[0], str: argsPrefix})
            if (label) {
                assert(label[0])
                argSegments.push({ node: args[0], str: ','})
                argSegments.push(buildArgumentLabel(label[0]))
            }
            argSegments.push({ node: args[0], str: argsSuffix})
            segments.push({ node: args[0], segments: argSegments })
        } 
    
        segments.push({ node, str: braceSuffix })
        return { node, segments }
    }
    
    const buildStatement: (node: StatementNode) => JsSegment
    = node => {
        const atLeastOne = node.children.AtLeastOneStatement
        const consume = node.children.ConsumeStatement
        const many = node.children.ManyStatement
        const option = node.children.OptionStatement
        const or = node.children.OrStatement
        const skip = node.children.SkipStatement
        const subrule = node.children.SubruleStatement
        const escaped = node.children.EscapedString
    
        if (atLeastOne) {
            assert(atLeastOne[0])
            return buildAtLeastOneStatement(atLeastOne[0])
        } else if (consume) {
            assert(consume[0])
            return buildConsumeStatement(consume[0])
        } else if (many) {
            assert(many[0])
            return buildManyStatement(many[0])
        } else if (option) {
            assert(option[0])
            return buildOptionStatement(option[0])
        } else if (or) {
            assert(or[0])
            return buildOrStatement(or[0])
        } else if (skip) {
            assert(skip[0])
            return buildSkipStatement(skip[0])
        } else if (subrule) {
            assert(subrule[0])
            return buildSubruleStatement(subrule[0])
        } 
        assert(escaped && escaped[0])
        return { node, str: buildEscapedString(escaped[0]) }
    }
    
    const buildStatementAsBlock: (node: StatementNode) => JsSegment 
    = node => {
        const segments: JsSegment[] = []
        const statementPrefix = '() => '
        segments.push({ node, str: statementPrefix })
        segments.push(buildStatement(node))
        return { node, segments }
    }
    
    const buildStatementList: (node: StatementListNode) => JsSegment
    = node => {
        const statement = node.children.Statement
        assert(statement)
    
        const [prefix, suffix] = ['() => {', '}']
        const segments: JsSegment[] = []
        segments.push({ node, str: prefix })
        statement.forEach(s => {
            segments.push(buildStatement(s))
            segments.push({ node, str: ';' })
        }),
        segments.push({ node, str: suffix })
        return { node, segments }
    }
    
    const buildRuleStatement: (node: RuleStatementNode) => JsSegment
    = node => {
        const isExposed = node.children.Equals && node.children.Equals[0]
        const name = node.children.Identifier
        const statementList = node.children.StatementList
        assert(name && name[0])
        assert(statementList && statementList[0])
    
        const descriptor = isExposed? 'this.': 'const '
        const [prefix, suffix] = [`${descriptor}${name[0].image} = $.RULE("${name[0].image}", `, ')']
        const segments = [
            { node, str: prefix }, 
            buildStatementList(statementList[0]),
            { node, str: suffix }, 
        ]
        return { node, segments }
    }
    
    const buildRootStatement: (node: RootStatementNode) => JsSegment
    = node => {
        const rule = node.children.RuleStatement
        const escaped = node.children.EscapedString
        if (rule) {
            assert(rule[0])
            return buildRuleStatement(rule[0])
        }
        assert(escaped && escaped[0])
        return { node, str: buildEscapedString(escaped[0]) }
    }
    
    export const buildRoot: (node: RootNode) => JsSegment
    = node => {
        const root = node.children.RootStatement
        const segments: JsSegment[] = []
        if (root) {
            root.forEach(s => {
                segments.push(buildRootStatement(s))
                if (!s.children.EscapedString)
                    segments.push({ node, str: ';' })
            })
            return { node, segments }
        }
        return { node, segments }
    }
}