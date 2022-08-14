# 0xmin
The 0xmin1 is currently, in 2022, the worlds smallest computer in ThePowderToy(https://powdertoy.co.uk/).


TPT = The Powder Toy

comes with a compiler, emulator.cpp, and the actual computer save itself.

old computer documentation
https://powdertoy.co.uk/Discussions/Thread/View.html?Thread=24348

## to install
1. Download the files.
2. make sure you have nodeJS Version 16+ installed.
or run:
```
sudo apt update;
curl -sL https://deb.nodesource.com/setup_16.x | sudo -E bash -;
sudo apt-get install -y nodejs;
```
3. You can now use the compiler and emulator.

## how to use
### the compiler:
To compile an 0xmin assembly file you can use the following:
For binary output: `./compiler.sh filename.0xmin -o outputName.filt`
For lua output: `./compiler.sh filename.0xmin -o outputName.lua`
To run in TPT:`./compiler.sh filename.0xmin` to send it to The Powder Toy. Then run it on the 0xmin save by doing `compile()` in the tpt comandline. Then unpause the save.
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
