# 0xmin
The 0xmin1 is currently, in 2023, the worlds smallest 30 bit computer in ThePowderToy(https://powdertoy.co.uk/).


comes with a programming language with a compiler, emulator.cpp, and the actual 0xmin computer save itself.

old computer documentation

https://powdertoy.co.uk/Discussions/Thread/View.html?Thread=24348

## to install
### through terminal
1. enter the directory where you want 0xmin compiler to be stored.
2. run the following commands
`sudo apt update`
`sudo apt install git` #installs git if it is not already
`git clone https://github.com/RaconJS/0xmin.git --depth 1` #downloads files
`./0xmin/install.sh` runs the auto installer

3. make sure you have nodeJS version 16+ installed.
Check nodejs version by running:
`nodejs -v`

if this is not the case, run:
```
sudo apt update;
curl -sL https://deb.nodesource.com/setup_16.x | sudo -E bash -;
sudo apt-get install -y nodejs;
nodejs -v
```
The compiler used javascript features: private properties `#property` and `??`

### option 2:
1. Download the files.


2. in .bashrc add `alias 0xmin=pathToRepo/language/0xmin.sh`

3. If you have sublime text add the `pathToRepo/syntax_for_sublimeText/` folder into the `Packages/` folder in sublime text.

4. If you have the powder toy from the ubuntu store move the `pathToRepo/the_powder_toy/` into the `scripts/` in the-powder-toy

## how to use
### the compiler:
For help run `0xmin -help` or `./compiler.sh -help`

To compile an 0xmin assembly file you can use the following:

For binary output: `0xmin filename.0xmin -o outputName.filt`

For lua output: `0xmin filename.0xmin -o outputName.lua`

To run in TPT: `0xmin filename.0xmin` to autimaticly send it to The Powder Toy. Then run it on the 0xmin save by doing `compile()` in the tpt comandline. Then unpause the save.

compile and run: `0xmin -r filename.0xmin`, you can also find the compiled files as: `./emulator/a.filt` and `./emulator/aOld.filt`. These are tempory files and can be safely removed at any time.

### the emulator
To run `.filt` 0xmin-binary files run: `0xmin -e filename.filt` (-e for execute)
Optionally the speed of the emulator can be controlled with the `-s` and `-sm` (speed multiple) flags
e.g. `0xmin -e filename.filt -sm 4` runs emulator at 4 times normal speed (4 * 60 cycles per second)

## requirements:{
the following are required for the full 0xmin experience.
### node.js v16
For the `compiler.js`. It uses "`a??b`" and "`a?.b`".

node.js v16 can be installed with the `installer.sh`
### linux/ubuntu: this system has not been tested on other operating systems.
Otherwise you will have to:

	change the file paths in `compile.sh` that point to The_powder_toy.

	translate the bash file: `compiler.sh` into another format.
### sublime-text3, from `snap`
For syntax highlighting to make writing 0xmin code easier.
### the powder toy, from `snap`
instead of using the emulator.cpp, it gives you the actual visual computer.
## }

# ZASM
0xmin, Assembly, State, Macro Language

The names 'ZASM' and '0xmin' can be used almost interchangably

note: none of the files use the "ZASM" name yet.

ZASM->0@$# represents each of the compilation phase in ZASM.

\# -> meta phase

$ -> state checking, memory assignment, and label assignment phase

@ -> assembly phase (assembly->binary array)

0 -> binary phase (binary -> bufferArray -> output file)

Each of these has different syntax and are almost like 4 different languages.

## the meta language
The meta langauge is the code that runs at compile time to construct your program.

Meta lines can start with `#` but the phase can be infered from the command used.
`#` is only required for `#set:` statements. Alternatively `#;` can be put to mean that all statements will be meta if they don't have a space specifying symbol (one of `@$#`)

Variables can be declared with `let`

`#let i = -1;`


List can be made by using lists of assembly `@` or state `$` code. Code lines are used as list items. This makes the language more consistent and more flexible.

`#let list = {1;2;3};`

Here `list` is simaltatiously a list of numbers and a block of code.


We can get the amount of items (i.e. statements) in a label by using `..length`
`..` is for accessing inbuilt properties.

`list..length;//3`

This can be printed out to the console using a `#debugger` statement

`#debugger list..length;//3`

These properties exist on all labels. The names will not conflict with custom made ones.


To avoid 0xmin/ZASM being turing complete at compile time: all iteration and recursion is fixed and must be stated before it can be done.

Iteration can only be done through using the `#repeat` statement.

`#repeat list..length: list;//puts multiple copies of the list into the output file`
The first part is the maximum iteration and the 2nd is any single statement.



The meta language is very powerful and flexible wich makes up for the lack of non-meta language features.
For example, a type can look like this
`let myListOfStrings:>list(string);`

Unlike many compiled languages with meta-programming 0xmin/ZASM's meta language is heavilly used, and feels close to the code.

### types
There is only 1 variable type: the label. It contains a number, list, properties and a few internal properties.


## the assembly language
the language can support different dialects for different machines (compilation targets).

Currently the 4 language modes are: 0xmin, tptasm, text (8 bit), raw binary filt (30 bit)

You can set the language mode by putting a `# "..."` at the very top of your source file: `#"0xmin";`, `#"tptasm";`, `#"int";`, or `#"text";`
By default the language is set to 0xmin.

The language modes affects the syntax for assembly (`@`) code, and how strings convert to numbers.

### #"0xmin";
#### command set:
0xmin currently has 16 commands (1 unused one). They are:

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

#### State checker
`#"0xmin";` has a state checker to prevent logic errors caused by irrisponcible jumping.
In order to jump from A to B the `move` pointer must have the same "state".
To ignore this rule `!` can be added at the begining of a command.
e.g. `jump +2; move +5; null` throughs an error
`!jump +2; move +5; null`