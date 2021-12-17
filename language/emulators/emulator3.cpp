//UNFINISHED
#include <chrono>
#include <thread>
#include <iostream>
#include <cmath>
using namespace std ;
class textCanvas{//col,pos,clear;
	private:
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
	string clearWindow(){return "\033[1;1H\033[J";}
	public:
	int width=132,height=43-4;
	textCanvas(){onload();};
	~textCanvas(){unload();}
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
	string pos(int color,int bgColor){
		int args[2]={color,bgColor};
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
void sleep(int x){
	std::this_thread::sleep_for(std::chrono::milliseconds(x));
}void sleep(float x){sleep((int)x);}
class{
	public:
	void innit(){
		cout<<
		""
		;
	}
	private:

}cpuDisplay;
int main(int argc, char const *argv[]){
	cout<<0.00885f;
	if(0)for(int i=0;i<10;i++){
		int x=100;
		cout<<i;
		ctx.update();
		sleep(x);
	}
	return 0;
}
//moveTo(x,y);
//setColor(int);
//setStyle(int);
//clearWindow();
//
//max: width=132,height=43