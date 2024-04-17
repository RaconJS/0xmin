#!/usr/bin/env bash
#requires nodejs v16.7.0
function useExamples {
	#to use do
	./0xmin.sh inputFileName.0xmin -o outputFileName.filt 
	#or if your using The Powder Toy 
	./0xmin.sh inputFileName.0xmin a.filt
		#or
		./0xmin.sh inputFileName.0xmin
}
function compile {
	mainfolder=$(dirname "${BASH_SOURCE[0]}");
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
			if [[ "$operator" = "-run" || "$operator" = "-r" ]]; then #0xmin -r file.0xmin
				isRunningFile=true #$val1;
				#if [[ $((i + 1)) < $ELEMENTS ]];then 
					if [[ $externalOutFile == false ]];then #for pipelineing compiler into emulator
						mv $mainfolder/emulators/a.filt $mainfolder/emulators/aOld.filt;
						outFileName=$mainfolder/emulators/a.filt;
						runFileName=$mainfolder/emulators/a.filt;
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
					val1=$val1;
				else
					val1=a.filt;
				fi

				outFileName=$val1;
				externalOutFile=true;
				if $isUsingOutFileNameToExicute; then
					runFileName=$val1;
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
			elif [[ $operator == "-help" || $operator == "--help" ]]; then
				echo compiles .0xmin files
				echo
				echo \`0xmin sourceCode.0xmin -o outputFile.filt\`
				echo
				echo flags:
				echo -o filePath.filt -\> output
				echo
				printf '%s ' -\e filePath.filt -\> runs program on the 0xmin emulator
				echo
				echo
				echo -r filePath.0xmin -\> compiles and then runs .0xmin program
				echo
				echo -s -\> speed of the emulator in ticks per second. e.g. \`0xmin -\e a.filt -s 10\`
				echo
				echo -sm -\> speed multiplier, makes emulator run at x\*60 ticks per second. e.g. \`0xmin -\e a.filt -sm 10\`
			#default
			else
			inputFileName=$val;
			fi
		done
	
	#code.0xmin => code.filt or code.asm
	powderToyScriptsFolder=~/snap/the-powder-toy/current/.local/share/"The Powder Toy"/scripts;
	if [[ $isUsingOutFileNameToExicute == true ]]; then
		nodejs $mainfolder/compilers/compile.js "$inputFileName" $outFileName; #(nodejs test.js);
	fi
	if [[ -f a.filt && -e "$powderToyScriptsFolder" ]]; then #if file exists
		mv a.filt "$powderToyScriptsFolder"; #~/snap/the-powder-toy/current/.local/share/'The Powder Toy'/scripts;
	fi;
	if [[ -f a.asm && -e "$powderToyScriptsFolder" ]]; then #if file exists
		mv a.asm "$powderToyScriptsFolder"; #~/snap/the-powder-toy/current/.local/share/'The Powder Toy'/scripts;
	fi;
	if [[ $isRunningFile == true ]]; then
		test=0;
		if [[ -f $runFileName ]]; then
			test=1;
		else
			test=0;
		fi;echo $test;
		$mainfolder/emulators/0xmin_emulator $runFileName $test $runSpeed;
	fi
	return;
}
compile "$@";
