#installs the entire ZASM/0xmin envirment including all dependancies
#It is encuraged to read this source code to make sure you know what you are doing, and are fine with curtain files being overwriten
source ../settings.sh
sudo apt update
if ! type 0xmin; then
	#adding 0xmin command since it does not already exist
	echo alias 0min $PWD/language/0xmin.sh >> ~/.bashrc
fi

#for the 0xmin compiler
sudo apt install nodejs

#the c++ compiler 'g++' is only needed if you want build or modify the 0xmin emulator.
sudo apt install g++

sudo snap install sublime-text --classic
mv 0xmin/syntax_for_sublimeText ~/.config/sublime-text/Packages/0xmin

snap install the-powder-toy
if [ ! -d "$pathTo_ThePowderToy"/scripts ]; then
	echo install autorun from "https://powdertoy.co.uk/Discussions/Thread/View.html?Thread=19400"
	mkdir "$pathTo_ThePowderToy"/scripts;
fi;
mv the_powder_toy/Saves/0xmin.cps "$pathTo_ThePowderToy"/Saves/0xmin.cps
mv the_powder_toy/Saves/R216K2A.cps  "$pathTo_ThePowderToy"/Saves/R216K2A.cps 
mv the_powder_toy/scripts/"oxmin.lua" "$pathTo_ThePowderToy"/scripts/"oxmin.lua"

#The full 0xmin envirment is now installed.

#example programs
	mkdir 0xmin/examples
	cd 0xmin/examples
	touch hello\ world.0xmin
	echo "
#'0xmin';
'Hello, World!\h';
	" >> hello\ world.0xmin
	#0xmin files can now be compiled with "0xmin sourceFileName.0xmin -o outputFile.filt"
	0xmin hello\ world.0xmin -o hello\ world.filt
	#0xmin machinecode files (ending in '.filt') can be run with "0xmin -e outputFile.filt"
	0xmin -e hello\ world.0xmin
	echo "
#'tptasm';
#import lib 'R2/print.0xmin';
print('Hello, World!');
hault;
	" >> hello\ world\ for\ tptasm.0xmin
	0xmin hello\ world\ for\ tptasm.0xmin -o hello\ world.tptasm
	#in Sublime Text, files ending in '.0xmin', can be compiled (built) by pressing 'Ctrl' + 'b'
	sublime-text.subl hello\ world.0xmin
echo install autorun from "https://powdertoy.co.uk/Discussions/Thread/View.html?Thread=19400"