# 0xmin
The 0xmin1 is currently, in 2023, the worlds smallest 30 bit computer in ThePowderToy(https://powdertoy.co.uk/).


comes with a programming language with a compiler, emulator.cpp, and the actual 0xmin computer save itself.

old computer documentation

https://powdertoy.co.uk/Discussions/Thread/View.html?Thread=24348

## to install

1. Download the files.

2. make sure you have nodeJS version 16+ installed.

Check nodejs version by running:
`nodejs -v`

if this is not the case, run:
```
sudo apt update;
curl -sL https://deb.nodesource.com/setup_16.x | sudo -E bash -;
sudo apt-get install -y nodejs;
nodejs -v
```
3. in .bashrc add `alias 0xmin=pathToRepo/language/0xmin.sh`

4. If you have sublime text add the `pathToRepo/syntax_for_sublimeText/` folder into the `Packages/` folder in sublime text.

5. If you have the powder toy from the ubuntu store move the `pathToRepo/the_powder_toy/` into the `scripts/` in the-powder-toy

## how to use
### the compiler:
For help run `0xmin -help` or `./compiler.sh -help`

To compile an 0xmin assembly file you can use the following:

For binary output: `./compiler.sh filename.0xmin -o outputName.filt`

For lua output: `./compiler.sh filename.0xmin -o outputName.lua`

To run in TPT:`./compiler.sh filename.0xmin` to autimaticly send it to The Powder Toy. Then run it on the 0xmin save by doing `compile()` in the tpt comandline. Then unpause the save.

compile and run: `./compiler.sh -r filename.0xmin`, you can also find the compiled files as: `./emulator/a.filt` and `./emulator/aOld.filt`
### the emulator
To run `.filt` 0xmin-binary files run: `./compile.sh -e filename.filt` (-e for execute)

## requirements:{
the following are required for the full 0xmin experience.
### node.js v16
For the `compiler.js`. It uses "`a??b`" and "`a?.b`".

node.js v16 can be installed with the `installer.sh`
### linux/ubuntu (strongly recommended)
Otherwise you will have to:

	change the file paths in `compile.sh` that point to The_powder_toy.

	translate the bash file: `compiler.sh` into another format.
### sublime-text3, Ideally from ubuntu store (optional)
For syntax highlighting to make writing 0xmin code easier.
### the powder toy, form the ubuntu store 
instead of using the emulator.cpp, it gives you the actual visual computer.

## }
# ZASM
0xmin, Assembly, Small, Macro Language

To prevent confusion between the computer and the programing language used by the compiler, the language is called ZASM.

note: none of the files use the "ZASM" name yet.

ZASM->0@$# represents each of the compilation faces in ZASM.

\# -> meta/macro phase

$ -> memory assignment & label assignment phase

@ -> assembly phase (assembly->binary array)

0 -> binary phase (binary -> bufferArray -> output file)

## the language
the language can support different dialects for different machines.

Currently the 3 language modes are: 0xmin, tptasm, raw binary

You can set the language mode by putting at the very top of your source file: `#"0xmin";`, `#"tptasm";`, or `#"code";`
By default the language is set to 0xmin.

The language modes only changes the syntax for assembly (`@`) code.

### #"0xmin";
#### command set:
0xmin currently has 16 commands (+1 unused one). They are:

0: `move`

1: `jump`

2: `nor`

3: `red`

4: `blue`

5: `set`

6: `xor`

7: `and`

8: `or`

9: `or_input` (aka "or input")

10: `get_jump` (aka "get jump -1")

11: `set`

12: `if`

13: `set_jump` (aka "set jump +3")

14: `null`

15: unused

0x100XY: `"\xXY"` (aka print char)


hello world example in ZASM/0xmin: `"hello world\h";`

The "\h" haults the program. It is a shorthand for `jump +0;`.

You can print a string simply by having a string.
It uses the "print char" command from the 0xmin cpu. This doesn't require any boiler plate such as for-loops, storing strings as a separate variable.

I will now assume you know a bit on how the CPU works from a programming perspective.

The 0xmin CPU uses 3 registers* (2 pointers + accumilator)
they are called: `jump` `move` and `alu` (disclamer: alu does not currently do anything in ZASM/0xmin although it does highlight in sublime text)

"jump to line 10" --> `jump->0xmin +10;`
"move the data pointer forwards by 5 lines" --> `move +5;`
