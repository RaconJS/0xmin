//g++ -pthread emulator4.cpp -o emulator4;
//0xmin version 4: "no io in ram"
//do ctrl+f "commands" to find the main emulator.
float runSpeed=60;//fps
//ctrl-f's line: 522 `switch(command)` for the actual commands
/*0xmin dev:
	I cant work out how to use the monitor, (with my own cpu). 
	I tried sending ascii codes for 1 frame 
	but that made it print charactors in different places 
	even though the manual says that they are different commands. 
	I assume '0x10??' == ctype(0x10??).
*/
/*R2 dev:
	The 0x10?? is worded with the R2 peripheral protocol in mind, so 0x10?? is actually 0x200210??. 
	I guess this protocol is not really explained anywhere >_> 
	tl;dr raw data bit is 0x20000, 
	attention request bit is 0x10000, 
	and keep-alive bit is 0x20000000.
*/
//UNFINISHED
//sleep + multi-threading for inputs.
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
using namespace std ;
//basic stuff
	typedef unsigned char u8;
	typedef unsigned int u32;
	typedef unsigned long int u64;
	#define hex (void*)(long)
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
	//filt and bray represent the tpt elemets. 
	struct filt30{//2^30 -1 states
		public:
		//static u32 white=0x3fffffff;
		u32 value=30;
		filt30(){};
		filt30(u32 v){value=(v&0x3fffffff);if(value==0)value=30;}
		operator u32(){return value;}
		filt30 operator ++(int a){value++;return value;}
		filt30 operator =(u32 v){value=(filt30)v;}
		filt30 operator =(filt30 v){if(v!=0 or value==0)value=v;}
	};
	struct bray30{//2^30 states
		public:
		//static u32 white=0x3fffffff;
		u32 value=0x3fffffff;
		bray30(u32 v){value=v;}
		operator u32(){return value;}
		filt30 operator =(u32 v){value=(bray30)v;}
		filt30 operator =(bray30 v){if(value!=0)value=v;}
		filt30 operator =(filt30 v){if(v!=0 or value==0)value=v;}
	};
	struct pistonAddressN{
		public:
		u64 value;
		pistonAddressN(u64 v){value=v;}
		operator u64(){return value;}
		filt30 operator =(u64 v){value=(pistonAddressN)v;}
	};
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
//----
filt30* ram;
int ramLen;
filt30 getCPU_output();
void expandRamIfNeeded(int index){
	auto oldRamSize = ramLen;
	if(false)if(index > ramLen){//doesn't currently work
		ramLen += 2 * (index - ramLen);//assert change in size is between [0,255*2]
		ram = (filt30*) realloc(ram, sizeof(filt30) * ramLen);
		std::fill(ram + oldRamSize * sizeof(filt30), ram + ramLen*sizeof(filt30), filt30(0));
	}
	//return ram[index];
}
class R2Terminal{
	private: filt30 spairFilts[2];
	public:
	short int x=0,y=0;
	short int bgColor=0,fgColor=15;
	short int dims[2]={16,12};
	short int dims_internal[2]={16,16};
	short int offset_x=2,offset_y=2;
	void innit(){
		//detect 'import lib "io.0xmin";'
		//note: io can now be done without using ram addresses.
		//`has_io_in_ram` is to support older versions of 0xmin
		bool has_io_in_ram=
			ram[1]==1&&//'jump 0;'
			ram[2]==(filt30)0&&
			ram[3]==0x20000000&&
			ram[4]==(filt30)0&&
			ram[5]==0x20000000
		;
		if(has_io_in_ram){
			input=&ram[3];//from keyboard
			output=&ram[5];//to screen
		}else{
			input=&spairFilts[0];//from keyboard
			output=&spairFilts[1];//to screen
		}
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
	}
	filt30* input;//from keyboard
	filt30* output;//ramCoord to screen
	filt30 filtObj;//
	filt30 redFilt =0x20000000;
	filt30 data    =0x00020000;//char
	filt30 _char   =0x00000000;//0x10??,
	filt30 _pos    =0x00001000;//0x1???, //0x1yyx
	filt30 _col    =0x00002000;//0x20??,
	filt30 _confirm=0x00010000; //0x20030000,
	class{}io;
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
			filt30 currentWord=getCPU_output();//auto print
			filtObj = !(currentWord&redFilt)?*output:currentWord;
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
			*output=redFilt;
		}
	}
}terminal;
char inputChar;
bool inputWasPressed;
class R2KeyBoard{
	public:
	filt30* input;//from keyboard 'terminal.input'
	filt30* output;//from CPU 'terminal.output'
	filt30 inputValue;
	//char inputChar;
	//bool inputWasPressed;
	const u32 attensionRequest=0x20010000;
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
				else if(*output==attensionRequest){
					returnVal=0x20028000;//failed request
				}
				else returnVal=0x20000000;
			}
			else if(mode==1){//ready for attension request
				if(*output==attensionRequest){
					if(inputWasPressed){
						latencyFrames=5;
						coolDown=5;
						returnVal=inputChar|terminal._confirm|terminal.data;
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
		cout<<ctx.moveTo(pos[0],pos[1])
			<<"                     "
			<<ctx.moveTo(pos[0],pos[1])
			<<"["<<inputChar<<","<<mode<<"]"
			//<<ctx.moveTo(terminal.offset_x+terminal.dims[0]+1,offset_y)
			//<<"┐"

			<<ctx.moveTo(terminal.offset_x+terminal.dims[0]+1,offset_y+1)
			<<"<< output:"<<hex *output
			<<ctx.moveTo(terminal.offset_x+terminal.dims[0]+1,offset_y+2)
			<<">> input :"<<hex *input
			
			//<<ctx.moveTo(terminal.offset_x+terminal.dims[0]+1,offset_y+3)
			//<<"┘"
		;
		if(returnVal!=0){
			bufferToinput[latencyFrames]=returnVal;
		}
		if(coolDown>0)coolDown--;
		if(bufferToinput[0]!=0){
			*input=bufferToinput[0];
			inputValue=bufferToinput[0];
		}
		bufferToinput[16-1]=0x20000000;
		for(int i=0;i<16-1;i++){
			bufferToinput[i]=bufferToinput[i+1];
		}
	}
	static void inputListener();
	void innit(){
		for(int i=0;i<16;i++)bufferToinput[i]=0;
		offset_x=terminal.offset_x+terminal.dims[0]+1+3;//from keyboard
		offset_y=terminal.offset_y;//to screen
		cout
			<<ctx.moveTo(offset_x,offset_y)<<"( )"
		;
		input=terminal.input;
		output=&terminal.filtObj;//output;
	}
	bool isRunning=true;
}keyboard;
void R2KeyBoard::inputListener(){
	int pos[2]={keyboard.offset_x+1+4,keyboard.offset_y};
	while(keyboard.isRunning)
	{
		//cout<<ctx.moveTo(pos[0],pos[1]);
		inputChar=std::getchar();
		inputWasPressed=true;
	}
}
class NumberDisplay{
	public:
	filt30* input;//=ram[2];
	filt30* output;//=ram[4];
	filt30 oldOutput=0;
	int pos[2];
	void innit(){
		input=&ram[2];//from keyboard
		output=&ram[4];//to screen
		oldOutput=*output+1;
		pos[0]=4+terminal.dims[0]+terminal.offset_x;
		pos[1]=5;
		cout<<ctx.moveTo(pos[0],pos[1]);
		cout<<"out   :0";
	}
	void onUpdate(){
		if((*output).value!=oldOutput.value){//dont need to redraw if its the same
			cout<<ctx.moveTo(pos[0],pos[1]);
			cout<<"out   :          ";
			cout<<ctx.moveTo(pos[0],pos[1]);
			cout<<"out   :";
			cout<<hex(*output&0xfffffff)<<" ";
			oldOutput=*output;
		}
	}
}numberDisplay;
//cpu
	bool hasHault=false;
	class CPU{

	};
	//R2
		char *last_filename = NULL;
		int speed_button_val = 60;//16
		int slowModeState = 0;//bool
		int pauseatHLT = 1;//bool
		int pauseatIP = 0;//bool
		int pauseatIPaddr = 0;//16
		int pauseatIO = 0;//bool
		int R2TERM_PORT = 0;//8
		int R2TERM_PORT_IN = 0;//8

		uint16_t INPUT_BUFFER[256];
		int INPUT_BUFFER_SIZE = 0;//16
		int INPUT_BUFFER_P = 0;//16
		int bump_rec = 0xFFFF;//16
		int Tcursor = 0;//8

		const int INST_CLASS[] = {3,3,3,3,3,3,3,3,2,3,3,3,3,3,3,3,0,2,3,3,3,3,3,3,1,1,3,3,2,1,2,0};//0='0' 1='1' 2='1*' 3='2' <-- 8bit

		int R2_SIZE = 2048-1;//DEFAULT 2K (bitmask)

		uint32_t R2_MEM[65536];
		uint16_t R2_REG[16];//14=SP 15=IP // 16
		int R2_WM = 0;//Write Mask (SWM)
		int R2_SHIFT_PREV = 0;
		int F_Carr = 0;//bool
		int F_Over = 0;//bool
		int F_Zero = 0;//bool
		int F_Sign = 0;//bool

		int O1 = 0;int O1T = 0;//0=REG 1=MEM 2=CONST //16/8
		int O2 = 0;int O2T = 0;//0=REG 1=MEM 2=CONST //16/8

		void toR2TERM(int d){//16
			/*if(d & 0x1000){
				Tcursor = d & 0xFF;
				return;
			}
			if(d & 0x2000){//0x20BF
				char color_arr[] = {30,34,32,36,31,35,33,37,90,94,92,96,91,95,93,97};//To match colors in xterm. //8
				printf("\033[%d;%dm",color_arr[d & 0xF],color_arr[(d>>4) & 0xF]+10);
				return;
			}
			if(d<10) d+=0x30;	///OPTIONAL - Some of my R2 programs use 0x0 - 0x9 as '0' - '9'
			if(d==10) d=0x30;	///OPTIONAL - or 0xA as '0'

			if(d == 0x7F){//0x7F is a full block on the R2TERM - used as blinking cursor.
				printf("\033[%d;%dH\u2588",(Tcursor>>4)+3,(Tcursor&0xF)+2);//UNICODE for FULL BLOCK
			} else {
				printf("\033[%d;%dH%c",(Tcursor>>4)+3,(Tcursor&0xF)+2,d & 0xFF);
			}
			fflush(stdout);

			Tcursor++;
			if(Tcursor>=16*13) Tcursor = 0;*/
		}

		void Roper(int _class, int inst){//8-32 //Updates O[1/2] and O[1/2]T
			int type = (inst >> 20) & 0xF;//8
			int subt = (inst >> 15) & 0x1;//8

			int qR1,qR2,qRB,qI1,qI2,qR2F,qI2F;//8-8-8-16-16-8-16
			switch(_class){
				case 0://0
					break;
				case 1://1
					qR1 = inst & 0xF;
					qRB = (inst >> 16) & 0xF;
					qI1 = (inst >> 4) & 0xFFFF;
					O1T = 1;
					switch(type){
						case 0x0:
							O1 = qR1;
							O1T = 0;
							break;
						case 0x4:
							O1 = R2_REG[qR1];
							break;
						case 0xC:
							if(subt) O1 = R2_REG[qRB] - R2_REG[qR1];
							else O1 = R2_REG[qRB] + R2_REG[qR1];
							break;
						case 0x5:
							O1 = qI1;
							break;
						case 0xD:
							if(subt) O1 = R2_REG[qRB] - (qI1 & 0x7FF);
							else O1 = R2_REG[qRB] + (qI1 & 0x7FF);
							break;
					}
					break;
				case 2://1*
					qR2 = (inst >> 4) & 0xF;
					qRB = (inst >> 16) & 0xF;
					qI2 = (inst >> 4) & 0xFFFF;
					O1T = 1;
					switch(type){
						case 0x0:
							O1 = qR2;
							O1T = 0;
							break;
						case 0x1:
							O1 = R2_REG[qR2];
							break;
						case 0x9:
							if(subt) O1 = R2_REG[qRB] - R2_REG[qR2];
							else O1 = R2_REG[qRB] + R2_REG[qR2];
							break;
						case 0x2:
							O1 = qI2;O1T = 2;
							break;
						case 0x3:
							O1 = qI2;
							break;
						case 0xB:
							if(subt) O1 = R2_REG[qRB] - (qI2 & 0x7FF);
							else O1 = R2_REG[qRB] + (qI2 & 0x7FF);
							break;
					}
					break;
				case 3://2
					qR1 = inst & 0xF;
					qR2 = (inst >> 4) & 0xF;//CHANGING
					qRB = (inst >> 16) & 0xF;
					qI1 = (inst >> 4) & 0xFFFF;
					qI2 = (inst >> 4) & 0xFFFF;//CHANGING
					qR2F = inst & 0xF;//CHANGING
					qI2F = inst & 0xFFFF;//CHANGING
					switch(type){
						case 0x0:
							O1 = qR1;O1T = 0;
							O2 = qR2;O2T = 0;
							break;
						case 0x1:
							O1 = qR1;O1T = 0;
							O2 = R2_REG[qR2];O2T = 1;
							break;
						case 0x9:
							O1 = qR1;O1T = 0;
							if(subt) O2 = R2_REG[qRB] - R2_REG[qR2];
							else O2 = R2_REG[qRB] + R2_REG[qR2];
							O2T = 1;
							break;
						case 0x2:
							O1 = qR1;O1T = 0;
							O2 = qI1;O2T = 2;
							break;
						case 0x3:
							O1 = qR1;O1T = 0;
							O2 = qI1;O2T = 1;
							break;
						case 0xB:
							O1 = qR1;O1T = 0;
							if(subt) O2 = R2_REG[qRB] - (qI1 & 0x7FF);
							else O2 = R2_REG[qRB] + (qI1 & 0x7FF);
							O2T = 1;
							break;
						case 0x4:
							O1 = R2_REG[qR1];O1T = 1;
							O2 = qR2;O2T = 0;
							break;
						case 0xC:
							O2 = qR2;O2T = 0;
							if(subt) O1 = R2_REG[qRB] - R2_REG[qR1];
							else O1 = R2_REG[qRB] + R2_REG[qR1];
							O1T = 1;
							break;
						case 0x5:
							O1 = qI1;O1T = 1;
							O2 = qR2F;O2T = 0;
							break;
						case 0xD:
							O2 = qR2F;O2T = 0;
							if(subt) O1 = R2_REG[qRB] - (qI1 & 0x7FF);
							else O1 = R2_REG[qRB] + (qI1 & 0x7FF);
							O1T = 1;
							break;
						case 0x6:
							O1 = R2_REG[qR1];O1T = 1;
							O2 = qI1;O2T = 2;
							break;
						case 0xE:
							O2 = (qI2 & 0x7FF);O2T = 2;
							if(subt) O1 = R2_REG[qRB] - R2_REG[qR1];
							else O1 = R2_REG[qRB] + R2_REG[qR1];
							O1T = 1;
							break;
						case 0x7:
							O1 = qI1;O1T = 1;
							O2 = (qI2F & 0xF);O2T = 2;
							break;
						case 0xF:
							O2 = (qI2F & 0xF);O2T = 2;
							if(subt) O1 = R2_REG[qRB] - (qI1 & 0x7FF);
							else O1 = R2_REG[qRB] + (qI1 & 0x7FF);
							O1T = 1;
							break;
					}
					break;
			}
		}
		int RrOP1(){//16 //Read value of op 1
			switch(O1T){
				case 0://REG
					return R2_REG[O1];
				case 1://MEM
					return R2_MEM[O1 & R2_SIZE] & 0xFFFF;
				case 2://CONST
					return O1;
				default:
					fprintf(stderr,"Error at RrOP1.\n");
			}
			return 0;
		}
		int RrOP2(){//16 //Read value of op 2
			switch(O2T){
				case 0://REG
					return R2_REG[O2];
				case 1://MEM
					return R2_MEM[O2 & R2_SIZE] & 0xFFFF;
				case 2://CONST
					return O2;
				default:
					fprintf(stderr,"Error at RrOP2.\n");
			}
			return 0;
		}
		void RwOP1(int val){//16 //Write to op 1
			switch(O1T){
				case 0://REG
					R2_REG[O1] = val;
					break;
				case 1://MEM
					R2_MEM[O1 & R2_SIZE] = val | R2_WM | 0x20000000;
					break;
				case 2://CONST
				default:
					fprintf(stderr,"Error at RwOP1.\n");
			}
		}
		void R_flag(int val){//16
			F_Zero = (val == 0);
			F_Sign = ((val & 0x8000) != 0);
		}
		void Rstep(){//Executes one instruction.
			int saveIP = R2_REG[15];//16
			int inst = R2_MEM[saveIP & R2_SIZE];
			int comm = (inst >> 24) & 0x1F;//8
			int _class= INST_CLASS[comm];
			Roper(_class,inst);
			int q1 = RrOP1();//16
			int q2 = RrOP2();//16/4
			int q3;//16/32
			int WriteBack = (comm >> 3) ^ 0x01;
			switch(comm){
				case 0x00://MOV
					RwOP1(q2);R_flag(q2);F_Carr = 0;F_Over = 0;
					break;
				case 0x01://AND
				case 0x09://ANDS
					q3 = q1 & q2;
					if(WriteBack) RwOP1(q3);
					R_flag(q3);F_Carr = 0;F_Over = 0;
					break;
				case 0x02://OR
				case 0x0A://ORS
					q3 = q1 | q2;
					if(WriteBack) RwOP1(q3);
					R_flag(q3);F_Carr = 0;F_Over = 0;
					break;
				case 0x03://XOR
				case 0x0B://XORS
					q3 = q1 ^ q2;
					if(WriteBack) RwOP1(q3);
					R_flag(q3);F_Carr = 0;F_Over = 0;
					break;
				case 0x04://ADD
				case 0x0C://ADDS
					q3 = q1 + q2;
					if(WriteBack) RwOP1(q3 & 0xFFFF);
					R_flag(q3 & 0xFFFF);F_Carr = q3 >> 16;F_Over = ((q1>>15) == (q2>>15)) && (((q3>>15)&1) != (q2>>15));
					break;
				case 0x05://ADC
				case 0x0D://ADCS
					q3 = q1 + q2 + F_Carr;
					if(WriteBack) RwOP1(q3 & 0xFFFF);
					R_flag(q3 & 0xFFFF);F_Carr = q3 >> 16;F_Over = ((q1>>15) == (q2>>15)) && (((q3>>15)&1) != (q2>>15));
					break;
				case 0x06://SUB
				case 0x0E://SUBS / CMP
					q3 = (q1 - q2) & 0xFFFF;
					if(WriteBack) RwOP1(q3);
					R_flag(q3);F_Carr = (q1 < q2);F_Over = ((q1>>15)!=(q2>>15)) && ((q2>>15)==(q3>>15));
					break;
				case 0x07://SBB
				case 0x0F://SBBS
					q3 = (q1 - q2 - F_Carr) & 0xFFFF;
					if(WriteBack) RwOP1(q3);
					R_flag(q3);F_Carr = (q1 < q2);F_Over = ((q1>>15)!=(q2>>15)) && ((q2>>15)==(q3>>15));
					break;
				case 0x08://SWM
					R_flag(q1);F_Carr = 0;F_Over = 0;
					R2_WM = (q1 & 0x1FFF) << 16;
					break;
				case 0x10://HLT
					if(pauseatHLT) slowModeState = 0;
					break;
				case 0x11://J**
					switch(inst & 0xF){
						case 0x0://JMP			TRUE
							R2_REG[15] = q1;
							break;
						case 0x1://JN			FALSE	NOP
							break;
						case 0x2://JB/JNAE/JC	C = 1
							if(F_Carr) R2_REG[15] = q1;
							break;
						case 0x3://JNB/JAE/JNC	C = 0
							if(F_Carr == 0) R2_REG[15] = q1;
							break;
						case 0x4://JO			O = 1
							if(F_Over) R2_REG[15] = q1;
							break;
						case 0x5://JNO			O = 0
							if(F_Over == 0) R2_REG[15] = q1;
							break;
						case 0x6://JS			S = 1
							if(F_Sign) R2_REG[15] = q1;
							break;
						case 0x7://JNS			S = 0
							if(F_Sign == 0) R2_REG[15] = q1;
							break;
						case 0x8://JE/JZ		Z = 1
							if(F_Zero) R2_REG[15] = q1;
							break;
						case 0x9://JNE/JNZ		Z = 0
							if(F_Zero == 0) R2_REG[15] = q1;
							break;
						case 0xA://JLE/JNG		Z = 1 OR S != O
							if(F_Zero || F_Sign!=F_Over) R2_REG[15] = q1;
							break;
						case 0xB://JNLE/JG		Z = 0 OR S = O
							if(F_Zero == 0 || F_Sign==F_Over) R2_REG[15] = q1;//edited
							break;
						case 0xC://JL/JNGE		S != O
							if(F_Sign != F_Over) R2_REG[15] = q1;
							break;
						case 0xD://JNL/JGE		S = O
							if(F_Sign == F_Over) R2_REG[15] = q1;
							break;
						case 0xE://JBE/JNA		C = 1 OR Z = 1
							if(F_Carr || F_Zero) R2_REG[15] = q1;
							break;
						case 0xF://JNBE/JA		C = 0 AND Z = 0
							if(F_Carr == 0 && F_Zero == 0) R2_REG[15] = q1;
							break;
					}
					break;
				case 0x12://ROL <<
					q2 &= 0xF;
					q3 = q1;
					for(int i=0;i<q2;i++) q3 = ((q3 << 1) | (q3 >> 15)) & 0xFFFF;
					RwOP1(q3);R_flag(q3);F_Carr = 0;F_Over = 0;
					break;
				case 0x13://ROR >>
					q2 &= 0xF;
					q3 = q1;
					for(int i=0;i<q2;i++) q3 = ((q3 & 0x01)<<15) | (q3 >> 1);
					RwOP1(q3);R_flag(q3);F_Carr = 0;F_Over = 0;
					break;
				case 0x14://SHL <<
					q2 &= 0xF;
					q3 = (q1 << q2) & 0xFFFF;
					RwOP1(q3);R_flag(q3);F_Carr = 0;F_Over = 0;
					break;
				case 0x15://SHR >>
					q2 &= 0xF;
					q3 = q1 >> q2;
					RwOP1(q3);R_flag(q3);F_Carr = 0;F_Over = 0;
					break;
				/*case 0x16://SCL << (OLD)
					q1 = RrOP1();
					q2 = RrOP2() & 0xF;
					qb = q1;
					for(int i=0;i<q2;i++) qb = ((qb << 1) | ((R2_SHIFT_PREV >> (15-i)) & 0x01)) & 0xFFFF;
					RwOP1(qb);R_flag(qb);F_Carr = 0;F_Over = 0;
					break;*/
				case 0x16://SCL << (NEW)
					q2 &= 0xF;
					q3 = ((((q1<<16) | R2_SHIFT_PREV) << q2) >> 16) & 0xFFFF;
					RwOP1(q3);R_flag(q3);F_Carr = 0;F_Over = 0;
					break;
				case 0x17://SCR	>>
					q2 &= 0xF;
					q3 = (((R2_SHIFT_PREV << 16) | q1) >> q2) & 0xFFFF;
					RwOP1(q3);R_flag(q3);F_Carr = 0;F_Over = 0;
					break;
				case 0x18://BUMP
					break;
				case 0x19://WAIT
					if(INPUT_BUFFER_P < INPUT_BUFFER_SIZE) bump_rec = R2TERM_PORT_IN;
					RwOP1(bump_rec);
					R_flag(bump_rec);F_Carr = 0;F_Over = 0;
					bump_rec = 0xFFFF;
					break;
				case 0x1A://SEND
					if(q1 == R2TERM_PORT) toR2TERM(q2);
					if(pauseatIO) slowModeState = 0;
					break;
				case 0x1B://RECV
					if(pauseatIO) slowModeState = 0;
					if(q2 == R2TERM_PORT_IN){
						if(INPUT_BUFFER_P < INPUT_BUFFER_SIZE){
							F_Carr = 1;
							int r_val = INPUT_BUFFER[INPUT_BUFFER_P++];//16
							RwOP1(r_val & 0xFFFF);
							F_Zero = (r_val == 0);
							F_Sign = ((r_val & 0x8000) != 0);
							if(INPUT_BUFFER_P == INPUT_BUFFER_SIZE){
								INPUT_BUFFER_SIZE = 0;
								INPUT_BUFFER_P = 0;
							}
							updateIObufferlabel();
						} else {
							F_Carr = 0;
						}
					}
					break;
				case 0x1C://PUSH
					R2_MEM[(--R2_REG[14]) & R2_SIZE] = q1 | R2_WM | 0x20000000;
					R_flag(q1);F_Carr = 0;F_Over = 0;
					break;
				case 0x1D://POP
					q3 = R2_MEM[(R2_REG[14]++) & R2_SIZE];
					RwOP1(q3);
					R_flag(q3);F_Carr = 0;F_Over = 0;
					break;
				case 0x1E://CALL
					R2_MEM[(--R2_REG[14]) & R2_SIZE] = (R2_REG[15] + 1) | R2_WM | 0x20000000;
					R2_REG[15] = q1;
					break;
				case 0x1F://RET
					R2_REG[15] = R2_MEM[(R2_REG[14]++) & R2_SIZE] & 0xFFFF;
					break;
				default:
					fprintf(stderr,"Error at Rstep.\n");
			}
			if(_class != 0) R2_SHIFT_PREV = q1;
			if(saveIP == R2_REG[15]) R2_REG[15]++;
		}
	//----
	class CPU_R216{
		public://used by emulator
		filt30* ram;
		u32 ramSize;
		bool hasHault=false;
		public://the CPU's state
	};
	class CPU0xmin3{
		public://used by emulator
		filt30* ram;
		bool hasHault=false;
		public://the CPU's state
		bool aluif=false;
		filt30 alu=0;
		u64 move=0;
		u64 jump=0;

		public://values that are used within a few frames.
		filt30 currentWord;//current instruction
		bool blocker=false;

		short int move_next=0;
		short int jump_next=0;
		filt30 get_jump;
		u32 set_jump;
		u32 set_bray;

		filt30 input;
		filt30 output;
		public://debugger pause
		bool wasInputDown=false;
		void onUpdate();
	}cpu;
	class Display{
		public:
		void innit(){
			cout<<
			""
			;
		}
		void onUpdate(){
			//int[2]
			if(0){cout<<ctx.moveTo(
				terminal.dims[0]+terminal.offset_x+4,
				terminal.dims[0]+terminal.offset_y+7
			);
			cout<<cpu.move;
			cout<<cpu.jump;
			}
			int x=4+terminal.dims[0]+terminal.offset_x;
			int y0=7,y=y0;
			//                     "get jump -1 +0x21234567";
			cout<<ctx.moveTo(x,y)<<"                       ";
			cout<<ctx.moveTo(x,y++)<<"move : "<<hex cpu.move;
			cout<<ctx.moveTo(x,y)<<"                       ";
			cout<<ctx.moveTo(x,y++)<<"jump : "<<hex cpu.jump;
			cout<<ctx.moveTo(x,y)<<"                       ";
			cout<<ctx.moveTo(x,y++)<<"alu  : "<<hex cpu.alu.value;
			cout<<ctx.moveTo(x,y)<<"                       ";
			cout<<ctx.moveTo(x,y++)<<"if   : "<<cpu.aluif;
			cout<<ctx.moveTo(x,y)<<"                       ";
			cout<<ctx.moveTo(x,y++)<<"*move: "<<hex ram[cpu.move];

			cout<<ctx.moveTo(x,y)<<"                          ";//"get jump -1 +0x21234567";
			cout<<ctx.moveTo(x,y++)<<"*jump: ";
			if(!(cpu.currentWord&0x00030000)){
				bool sign = (cpu.currentWord&0x1000)!=0;//is negative
				cout<<(const char*[]){"move","jump","nor","red","blue","get","xor","and","or","get jump -1","or input","set","if","set jump +3","null",""}[cpu.currentWord&0xf]
				<<" "<<(const char[]){'+','-'}[sign]<<hex ( ((cpu.currentWord>>4)&0xfe) + ((cpu.currentWord>>4)&1)*(int[2]){1,-1}[sign + (cpu.currentWord&0xf==0)] )
			;}
			else if(!(cpu.currentWord&~0x20023fff)){
				char str=(char)cpu.currentWord;
				switch(cpu.currentWord&0x00003000){
					case 0x0000:
					if(0){}
					else if(str>0x21)cout<<"\""<<str<<"\"";
					else if(str=='\t')cout<<"\"\\t\"";
					else if(str=='\n')cout<<"\"\\n\"";
					else if(str=='\r')cout<<"\"\\r\"";
					else if(str==' ')cout<<"\" \"";
					else cout<<"\\x"<<hex(str)<<"";
					break;//char
					case 0x1000:cout<<"\\p"<<(0xf&cpu.currentWord)<<(0xf&(cpu.currentWord>>4));break;//pos
					case 0x2000:cout<<"\\c"<<(0xf&cpu.currentWord)<<(0xf&(cpu.currentWord>>4));break;//col
				}
			}
			else cout<<hex(cpu.currentWord);
			cout<<'\n';
		}
		private:
	}cpuDisplay;
	void CPU0xmin3::onUpdate(){//main emulator
		//pointers
			expandRamIfNeeded(max(jump+jump_next+2,move+move_next));
			filt30 get_jump=ram[jump];//for 'get jump -1;'
			jump+=jump_next;
			if(jump>=ramLen||jump<0){
				if(jump<0)jump=0;
				else jump=ramLen-1;
				hasHault=true;
			}
			filt30 dataFromJump=ram[jump];
			if(set_bray!=0){ram[move]=set_bray;set_bray=0;}//'set' is done after instruction is read but before the "move pointer" is updated.
			move=max(0l,((long)move)+move_next);
			if(set_jump!=0){ram[jump+2]=set_jump;set_jump=0;}
			filt30 dataFromMove=ram[move];
		//read input
			if(!blocker){
				currentWord=dataFromJump;
			}int command=currentWord&0x3000f;
			short int address=(currentWord&0x0ff0)/0x10;
			short int address_sign=(currentWord&0x1000)/0x1000;
			jump_next=1;
			move_next=0;
		//commands
			u32 output_bray;
			input=keyboard.inputValue;
			u32 ans=0,a=alu,b=dataFromMove;//for operations
			switch(command){
				case 0 ://move
					move_next=address*((int[2]){1,-1})[address_sign];
					break;
				case 1 ://jump
					jump_next=((address&~1)*(int[2]){1,-1}[address_sign])+(address&1);
					if(address==0){
						if(!address_sign)hasHault=true;//'jump 0;' => 'hault;'
						else {
							if(inputWasPressed&&wasInputDown){//jump -0;' => 'wait for input'; for debugging
								jump++;//on rising edge
								inputWasPressed=false;
								wasInputDown=true;
							}
							wasInputDown=inputWasPressed;
						}
					}
					break;
				//alu
				case 2 :ans=a|input;break;//'or input'
				case 3 :ans=a*(b&-b);break;//'red'
				case 4 :ans=b==0?a:a/(b&-b);break;//'blue'
				case 5 :ans=get_jump;break;//'get jump -1'
				case 6 :ans=~(a|b);break;//'nor'
				case 7 :ans=b;break;//'get'
				case 8 :ans=a^b;break;//'xor'
				case 9 :ans=a&b;break;//'and'
				case 10:ans=a|b;break;//'or'
				//misc
				case 11:set_bray=alu;break;//'set'
				case 12:blocker=!aluif;aluif=!aluif;break;//'if' 
				case 13:set_jump=alu;break;//'set jump +3'
				//case 14:break;//'null'
				//case 15:break;//empty
				default:output_bray=currentWord;//print char
			}
			//note: with the 'if' command. is run as: 'if;"then";"else/finally";' can be used as: if;jump->then; jump->else
			//	'if;' means 'if there has been a operation that did not equal 0, from the last if statement; then continue as normal; other wise ignore the next line of code."
			if((ans&0x3fffffff)!=0){
				alu=ans;
				aluif=true;
			}
			output=output_bray!=0?output_bray:0x20000000;
	}
filt30 getCPU_output(){return cpu.output;}
//----
void doStep(int i){
	cpu.onUpdate();
	cpuDisplay.onUpdate();
	numberDisplay.onUpdate();
	keyboard.onUpdate();
	terminal.onUpdate();
	cout<<ctx.moveTo(
		keyboard.offset_x+1,
		keyboard.offset_y//terminal.dims[1]+terminal.offset_y
	);
}
std::thread inputThread;
void mainThread(){
	int num=0;
	for(int i=0;(i<40000||true)&&!cpu.hasHault;i++,num++){
		//for(int i=0;i<1&&!cpu.hasHault;i++,num++){
			doStep(i);
		//}
		ctx.update();
		mySleep(1000./runSpeed);
		//cout<<hex cpu.jump<<" ";//<<":"<<(void*)(long)cpu.jump<<":"<<(void*)(long)cpu.move<<" ";
		/*if(cpu.hasHault){break;
			//string a;cin>>a;cpu.jump++;
		}*/
	}{
		//std::future<std::string> future = std::async(handleInput);
	}cout<<ctx.moveTo(1,terminal.dims[1]+terminal.offset_y)<<"\nhaulted at:"<<cpu.jump<<", i="<<num;
	keyboard.isRunning=false;
	//delete &inputThread;
}
int main(int argc, char const *argv[]){
	// copies all data into buffer
	string fileName;
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
		ramLen=(int)buffer.size()/4;
		ram=new filt30[ramLen];
		for(int i=3;i<buffer.size();i+=4){
			int n=(int)(i/4);
			u32 val=0;
			val=(val<<8)+(buffer.at(i)&0xff);
			val=(val<<8)+(buffer.at(i-1)&0xff);
			val=(val<<8)+(buffer.at(i-2)&0xff);
			val=(val<<8)+(buffer.at(i-3)&0xff);
			ram[n]=val;
			//cout<<(void*)(long)ram[n]<<" ";
		}
		buffer.clear();//free memory "hopefully"
		inputFile.close();
	}
	{
		cout<<ctx.clear();
		terminal.innit();
		keyboard.innit();
		cpuDisplay.innit();
		numberDisplay.innit();
		cpu.ram=ram;
		cout<<ctx.moveTo(terminal.dims[0]+terminal.offset_x+4,1);
		cout<<"size:"<<ramLen<<"\n";
	}
	auto main = std::thread(mainThread);
	inputThread = std::thread(R2KeyBoard::inputListener);
	inputThread.detach();
	main.join();
	cout<<endl;
	return 0;
}
//moveTo(x,y);
//setColor(int);
//setStyle(int);
//clearWindow();
//
//max: width=132,height=43
/*quine:
┌────────────────────────────────────────────────────────────────┐
│j+42 j+00 _ m+00 > m+00 g m-28 g _ _ j+06 > _ ~ m+00 _ m+06 s ~ │
│s _ j+05 m+03 g m-03 j+13 > _ _ m+02 > _ j+05 m+02 g m-04 j+08 <│   247 
│ m-01 s ~ s m-01 < m+22 j+A4 m+0A g m-04 s | | g m+00 m+00 m+00 │
│_ _ m-00 m+01 m+01 m+10 _ m+01 m+02 m+35 g _ _ m-01 ^ _ j+02 j+8│
│B m+01 g m-31 s j+03 m+01 m-00 m+31 g m+1B < m+0D s m-0C | m+0E │
│s m-5F m+5D g m-5F m+36 | m+02 s m+01 & m-02 s j+03 m+01 m-00 _ │
│g m+32 < m+0D s m-0C | m+0E s m+60 m+00 g m-05 m-D3 s m+33 g _ m│
│+02 & m-35 _ j+42 m+33 g _ _ m+03 & _ j+05 m+9B g m+01 j+03 m+9C│
│ g m-D2 s m+39 g m-02 s m-04 g m+04 > m-06 | m+09 & m-08 s j+03 │
│m+01 m-00 _ g m+6B < m+0D s m-0C | m+0E s m+37 m+07 g m-07 m-E3 │
│s m+37 g m+01 _ _ ^ _ j+02 j+07 ^ m+03 > m-04 s j-2D m-38 m+3C g│
│ m-3C s m+30 g m-2F s m+CB g m-A3 s j-CB j+A4 m+07 s j-93 j+01 _│
│ _ _ s _ ? _ & _ ^ ? _ < _ _ _ _ _ m+03 j+03 ~ < > g ^ & | _ j+0│
│4 ~ < > g ^                                                     │
└────────────────────────────────────────────────────────────────┘
*/