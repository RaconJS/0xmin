--ram={
--4096,145,255,1,2,2,2,536870912,1073741823,30,112,5,4176,7,2,96,7,5,4160,6,0x1FF0,8177
--}
ram=minFilt;
function compile(ramIn,x,y)
	dofile("scripts/minFilt.lua");
	ram=minFilt;
	startPos={141,72}
	if not (ramIn==nil) then ram=ramIn end
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
	tpt.log(startPos[1],startPos[2])
end