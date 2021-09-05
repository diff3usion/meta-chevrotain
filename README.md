[![npm](https://img.shields.io/npm/v/meta-chevrotain.svg )](https://www.npmjs.com/package/meta-chevrotain)
# meta-chevrotain
  DSL for generating [chevrotain](https://github.com/Chevrotain/chevrotain) parser code and cst typing

## Warning
  This is a improvisational project and is **NOT TESTED AT ALL**. It might be improved in the future.
## Examples
  [Rail Diagram](https://diff3usion.github.io/meta-chevrotain/)
  
  [Bootstrapping Definition](https://github.com/diff3usion/meta-chevrotain/blob/main/meta_in.txt)
  
  [Generated Parser](https://github.com/diff3usion/meta-chevrotain/blob/main/src/meta_parser.ts)
  
  [Generated Typing](https://github.com/diff3usion/meta-chevrotain/blob/main/src/meta_type.d.ts)
  
## Requires
  [node](https://github.com/nodejs/node), [yarn](https://github.com/yarnpkg/berry)
  
## Init
    yarn
    
## Usage
  ### Bootstrapping
    yarn start -b
  ### Read file and output parser code to console
    yarn start -i input.txt -p
  ### Read file and output typing code to console
    yarn start -i input.txt -t
  ### Read file and output to files
    yarn start -i input.txt --ts parser.ts --dts cst.d.ts

