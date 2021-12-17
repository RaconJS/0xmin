#!/usr/bin/env bash
echo preparing repo for git
echo code
cp -r ./../compilers ./language
cp -r ./../emulators ./language
cp -r ./../code ./language
cp -r ./../docs ./language
cp -r ./../include ./language
echo tpt
cp ~/snap/the-powder-toy/current/.local/share/"The Powder Toy"/Saves/"a subframe tester.cps" the_powder_toy/Saves/
echo sublime text
rm -r syntax_for_sublimeText
cp -r ~/./.config/sublime-text-3/Packages/0xmin syntax_for_sublimeText
#mv Packages syntax_for_sublimeText