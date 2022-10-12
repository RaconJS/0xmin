typedef unsigned int filt30;
filt30 alu;
struct Grid{
	filt30 val[8];
}grid;
struct Pos{
	short int filtNumber;
	filt30 val;
};
void addToPos(bool increment_isNegative[4],Pos inPos,Pos &posOut){
	//magnitude[0],sign[0],magnitude[1],sign[1]
	auto a=increment_isNegative;
	if(a[1]&&a[0])
		posOut.filtNumber=inPos.filtNumber-1;
	else if((!a[1])&&a[0])
		posOut.filtNumber=inPos.filtNumber+1;
	if(a[3]&&a[2])
		posOut.val=inPos.val<<1;
	else if((!a[3])&&a[2])
		posOut.val=inPos.val>>1;
}
struct{
	unsigned int direction;
	Pos pos;
}player;
void guess(filt30 &alu = alu){}
int main(int argc, char const *argv[]){
	for (short int i = 0; i < 1; ++i){
		int neighbours=0;//bool[3];
		const bool moveMent[4][4]={//move anti-clockwise
			{0,0,1,0},//^
			{1,1,0,0},//<
			{0,0,1,1},//v
			{1,0,0,0},//>
		};
		{
			const bool direction[4][4]={//corners
				{1,0,1,1},//bottom right
				{1,0,1,0},
				{1,1,1,0},
				{1,1,1,1},
			};
			Pos testPos;
			addToPos((bool*)direction[player.direction],player.pos,testPos);
			for (int i = 0; i < 3; ++i){
				neighbours<<=1;
				filt30 move=grid.val[testPos.filtNumber];
				if(move&1)neighbours|=1;
				addToPos((bool*)moveMent[player.direction],player.pos,testPos);
			}
		}
		if(neighbours==0){//move player
			int a = (player.direction+3)%4;
			addToPos((bool*)moveMent[a],player.pos,player.pos);
		}
		else if(neighbours&0b010||neighbours==0b101){//direct hit
			player.direction^=0b10;
			//player.direction=(player.direction+2)%4;
		}
		else{
			if(neighbours==0b001){//turn left
				player.direction=(player.direction+1)%4;
			}
			else{//turn right
				player.direction=(player.direction-1)%4;
			}
		}
	}
	return 0;
}