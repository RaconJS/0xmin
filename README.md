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
if;null;
jump-3;
```
each of these lines of code can be translated indepently, directly into machine code.
The 0xmin compiler has sertain debugging support with the 'jump' and 'move' commands that wont be picked up if they are typed as numbers.

### level2 assembly-ish
Macro code is represented by `#`, hidden aka context code by `$` and assembly by `@`.
This level/paradime is for people who are missing the '{' or '}' keys on there keyboard.
0xmin has very high level macros support. e.g. object orintated macros.
Like in C++, `#` is used for macros.
Unlike C++, macros can be on the same line.
Using the assembly part of 0xmin, we can use **labels**.
```
//labels can be created with 'let' or 'var', defined with 'def'
//labels can be used in the assembly language with the '->' arrow (called 'to')
# let label;
null;
xor # def label;//
jump -> label;//jump -1;
```
The code above will infinitly "jump to label".

Access to labels can be removed with `delete`
e.g.`#let label;#def label;#delete label;`
`delete` deletes only prevents code past that point from accessing that label, the label still technically exists. (just like local scopes)
`delete` can be used instead of local scopes.
### level3 oop
in 0xmin all labels can be used as a function, array, label, code block and object all at the same time.
#### functions:
All macro functions hault.
To achieve this the compiler bans unbounded recursion and doesnt use for/while loops.
instead recursion and iteration must specify the maximum amount when first called.
`recur (n) foo();` `repeat (n) foo();`
with `recur`, it wont throw an error if you try to go over the bounds but will just not run.
