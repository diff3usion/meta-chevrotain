/**
 * This file is hand-written (for now)
 */

import { createToken, Lexer } from 'chevrotain'

const EscapeSymbol = '#'

export const EscapedString  = createToken({ name: "EscapedString",  pattern: new RegExp(`${EscapeSymbol}[^${EscapeSymbol}]*${EscapeSymbol}`) });
export const OnePlus        = createToken({ name: "OnePlus",        pattern: /1\+/ })
export const LAngle         = createToken({ name: "LAngle",         pattern: /\</ })
export const Underscore     = createToken({ name: "Underscore",     pattern: /\_/ })
export const ZeroPlus       = createToken({ name: "ZeroPlus",       pattern: /0\+/ })
export const Question       = createToken({ name: "Question",       pattern: /\?/ })
export const Backslash      = createToken({ name: "Backslash",      pattern: /\\/ })
export const VBar           = createToken({ name: "VBar",           pattern: /\|/ })
export const Equals         = createToken({ name: "Equals",         pattern: /\=/ })
export const Minus          = createToken({ name: "Minus",          pattern: /\-/ })
export const Asterisk       = createToken({ name: "Asterisk",       pattern: /\*/ })
export const Semicolon      = createToken({ name: "Semicolon",      pattern: /;/ });
export const RAngle         = createToken({ name: "RAngle",         pattern: /\>/ })
export const Exclamation    = createToken({ name: "Exclamation",    pattern: /\!/ })
export const Caret          = createToken({ name: "Caret",          pattern: /\^/ })
export const At             = createToken({ name: "At",             pattern: /\@/ })
export const Identifier     = createToken({ name: "Identifier",     pattern: /\w+/ })
export const Comma          = createToken({ name: "Comma",          pattern: /,/ });
export const LCurly         = createToken({ name: "LCurly",         pattern: /{/ });
export const RCurly         = createToken({ name: "RCurly",         pattern: /}/ });
export const LBrace         = createToken({ name: "LBrace",         pattern: /\(/ });
export const RBrace         = createToken({ name: "RBrace",         pattern: /\)/ });	
export const WhiteSpace     = createToken({ name: "WhiteSpace",     pattern: /\s+/, group: Lexer.SKIPPED });

export const tokens = [
    EscapedString,
    OnePlus, 
    LAngle, 
    Underscore, 
    ZeroPlus, 
    Question, 
    Backslash, 
    VBar, 
    Equals, 
    Minus, 
    Asterisk, 
    Semicolon, 
    RAngle,
    Exclamation,
    Caret,
    At,
    Identifier, 
    Comma,
    RCurly, 
    LCurly, 
    LBrace,
    RBrace,
    WhiteSpace,
]

export const lexer = new Lexer(tokens, {
    // Less position info tracked, reduces verbosity of the playground output.
    positionTracking: "onlyStart"
});
