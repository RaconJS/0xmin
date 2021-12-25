//e
//UNFINISHED
#include <chrono>
#include <future>
#include <thread>
#include <iostream>
#include <cmath>

#include <fstream>
#include <iterator>
#include <vector>

#include <sys/ioctl.h>
#include <unistd.h>

using namespace std ;
//basic stuff
	typedef unsigned char u8;
	typedef unsigned int u32;
	typedef unsigned long int u64;
	#define hex (void*)(long)
	void mySleep(float x){
		std::this_thread::sleep_for(std::chrono::microseconds((int)(x*1000)));
	}
	struct filt30{//fist 2 bits
		public:
		u32 value=30;
		filt30(){};
		filt30(u32 v){value=(v&0x3fffffff);if(value==0)value=30;}
		operator u32(){return value;}
		filt30 operator ++(int a){value++;return value;}
		filt30 operator =(u32 v){value=(filt30)v;}
		filt30 operator =(filt30 v){if(v!=0 or value==0)value=v;}
	};
	class textCanvas{//col,pos,clear;
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
			struct winsize dimentions;
			ioctl(STDOUT_FILENO, TIOCGWINSZ, &dimentions);
			width=dimentions.ws_col;
			height=dimentions.ws_row;
			string str="";
			for(int i=0;i<height&&i<100;i++){
				for(int j=0;j<width-1&&j<300;j++){
					str+=' ';
				}if(i<height-1)str+='\n';
			}
			return "\033[0;0H\033[J"+str+"\033[0;0H\033[J";
		}
		public:
		int width=132,height=43-4;
		textCanvas(){ if(0)onload();};
		~textCanvas(){if(0)unload();}
		string col(int args[2]){//0-15
			return "\x1b["+to_string(args[1])+to_string(args[1]>7?90-8:30)+";"+to_string(args[0])+to_string(args[0]>7?100-8:40)+"m";
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
//----
filt30* ram;
int ramLen;
class R2Terminal{
	public:
	short int x=0,y=0;
	short int bgColor=7,fgColor=15;
	short int dims[2]={16,12};
	short int dims_internal[2]={16,16};
	short int offset_x=2,offset_y=2;
	void innit(){
		input=&ram[3];//from keyboard
		output=&ram[5];//to screen
		cout<<ctx.moveTo(1,1);
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
	filt30* input;//from keyboard
	filt30* output;//to screen
	filt30 redFilt =0x20000000;
	filt30 data    =0x00020000; 
	filt30 _char   =0x00000000;//0x10??,
	filt30 _pos    =0x00001000;//0x1???, //0x1yyx
	filt30 _col    =0x00002000;//0x20??,
	filt30 _confirm=0x00010000; //0x20030000,
	class{

	}io;
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
				<<charOut;
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
	}
	void onUpdate(){
		*input=redFilt;
		handle_output:{
			if(*output&redFilt){
				if(*output&data){
					switch((u32)*output&0x0ffc0000){
						case 0x00000000://char
							print((char)*output&0xff);
							break;
						case 0x00010000://pos 0x1yyx
							x=(*output&0x00f);
							y=(*output&0xff0)/0x10;
							cout<<ctx.pos(y+1,x+1);
							break;
						case 0x00020000://col 0x20fb
							fgColor=(*output&0x0f);
							bgColor=(*output&0xf0)/0x10;
							cout<<ctx.col(fgColor,bgColor);
							break;
					}
				}
			}
			*output=redFilt;
		}
		*output=redFilt;
	}
}terminal;
class NumberDisplay{
	public:
	filt30* input;//=ram[2];
	filt30* output;//=ram[4];
	filt30 oldOutput=0;
	void innit(){
		input=&ram[2];//from keyboard
		output=&ram[4];//to screen
		oldOutput=*input;
	}
	void onUpdate(){
		if((*output).value!=oldOutput.value){//dont need to redraw if its the same
			cout<<ctx.moveTo(4+terminal.dims[0]+terminal.offset_x,3);
			cout<<(*output&0xfffffff)<<" ";
			oldOutput=*output;
		}
		cout<<ctx.moveTo(3+terminal.dims[0]+terminal.offset_x,3);
	}
}numberDisplay;
//cpu
	class CPU0xmin3{
		public:
		filt30* ram;
		bool hasHault=false;
		public:
		bool aluif=false;
		filt30 alu=0;
		u64 move=0;
		u64 jump=0;

		filt30 currentWord;//current instruction
		bool blocker=false;

		short int move_next=0;
		short int jump_next=0;
		filt30 get_jump;
		u32 set_jump;
		u32 set_bray;
		void onUpdate(int i);
	}cpu;
	class{
		public:
		void innit(){
			cout<<
			""
			;
		}
		void onUpdate(){
			cout<<cpu.move<<cpu.jump;
		}
		private:
	}cpuDisplay;
	void CPU0xmin3::onUpdate(int i){
		//pointers
			filt30 get_jump=ram[jump];//for 'get jump -1;'
			jump+=jump_next;
			if(jump>=ramLen){
				jump=ramLen-1;
				hasHault=true;
			}
			move=max(0l,((long)move)+move_next);
			if(set_jump!=0){ram[jump+2]=set_jump;set_jump=0;}
			if(set_bray!=0){ram[move]=alu;set_bray=0;}
			filt30 dataFromMove=ram[move];
		//read input
			if(!blocker){
				currentWord=ram[jump];
			}
			short int command=currentWord&0xf;
			short int address=(currentWord&0x0ff0)/0x10;
			short int address_sign=(currentWord&0x1000)/0x1000;
			jump_next=1;
			move_next=0;
		//commands
			u32 ans=0,a=alu,b=dataFromMove;//for operations
			switch(command){
				case 0://move
					move_next=address*((int[2]){1,-1})[address_sign];
					break;
				case 1://jump
					jump_next=((address&~1)*(int[2]){1,-1}[address_sign])+(address&1);
					if(address==0){hasHault=true;}
					break;
				case 2:ans=~(a|b);break;//'nor'
				case 3:ans=a*(b&-b);break;//'red'
				case 4:ans=b==0?a:a/(b&-b);break;//'blue'
				case 5:ans=b;break;//'get'
				case 6:ans=a^b;break;//'xor'
				case 7:ans=a&b;break;//'and'
				case 8:ans=a|b;break;//'or'
				case 9:ans=get_jump;break;//'get jump-1;'
				case 10:set_bray=alu;break;//'set'
				case 11:blocker=!aluif;aluif=!aluif;break;//if 
				case 12:set_jump=alu;break;//'set jump +3;'
			}
			//note: with the 'if' command. is run as: 'if;"then";"else/finally";' can be used as: if;jump->then; jump->else
			//	'if;' means 'if there has been a operation that did not equal 0, from the last if statement; then continue as normal; other wise ignore the next line of code."
			if(ans!=0){
				alu=ans;
				aluif=true;
			}
	}
//----
void doStep(int i){
	cpu.onUpdate(i);
	numberDisplay.onUpdate();
	terminal.onUpdate();
}
int main(int argc, char const *argv[]){
	// copies all data into buffer
	{
		string fileName=argv[1];
		if(argc<=1)fileName="testCode.filt";//"../compilers/quine.filt";
		std::ifstream inputFile(fileName, std::ios::binary );
		std::vector<char> buffer(std::istreambuf_iterator<char>(inputFile), {});
		ram=new filt30[buffer.size()];
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
		ramLen=(int)buffer.size()/4;
		cout<<"size:"<<ramLen<<"\n";
		buffer.clear();//free memory "hopefully"
	}
	{
		cout<<ctx.clear();
		terminal.innit();
		cpuDisplay.innit();
		numberDisplay.innit();
		cpu.ram=ram;
	}
	int num=0;
	for(int i=0;i<40000&&!cpu.hasHault;i++,num++){
		//for(int i=0;i<1&&!cpu.hasHault;i++,num++){
			doStep(i);
		//}
		ctx.update();
		mySleep(1./8);
		//cout<<hex cpu.jump<<" ";//<<":"<<(void*)(long)cpu.jump<<":"<<(void*)(long)cpu.move<<" ";
	}{
		//std::future<std::string> future = std::async(handleInput);
	}cout<<ctx.moveTo(1,terminal.dims[1]+terminal.offset_y)<<"\nhaulted at:"<<cpu.jump<<", i="<<num;
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