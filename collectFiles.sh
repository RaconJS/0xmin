#!/usr/bin/env bash
#this program gathers all the external files into the repo.
echo preparing repo for git
echo code
mkdir ./language
cp -r ./../compilers ./language
cp -r ./../emulators ./language
cp -r ./../examples ./language
cp -r ./../docs ./language
cp -r ./../include ./language
cp -r ./../0xmin.sh ./language
echo tpt
source ./settings.sh
cp "$pathTo_ThePowderToy"/Saves/"a subframe tester.cps" the_powder_toy/Saves/"0xmin.cps"
cp "$pathTo_ThePowderToy"/Saves/"a_R216K2A.cps" the_powder_toy/Saves/"R216K2A.cps"
cp "$pathTo_ThePowderToy"/scripts/"oxminv1.lua" the_powder_toy/scripts/"oxminv1.lua"
echo sublime text
rm -r syntax_for_sublimeText
cp -r ~/.config/sublime-text/Packages/0xmin syntax_for_sublimeText
#mv Packages syntax_for_sublimeText