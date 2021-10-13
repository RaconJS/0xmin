#requires nodejs v16.7.0
function useExamples {
	#to use do
	./compile.sh inputFileName.0xmin outputFileName.filt 
	#or if your using The Powder Toy 
	./compile.sh inputFileName.0xmin minFilt.lua
}
function a {
	#!/usr/bin/env bash
	#code.0xmin => code.filt or code.lua
	inputFileName=$1;
	outFileName=$2;
	powderToyScriptsFolder=~/snap/the-powder-toy/current/.local/share/"The Powder Toy"/scripts;
	mainfolder=$(dirname ${BASH_SOURCE[0]});
	nodejs $mainfolder/compile.js $inputFileName $outFileName; #(nodejs test.js);
	if [[ -f minFilt.lua && -e "$powderToyScriptsFolder" ]]; then #if file exists
		mv minFilt.lua "$powderToyScriptsFolder"; #~/snap/the-powder-toy/current/.local/share/'The Powder Toy'/scripts;
	fi
	return;
}
a $1 $2;
