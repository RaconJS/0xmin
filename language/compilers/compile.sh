#!/usr/bin/env bash
#requires nodejs v16.7.0
function useExamples {
	#to use do
	./compile.sh inputFileName.0xmin outputFileName.filt 
	#or if your using The Powder Toy 
	./compile.sh inputFileName.0xmin minFilt.lua
}
function compile {
	mainfolder=$(dirname ${BASH_SOURCE[0]});
	#process inputs
		inputFileName=$1;
		outFileName=$2;
		externalOutFile=false; #true => dont make an internal file, for compiler->emulator
		isRunningFile=false;
		isUsingOutFileNameToExicute=true; # '-e'  => false
		runSpeed=60;
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
				isRunningFile=true #$val1;
				#if [[ $((i + 1)) < $ELEMENTS ]];then 
					if [[ $externalOutFile == false ]];then #for pipelineing compiler into emulator
						mv $mainfolder/../emulators/a.filt $mainfolder/../emulators/aOld.filt;
						outFileName=$mainfolder/../emulators/a.filt;
						runFileName=$mainfolder/../emulators/a.filt;
					fi
				#fi
				#i=$(($i + 1));
				continue;
			elif [[ "$operator" = "-e" ]]; then #'0xmin -e code.filt;' execute '.filt' file
				if [[ $((i + 1)) < $ELEMENTS ]];then 
					runFileName=$val1;
					isUsingOutFileNameToExicute=false;
					isRunningFile=true;
				fi
				i=$(($i + 1));
				continue;
			#'-o name.filt'
			elif [[ $operator == "-o" ]]; then
				if [[ $((i + 1)) < $ELEMENTS ]];then
					outFileName=$val1;
					externalOutFile=true;
					if $isUsingOutFileNameToExicute; then
						runFileName=$val1;
					fi
				fi
				i=$(($i + 1));
				continue;
			#'-s $runSpeed_in_fps'
			elif [[ $operator == "-s" ]]; then
				if [[ $((i + 1)) < $ELEMENTS ]];then
					runSpeed=$val1;
				fi
				i=$(($i + 1));
				continue;
			#'-sm $runSpeed_in_fps*60'
			elif [[ $operator == "-sm" ]]; then
				if [[ $((i + 1)) < $ELEMENTS ]];then
					runSpeed=$(($val1*60));
				fi
				i=$(($i + 1));
				continue;
			#default
			else
			inputFileName=$val;
			fi
		done
	
	#code.0xmin => code.filt or code.lua
	powderToyScriptsFolder=~/snap/the-powder-toy/current/.local/share/"The Powder Toy"/scripts;
	if [[ $isUsingOutFileNameToExicute == true ]]; then
		nodejs $mainfolder/compile.js $inputFileName $outFileName; #(nodejs test.js);
	fi
	if [[ -f minFilt.lua && -e "$powderToyScriptsFolder" ]]; then #if file exists
		mv minFilt.lua "$powderToyScriptsFolder"; #~/snap/the-powder-toy/current/.local/share/'The Powder Toy'/scripts;
	fi;
	if [[ $isRunningFile == true ]]; then
		test=0;
		if [[ -f $runFileName ]]; then
			test=1;
		else
			test=0;
		fi;echo $test;
		$mainfolder/../emulators/emulator4 $runFileName $test $runSpeed;
	fi
	return;
}
compile $@;
