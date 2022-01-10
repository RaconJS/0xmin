#requires nodejs v16.7.0
function useExamples {
	#to use do
	./compile.sh inputFileName.0xmin outputFileName.filt 
	#or if your using The Powder Toy 
	./compile.sh inputFileName.0xmin minFilt.lua
}
function compile {
	#process inputs
		inputFileName=$1;
		outFileName=$2;
		isRunningFile=false;
		isUsingOutFileNameToExicute=true;
		runFileName="";
		args=("$@");
		# get number of elements 
		ELEMENTS=${#args[@]} 
		 
		# echo each element in array  
		# for loop 
		for (( i=0;i<$ELEMENTS;i++)); do 
			val=${args[${i}]}
			operator=$val
			val1=${args[$((i+1))]}
			#'-run true' runs the .filt file afterwards on the emulator
			if [[ "$operator" = "-run" || "$operator" = "-r" ]]; then
				if [[ $((i + 1)) < $ELEMENTS ]];then 
					isRunningFile=$val1;
				fi
				i=$(($i + 1));
				continue;
			elif [[ "$operator" = "-e" ]]; then #exicute '.filt' file name
				if [[ $((i + 1)) < $ELEMENTS ]];then 
					runFileName=$val1;
					isRunningFile=true;
				fi
				i=$(($i + 1));
				continue;
			#'-o name.filt'
			elif [[ $operator == "-o" ]]; then
				if [[ $((i + 1)) < $ELEMENTS ]];then
					outFileName=$val1;
					if $isUsingOutFileNameToExicute; then
						runFileName=$val1;
					fi
				fi
				i=$(($i + 1));
				continue;
			#default
			else
			inputFileName=$val;
			fi
		done
	#!/usr/bin/env bash
	#code.0xmin => code.filt or code.lua
	powderToyScriptsFolder=~/snap/the-powder-toy/current/.local/share/"The Powder Toy"/scripts;
	mainfolder=$(dirname ${BASH_SOURCE[0]});
	nodejs $mainfolder/compile.js $inputFileName $outFileName; #(nodejs test.js);
	if [[ -f minFilt.lua && -e "$powderToyScriptsFolder" ]]; then #if file exists
		a=1 #mv minFilt.lua "$powderToyScriptsFolder"; #~/snap/the-powder-toy/current/.local/share/'The Powder Toy'/scripts;
	fi;if $isRunningFile; then
		$mainfolder/../emulators/emulator3 $runFileName;
	fi
	return;
}
compile $@;
