//ps
((getInput,print)=>{
	//segment:[x,y]
	let direction=[0,0];
	let pos=[8,6];
	let snake=[[...pos]];
	let grid=new Array(12).fill().map(v=>new Array(16).fill(0));
	grid[pos[1]][pos[0]]=1;
	let apple=[0,0].map((v,i)=>Math.random()*[16,12][i]|0);
	function mainLoop(){
		let loose=()=>{console.log("game over")};
		let input=getInput();//:char?
		if(input!=undefined)
		switch(input){
			case"w":direction=0;break;
			case"a":direction=1;break;
			case"s":direction=2;break;
			case"d":direction=3;break;
		}
		[
			()=>{pos[1]-=1;if(pos[1]<0)loose()},
			()=>{pos[0]-=1;if(pos[0]<0)loose()},
			()=>{pos[1]+=1;if(pos[1]==12)loose()},
			()=>{pos[0]+=1;if(pos[0]==16)loose()},
		][direction]();
		if(grid[pos[1]][pos[0]])loose();
		grid[pos[1]][pos[0]]=1;
		snake.push([...pos]);
		if(pos[0]==apple[0]&&pos[1]==apple[1]){
			console.log("you got an apple");
		}
		else{
			let oldPos=grid.shift();
			grid[oldPos[1]][oldPos[0]]=0;
		};
	}
	for(let i=0;i<10;i++){//loop
		mainLoop();
	}
})();