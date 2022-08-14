# 0xmin
Worlds smallest computer in ThePowderToy: https://powdertoy.co.uk/. (as of 2022)

TPT = The Powder Toy

30bit
comes with a compiler, emulator.cpp, and the actual computer save itself.

old computer documentation
https://powdertoy.co.uk/Discussions/Thread/View.html?Thread=24348

## to install
1. Download the files.
2. make sure you have nodeJS 16+ installed.
or run:
```
sudo apt update;
curl -sL https://deb.nodesource.com/setup_16.x | sudo -E bash -;
sudo apt-get install -y nodejs;
```
3. You can now use the compiler and emulator.

## to use
to compile an 0xmin assembly file you can use the following:
for binary output: `./compiler.sh filename.0xmin outputName.filt`
for lua output: `./compiler.sh filename.0xmin outputName.lua`

or

`./compiler.sh filename.0xmin` to send it to The Powder Toy. Then run it on the 0xmin save by doing `compile()` in the tpt comandline. Then unpause the save.

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
