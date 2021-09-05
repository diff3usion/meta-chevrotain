#!/usr/bin/env node

import yargs from 'yargs/yargs'
import { hideBin } from 'yargs/helpers'
import { readFileSync, writeFileSync } from 'fs';

import { lexAndParse, makeDtsFile, makeTsFile } from './dsl';

const parseExtraItems: (s?: string) => [string, string][] | undefined
    = s => {
        const res = s?.split(',').map(l => l.split(':'))
        if (res?.every(i => i.length === 2 && i.every(w => /\w+/.test(w))))
            return res as [string, string][]
        return undefined
    }

const argv
    = yargs(hideBin(process.argv))
        .options({
            input: {
                alias: 'i',
                type: 'string',
                desc: "Input parser definition file",
            },
            parser: {
                alias: 'p',
                type: 'string',
                desc: "Output generated parser to file",
            },
            typing: {
                alias: 't',
                type: 'string',
                desc: "Output generated typing to file",
            },
            log: {
                alias: 'l',
                type: 'boolean',
                desc: "Output to console instead of file",
            },
            extra: {
                alias: 'e',
                type: 'string',
                desc: "Extra typing entries to append to node interfaces",
            }
        })
        .usage("Usage: $0 -i <InputFile> --ts <OutputParserFile> --dts <OutputTypingFile>")
        .help('help')
        .check(argv => {
            if (!argv.input)
                throw new Error("Needs input file, use '-i input.txt")
            if (argv.parser === undefined && argv.typing === undefined)
                throw new Error("Needs further action after input, use '-p parser.ts -t typing.d.ts'")
            if (argv.extra && parseExtraItems(argv.extra) === undefined)
                throw new Error("Invalid extra typing entries format, example is '-e index:number'")
            return true
        })
        .parseSync();

if (argv.input) {
    const inputFile = readFileSync(argv.input, 'utf-8')
    const cstRoot = lexAndParse(inputFile).cst
    if (argv.log) {
        if (argv.parser !== undefined) {
            console.log("// Parser: ")
            console.log(makeTsFile(cstRoot))
        }
        if (argv.typing !== undefined) {
            console.log("// Typing: ")
            console.log(makeDtsFile(cstRoot, parseExtraItems(argv.extra)))
        }
    } else {
        if (argv.parser) writeFileSync(argv.parser, makeTsFile(cstRoot), 'utf-8')
        if (argv.typing) writeFileSync(argv.typing, makeDtsFile(cstRoot, parseExtraItems(argv.extra)), 'utf-8')
    }
}
