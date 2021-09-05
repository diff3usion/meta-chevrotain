#!/usr/bin/env node

import yargs from 'yargs/yargs'
import { hideBin } from 'yargs/helpers'
import { readFileSync, writeFileSync } from 'fs';

import { lexAndParse, makeDtsFile, makeTsFile } from './dsl';

const argv
    = yargs(hideBin(process.argv))
        .options({
            bootstrap: { type: 'boolean', alias: 'b' },
            input: { type: 'string', alias: 'i' },
            logParser: { type: 'boolean', alias: 'p' },
            logTyping: { type: 'boolean', alias: 't' },
            ts: { type: 'string' },
            dts: { type: 'string' },
        })
        .usage("Usage: $0 -i <InputFile> --ts <OutputParserFile> --dts <OutputTypingFile>")
        .help('help')
        .check(argv => {
            if (argv.bootstrap) return true
            if (!argv.input)
                throw new Error("No input file")
            if (argv.logParser && argv.logTyping)
                throw new Error("Cannot log parser and typings the same time")
            if (!argv.logParser && !argv.logTyping && !argv.ts && !argv.dts)
                throw new Error("Need further action after input")
            return true
        })
        .parseSync();

if (argv.bootstrap) {
    const input = `${__dirname}/../meta_in.txt`
    const tsOutput = argv.ts ? argv.ts : `${__dirname}/../src/parser.ts`
    const dtsOutput = argv.dts ? argv.dts : `${__dirname}/../src/type.d.ts`
    const inputFile = readFileSync(input, 'utf-8')
    const cstRoot = lexAndParse(inputFile).cst
    if (tsOutput) writeFileSync(tsOutput, makeTsFile(cstRoot), 'utf-8')
    if (dtsOutput) writeFileSync(dtsOutput, makeDtsFile(cstRoot), 'utf-8')
} else if (argv.input) {
    const inputFile = readFileSync(argv.input, 'utf-8')
    const cstRoot = lexAndParse(inputFile).cst
    if (argv.logParser) {
        console.log(makeTsFile(cstRoot))
    } else if (argv.logTyping) {
        console.log(makeDtsFile(cstRoot))
    } else {
        if (argv.ts) writeFileSync(argv.ts, makeTsFile(cstRoot), 'utf-8')
        if (argv.dts) writeFileSync(argv.dts, makeDtsFile(cstRoot), 'utf-8')
    }
}
