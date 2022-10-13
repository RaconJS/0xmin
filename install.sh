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