#!/usr/bin/env node

import yargs from 'yargs/yargs'
import { hideBin } from 'yargs/helpers'
import { readFileSync, writeFileSync } from 'fs';

import { lexAndParse, MetaChevrotainConfig, parserFileContent, typingFileContent } from './dsl';

const defaultConfig: MetaChevrotainConfig = {
    useJs: false,
    useModule: true,
}

function readConfigFile(configFilePath: string): MetaChevrotainConfig {
    const configJson = readFileSync(configFilePath, 'utf-8')
    const parsedConfigJson = JSON.parse(configJson)
    return { ...defaultConfig, ...parsedConfigJson }
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
            config: {
                alias: 'c',
                type: 'string',
                desc: "Configuration file",
            }
        })
        .usage("Usage: $0 -i <InputFile> -p <OutputParserFile> -t <OutputTypingFile>")
        .help('help')
        .check(argv => {
            if (!argv.input)
                throw new Error("Needs input file, use '-i input.txt")
            if (argv.parser === undefined && argv.typing === undefined)
                throw new Error("Needs further action after input, use '-p parser.ts -t typing.d.ts'")
            return true
        })
        .parseSync();

if (argv.input) {
    const inputFile = readFileSync(argv.input, 'utf-8')
    const cstRoot = lexAndParse(inputFile).cst
    const config = argv.config ? readConfigFile(argv.config) : defaultConfig
    if (argv.log) {
        if (argv.parser) {
            console.log("// Parser: ")
            console.log(parserFileContent(cstRoot, config))
        }
        if (argv.typing) {
            console.log("// Typing: ")
            console.log(typingFileContent(cstRoot, config))
        }
    } else {
        if (argv.parser) {
            writeFileSync(argv.parser, parserFileContent(cstRoot, config), 'utf-8')
        }
        if (argv.typing) {
            writeFileSync(argv.typing, typingFileContent(cstRoot, config), 'utf-8')
        }
    }
}
