#include <iostream>
using namespace std ;
const int len=64;unsigned int ram[len]={//u32
	//0x1000,//move-0;m=0;var return <-line 0
	//0x0091,//jump+9;m=0; var start;
	//0xFF,//Input0;
	//1,//var Input1;
	//2,//var Output0;
	//2,//var Output1;
	//0x2,//var const0x2;
	//0x20000000,//var constRed;
	//0x3FFFFFFF,//var constWhite
	//30,
	//0x0070,//move -> constRed; //{Output0 = Input0!=red?(~red):red}
	//	0x0005,//get(red);
	//	0x1050,//move -> Input0;
	//	0x0007,//ifdo(true);
	//	0x0002,//nor(red,Input0);
	//	0x0060,//move -> &constWhite;
	//	0x0007,//ifdo(nor);//{if(Input0!=red)}
	//	0x0005,//get(constWhite);//var then
	//0x1040,//move -> Output0;
	//0x0006,//set(Output0 = {red,white};)
	//0x1FF0,
	//0x1FF1,
	30,81,30,30,30,30,64,6,128,49,30,30,4128,6,2,6,4,64,4,3,4144,6,2,4112,3,32,4288,4465

};
#ifndef SYMBOL
#define SYMBOL value
#endif
enum code{move=0,jump=1,nor=2,red=3,blue=4,get=5,set=6,ifdo=7};
typedef unsigned int u32;typedef unsigned long int u64;//address
struct filt30{//fist 2 bits
	public:
	u32 value=30;
	filt30(){};
	filt30(u32 v){value=v&0x3fffffff;}
	operator u32(){return value;}
	filt30 operator ++(int a){value++;return value;}
	filt30 operator =(u32 v){value=(filt30)v;}
	filt30 operator =(filt30 v){if(v!=0 or value==0)value=v;}
};
class Oxmin1{
	enum code{move=0,jump=1,nor=2,red=3,blue=4,get=5,set=6,ifdo=7};
	enum Bit30Consts{
		B30_white =0x3FFFFFFF,//11 111... 00
		B30_red   =0x20000000,//10 000... 00
		B30_redNot=0x1FFFFFFF,//01 111... 00
	};//2^30-1
	public:
		int ramLen;
		filt30* ram;
		filt30* ramRef;
		int instructionPointer=0;//current line
		int dataPointer=0;
		short int jumpLine=0;//next relative line
		short int moveLine=0;

		filt30 CIR=30;//currentInstruction: imprtant in "if" instruction
		filt30 accumilator=30;
		
