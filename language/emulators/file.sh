#!/usr/bin/env bash
#file.sh is run by file.out
g++ -pthread emulator.cpp -o 0xmin_emulator;
g++ -pthread r2emulator.cpp -o r2emulator;
echo done