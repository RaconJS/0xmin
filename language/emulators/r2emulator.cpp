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
	u32 input;
	u32 output;
}io;
class R2Terminal{
	public:
	u32 &portValue = io.output;
	u32 &output = portValue;
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
			output=redFilt;
		}
	}
}terminal;
class R2KeyBoard{
		public:
		u32 &input = io.input;//from keyboard 'terminal.input'
		u32 &output = io.output;//from CPU 'terminal.output'
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
						returnVal=0x20028000;//failed request
					}
					else returnVal=0x20000000;
				}
				else if(mode==1){//ready for attension request
					if(output==attensionRequest){
						if(inputWasPressed){
							latencyFrames=5;
							coolDown=5;
							returnVal=inputChar|confirm|data;
							mode=2;
						}
					}
					else {
						latencyFrames=0;
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
void R2KeyBoard::inputListener(){
	int pos[2]={keyboard.offset_x+1+4,keyboard.offset_y};
	if(0)while(keyboard.isRunning){
		//cout<<ctx.moveTo(pos[0],pos[1]);
		keyboard.inputChar=std::getchar();
		keyboard.inputWasPressed=true;
	}
}
class Ram{
	public:
	Ram(){
		for (u32 i = 0; i < size; ++i){
			ram[i] = 0;
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
	u32* io_input = &io.input;//from keyboard
	u32* io_output = &io.output;//to terminal
	bool haulted = false;
	virtual void update(){
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
class r2CPU:public FiltCPU{
	public:
	void innit(){
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
				includeRB = (bool)((command >> 20) & 1);//bit 20
				opandType = (command >> 20) & 0b111;//bits 22-24
				subRB = (bool)((command >> 15) & 1);//
				opcode = (command >> 24) & 0x1f;
			}
			{
				arg1FromRam = opandType&0x4;
				arg2FromRam = !arg1FromRam && (bool)(opandType&1);
				includeR1 = !arg1FromRam && !(bool)(opandType&1);
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
		if(commandData.arg2FromRam)
			setRamValue(commandData.outputPointer,value);
		else registers[commandData.R1] = 0xffff&(u16)value;
	}
	void setRamValue(u16 address,u32 value){
		ram->set(address,0x3fffffff&(0x20000000|(((u32)mask)<<16)|(0xffff&value)));
	}
	void updateState(u32 value,bool write){
		internalValue = commandData.arg1Value;
		flags.sign = value & 0x8000 != 0;
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
	void update() override {//:mutates ram & self
		u32 command = ram->get(ip);
		commandData.getDataFromValue(command);//:@(~CommandData)->CommandData & mutates commandData
		u16 arg1,arg2;
		arg1 = commandData.includeR1?registers[commandData.R1]:commandData.I1;
		if(commandData.arg1FromRam){
			commandData.outputPointer = arg1;
			arg1 = ram->get(arg1);
		}
		else commandData.outputPointer = 0;
		commandData.arg1Value = arg1;
		arg2 = commandData.includeR2?registers[commandData.R2]:commandData.includeR1?commandData.I1:(u16)commandData.I2;
		if(commandData.arg2FromRam)arg2 = ram->get(arg2);
		commandData.arg2Value = arg2;
		u32 output;
		bool hasJumped;
		bool silent = true;
		u32 a=arg1,b=arg2,o=output;
		const u32 R2TERM_PORT = 0;//terminal port
		const u32 R2TERM_PORT_IN = 0;//keyboard port
		switch(commandData.opcode){
			case 0x00://MOV
				updateState(a,true);
				break;
			case 0x01://AND
				silent = false;
			case 0x09://ANDS
				output = a & b;
				if(!silent) updateState(output,false);
				setValue(output);
				break;
			case 0x02://OR
				silent = false;
			case 0x0A://ORS
				output = a | b;
				if(!silent) updateState(output,false);
				setValue(output);
				break;
			case 0x03://XOR
				silent = false;
			case 0x0B://XORS
				output = a ^ b;
				if(!silent) updateState(output,false);
				setValue(output);
				break;
			case 0x04://ADD
				silent = false;
			case 0x0C://ADDS
				output = a + b;
				updateForAddision:{
					setValue(output);
					if(!silent){
						updateState(output,false);
						setFlagsForAdd(a,b,o);
					};
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
					setValue(output);
					if(!silent){
						updateState(output,false);
						setFlagsForAdd(a,b,o);
					};
					break;
				}//R_flag(q3);F_Carr = (q1 < q2);F_Over = ((q1>>15)!=(q2>>15)) && ((q2>>15)==(q3>>15));
				break;
			case 0x07://SBB
				silent = false;
			case 0x0F://SBBS
				output = a - b - flags.carry;
				goto updateForSubtration;
				break;
			case 0x08://SWM
				updateState(output,false);
				mask = (a & 0x1FFF);
				break;
			case 0x10://HLT
				haulted = true;
				break;
			case 0x11://J**
				switch(commandData.jumpType){
					case 0x0://JMP			TRUE
						ip = a;
						break;
					case 0x1://JN			FALSE	NOP
						break;
					case 0x2://JB/JNAE/JC	C = 1
						if(flags.carry)ip = a;
						break;
					case 0x3://JNB/JAE/JNC	C = 0
						if(!flags.carry)ip = a;
						break;
					case 0x4://JO			O = 1
						if(flags.overflow)ip = a;
						break;
					case 0x5://JNO			O = 0
						if(!flags.overflow)ip = a;
						break;
					case 0x6://JS			S = 1
						if(flags.sign)ip = a;
						break;
					case 0x7://JNS			S = 0
						if(!flags.sign)ip = a;
						break;
					case 0x8://JE/JZ		Z = 1
						if(flags.zero)ip = a;
						break;
					case 0x9://JNE/JNZ		Z = 0
						if(!flags.zero)ip = a;
						break;
					case 0xA://JLE/JNG		Z = 1 OR S != O
						if(flags.zero || flags.sign!=flags.overflow)ip = a;
						break;
					case 0xB://JNLE/JG		Z = 0 OR S = O
						if(!flags.zero && flags.sign==flags.overflow)ip = a;
						break;
					case 0xC://JL/JNGE		S != O
						if(flags.sign != flags.overflow)ip = a;
						break;
					case 0xD://JNL/JGE		S = O
						if(flags.sign == flags.overflow)ip = a;
						break;
					case 0xE://JBE/JNA		C = 1 OR Z = 1
						if(flags.carry || flags.zero)ip = a;
						break;
					case 0xF://JNBE/JA		C = 0 AND Z = 0
						if(!flags.carry && !flags.zero)ip = a;
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
				break;
			case 0x19://WAIT
				output = -1;
				if(a == R2TERM_PORT_IN && *io_input & keyboard.confirm != 0)
					output = R2TERM_PORT_IN;
				updateState(output,true);
				break;
			case 0x1A://SEND
				if(a == R2TERM_PORT) *io_output = b | keyboard.data | 0x20000000;
				break;
			case 0x1B://RECV
				if(b == R2TERM_PORT_IN){
					if(*io_input & keyboard.confirm){
						updateState(*io_input,true);
						flags.carry = true;
					} else {
						updateState(0,false);
					}
				}
				break;
			case 0x1C://PUSH
				setRamValue(--sp,a);
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
				ip = a;
				break;
			case 0x1F://RET
				ip = ram->get(sp++);
				break;
			default:{
				//fprintf(stderr,"Error at Rstep.\n");
			}
		}
		if(!hasJumped)ip++;
	}
}cpu;
u32 i;
class GetKeyInput{
	struct termios oldt, newt;
	public:
	GetKeyInput(){//allows std::getchar(); to not need '\n'
		//code I "borrowed" from stack overflow
		int c;   

		/*tcgetattr gets the parameters of the current terminal
		STDIN_FILENO will tell tcgetattr that it should write the settings
		of stdin to oldt*/
		tcgetattr( STDIN_FILENO, &oldt);
		/*now the settings will be copied*/
		newt = oldt;

		/*ICANON normally takes care that one line at a time will be processed
		that means it will return if it sees a "\n" or an EOF or an EOL*/
		newt.c_lflag &= ~(ICANON);          

		/*Those new settings will be set to STDIN
		TCSANOW tells tcsetattr to change attributes immediately. */
		tcsetattr( STDIN_FILENO, TCSANOW, &newt);
	
	}
	~GetKeyInput(){
		/*restore the old settings*/
		tcsetattr( STDIN_FILENO, TCSANOW, &oldt);
	}
}getKeyInput;
float runSpeed = 60;
void mainThread(){
	for (i = 0; i < 1000; ++i){
		cpu.update();
		terminal.onUpdate();
		keyboard.onUpdate();
		if(cpu.haulted){
			return;
		}
		ctx.update();
		mySleep(1000./runSpeed);
	}
}
void foo(){}
int main(int argc, char const *argv[])
{
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
	{
		auto main = std::thread(mainThread);
		std::thread(R2KeyBoard::inputListener).detach();
		main.join();
	}
	terminal.onEnd();
	cout<<"i:"<<i;
	cout<<endl;
	return 0;
}