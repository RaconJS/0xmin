%include "common"
start:
	exh r1,r1,0x2001
	mov r1,0x0
	mov r3,0x0
	exh r1,r1,0x2002
	mov r2,r1,r0
	jmp 0x7
	jy 0x6
	ld r2,r3,0x11
	st r2,r1
	add r3,0x1
	sub r0,r3,0xb
	jl 0x6
	hlt 
	jmp 0x0
	dw 0x0
	dw 0x0
	dw 0x0
	dw 0x68
	dw 0x65
	dw 0x6c
	dw 0x6c
	dw 0x6f
	dw 0x20
	dw 0x77
	dw 0x6f
	dw 0x72
	dw 0x6c
	dw 0x64