/*
    MIT License

    Copyright (c) 2023 Yvain Ramora

    Permission is hereby granted, free of charge, to any person obtaining a copy
    of this software and associated documentation files (the "Software"), to deal
    in the Software without restriction, including without limitation the rights
    to use, copy, modify, merge, publish, distribute, sublicense, and/or sell
    copies of the Software, and to permit persons to whom the Software is
    furnished to do so, subject to the following conditions:

    The above copyright notice and this permission notice shall be included in all
    copies or substantial portions of the Software.

    THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND, EXPRESS OR
    IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF MERCHANTABILITY,
    FITNESS FOR A PARTICULAR PURPOSE AND NONINFRINGEMENT. IN NO EVENT SHALL THE
    AUTHORS OR COPYRIGHT HOLDERS BE LIABLE FOR ANY CLAIM, DAMAGES OR OTHER
    LIABILITY, WHETHER IN AN ACTION OF CONTRACT, TORT OR OTHERWISE, ARISING FROM,
    OUT OF OR IN CONNECTION WITH THE SOFTWARE OR THE USE OR OTHER DEALINGS IN THE
    SOFTWARE.
*/

/* importing modules */
const argv = require("minimist")(process.argv.slice(2));
const fs = require("fs");

/* reading the input file */
if (argv.i) {
    if (fs.existsSync(argv.i)) {
        fs.readFile(argv.i, "utf8", (err, data) => {
            if (!err) {
                decryptString(data);
            } else {
                console.log("\x1b[31mError: An error has occurred while reading the input file.\x1b[0m");
            }
        })
    } else {
        console.log("\x1b[31mError: You must provide a valid input file.\x1b[0m");
    }
} else {
    console.log("\x1b[31mError: You need to provide an input file!\n\x1b[33mexample: node index.js -i obfuscated.js\x1b[0m");
}

/* function for finding strings and decrypting them */
function decryptString(data) {

    /* finds encrypted strings */
    var cryptedStrings = data.match(/=\s*\[.*,.*\]/i)[0].replace(/=\s*/, '').split(/\s*,\s*/g).filter(str => str.startsWith("'") && str.endsWith("'")).map(str => ConvertEscapeSequences(str.slice(1, -1))).concat(decompress(ConvertEscapeSequences(data.match(/function\s*[0-9A-Z$_]+\s*\(\s*\)\s*{\s*return\s*'.*'\s*}/i)[0].match(/'.*'/)[0].slice(1, -1))));

    /* decrypts strings based on their signatures */
    cryptedStrings.forEach(str => {
        if (str.startsWith('<~') && str.endsWith('~>')) {
            /*
            if : 
                C = 52200625 * (a'-33) + 614125 * (b'-33) + 7225 * (c'-33) + 85 * (d'-33) + (e'-33)
            knowing that :
                52200625/614125 = 85
                614125/7225 = 85
                7225/85 = 85
            then :
                a = 255 & C >> 24
                b = 255 & C >> 16
                c = 255 & C >> 8
                d = 255 & C
            */
            var plaintext = [];
            str = str.slice(2, -2).replace(/s/g, '').replace('z', '!!!!!');
            var oldStr = str;
            str += "uuuuu".slice(str.length % 5);
            for(let i = 0; i < str.length; i += 5) {
                var C = 52200625 * (str.charCodeAt(i) - 33) + 614125 * (str.charCodeAt(i+1) - 33) + 7225 * (str.charCodeAt(i+2) - 33) + 85 * (str.charCodeAt(i+3) - 33) + (str.charCodeAt(i+4) - 33)
                plaintext.push(255 & C >> 24, 255 & C >> 16, 255 & C >> 8, 255 & C)
            }

            /* displays plain text */
            console.log('\x1b[33m \''+ str +'\'\x1b[90m = \x1b[32m\'' + String.fromCharCode(...plaintext).slice(0, oldStr.length-str.length) + '\'\x1b[0m')
        } else if (str.startsWith('{') && str.endsWith('}')) {

        } else {

        }
    })
}

/* function for converts Unicode and Hexadecimal escape sequences into characters */
function ConvertEscapeSequences(str) {
    var newStr = "";
    var chars = str.match(/(\\x[0-F]{2}|\\u[0-F]{4}|.)/gi);
    chars.forEach(char => newStr += char.length != 1 ? String.fromCharCode(parseInt(char.match(/[0-F]+/i)[0], 16)) : char);
    return newStr;
}

/* function for decompressing JSConfuser strings */
function decompress(str) {
    var firstChar1 = firstChar2 = str[0];
    var byteMax = oldByte = 256
    var uncompressedChars = [firstChar1];
    var decompressTable = {};
    for (let i = 1; i < str.length; i++) {
        var char = str.charCodeAt(i);
        if (char < byteMax) {
            char = str[i];
        } else {
            char = decompressTable[char] ? decompressTable[char] : firstChar1 + firstChar2;
        }
        uncompressedChars.push(char);
        firstChar2 = char.charAt(0);
        decompressTable[oldByte] = firstChar1 + firstChar2;
        firstChar1 = char;
        oldByte++;
    }
    return uncompressedChars.join('').split('1')
}