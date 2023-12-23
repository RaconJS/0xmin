#!/usr/bin/env bash
function main {
	echo Welcome to the 0xmin installer.
	echo I would recommend reading this program\'s code first before continueing installing.
	yes_or_no continue\? || exit
	echo dependancies: nodejs version 16+, sublimeText, the-powder-toy
	
	echo checking for nodejs
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

	echo unpack 0xmin files:

	echo checking for sublimeText
	yes_or_no unpack the package for Sublime Text\? && (
		sublimetext="~/.config/sublime-text-3";
		if test -f $sublimetext;then
			echo sublimeText found #echo it appears there is already an 0xmin package in sumblimetext\?
		fi
		sublimetext= "~/.config/sublime-text-3/Packages/0xmin"
		yes_or_no use the file location: $sublimetext\? ||
		read -e -p "enter new file path for the sublimetext syntax package" sublimetext
		unpack_for_sublimetext $sublimetext
	)
}
function unpack_for_sublimetext {
	echo unpacking Sublime Text files
	cp -r syntax_for_sublimeText $1
}
function unpack_for_thePowderToy {
	cp -r the_powder_toy $1
}
function installNode {
	return 0
	echo installing node.js 16;
	sudo apt-get update;
	curl -sL https://deb.nodesource.com/setup_16.x | sudo -E bash -;
	sudo apt-get install -y nodejs;
	nodejs --version;
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