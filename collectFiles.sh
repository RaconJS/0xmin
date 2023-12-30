#!/usr/bin/env bash
#this program gathers all the external files into the repo.
echo preparing repo for git
echo code
cp -r ./../compilers ./language
cp -r ./../emulators ./language
cp -r ./../examples ./language
cp -r ./../docs ./language
cp -r ./../include ./language
cp -r ./../0xmin.sh ./language
echo tpt
cp ~/snap/the-powder-toy/current/.local/share/"The Powder Toy"/Saves/"a subframe tester.cps" the_powder_toy/Saves/"0xmin.cps"
cp ~/snap/the-powder-toy/current/.local/share/"The Powder Toy"/Saves/"a_R216K2A.cps" the_powder_toy/Saves/"R216K2A.cps"
cp ~/snap/the-powder-toy/current/.local/share/"The Powder Toy"/scripts/"oxminv1.lua" the_powder_toy/scripts/"oxminv1.lua"
echo sublime text
rm -r syntax_for_sublimeText
cp -r ~/./.config/sublime-text-3/Packages/0xmin syntax_for_sublimeText
#mv Packages syntax_for_sublimeText