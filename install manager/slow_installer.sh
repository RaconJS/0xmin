#!/usr/bin/env bash
#search words: TODO, UNFINISHED
source ../settings.sh
function main {
	#TODO: test and UI
	#TODO: complete file
	echo Welcome to the 0xmin installation helper.
	echo This program is meant to be an alternative to moveing and installing files manually.
	yes_or_no continue\? || exit
	echo 1/2: dependancies: nodejs version 16+, sublimeText, the-powder-toy
	
	echo 1-1/2: checking for nodejs
	if ! command -v nodejs; then
	    echo nodejs is missing
	    yes_or_no install nodejs\? && installNode
	else 
		echo nodejs found
		if [[ $(echo $(nodejs --version) | sed 's/[^0-9]*//') -lt 16 ]]; then
			echo nodejs version: $(nodejs --version)
			echo version 16 or later if required for the 0xmin compiler
			yes_or_no reinstall nodejs\? && installNode
		fi
	fi

	echo 2/2: unpack 0xmin files:

	echo 2-1/2: checking for sublimeText
	yes_or_no unpack the package for Sublime Text\? && (
		sublimetext="~/.config/sublime-text-3";
		if test -f $sublimetext;then
			echo sublimeText found #echo it appears there is already an 0xmin package in sumblimetext\?
		fi
		sublimetext="$pathTo_SublimeText_0xminPackage"
		yes_or_no use the file location: $sublimetext\? ||
		read -e -p "enter new file path for the sublimetext syntax package" sublimetext
		unpack_for_sublimetext $sublimetext
	)
	echo 2-2/2: checking for the the-powder-toy
	tptPath=$pathTo_ThePowderToy
	if ! command -v "the-powder-toy"; then
	    echo the-powder-toy is missing
	    yes_or_no install the-powder-toy from snap\? && installTPT
	else 
		echo the-powder-toy found
	fi
	yes_or_no use the file location: $tptPath\? ||
	read -e -p "enter new file path for the TPT 0xmin scripts and TPT 0xmin computer save" tptPath
	unpack_for_thePowderToy $tptPath
}
function unpack_for_sublimetext {
	echo unpacking Sublime Text files
	cp -r syntax_for_sublimeText $1
}
function unpack_for_thePowderToy {
	cp -r the_powder_toy $1
}
function installNode {
	echo installing node.js 16;
	sudo apt-get update;
	curl -sL https://deb.nodesource.com/setup_16.x | sudo -E bash -;
	sudo apt-get install -y nodejs;
	nodejs --version;
}
function installTPT {
	echo installing the-powder-toy;
	sudo snap install the-powder-toy;
}
function yes_or_no {
    read -e -p "$* [Y/n]:" choice
    [[ "$choice" == [Yy]* ]] && return 0 || return 1
}
function install {
	echo installing node.js 16;
	sudo apt-get update;
	curl -sL https://deb.nodesource.com/setup_16.x | sudo -E bash -;
	sudo apt-get install -y nodejs;
	nodejs --version;

	echo installing into sublime-text
	mv syntax_for_sublimeText ~/.config/sublime-text-3/Packages/0xmin
	#echo hello $(read varname;echo $varname;)
}
function uninstall {
	#!/usr/bin/env bash
	sudo apt-get update;
	sudo apt-get remove nodejs;
	mv ~/.config/sublime-text-3/Packages/0xmin syntax_for_sublimeText
}
main