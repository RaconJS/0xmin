# 0xmin
Worlds smallest 30bit computer in The Powder Toy.

TPT = ThePowderToy

comes with a compiler, emulator.cpp, the TPT computer itself

old computer documentation
https://powdertoy.co.uk/Discussions/Thread/View.html?Thread=24348

## to install and use
`./compiler.sh filename.0xmin outputName.filt`

or

`./compiler.sh filename.0xmin outputName.lua`

or

`./compiler.sh filename.0xmin` to send it to The Powder Toy

## requirements:{
the following are required for the full 0xmin experience.
### node.js v16
For the `compiler.js`. It uses "`a??b`" and "`a?.b`".

node.js v16 can be installed with the `installer.sh`
### ubuntu (strongly recommended)
Otherwise you will have to:
	change the file paths in `compile.sh` that point to The_powder_toy.
	translate the bash file: `compiler.sh` into another format.
### sublime-text3, from ubuntu store (optional)
For syntax highlighting for writing 0xmin code.
### the powder toy, form the ubuntu store 
instead of using the emulator.cpp, it gives you the actual visual computer.

## }

## about the programming language
0xmin allows for many levels of programming, from machine code, to c++.
its syntax is partly inspired by off javascript&c++.

###  level0 machine code
machine code can be typed in as a list of 30 bit numbers separated by `;`.
0xmin only allows 30ints to be typed in as decimal,binary or hexidecimal.
e.g.
```
1;2;3;0b100;0x5;
```
note that `0;` will still turn into ctype(30) in ThePowderToy.
0xmin (unlike python) doesnt care about tabs or \n's.

### level1 worded commands
use 0xmin instruction set.
```
move+4;
and;
or;
jump-3;
```
### level2 assembly-ish
0xmin has very high level macros support.
like in C++, `#` is used for macros.
unlike C++, macros can be on the same line.
using the assembly part of 0xmin, we can use **labels**.
```
//labels can be created with 'let' or 'var', defined with 'def'
# let label;
null;
456 # def label;
jump->label;
```
