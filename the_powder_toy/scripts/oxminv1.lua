--[[
tpt.setdebug(0x8);compile();
loadfile("tptasm/main.lua")("code.asm")
]]
--[[
ram={
4096,145,255,1,2,2,2,536870912,1073741823,30,112,5,4176,7,2,96,7,5,4160,6,0x1FF0,8177
}
]]
ram=minFilt;
function tptasm(doLog)
	local str=nil
	local arg1 = 0xDEAD
	if doLog=="log" then str="tptasm.log"end
	if doLog=="bin" then arg1="minFilt.bin"end
	return loadfile("tptasm/main.lua")("scripts/minFilt.lua",arg1,str);--tester.asm");
end
function compile(computer)
	dofile("scripts/minFilt.lua");
	ram=minFilt;
	if not (ramIn==nil) then ram=ramIn end
	if(computer==1)then
		--riskete
		startPos={76,128}
		size={128,32}
		for i,v in ipairs(ram) do
			posX=startPos[1]+i%size[1]-1
			posY=startPos[2]+math.floor(i/size[1])
			tpt.delete(posX,posY)
			local n=tpt.create(posX,posY,"filt") 
			tpt.set_property("ctype",v,n)
			tpt.set_property("tmp",0,n)
		end
	else
		--0xmin
		startPos={141,72}
		if not (x==nil) then startPos[1]=x end
		if not (y==nil) then startPos[2]=y end
		local posX,posY;
		for i,v in ipairs(ram) do
			posX=startPos[1]+i-1
			posY=startPos[2]
			tpt.delete(posX,posY)
			local n=tpt.create(posX,posY,"filt") 
			tpt.set_property("ctype",v,n)
			tpt.set_property("tmp",0,n)
		end
		end
	tpt.log(startPos[1],startPos[2])
end
function subleq()
	--subleq1
	dofile("scripts/minFilt.lua");
	ram=minFilt;
	startPos={431,274}
	ramSize={128,16};
	if not (x==nil) then startPos[1]=x end
	if not (y==nil) then startPos[2]=y end
	local posX,posY;
	for i,v in ipairs(ram) do
		if i>ramSize[1]*ramSize[2] then break end
		posX=startPos[1]+(i-1)%ramSize[1]
		posY=startPos[2]+math.floor((i-1)/ramSize[1])%ramSize[2]
		tpt.delete(posX,posY)
		local n=tpt.create(posX,posY,"filt") 
		tpt.set_property("ctype",v,n)
		tpt.set_property("tmp",0,n)
	end
end
function compileASM()end
function setCommand(jumpLen,aluLen,setLen)
	jumpLen=jumpLen or 2;
	aluLen =aluLen  or 8;
	setLen =setLen  or 3;print(jumpLen)
	for i1=0,16 do
		local i=i1
		local x=128
		local y=73+i*2
		local val=0x20000000;
		if i<=jumpLen then val=i1 end i=i-jumpLen
		if i<=setLen  then val=i1 end i=i- setLen
		if i<=aluLen  then val=i1 end i=i- aluLen
		tpt.set_property("ctype",val , x, y) 
	end
end