		bool hasIfBlockerInsl=false;//for "else"
		bool ifNotALU=true;//insl for alu bool
		bool isOn=true;//
		bool onOffButton=false;
	public:
		filt30 valB;
		int ticNum=0;
	Oxmin1(u32* ramIn,int lenIn){
		ramLen=lenIn;
		ram=new filt30[ramLen];
		for(int i=0;i<ramLen;i++){
			ram[i]=ramIn[i];
		}
	};
	~Oxmin1(){
		delete[] ram;
	};
	void doStep(){
		if(onOffButton){
			onOffButton=false;
			if(!isOn){
				jumpLine&=~0x1;
			}
			isOn!=isOn;
			if(isOn){
					
			}
		}
		auto relLine1=jumpLine;
		if(jumpLine<0 and (-jumpLine)&0x1){//if(jumpLine&0x10 and jumpLine&0x1){//if is -ve
			jumpLine+=2;//all but +1 is positive
		}
		instructionPointer=min(max(0,instructionPointer+jumpLine),ramLen-1);
		jumpLine=1;
		if(!hasIfBlockerInsl){//read if
			CIR=ram[instructionPointer];
		}
		dataPointer=min(max(0,dataPointer+moveLine),ramLen-1);
		moveLine=0;
		filt30 CDR=ram[dataPointer];
		short unsigned int opcode=CIR&0xf;
		short int address =(CIR&0x0ff0)>>4;
		bool negativeJump =(CIR&0x1000)>>12;//
		int jumpMul=1-negativeJump*2;

		switch(opcode){
			case code::move:moveLine=address*jumpMul;break;
			case code::jump:jumpLine=address*jumpMul;break;
		}
		{
			u32 aluBray=0;
			switch(opcode){//alu
				case code::nor:
					aluBray=(filt30)(~accumilator);
					if(aluBray)aluBray=(filt30)(aluBray&(~CDR));
				break;
				case code::red:aluBray=(accumilator*(CDR&(-CDR)))&0x3FFFFFFF;break;
				case code::blue:aluBray=(accumilator/(CDR&(-CDR)))&0x3FFFFFFF;break;
				case code::get:if(accumilator)aluBray=CDR;break;//get if(true)
			}
			if(aluBray){
				ifNotALU=false;
				accumilator=aluBray;
			}
			switch(opcode){
				case code::set:
					ram[dataPointer]=accumilator;
				break;
				case code::ifdo:
					hasIfBlockerInsl=ifNotALU;
					ifNotALU=!ifNotALU;
				break;
			}
		}
		// /if(CIR&)
		{
			ticNum++;
			valB=CDR;

		}
	};
}cpu(ram,len);
void coutArray10(unsigned int* c,int l);
void coutArray0x(unsigned int* c,int l);
void coutArray0x(filt30* C,int L);
void showCPU(){
	//coutArray0x((int*)(&cpu),sizeof(cpu)/sizeof(int));
	cout
		<<(1000+cpu.ticNum)<<": "
		<<  "rA:"<<(int*)(long int)(0x40000000|cpu.accumilator)
		<<", rB:"<<(int*)(long int)(0x40000000|cpu.valB)//<<"\033[;4m"//
		<<", ci:"<<(int*)(long int)(0x10000|cpu.CIR&0x1fff)//<<"\033[;4H"
		<<","<<cpu.hasIfBlockerInsl
		<<", Ln:"<<(int)(long int)(10000+(cpu.instructionPointer&0x1ff))
		<<", Mn:"<<(int)(long int)(10000+(cpu.dataPointer&0x1ff))
	;
	cout<<" :: ";
	coutArray0x(cpu.ram,10+0*cpu.ramLen);
	cout<<"\n";
}
void step(){
	cpu.doStep();
	showCPU();
}
int main(int argc, char const *argv[]){
	//Oxmin1(new u32[100],1);
	bool hasUser=false;
	if(argc==2){
		if(argv[1]=="while"){
			hasUser=true;
		}
	}
	char stop='n';
	showCPU();
	if(!hasUser){
		cout<<"dont do into an infinite loop\n";
		for (int i = 0; i < 40; ++i){
			step();
		}
	}
	else{
		cout<<"type \'y\' to stop\n";
	}
	return 0;
	while(stop!='y'&&stop!='Y'&&hasUser){break;
		step();
		cin>>stop;
	}
	return 0;
}
void coutArray10(int* array,int len){coutArray10((unsigned int*)array,(int)len);};
void coutArray10(unsigned int* array,int len){
	int mLen=0;
	const char* zeros="00000000";
	for (short int i = 0; i < len; ++i){
		/*if(array[i]<0x20000000){
			cout<<zeros+1;
		}*/
		cout<<array[i];
		if(i<len-1)cout<<",";
	}
};
void coutArray0x(filt30* array,int len){
	for (short int i = 0; i < len; ++i){
		cout<<(int*)(long int)(array[i].value);
		if(i<len-1)cout<<",";
	}
};
void coutArray0x(unsigned long int* array,int len){
	for (short int i = 0; i < len; ++i){
		cout<<(int*)((long int)(array[i]>>(8*4)));
		if(i<len-1)cout<<",";
	}
};
void coutArray0x(unsigned int* array,int len){
	for (short int i = 0; i < len; ++i){
		cout<<(int*)(long int)array[i];
		if(i<len-1)cout<<",";
	}
};
