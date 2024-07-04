//clang r2emulator.cpp
/*
	// #include <chrono>
	#include <thread>
	//normal stuff
	#include <iostream>
	#include <cmath>
	//read file
	#include <fstream>
	#include <iterator>
	#include <vector>
	//terminal dimentions
		// #include <sys/ioctl.h>
		// #include <unistd.h>
	//get key inputs, use `cin` without enter
	#include <termios.h>//termios, TCSANOW, ECHO, ICANON
	#include <unistd.h>//STDIN_FILENO
*/
//read file
	#include <fstream>
	#include <iterator>
	#include <vector>
//input output
	#include <iostream>
//memset
	#include <cstring>
//threads
	#include <thread>
//time
	#include <chrono>
//get key inputs, use `cin` without enter
	#include <termios.h>//termios, TCSANOW, ECHO, ICANON
	#include <unistd.h>//STDIN_FILENO
//#include <termios.h>//termios, TCSANOW, ECHO, ICANON
//#include <unistd.h>//STDIN_FILENO
using namespace std;
typedef unsigned char u8;
typedef unsigned int u32;
typedef unsigned short int u16;
typedef unsigned long int u64;
#define hex (void*)(long)
const u32 redFilt = 0x20000000;
void mySleep(float x){
	std::this_thread::sleep_for(std::chrono::microseconds((int)(x*1000)));
}
class TextCanvas{//col,pos,clear;
	public://private:
	struct{
		int reset=0,bold=1,underline=4,inverse=7,bold_off=21,underline_off=24,inverse_off=27;
	}text_style;
	struct {
		int black=30,red=31,green=32,yellow=33,blue=34,magenta=35,cyan=36,white=37;
	}text_color;
	void onload(){cout<<clearWindow()<<resetStyle()<<setStyle(text_style.bold)<<"textCanvas:::loaded\n"<<resetStyle();}
	void unload(){cout/*<<clearWindow()*/<<resetStyle()<<setStyle(text_style.bold)<<"textCanvas:::deleted\n"<<resetStyle();}
	string setColor(int colourNumber=0){
		return (string)("\033["+to_string(((int*)&text_color)[colourNumber])+"m");
		//return (string)("\033["+to_string(*((int**)&text_style)[colourNumber])+"m");
	}
	string moveTo(int x,int y){
		return (string)("\033["+to_string(y)+";"+to_string(x)+"H");
	};
	string clearWindow(){
		return "\033[H\033[2J\033[3J";
	}
	public:
	int width=132,height=43-4;
	TextCanvas(){ if(0)onload();};
	~TextCanvas(){if(0)unload();}
	string col(int args[2]){//0-15
		const int map[]={0,4,2,6,1,5,3,7, 0+8,4+8,2+8,6+8,1+8,5+8,3+8,7+8};//from R2 terminal to bash terminal
		const int mappedArgs[]={map[args[0]],map[args[1]]};
		return "\x1b["+to_string(mappedArgs[0]+(mappedArgs[0]>7?90-8:30))
		+(args[1]==0?"":";"+to_string(mappedArgs[1]+(mappedArgs[1]>7?100-8:40)))
		+"m";
	}
	string col(int color,int bgColor){
		int args[2]={color,bgColor};
		return col(args);
	}
	string pos(int args[2]){//0-15
		return "\033["+to_string(args[1])+";"+to_string(args[0])+"H";
	}
	string pos(int y,int x){
		int args[2]={x,y};
		return pos(args);
	}
	string update(){
		cout<<std::flush;
		return "";
	}
	string setStyle(int style,int col){
		return "\033["+to_string(((int*)&text_style)[style])+";"+to_string(((int*)&text_color)[col])+"m";
	}
	string setColor(int col,int style){
		return setStyle(style,col);
	}
	string resetStyle(){return setStyle(0);};
	string setStyle(int colourNumber=0){
		return (string)("\033["+to_string(((int*)&text_style)[colourNumber])+"m");
		//return (string)("\033["+to_string(*((int**)&text_style)[colourNumber])+"m");
	}
	string clear(){return clearWindow();}
	//string endWindow(){return "\033[K";}
}ctx;
struct IO{
	public:
	volatile u32 input;
	volatile u32 output;
}io;
class R2Terminal{
	public:
	volatile u32 &portValue = io.output;
	volatile u32 &output = portValue;
	short int x=0,y=0;
	short int bgColor=0,fgColor=15;
	short int dims[2]={16,12};
	short int dims_internal[2]={16,16};
	short int offset_x=2,offset_y=2;
	void onEnd(){
		cout<<ctx.moveTo(0,dims[1]+offset_y+1);
	}
	void innit(){
		cout<<ctx.moveTo(1,1);
		if(0){//testing larger terminal
			short int asd[2]={40,100};
			dims[0]=dims_internal[0]=asd[0];
			dims[1]=dims_internal[1]=asd[1];
		}
		else{
			string str="";
			str+="┌";for(int i=0;i<dims[0];i++)str+="─";str+="┐\n";
			for(int i=0;i<dims[1];i++){
				str+="│";
				for(int j=0;j<dims[0];j++){
					str+=' ';
				}
				str+="│";
				str+='\n';
			}
			str+="└";for(int i=0;i<dims[0];i++)str+="─";str+="┘";
			cout<<str;
		}
		output = redFilt;
	}
	u32 redFilt =0x20000000;
	u32 data    =0x00020000;//char
	u32 _char   =0x00000000;//0x10??,
	u32 _pos    =0x00001000;//0x1???, //0x1yyx
	u32 _col    =0x00002000;//0x20??,
	u32 _confirm=0x00010000; //0x20030000,
	void endOfY(){
		//ctx.pos(0,0);
		x=0;y=0;
	}
	void endOfX(){
		//ctx.pos(0,0);
		x=0;nextY();
		coutChar('\n');
	}
	void coutChar(char charOut){
		if(x<dims[0]&&y<dims[1]){
			cout
				<<ctx.col(fgColor,bgColor)
				<<ctx.pos(y+offset_y,x+offset_x)//data.value=0x00020000;
			;
			//"┘└┐┌┴├┬"
			int charAsInt = charOut&0xff;
			if(0){}
			else if(charAsInt==0xd9)cout<<"─";
			else if(charAsInt==0xda)cout<<"│";
			else if(charAsInt==0xdf)cout<<"┘";
			else if(charAsInt==0xe0)cout<<"└";
			else if(charAsInt==0xe1)cout<<"┐";
			else if(charAsInt==0xe2)cout<<"┌";

			else if(charAsInt==0xe3)cout<<"┴";
			else if(charAsInt==0xe4)cout<<"├";
			else if(charAsInt==0xe5)cout<<"┬";
			else if(charAsInt==0xe6)cout<<"┤";
			else if(charAsInt==0xe7)cout<<"┼";
			else cout<<charOut;
		}
	}
	void nextX(){
		x=(x+1)%dims_internal[0];
		if(x==0){
			nextY();
		}
	}
	void nextY(){
		y=(y+1)%dims_internal[1];
		x=0;
		if(y==0){
			//coutChar('\n');coutChar('\n');
		}
		else coutChar('\n');
	}
	void print(char charOut){
		if(charOut=='\n'){
			nextY();
		}else if(charOut=='\t'){
			for(int i=0;i<2;i++)print(' ');
		}else{
			coutChar(charOut);
			nextX();
		}
		cout<<ctx.resetStyle();
	}
	void onUpdate(){
		//*input=redFilt;
		handle_output:{
			u32 filtObj = output;
			if(filtObj&redFilt){
				if(filtObj&data){
					switch((u32)filtObj&0x0000f000){
						case 0x00000000://char
							print((char)filtObj&0xff);
							break;
						case 0x00001000://pos 0x1yyx
							x=(filtObj&0x00f);
							y=(filtObj&0xff0)/0x10;
							cout<<ctx.pos(y+1,x+1);
							break;
						case 0x00002000://col 0x20fb
							fgColor=(filtObj&0x0f);
							bgColor=(filtObj&0xf0)/0x10;
							//cout<<ctx.col(fgColor,bgColor);
							break;
					}
				}
			}
		}
	}
}terminal;
class R2KeyBoard{
		public:
		volatile u32 &input = io.input;//from keyboard 'terminal.input'
		volatile u32 &output = io.output;//from CPU 'terminal.output'
		u32 inputValue;
		char inputChar;
		bool inputWasPressed;
		const u32 attensionRequest=0x20010000;
		const u32 confirm = 0x00010000;
		const u32 data = 0x00020000;
		u32 bufferToinput[16];
		int mode=0;//sleep,hasInput,
		short int dims[2]={4,1};
		short int offset_x,offset_y;
		int coolDown=0;
		void onUpdate(){//called every frame
			u32 returnVal=0;
			int latencyFrames=0;
			if(coolDown==0){
				if(mode==0){//default idle state
					if(inputWasPressed){//onKeyDown("go to next stage");
						latencyFrames=14;
						returnVal=attensionRequest;
						mode=1;
					}
					else if(output==attensionRequest){
						latencyFrames=14;//TEST
						returnVal=0x20028000;//failed request
					}
					else {
						latencyFrames=14;//TEST
						returnVal=0x20000000;
					}
				}
				else if(mode==1){//ready for attension request
					if(output==attensionRequest){
						if(inputWasPressed){
							latencyFrames=5;
							coolDown=5;
							returnVal=inputChar|data|redFilt;
							bufferToinput[latencyFrames+1]=returnVal;//is done for 2 frames
							mode=2;
						}
					}
					else {
						latencyFrames=6;//0; trialing '6' since it wasn't working
						returnVal=attensionRequest;
					}
				}
				else if(mode==2){//sends the charactor for a second time.
					inputWasPressed=false;
					mode=0;
				}
			}
			int pos[2]={offset_x+3,offset_y};
			if(returnVal!=0){
				bufferToinput[latencyFrames]=returnVal;
			}
			if(coolDown>0)coolDown--;
			if(bufferToinput[0]!=0){
				input=bufferToinput[0];
				inputValue=bufferToinput[0];
			}
			bufferToinput[16-1]=0x20000000;
			for(int i=0;i<16-1;i++){
				bufferToinput[i]=bufferToinput[i+1];
			}
			gotoInputPos();
		}
		void gotoInputPos(){
			cout<<ctx.moveTo(terminal.dims[0]+terminal.offset_x+1,terminal.offset_y);
		}
		static void inputListener();
		void innit(){
			for(int i=0;i<16;i++)bufferToinput[i]=0;
			gotoInputPos();
		}
		bool isRunning=true;
}keyboard;
class Ram{
	public:
	Ram(){
		size = 0x10000;
		for (u32 i = 0; i < size; ++i){
			ram[i] = redFilt;
		}
	}
	u32 size;
	u32 ram[0x10000];
	u32 get(u16 address){
		if(address>sizeof(ram)/sizeof(u32)){
			std::cout<<"address:"<<(hex address)<<endl;
			throw;
		}
		return ram[address];
	}
	void set(u16 address,u32 value){
		ram[address] = value;
	}
};
class FiltCPU{
	public:
	volatile u32* io_input = &io.input;//from keyboard
	volatile u32* io_output = &io.output;//to terminal
	bool haulted = false;
	virtual void update(){
		*io_output = redFilt;
		if(haulted){
			return;
		}
	};
	virtual void innit(){
		if(haulted){
			return;
		}
	};
};
u32 i;
class r2CPU:public FiltCPU{
	public:
	void innit(){
		reset_all();
	};
	Ram* ram = new Ram();
	r2CPU(){}
	~r2CPU(){}
	struct Flags{
		bool sign;
		bool carry;
		bool overflow;
		bool zero;
	}flags;
	u16 registers[16];
	u16& sp = registers[14];
	u16& ip = registers[15];
	u16 internalValue;//used for chain shifting
	u16 mask;
	class CommandData{
		public:
			u32 value;
		public:
			u8 jumpType;
			u8 opcodeClass;//:enum(0,P,S,PS)
		public:
			u8 R1;
			u8 R2;
			u8 RB;
			u16 I1;
			u8 I2;
		public:
			u8 opcode;//instruction
			u8 opandType;
			bool includeRB;
			bool subRB;
		public:
			bool arg1FromRam;
			bool arg2FromRam;
			bool includeR2;
			bool includeR1;
		public:
			u16 outputPointer;
			u16 arg1Value;//:int | address
			u16 arg2Value;//:int | address
		void getDataFromValue(u32 command){
			value = command;
			{//opand data: bits 0-19
				R1 = I2 = jumpType = command & 0xf;//bits 0-3
				I1 = (command >> 4) & 0xffff;//bits 4-19
				R2 = (command >> 4) & 0xf;//bits 4-7
				RB = (command >> 16) & 0xf;//bits 16-19
			}
			{//opcode data: bits 15 + 20-28
				includeRB = (bool)((command >> 20) & 8);//bit 22
				if(includeRB)I1 = I1 & 0x7ff;//U11
				opandType = (command >> 20) & 0b111;//bits 22-24
				subRB = (bool)((command >> 12) & 8);//bit 14
				opcode = (command >> 24) & 0x1f;
			}
			{
				arg1FromRam = (bool)(opandType&0x4);
				arg2FromRam = !arg1FromRam && (opandType&1);
				includeR1 = !arg1FromRam || !(opandType&1);
				if(arg1FromRam && !includeR1)R2 = R1;//handle `OPER [U16_I1], REG_R2`
				includeR2 = !(opandType&0x2);
			}
		}
	}commandData;
	void reset_all(){
		reset_state();
		reset_registers();
	}
	void reset_ram(){
		std::memset(ram, 0, sizeof *ram);
	}
	void reset_registers(){
		std::memset(registers, 0, sizeof registers);
	}
	void reset_state(){
		internalValue = 0;
		flags = Flags{};
		*io_input = redFilt;
		*io_output = redFilt;
		commandData = CommandData{};
		mask = 0;
	}
	void setValue(u32 value){
		if(commandData.arg1FromRam)
			setRamValue(commandData.outputPointer,value);
		else registers[commandData.R1] = 0xffff&(u16)value;
	}
	void setRamValue(u16 address,u32 value){
		ram->set(addRBtoAddress(address),0x3fffffff&(0x20000000|(((u32)mask)<<16)|(u32)(0xffff&value)));
	}
	void updateState(u32 value,bool write){
		internalValue = commandData.arg1Value;
		flags.sign = value & 0x8000;
		flags.zero = value == 0;
		flags.overflow = 0;
		flags.carry = 0;
		if(write)setValue(value);
	}
	void setFlagsForAdd(u32 arg1,u32 arg2,u32 output){//where: o = f(a,b);
		auto a = arg1, b = arg2, o = output;
		flags.carry = (o >> 16)&1;
		flags.overflow = ((a>>15) == (b>>15)) && (((o>>15)&1) != (b>>15));
	}
	void setFlagsForSub(u32 arg1,u32 arg2,u32 output){//where: o = f(a,b);
		auto a = arg1, b = arg2, o = output;
		flags.carry = (a < b);//unsigned
		flags.overflow = ((a>>15) != (b>>15)) && ((b>>15) == ((o>>15)&1));
	}
	void disassemble(CommandData commandData){
		cout<<(std::string[]){
			"mov", "and", "or", "xor", "add", "adc", "sub", "sbb", "swm", "ands", "ors", "xors", "adds", "adcs", "subs", "sbbs", "hlt", "j", "rol", "ror", "shl", "shr", "scl", "scr", "bump", "wait", "send", "recv", "push", "pop", "call", "ret"
		}[commandData.opcode];
		if(commandData.opcode == 0x11){
			cout<<(std::string[]){"mp", "n", "b", "ae", "o", "no", "s", "ns", "z", "nz", "le", "g", "l", "ge", "be", "a"}[commandData.jumpType];
		}
		char addOrSub = "+-"[commandData.subRB];
		cout<<" ";
		{
			if(commandData.arg1FromRam){
				cout<<"*";
				if(commandData.includeRB)cout<<"r"<<0+commandData.RB<<addOrSub;
			}
			if(commandData.includeR1)cout<<"r"<<0+commandData.R1;
			else cout<<hex commandData.I1;
		}
		cout<<" ";
		{
			if(commandData.arg2FromRam){
				cout<<"*";
				if(commandData.includeRB)cout<<"r"<<0+commandData.RB<<addOrSub;
			}
			if(commandData.includeR2)cout<<"r"<<0+commandData.R2;
			else if(commandData.includeR1)cout<<hex commandData.I1;
			else cout<<"r"<<hex commandData.I2;
		}
		cout<<" ";
	}
	u16 addRBtoAddress(u16 address){
		return !commandData.includeRB?address:
			registers[commandData.RB]+(commandData.subRB?-address:address);
	}
	u32 getFromRam(u16 address, CommandData commandData){
		return ram->get(addRBtoAddress(address));
	}
	void update() override {//:mutates ram & self
		*io_output = redFilt;
		if(haulted)throw;
		u32 command = ram->get(ip);
		commandData.getDataFromValue(command);//:@(~CommandData)->CommandData & mutates commandData
		u16 arg1,arg2;
		arg1 = commandData.includeR1?registers[commandData.R1]:commandData.I1;
		if(commandData.arg1FromRam){
			commandData.outputPointer = arg1;
			arg1 = 0xffff & getFromRam(arg1,commandData);
		}
		else commandData.outputPointer = 0;
		commandData.arg1Value = arg1;
		arg2 = commandData.includeR2?registers[commandData.R2]:commandData.includeR1?commandData.I1:(u16)commandData.I2;
		if(commandData.arg2FromRam)arg2 = 0xffff & getFromRam(arg2,commandData);
		commandData.arg2Value = arg2;
		bool hasJumped = false;
		bool silent = true;
		arg1&=0xffff;
		arg2&=0xffff;
		u32 output=arg2;//require: output is assigned in all cases
		u32 a=arg1,b=arg2,&o=output;
		const u32 R2TERM_PORT = 0;//terminal port
		const u32 R2TERM_PORT_IN = 0;//keyboard port
		switch(commandData.opcode){
			case 0x00://MOV
				updateState(b,true);
				break;
			case 0x01://AND
				silent = false;
			case 0x09://ANDS
				output = a & b;
				if(!silent)setValue(output);
				updateState(output,false);
				break;
			case 0x02://OR
				silent = false;
			case 0x0A://ORS
				output = a | b;
				if(!silent)setValue(output);
				updateState(output,false);
				break;
			case 0x03://XOR
				silent = false;
			case 0x0B://XORS
				output = a ^ b;
				if(!silent)setValue(output);
				updateState(output,false);
				break;
			case 0x04://ADD
				silent = false;
			case 0x0C://ADDS
				output = a + b;
				updateForAddision:{
					if(!silent)setValue(output);
					updateState(output,false);
					setFlagsForAdd(a,b,o);
					break;
				}
			case 0x05://ADC
				silent = false;
			case 0x0D://ADCS
				output = a + b + flags.carry;
				goto updateForAddision;
			case 0x06://SUB
				silent = false;
			case 0x0E://SUBS / CMP
				output = a - b;
				updateForSubtration:{
					if(!silent)setValue(output);
					updateState(output,false);
					setFlagsForSub(a,b,o);
					break;
				}//R_flag(q3);F_Carr = (q1 < q2);F_Over = ((q1>>15)!=(q2>>15)) && ((q2>>15)==(q3>>15));
				break;
			case 0x07://SBB
				silent = false;
			case 0x0F://SBBS
				output = a - b - flags.carry;
				goto updateForSubtration;
			case 0x08://SWM
				output = b;
				updateState(output,false);
				mask = (b & 0x1FFF);
				break;
			case 0x10://HLT
				haulted = true;
				break;
			case 0x11://J**
				ip++;
				hasJumped = true;
				switch(commandData.jumpType){
					case 0x0://JMP			TRUE
						ip = b;
						break;
					case 0x1://JN			FALSE	NOP
						break;
					case 0x2://JB/JNAE/JC	C = 1
						if(flags.carry)ip = b;
						break;
					case 0x3://JNB/JAE/JNC	C = 0
						if(!flags.carry)ip = b;
						break;
					case 0x4://JO			O = 1
						if(flags.overflow)ip = b;
						break;
					case 0x5://JNO			O = 0
						if(!flags.overflow)ip = b;
						break;
					case 0x6://JS			S = 1
						if(flags.sign)ip = b;
						break;
					case 0x7://JNS			S = 0
						if(!flags.sign)ip = b;
						break;
					case 0x8://JE/JZ		Z = 1
						if(flags.zero)ip = b;
						break;
					case 0x9://JNE/JNZ		Z = 0
						if(!flags.zero)ip = b;
						break;
					case 0xA://JLE/JNG		Z = 1 OR S != O
						if(flags.zero || flags.sign!=flags.overflow)ip = b;
						break;
					case 0xB://JNLE/JG		Z = 0 OR S = O
						if(!flags.zero && flags.sign==flags.overflow)ip = b;
						break;
					case 0xC://JL/JNGE		S != O
						if(flags.sign != flags.overflow)ip = b;
						break;
					case 0xD://JNL/JGE		S = O
						if(flags.sign == flags.overflow)ip = b;
						break;
					case 0xE://JBE/JNA		C = 1 OR Z = 1
						if(flags.carry || flags.zero)ip = b;
						break;
					case 0xF://JNBE/JA		C = 0 AND Z = 0
						if(!flags.carry && !flags.zero)ip = b;
						break;
				}
				break;
			case 0x12://ROL <<
				b &= 0xF;
				output = a;
				for(int i=0;i<b;i++) o = ((o << 1) | (o >> 15)) & 0xFFFF;
				updateState(output,true);
				break;
			case 0x13://ROR >>
				b &= 0xF;
				output = a;
				for(int i=0;i<b;i++) o = ((o & 0x01)<<15) | (o >> 1);
				updateState(output,true);
				break;
			case 0x14://SHL <<
				b &= 0xF;
				output = (a << b) & 0xFFFF;
				updateState(output,true);
				break;
			case 0x15://SHR >>
				b &= 0xF;
				output = a >> b;
				updateState(output,true);
				break;
			case 0x16://SCL << (NEW)
				b &= 0xF;
				output = ((((a<<16)|((u32)internalValue)) << b) >> 16) & 0xFFFF;
				updateState(output,true);
				break;
			case 0x17://SCR	>>
				b &= 0xF;
				output = (((((u32)internalValue) << 16) | a) >> b) & 0xFFFF;
				updateState(output,true);
				break;
			case 0x18://BUMP
				if(a == R2TERM_PORT_IN)
					*io_output = redFilt | keyboard.confirm;
				break;
			case 0x19://WAIT
				output = -1;
				if(*io_input & keyboard.confirm){
					output = R2TERM_PORT_IN;
				}
				updateState(output,true);
				break;
			case 0x1A://SEND
				if(a == R2TERM_PORT) *io_output = b | keyboard.data | 0x20000000;
				break;
			case 0x1B://RECV
				if(b == R2TERM_PORT_IN){
					if(*io_input & keyboard.data){
						updateState(*io_input,true);
						flags.carry = true;
					} else {
						updateState(0,false);
					}
				}
				break;
			case 0x1C://PUSH
				setRamValue(--sp,b);
				output = b;
				updateState(output,false);
				break;
			case 0x1D://POP
				output = ram->get(sp++);
				updateState(output,true);
				break;
			case 0x1E://CALL
				//R2_MEM[(--R2_REG[14]) & R2_SIZE] = (R2_REG[15] + 1) | R2_WM | 0x20000000;
				//R2_REG[15] = q1;
				setRamValue(--sp,ip+1);
				ip = b;
				hasJumped = true;
				break;
			case 0x1F://RET
				ip = ram->get(sp++);
				hasJumped = true;
				break;
			default:{
				//fprintf(stderr,"Error at Rstep.\n");
			}
		}
		if(!hasJumped)ip++;
	}
	void display(){
		TEST:{
			//keyboard.gotoInputPos();
			//cout<<"                                     ";
			//keyboard.gotoInputPos();
			cout<<(ip<0x10?"  ":ip<0x100?" ":"")<<hex ip<<"|";
			cout<<hex commandData.value<<"|";
			cout<<(!flags.zero?" ":"z");
			cout<<(!flags.sign?" ":"s");
			cout<<(!flags.carry?" ":"c");
			cout<<(!flags.overflow?" ":"o");
			cout<<hex *io_input;
			cout<<hex *io_output<<" | ";
			disassemble(commandData);
			cout<<"\033[65D"<<"\033[65C";
			cout<<"[";for(u8 i=0;i<16;i++){cout<<hex registers[i]<<",";};cout<<"]";
		}
	}
}cpu;
void R2KeyBoard::inputListener(){
	int pos[2]={keyboard.offset_x+1+4,keyboard.offset_y};
	while(keyboard.isRunning){
		//cout<<ctx.moveTo(pos[0],pos[1]);
		#define ngetc(c) (read (0, (c), 1))
		ngetc(&keyboard.inputChar);//keyboard.inputChar=std::getchar();
		{//map keys to r2 keyboard
			if(keyboard.inputChar > 0x20 && keyboard.inputChar < 0x7f){}//normal charactors
			else if(keyboard.inputChar == '\n')keyboard.inputChar = '\r';//enter
			else if(keyboard.inputChar == 0x7f)keyboard.inputChar = '\x08';//delete
			else{//unhandled case
				//TEST
				// cout<<"KEYCODE:"<<hex keyboard.inputChar<<endl;
				// throw;
			}
		}
		cout<<keyboard.inputChar<<endl;
		keyboard.inputWasPressed=true;
		if(cpu.haulted)return;
	}
}
class GetKeyInput{
	struct termios oldt, newt;
	public:
	GetKeyInput(){//allows std::getchar(); to not need '\n'
		//code I "borrowed" from stack overflow
		int c;   

		//tcgetattr gets the parameters of the current terminal
		//STDIN_FILENO will tell tcgetattr that it should write the settings
		//of stdin to oldt
		tcgetattr( STDIN_FILENO, &oldt);
		//now the settings will be copied
		newt = oldt;

		//ICANON normally takes care that one line at a time will be processed
		//that means it will return if it sees a "\n" or an EOF or an EOL
		newt.c_lflag &= ~(ICANON);          

		//Those new settings will be set to STDIN
		//TCSANOW tells tcsetattr to change attributes immediately.
		tcsetattr( STDIN_FILENO, TCSANOW, &newt);
	
	}
	~GetKeyInput(){
		//restore the old settings
		tcsetattr( STDIN_FILENO, TCSANOW, &oldt);
	}
}getKeyInput;
float runSpeed = 60;
void mainThread(){
	for (i = 0; i < 1000 || true; ++i){
		cpu.update();
		terminal.onUpdate();
		keyboard.onUpdate();
		if(cpu.haulted){
			return;
		}
		//TEST:{int a;cin>>a;}
		//terminal.onEnd();cout<<"ip:"<<hex cpu.ip<<"    ";//TEST
		ctx.update();
		mySleep(1000./runSpeed);
	}
}
void foo(){}
int main(int argc, char const *argv[]){
	const char* fileName;
	{//load data
		if(argc>2){//0:???,1:file,2:file exists, 3:speed
			if(argv[2][0]=='0'){//if emulator is exicuted using the 0xmin bash command
				cout//&& if given file didnt exist
					<<"\x1b[36;1m"<<"emulator :: "<<"\x1b[0m"
					<<"\x1b[31;1m"<<"0xmin-ERROR :: "<<"\x1b[0m"
					<<"file: '"<<argv[1]<<"' does not exist."
					<<" Emulator needs '.filt' file."
				;return 1;
			}
			else fileName=argv[1];
			if(argc>3){
				runSpeed=stof(argv[3]);cout<<runSpeed;
			}
		}else{//0:???,
			if(argc<=1){
				fileName="a.filt";//"../compilers/quine.filt";
			}
			else {
				fileName=argv[1];
			}
		}
		{
			std::ifstream inputFile(fileName, std::ios::binary );
			std::vector<char> buffer(std::istreambuf_iterator<char>(inputFile), {});
			int ramLen=(int)buffer.size()/4;

			//ram=new filt30[ramLen];
			for(int i=3;i<buffer.size();i+=4){
				int n=(int)(i/4);
				u32 val=0;
				val=(val<<8)+(buffer.at(i)&0xff);
				val=(val<<8)+(buffer.at(i-1)&0xff);
				val=(val<<8)+(buffer.at(i-2)&0xff);
				val=(val<<8)+(buffer.at(i-3)&0xff);
				cpu.ram->ram[n]=val;
				//cout<<(void*)(long)ram[n]<<" ";
			}
			buffer.clear();//free memory "hopefully"
			inputFile.close();
		}
	}
	cout<<ctx.clear();
	terminal.innit();
	keyboard.innit();
	cpu.innit();
	const bool TEST = false;
	if(TEST){
		//mainThread();
		cout<<ctx.clear();
		for(int i=0;i<100;i++){
			cpu.update();
			cpu.display();
			cout<<endl;
			if(cpu.haulted)break;
			//mySleep(1000./runSpeed);
		}
	}
	else{
		auto main = std::thread(mainThread);
		auto listener = std::thread(R2KeyBoard::inputListener);
		listener.detach();
		main.join();
	}
	//terminal.onEnd();
	cout<<"i:"<<i;
	cout<<endl;
	return 0;
}