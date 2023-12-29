function deReference(object){//:(any)->(unknown)[] ; is in prefix order
	let refsGraph = [];//:(any & graph-like)[]; contains original objects
	let refsTree = [];//: (any & tree-like)[]; contained cloned versions of the references structured like a lambda-calculus expression
	let classIndexes = [];//:{name:String,index:number}[]
	let isSearched = Symbol("isSearched");
	function addItem(clonedValue,value){
		const index = refsGraph.length;
		refsGraph.push(value);
		refsTree.push(clonedValue);
		return index;
	}
	!function cloneValue(value){//:(any)->number & []refs*
		let clonedValue = value;
		let index;
		if(refsGraph.includes(value))
			return refsGraph.indexOf(value);
		switch (typeof value){
			case"object":
				let object = value;
				if(object.toJSON){
					object = object.toJSON();
				}
				let classObj;
				let prototype = Object.getPrototypeOf(object);
				if(!Object.hasOwn(object,"constructor")){
					classObj = object.constructor;
				}
				else if(!Object.hasOwn(prototype,"constructor")){
					classObj = prototype.constructor;
				}
				else throw Error("Could not find the class name of object")
				let classIndex;
				function handleOtherClass(){
					if(refsGraph.includes(classObj)){
						classIndex = refsGraph.indexOf(classObj);
					}
					else{
						classIndex = refsGraph.push(classObj) - 1;
						refsTree.push([]);//:index[] ; contains references to its instance objects
						//assert: refsGraph((refsTree[classIndex])[ x ]) instanceof classObj
						classIndexes.push([classObj.name,classIndex]);
					}
					refsTree[classIndex].push(refsGraph.length);//push the index of this object
					
				}
				switch(classObj){
					case Set:
					case Map://json strings do not support maps and sets
						handleOtherClass();
					case Array:
						clonedValue = [];
						for(let item of object){
							clonedValue.push(cloneValue(item));
						}
						break;
					break;
					default:
						handleOtherClass();
					case Object:
						clonedValue = {};
						index = addItem(clonedValue,object);
						for(let property in object){
							if(Object.hasOwn(object,property)){
								clonedValue[property] = cloneValue(object[property]);
							}
						}
						let symbols = [];//[Symbol,tree-like value or object][]
						clonedValue = [classObj.name+"",clonedValue,symbols];//[String,tree-like,[Symbol,tree-like][]]
						for(let symbol of Object.getOwnPropertySymbols(object)){
							symbols.push([cloneValue(symbol), cloneValue(object[symbol])]);
						}
						if(symbols.length == 0)clonedValue = clonedValue[1];//get back the object on its own
						refsTree[index] = clonedValue;
					break;
				}
				return index;
			case"number":
			case"string":
			case"symbol":
			case"function":
				return addItem(clonedValue,value);
			break;
		}
	}(object);
	return {
		originals:refsGraph,
		cloned:{refs:refsTree,classIndexes},
		classes:classIndexes,
	};
}
function parseList({refs,classIndexes},classList){
	//assume prefix order
	function handleObject(reference,i){
		for(let i in reference){
			if(Object.hasOwn(reference,i)){
				if(typeof reference[i] == "number"){
					reference[i] = refs[reference[i]];
				}
			}
		}
	}
	for(let i = refs.length - 1; i >= 0; i--){//reference:number|Object|Array|
		let reference = refs[i];
		if(typeof reference == "number"){
			continue;
		}
		else if(reference instanceof Array && typeof reference[0] == "string"){
			handleObject(reference[1],i);
			for(let [symbol,value] of reference[2]){
				if(typeof reference[1][symbol] == "number"){
					reference[1][symbol] = refs[reference[1][i]];
				}
				else reference[1][symbol] = reference[1][i];
			}
			refs[i] = reference[1];
		}
		if(reference.constructor == Object || reference instanceof Array){
			handleObject(reference,i);
		}
	}
	//refs[i] = Object.assign(new classList[i](),reference[1]);
	return refs[0];
}
let a = {a:5};
let b = {a,c:new class asd{}};
a.b = b;
console.log(parseList(deReference(a).cloned,[new class asd{}]));
if(0)module.exports={
	listify:deReference,
	parseList:parseList,
};