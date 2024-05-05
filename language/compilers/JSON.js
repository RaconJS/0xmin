function listify(label,classes){
	let originals=new Map();//:Map(class<T>->T[])
	let cloned=new Map();//:Map(class<T>->Data<T>[])
	classes["Object"] = Object;
	classes["_data"] = null;
	classes["_data"] = null;
	classes["_data"] = null;
	Object.keys(classes).forEach(i=>{
		let clonedEntry = {properties:[],list:[]};
		cloned.set(i,clonedEntry);
		originals.set(classes[i],{cloned:clonedEntry,original:[]});
	});
	let searchSymbol = Symbol();
	let typeMap = {
		null:".",
		undefined:"-",
		empty:"_",
		number:"#",
		string:"~",
		reference:"&",
	};
	function typeMap_getMappedValue(value){
		return value===undefined?typeMap.undefined
			:value===null?typeMap.null
			:typeof value=="number"?typeMap.number+value
			:typeof value=="string"?typeMap.string+value
			:value
		;
	};

	function search(object){//:()->index:Number
		let objectsWithClass=originals.get(Object.getPrototypeOf(object).constructor);
		let index=objectsWithClass.original.indexOf(object);
		if(object[searchSymbol]||index!=-1)return typeMap.reference+index;//TODO:add indexes for `*objNum_classNum`
		index=objectsWithClass.original.push(object)-1;
		let dataObj=
			property.toJSON?object.toJSON()
			:object instanceof Array?[[],[]]
			:typeof object=="string"||object instanceof String?[[],typeMap.string+object]
			:typeof object=="number"||object instanceof Number?[[],typeMap.number+object]
			:[[]]
		;//:[properties:[],baseType:(String|Array|Function)?]
		object[searchSymbol]=true;
		objectsWithClass.cloned.list.push(dataObj);
		function forEachInDataTree(property){
			if(!property)return property;
			if(originals.has(Object.getPrototypeOf(property).constructor)){
				return search(property);
			}
			else{
				if(property instanceof Array){
					let array = [];
					property.forEach(v=>{
						array.push(forEachInDataTree(v));
					});
					return array;
				}
				else if(typeof property == "object"){
					let object = {};
					Object.keys(property).forEach(i=>{
						object[i]=(forEachInDataTree(property[i]));
					});
					return object;
				}
				else return typeMap_getMappedValue(property);
			}
		}
		Object.keys(object).forEach((key)=>{
			if(!isNaN(+key)){//handle array indexes
				dataObj[1].push(forEachInDataTree(object[+key]));
				return;
			}
			let nameIndex=objectsWithClass.cloned.properties.indexOf(key);
			let propertyData=//key=="data"?search(object[key]):
				forEachInDataTree(object[key]);
			if(propertyData!=undefined){
				if(nameIndex==-1)nameIndex=objectsWithClass.cloned.properties.push(key)-1;
				for(let i = dataObj[0].length;i<nameIndex;i++){
					dataObj[0].push(typeMap.empty);//all normal strings should start with "_" to differenciate
				}
				dataObj[0][nameIndex]=propertyData;
			}
		});
		delete object[searchSymbol];
		return index;
	}
	search(label);
	let clonedObject = {};{//convert Map to normal Object
		cloned.forEach((v,i)=>{
			if(v.list.length>0)//ignore empty lists
				clonedObject[i]=v
		});
	}
	return {originals,cloned:{version:1,typeMap,cloned:clonedObject}};
}
function parseList(label,classes){
	return {}
}
module.exports={
	listify,
	parseList:parseList,
};